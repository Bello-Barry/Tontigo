'use client'
import { PaymentRiskAlert } from './PaymentRiskAlert'
import { getGroupPaymentRisks } from '@/lib/actions/tontine.actions'
import { useEffect, useState } from 'react'

export function PaymentRiskAlertClient({ groupId }: { groupId: string }) {
  const [risks, setRisks] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getGroupPaymentRisks(groupId).then(result => {
      if (result.data) setRisks(result.data)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [groupId])

  if (!loaded || risks.length === 0) return null
  return <PaymentRiskAlert risks={risks} />
}
