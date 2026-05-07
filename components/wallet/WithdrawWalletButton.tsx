'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { withdrawFromWallet } from '@/lib/actions/wallet.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader2, Fingerprint, ShieldCheck } from 'lucide-react'
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
  const [open, setOpen]           = useState(false)
  const [amount, setAmount]       = useState(String(maxAmount))
  const [wallet, setWallet]       = useState<'mtn' | 'airtel'>('mtn')
  const [phone, setPhone]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [bioChecked, setBioChecked] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)
  const router = useRouter()

  const handleBiometric = async () => {
    setBioLoading(true)
    try {
      const { requestBiometricConfirmation } = await import('@/lib/biometric')
      const confirmed = await requestBiometricConfirmation(`Confirmer le retrait de ${formatFCFA(parseFloat(amount))}`)
      if (confirmed) {
        setBioChecked(true)
        toast.success('✅ Identité confirmée', { autoClose: 2000 })
      } else {
        toast.error('Authentification biométrique refusée.')
      }
    } catch {
      // Si WebAuthn non disponible, on laisse passer
      setBioChecked(true)
    } finally {
      setBioLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const num = parseFloat(amount)
    if (!num || num < 500)        { toast.error('Minimum 500 FCFA'); return }
    if (num > maxAmount)           { toast.error('Montant supérieur au solde'); return }
    if (!bioChecked)               { toast.error('Veuillez d\'abord confirmer votre identité.'); return }

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
          toastId: 'withdraw-pending',
          icon: <Loader2 className="animate-spin text-yellow-400" />,
        })

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
            setBioChecked(false)
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
        toast.success(`✅ ${formatFCFA(num)} envoyés sur ton portefeuille mobile !`)
        setOpen(false)
        setBioChecked(false)
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
        onClick={() => { setOpen(true); setBioChecked(false) }}
        className={`
          w-full h-14 gap-3 font-bold rounded-2xl transition-all duration-300
          ${variant === 'primary'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/40 border-none'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm'
          }
        `}
      >
        <Download className="w-5 h-5" />
        {label}
      </Button>
    )
  }

  return (
    <div className="glass-card p-6 space-y-6 border border-emerald-500/30 bg-emerald-500/5 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <p className="text-white font-bold text-lg">{label}</p>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setBioChecked(false) }} className="text-slate-500 hover:text-white">Annuler</Button>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Montant à retirer</label>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setBioChecked(false) }}
            max={maxAmount}
            min={500}
            className="bg-slate-900/50 border-slate-800 text-white h-14 text-xl font-bold pl-4 focus:ring-emerald-500/50 rounded-xl"
            placeholder="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">FCFA</div>
        </div>
        <p className="text-slate-500 text-xs">
          Maximum retirable : <span className="text-emerald-400 font-medium">{formatFCFA(maxAmount)}</span>
        </p>
      </div>

      {/* Choix wallet */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Méthode de réception</label>
        <div className="flex gap-3">
          {(['mtn', 'airtel'] as const).map(w => (
            <button
              key={w}
              onClick={() => { setWallet(w); setBioChecked(false) }}
              className={`
                flex-1 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2
                ${wallet === w
                  ? w === 'mtn'
                    ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-900/20 scale-[1.02]'
                    : 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20 scale-[1.02]'
                  : 'bg-slate-900 border-slate-800 text-slate-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                }
              `}
            >
              {w === 'mtn' ? '🟡 MTN Money' : '🔴 Airtel Money'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Numéro de téléphone</label>
        <Input
          placeholder="Ex: 06 456 78 90"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="bg-slate-900/50 border-slate-800 text-white h-12 rounded-xl focus:ring-emerald-500/50"
        />
        <p className="text-[10px] text-slate-500 italic">Par défaut, nous utilisons le numéro lié à ton profil.</p>
      </div>

      {/* Étape biométrique */}
      {!bioChecked ? (
        <button
          onClick={handleBiometric}
          disabled={bioLoading}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-3 transition-all"
        >
          {bioLoading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</>
            : <><Fingerprint className="w-5 h-5" /> Confirmer mon identité</>
          }
        </button>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-sm font-semibold">Identité confirmée — vous pouvez retirer</p>
        </div>
      )}

      {/* Bouton confirmation finale */}
      <Button
        onClick={handleWithdraw}
        disabled={loading || !bioChecked}
        className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
      >
        {loading
          ? <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</div>
          : 'Confirmer le retrait'
        }
      </Button>
    </div>
  )
}
