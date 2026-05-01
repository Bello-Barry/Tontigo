'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { payContribution, verifyContributionPayment } from '@/lib/actions/tontine.actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { formatFCFA } from '@/lib/utils/format'
import type { Contribution } from '@/lib/types'

interface PayContributionButtonProps {
  contribution: Contribution
}

export function PayContributionButton({ contribution }: PayContributionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<'mtn' | 'airtel'>('mtn')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const totalAmount = contribution.amount + (contribution.penalty_amount || 0)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const result = await payContribution(contribution.id, selectedWallet, phone)
      if (result.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (selectedWallet === 'mtn' && result.data?.reference) {
        const refId = result.data.reference
        toast.info('📱 Veuillez confirmer le paiement sur votre téléphone (USSD Prompt)...', {
          autoClose: false,
          toastId: 'momo-pending'
        })

        // Polling pour vérifier le statut (toutes les 3 secondes, max 2 minutes)
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          const check = await verifyContributionPayment(refId, contribution.id)
          
          if (check.data?.status === 'SUCCESSFUL') {
            clearInterval(interval)
            toast.dismiss('momo-pending')
            toast.success('✅ Cotisation payée avec succès !')
            setIsOpen(false)
            setLoading(false)
            router.refresh()
          } else if (check.data?.status === 'FAILED' || attempts > 40) {
            clearInterval(interval)
            toast.dismiss('momo-pending')
            toast.error(attempts > 40 ? 'Délai expiré. Vérifie ton application MTN.' : '❌ Paiement échoué ou annulé.')
            setLoading(false)
          }
        }, 3000)
      } else {
        // Cas Airtel ou Simulation sans polling
        toast.success('✅ Cotisation payée avec succès !')
        setIsOpen(false)
        setLoading(false)
        router.refresh()
      }
    } catch (err) {
      toast.error('Erreur lors du paiement')
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
      
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Numéro {selectedWallet === 'mtn' ? 'MTN' : 'Airtel'} Money</label>
        <Input
          placeholder="Ex: 06xxx..."
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-11"
        />
        <p className="text-[10px] text-slate-500 italic">Laisse vide pour utiliser ton numéro par défaut.</p>
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
