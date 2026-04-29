'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { withdrawFromWallet } from '@/lib/actions/wallet.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader2 } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/format'

interface WithdrawWalletButtonProps {
  source:    'tontine' | 'savings' | 'all'
  maxAmount: number
  label:     string
  userId:    string
  variant?:  'default' | 'primary'
}

export function WithdrawWalletButton({
  source, maxAmount, label, variant = 'default'
}: WithdrawWalletButtonProps) {
  const [open, setOpen]       = useState(false)
  const [amount, setAmount]   = useState(String(maxAmount))
  const [wallet, setWallet]   = useState<'mtn' | 'airtel'>('mtn')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleWithdraw = async () => {
    const num = parseFloat(amount)
    if (!num || num < 500)        { toast.error('Minimum 500 FCFA'); return }
    if (num > maxAmount)           { toast.error('Montant supérieur au solde'); return }

    setLoading(true)
    try {
      const result = await withdrawFromWallet({
        amount:     num,
        walletType: wallet,
        source,
        customPhone: phone,
      })

      if (result.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (wallet === 'mtn' && result.data?.reference) {
        const refId = result.data.reference
        toast.info('💸 Traitement du retrait vers MTN Money...', {
          autoClose: false,
          toastId: 'withdraw-pending'
        })

        // Polling pour vérifier le statut du décaissement
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          const { verifyWithdrawal } = await import('@/lib/actions/wallet.actions')
          const check = await verifyWithdrawal(refId)
          
          if (check.data?.status === 'SUCCESSFUL') {
            clearInterval(interval)
            toast.dismiss('withdraw-pending')
            toast.success(`✅ ${formatFCFA(num)} envoyés sur ton MTN Money !`)
            setOpen(false)
            setLoading(false)
            router.refresh()
          } else if (check.data?.status === 'FAILED' || attempts > 20) {
            clearInterval(interval)
            toast.dismiss('withdraw-pending')
            toast.error(attempts > 20 ? 'Délai expiré. Vérifie ton solde MTN.' : '❌ Échec du retrait mobile.')
            setLoading(false)
          }
        }, 3000)
      } else {
        // Simulation ou Airtel
        toast.success(`✅ ${formatFCFA(num)} envoyés sur ton portefeuille mobile !`)
        setOpen(false)
        setLoading(false)
        router.refresh()
      }
    } catch (err) {
      toast.error('Erreur lors du retrait')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className={`
          w-full h-12 gap-2 font-semibold
          ${variant === 'primary'
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
          }
        `}
      >
        <Download className="w-4 h-4" />
        {label}
      </Button>
    )
  }

  return (
    <div className="glass-card p-4 space-y-4 border border-emerald-500/20">
      <p className="text-white font-medium text-sm">{label}</p>

      {/* Montant */}
      <div className="space-y-1">
        <Input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          max={maxAmount}
          min={500}
          className="bg-slate-800 border-slate-700 text-white h-11"
          placeholder="Montant en FCFA"
        />
        <p className="text-slate-500 text-xs">
          Disponible : {formatFCFA(maxAmount)}
        </p>
      </div>

      {/* Choix wallet */}
      <div className="flex gap-2">
        {(['mtn', 'airtel'] as const).map(w => (
          <button
            key={w}
            onClick={() => setWallet(w)}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
              ${wallet === w
                ? w === 'mtn'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-red-500 text-white'
                : 'bg-slate-700 text-slate-400'
              }
            `}
          >
            {w === 'mtn' ? '🟡 MTN Money' : '🔴 Airtel Money'}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Numéro {wallet === 'mtn' ? 'MTN' : 'Airtel'} Money</label>
        <Input
          placeholder="Ex: 06xxx..."
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-11"
        />
        <p className="text-[10px] text-slate-500 italic">Laisse vide pour utiliser ton numéro par défaut.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1 h-11 border-slate-700 text-slate-300"
        >
          Annuler
        </Button>
        <Button
          onClick={handleWithdraw}
          disabled={loading}
          className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : 'Confirmer'
          }
        </Button>
      </div>
    </div>
  )
}
