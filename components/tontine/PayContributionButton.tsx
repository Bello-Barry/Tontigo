'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { payContribution } from '@/lib/actions/tontine.actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { formatFCFA } from '@/lib/utils/format'
import type { Contribution } from '@/lib/types'

interface PayContributionButtonProps {
  contribution: Contribution
}

export function PayContributionButton({ contribution }: PayContributionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<'mtn' | 'airtel'>('mtn')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const totalAmount = contribution.amount + (contribution.penalty_amount || 0)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const result = await payContribution(contribution.id, selectedWallet)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('✅ Cotisation payée avec succès !')
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      toast.error('Erreur lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
      >
        <Wallet className="w-4 h-4" /> Payer {formatFCFA(totalAmount)}
      </Button>
    )
  }

  return (
    <div className="glass-card p-4 space-y-4">
      <p className="text-white font-medium">Choisir le portefeuille</p>
      
      <div className="flex gap-2">
        {(['mtn', 'airtel'] as const).map(w => (
          <button
            key={w}
            onClick={() => setSelectedWallet(w)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              selectedWallet === w
                ? w === 'mtn'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-red-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {w === 'mtn' ? '📱 MTN Money' : '🔴 Airtel Money'}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          className="flex-1 border-slate-700 text-slate-300"
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Paiement...
            </>
          ) : (
            `Confirmer ${formatFCFA(totalAmount)}`
          )}
        </Button>
      </div>
    </div>
  )
}
