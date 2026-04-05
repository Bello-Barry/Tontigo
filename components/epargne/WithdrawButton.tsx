'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { withdrawFromVault } from '@/lib/actions/epargne.actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/format'
import type { SavingsVault } from '@/lib/types'

export function WithdrawButton({ vault }: { vault: SavingsVault }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleWithdraw = async () => {
    if (!confirm(`Confirmer le retrait de ${formatFCFA(vault.current_balance)} ?`)) return
    setLoading(true)
    const result = await withdrawFromVault(vault.id)
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success(`✅ ${formatFCFA(result.data!.netAmount)} envoyés vers ton wallet !`)
    router.refresh()
  }

  return (
    <Button
      onClick={handleWithdraw}
      disabled={loading}
      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
        : <><Download className="w-4 h-4" /> Retirer {formatFCFA(vault.current_balance)}</>
      }
    </Button>
  )
}
