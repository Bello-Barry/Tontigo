import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface PaymentRiskResult {
  risk_score:      number    // 0-100
  risk_level:      'low' | 'medium' | 'high' | 'critical'
  probability:     number    // 0-1 probabilité de défaut
  main_factors:    string[]  // Facteurs de risque identifiés
  recommendation:  string    // Action recommandée
  alert_group:     boolean   // Faut-il alerter le groupe ?
}

/**
 * Analyser le risque de défaut de paiement d'un membre
 * avant l'échéance de sa cotisation.
 */
export async function analyzePaymentRisk(params: {
  membershipId: string
  groupId:      string
}): Promise<PaymentRiskResult> {
  const fallback: PaymentRiskResult = {
    risk_score:     30,
    risk_level:     'low',
    probability:    0.3,
    main_factors:   [],
    recommendation: 'Envoyer un rappel standard',
    alert_group:    false,
  }

  try {
    // Récupérer les données du membre
    const { data: membership } = await serviceClient
      .from('memberships')
      .select(`
        turn_position, total_paid, total_penalties, status,
        users:user_id (
          trust_score, badge, total_groups_completed,
          total_groups_failed, profession, quartier
        )
      `)
      .eq('id', params.membershipId)
      .single()

    if (!membership) return fallback

    // Récupérer l'historique des paiements (anonymisé)
    const { data: contributions } = await serviceClient
      .from('contributions')
      .select('status, days_late, penalty_amount, due_date, paid_at')
      .eq('membership_id', params.membershipId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Récupérer les infos du groupe
    const { data: group } = await serviceClient
      .from('tontine_groups')
      .select('amount, frequency, current_turn, max_members, penalty_rate')
      .eq('id', params.groupId)
      .single()

    if (!group) return fallback

    const member = membership.users as any

    // Calculer des métriques clés
    const latePayments = contributions?.filter(c => c.days_late > 0).length ?? 0
    const totalContribs = contributions?.length ?? 1
    const lateRate = latePayments / totalContribs
    const avgDaysLate = (contributions?.reduce((s, c) => s + (c.days_late || 0), 0) ?? 0) / totalContribs
    const hasBeenEliminated = membership.status === 'elimine'

    const prompt = `
Analyse le risque de défaut de paiement de ce membre de tontine.

PROFIL MEMBRE (anonymisé) :
- Score de confiance : ${member.trust_score}/100
- Badge : ${member.badge}
- Groupes complétés : ${member.total_groups_completed}
- Groupes échoués : ${member.total_groups_failed}
- Profession : ${member.profession ?? 'non renseignée'}

HISTORIQUE PAIEMENTS :
- Taux de retard : ${Math.round(lateRate * 100)}%
- Moyenne jours de retard : ${avgDaysLate.toFixed(1)} jours
- Amendes cumulées : ${membership.total_penalties} FCFA
- Statut actuel : ${membership.status}

CONTEXTE DU GROUPE :
- Montant cotisation : ${group.amount} FCFA
- Fréquence : ${group.frequency}
- Tour actuel : ${group.current_turn}/${group.max_members}
- Ce membre reçoit sa cagnotte au tour : ${membership.turn_position}
- A-t-il déjà reçu sa cagnotte : ${membership.turn_position < group.current_turn}
- Taux d'amende : ${group.penalty_rate}%/jour

Retourne un JSON avec cette structure exacte :
{
  "risk_score": <entier 0-100>,
  "risk_level": "<low|medium|high|critical>",
  "probability": <décimal 0-1>,
  "main_factors": ["<facteur1>", "<facteur2>", "<facteur3>"],
  "recommendation": "<action recommandée en français>",
  "alert_group": <true|false>
}
`

    const result = await callAIJSON<PaymentRiskResult>({
      system: `Tu es un analyste financier expert en microfinance africaine.
               Tu évalues les risques de défaut de paiement dans les tontines.
               Sois précis et concis.`,
      prompt,
      maxTokens: 300,
      fallback,
    })

    // Enregistrer l'analyse
    await serviceClient.from('ai_analyses').insert({
      type:         'payment_risk',
      subject_id:   params.membershipId,
      subject_type: 'membership',
      score:        result.risk_score,
      result:       result,
      action_taken: result.alert_group ? 'group_alerted' : null,
    })

    // Si risque élevé → créer une alerte de sécurité
    if (result.risk_score >= 70) {
      await serviceClient.from('security_alerts').insert({
        type:     'payment_risk',
        severity: result.risk_score >= 85 ? 'high' : 'medium',
        group_id: params.groupId,
        user_id:  member.id,
        message:  `Risque élevé de défaut détecté (score: ${result.risk_score}/100)`,
        details:  result,
      })
    }

    return result

  } catch (error) {
    console.error('analyzePaymentRisk failed:', error)
    return fallback
  }
}
