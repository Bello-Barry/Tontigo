import { callAIJSON } from '../client'
import { serviceClient } from '@/lib/supabase/service'

interface TransactionVerificationResult {
  is_coherent:        boolean
  anomaly_score:      number
  anomalies:          string[]
  suspected_fraud:    boolean
  recommended_action: 'approve' | 'review' | 'block'
}

/**
 * Vérifier la cohérence d'une transaction MTN MoMo.
 */
export async function verifyTransactionCoherence(params: {
  mtnTransactionId: string
  userId:           string
  amount:           number
  transactionType:  'collection' | 'disbursement'
}): Promise<TransactionVerificationResult> {
  const fallback: TransactionVerificationResult = {
    is_coherent:        true,
    anomaly_score:      5,
    anomalies:          [],
    suspected_fraud:    false,
    recommended_action: 'approve',
  }

  try {
    const { data: recentTx } = await serviceClient
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', params.userId)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(20)

    const avgAmount = (recentTx?.reduce((s, t) => s + t.amount, 0) ?? 0) / (recentTx?.length || 1)
    const maxAmount = Math.max(...(recentTx?.map(t => t.amount) ?? [0]))

    const prompt = `
Vérifie la cohérence de cette transaction Mobile Money.

TRANSACTION :
- Type : ${params.transactionType}
- Montant : ${params.amount} FCFA

HISTORIQUE :
- Montant moyen : ${Math.round(avgAmount)} FCFA
- Montant max : ${maxAmount} FCFA
- Tx 24h : ${recentTx?.filter(t => new Date(t.created_at) > new Date(Date.now() - 86400000)).length ?? 0}

Retourne exactement ce JSON :
{
  "is_coherent": <true|false>,
  "anomaly_score": <entier 0-100>,
  "anomalies": ["<anomalie>"],
  "suspected_fraud": <true|false>,
  "recommended_action": "<approve|review|block>"
}
`

    return await callAIJSON<TransactionVerificationResult>({
      system: `Tu analyses les transactions Mobile Money pour détecter les fraudes.`,
      prompt,
      maxTokens: 250,
      fallback,
    })
  } catch (error) {
    console.error('verifyTransactionCoherence failed:', error)
    return fallback
  }
}
