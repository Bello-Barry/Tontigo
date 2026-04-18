import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface TrustScoreResult {
  ai_score:          number   // Score IA 0-100
  current_score:     number   // Score actuel en base
  recommended_score: number   // Score recommandé par l'IA
  delta:             number   // Différence à appliquer
  breakdown: {
    payment_behavior:   number  // 0-40 points
    group_completion:   number  // 0-25 points
    social_graph:       number  // 0-20 points
    profile_completeness: number // 0-15 points
  }
  insights:   string[]  // Observations clés
  red_flags:  string[]  // Signaux négatifs
}

/**
 * Recalculer le score de confiance d'un utilisateur via IA.
 */
export async function recalculateTrustScoreAI(
  userId: string
): Promise<TrustScoreResult> {
  const fallback: TrustScoreResult = {
    ai_score:          50,
    current_score:     50,
    recommended_score: 50,
    delta:             0,
    breakdown: {
      payment_behavior:     20,
      group_completion:     12,
      social_graph:         10,
      profile_completeness: 8,
    },
    insights:  [],
    red_flags: [],
  }

  try {
    const { data: user } = await serviceClient
      .from('users')
      .select('trust_score, total_groups_completed, total_groups_failed, badge, profession, quartier, wallet_mtn, wallet_airtel, avatar_url, onboarding_done, created_at')
      .eq('id', userId)
      .single()

    if (!user) return fallback

    // contributions is related to memberships
    const { data: memberships } = await serviceClient
      .from('memberships')
      .select('id, status, has_received_payout, total_paid, total_penalties')
      .eq('user_id', userId)

    const membershipIds = memberships?.map(m => m.id) || []

    const { data: contributions } = membershipIds.length > 0
      ? await serviceClient
          .from('contributions')
          .select('status, days_late, penalty_amount')
          .in('membership_id', membershipIds)
          .limit(50)
      : { data: [] }

    const { data: messages } = await serviceClient
      .from('group_messages')
      .select('id')
      .eq('user_id', userId)

    const totalContribs     = contributions?.length ?? 0
    const onTimeContribs    = contributions?.filter(c => c.days_late === 0 && c.status === 'paye').length ?? 0
    const lateContribs      = contributions?.filter(c => c.days_late > 0).length ?? 0
    const eliminatedCount   = memberships?.filter(m => m.status === 'elimine').length ?? 0
    const payoutReceived    = memberships?.filter(m => m.has_received_payout).length ?? 0
    const profileScore      = [
      user.profession, user.quartier, user.wallet_mtn ?? user.wallet_airtel,
      user.avatar_url, user.onboarding_done
    ].filter(Boolean).length

    const prompt = `
Calcule un score de confiance financière précis pour cet utilisateur de tontine.

COMPORTEMENT PAIEMENT :
- Cotisations totales : ${totalContribs}
- Payées à temps : ${onTimeContribs} (${totalContribs ? Math.round(onTimeContribs/totalContribs*100) : 0}%)
- Payées en retard : ${lateContribs}
- Éliminations pour amendes : ${eliminatedCount}

GROUPES :
- Cycles complétés avec succès : ${user.total_groups_completed}
- Cycles échoués : ${user.total_groups_failed}
- Cagnottes reçues et obligations honorées : ${payoutReceived}

GRAPHE SOCIAL :
- Messages envoyés dans les groupes : ${messages?.length ?? 0}
- Ancienneté sur la plateforme : ${Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)} jours

PROFIL :
- Complétude du profil : ${profileScore}/5 éléments renseignés
- Profession déclarée : ${user.profession ?? 'non renseignée'}
- Score actuel en base : ${user.trust_score}/100

Retourne exactement ce JSON :
{
  "ai_score": <entier 0-100>,
  "current_score": ${user.trust_score},
  "recommended_score": <entier 0-100>,
  "delta": <différence recommended - current>,
  "breakdown": {
    "payment_behavior": <entier 0-40>,
    "group_completion": <entier 0-25>,
    "social_graph": <entier 0-20>,
    "profile_completeness": <entier 0-15>
  },
  "insights": ["<observation1>", "<observation2>"],
  "red_flags": ["<signal_négatif1>"]
}
`

    const result = await callAIJSON<TrustScoreResult>({
      system: `Tu es un expert en scoring de crédit pour la microfinance africaine.`,
      prompt,
      maxTokens: 400,
      fallback,
    })

    if (Math.abs(result.delta) > 5) {
      const newScore = Math.max(0, Math.min(100, user.trust_score + Math.max(-10, Math.min(10, result.delta))))
      await serviceClient.from('users').update({
        trust_score: newScore
      }).eq('id', userId)
    }

    await serviceClient.from('ai_analyses').insert({
      type:         'trust_score',
      subject_id:   userId,
      subject_type: 'user',
      score:        result.ai_score,
      result:       result,
    })

    return result
  } catch (error) {
    console.error('recalculateTrustScoreAI failed:', error)
    return fallback
  }
}
