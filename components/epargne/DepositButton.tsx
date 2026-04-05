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
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeposit = async () => {
    const num = parseInt(amount)
    if (!num || num < 500) { toast.error('Minimum 500 FCFA'); return }
    setLoading(true)
    const result = await depositToVault(vaultId, { amount: num, wallet_type: wallet })
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success('✅ Versement enregistré !')
    setAmount('')
    setOpen(false)
    router.refresh()
    setLoading(false)
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
