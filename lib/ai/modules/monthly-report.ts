import { callAI } from '../client'
import { serviceClient } from '@/lib/supabase/service'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Générer un rapport financier mensuel narratif pour un utilisateur.
 */
export async function generateMonthlyReport(userId: string): Promise<string> {
  const now       = new Date()
  const lastMonth = subMonths(now, 1)
  const monthKey  = format(lastMonth, 'yyyy-MM')
  const monthName = format(lastMonth, 'MMMM yyyy', { locale: fr })

  const { data: existing } = await serviceClient
    .from('monthly_reports')
    .select('content')
    .eq('user_id', userId)
    .eq('month', monthKey)
    .maybeSingle()

  if (existing) return existing.content

  try {
    const { data: user } = await serviceClient
      .from('users')
      .select('full_name, trust_score, badge, total_groups_completed')
      .eq('id', userId)
      .single()

    if (!user) return ''

    const monthStart = startOfMonth(lastMonth).toISOString()
    const monthEnd   = endOfMonth(lastMonth).toISOString()

    const { data: transactions } = await serviceClient
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    const totalIn  = transactions?.filter(t => ['versement', 'retrait_epargne'].includes(t.type))
                       .reduce((s, t) => s + t.amount, 0) ?? 0
    const totalOut = transactions?.filter(t => ['cotisation', 'epargne'].includes(t.type))
                       .reduce((s, t) => s + t.amount, 0) ?? 0

    const prompt = `
Génère un rapport financier mensuel personnel pour ${user.full_name}.

DONNÉES DE ${monthName.toUpperCase()} :
- Reçu : ${totalIn.toLocaleString('fr-FR')} FCFA
- Versé : ${totalOut.toLocaleString('fr-FR')} FCFA
- Score confiance : ${user.trust_score}/100 (${user.badge})

Instructions :
- Ton chaleureux, conseiller financier ami.
- 3-4 paragraphes.
- Français congolais naturel.
- Conseils personnalisés.
`

    const report = await callAI({
      system: `Tu es le conseiller financier de Likelemba au Congo Brazzaville.`,
      prompt,
      maxTokens: 600,
    })

    await serviceClient.from('monthly_reports').upsert({
      user_id: userId,
      month:   monthKey,
      content: report,
      data: { totalIn, totalOut },
    })

    await serviceClient.from('notifications').insert({
      user_id:      userId,
      title:        `📊 Ton bilan de ${monthName} est prêt !`,
      body:         'Consulte ton rapport financier mensuel personnalisé.',
      type:         'monthly_report',
    })

    return report
  } catch (error) {
    console.error('generateMonthlyReport failed:', error)
    return ''
  }
}
