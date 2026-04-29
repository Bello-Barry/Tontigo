'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { depositToVault } from '@/lib/actions/epargne.actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus } from 'lucide-react'

export function DepositButton({ vaultId }: { vaultId: string }) {
  const [open, setOpen]     = useState(false)
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState<'mtn' | 'airtel'>('mtn')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeposit = async () => {
    const num = parseInt(amount)
    if (!num || num < 500) { toast.error('Minimum 500 FCFA'); return }
    setLoading(true)
    try {
      const result = await depositToVault(vaultId, { amount: num, wallet_type: wallet }, phone)
      if (result.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (wallet === 'mtn' && result.data?.reference) {
        const refId = result.data.reference
        toast.info('📱 Veuillez confirmer le versement sur votre téléphone...', {
          autoClose: false,
          toastId: 'momo-savings-pending'
        })

        // Polling
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          const { verifySavingsPayment } = await import('@/lib/actions/epargne.actions')
          const check = await verifySavingsPayment(refId, vaultId)
          
          if (check.data?.status === 'SUCCESSFUL') {
            clearInterval(interval)
            toast.dismiss('momo-savings-pending')
            toast.success('✅ Versement MoMo réussi !')
            setOpen(false)
            setAmount('')
            setLoading(false)
            router.refresh()
          } else if (check.data?.status === 'FAILED' || attempts > 40) {
            clearInterval(interval)
            toast.dismiss('momo-savings-pending')
            toast.error(attempts > 40 ? 'Délai expiré.' : '❌ Échec du versement.')
            setLoading(false)
          }
        }, 3000)
      } else {
        toast.success('✅ Versement enregistré !')
        setAmount('')
        setOpen(false)
        router.refresh()
        setLoading(false)
      }
    } catch (err) {
      toast.error('Erreur lors du versement')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
      >
        <Plus className="w-4 h-4" /> Ajouter de l'argent
      </Button>
    )
  }

  return (
    <div className="glass-card p-4 space-y-4">
      <p className="text-white font-medium">Ajouter un versement</p>
      <Input
        type="number"
        placeholder="Montant en FCFA"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="bg-slate-800 border-slate-700 text-white h-12"
      />
      <div className="flex gap-2">
        {(['mtn', 'airtel'] as const).map(w => (
          <button
            key={w}
            onClick={() => setWallet(w)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              wallet === w
                ? w === 'mtn' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {w === 'mtn' ? 'MTN Money' : 'Airtel Money'}
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
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-slate-700 text-slate-300">
          Annuler
        </Button>
        <Button onClick={handleDeposit} disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
        </Button>
      </div>
    </div>
  )
}
