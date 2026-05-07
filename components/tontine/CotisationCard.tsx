'use client'
import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFCFA, formatDate, getDaysUntil } from '@/lib/utils/format'
import { payContribution } from '@/lib/actions/tontine.actions'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { Loader2, AlertTriangle, CheckCircle2, Wallet, Calendar, ImagePlus, Sparkles, ShieldCheck } from 'lucide-react'
import type { Contribution } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

interface CotisationCardProps {
  contribution: Contribution
  penaltyRate?: number
  userId?: string
}

export function CotisationCard({ contribution, penaltyRate, userId }: CotisationCardProps) {
  const [isLoading, setIsLoading]       = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<'mtn' | 'airtel'>('mtn')
  const [isOpen, setIsOpen]             = useState(false)
  const [tab, setTab]                   = useState<'mobile' | 'receipt'>('mobile')
  const [receiptAnalyzing, setReceiptAnalyzing] = useState(false)
  const [receiptResult, setReceiptResult]       = useState<any>(null)
  const receiptInputRef                 = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isPaid = contribution.status === 'paye'
  const isLate = contribution.status === 'retard'
  const daysLeft = getDaysUntil(contribution.due_date)

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const res = await payContribution(contribution.id, selectedWallet)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('💰 Cotisation payée avec succès !')
        setIsOpen(false)
        router.refresh()
      }
    } catch (err) {
      toast.error('Erreur lors du paiement.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptAnalyzing(true)
    setReceiptResult(null)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1]
        const { analyzePaymentReceipt } = await import('@/lib/ai/modules/receipt-analysis')
        const result = await analyzePaymentReceipt(base64, file.type)
        setReceiptResult(result)

        if (result.is_payment_receipt && result.confidence >= 0.75 && result.amount !== null) {
          if (Math.abs(result.amount - totalAmount) < totalAmount * 0.1) {
            // Montant correct (~10% de marge) → valider automatiquement
            const res = await payContribution(contribution.id, 'mtn')
            if (!res.error) {
              toast.success('✅ Reçu validé par IA — Cotisation marquée comme payée !')
              setIsOpen(false)
              router.refresh()
            } else {
              toast.error(res.error)
            }
          } else {
            toast.warning(`⚠️ Reçu valide mais montant différent : ${result.amount?.toLocaleString()} vs ${totalAmount.toLocaleString()} FCFA attendus.`)
          }
        } else if (!result.is_payment_receipt) {
          toast.error('❌ Cette image ne semble pas être un reçu de paiement valide.')
        } else {
          toast.warning(`Analyse incertaine (confiance: ${Math.round(result.confidence * 100)}%). Vérification manuelle requise.`)
        }
        setReceiptAnalyzing(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Receipt analysis error:', err)
      toast.error('Erreur lors de l\'analyse du reçu.')
      setReceiptAnalyzing(false)
    }
  }

  const penaltyAmount = contribution.penalty_amount || 0
  const totalAmount   = contribution.amount + penaltyAmount

  return (
    <Card className={`glass-card overflow-hidden border-l-4 ${
      isPaid ? 'border-l-emerald-500' : 
      isLate ? 'border-l-red-500' : 
      'border-l-blue-500'
    }`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3 h-3" />
            Échéance: {formatDate(contribution.due_date)}
          </p>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatFCFA(totalAmount)}
          </div>
          {penaltyAmount > 0 && (
            <p className="text-[10px] text-red-400 flex items-center gap-1 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" /> Inclut {formatFCFA(penaltyAmount)} d'amende
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {isPaid ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> PAYÉ
            </div>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
                  Payer
                </Button>
              } />
              <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Règlement de cotisation</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Paye via Mobile Money ou uploade ton reçu.
                  </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
                  <button
                    onClick={() => setTab('mobile')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      tab === 'mobile' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 inline mr-1.5" />Mobile Money
                  </button>
                  <button
                    onClick={() => setTab('receipt')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      tab === 'receipt' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />Reçu par IA
                  </button>
                </div>

                <div className="py-2 space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total à payer</span>
                    <span className="text-2xl font-bold text-emerald-400">{formatFCFA(totalAmount)}</span>
                  </div>

                  {tab === 'mobile' ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-slate-300 flex items-center gap-2">
                           <Wallet className="w-4 h-4" /> Mode de paiement
                        </Label>
                        <WalletSelector selected={selectedWallet} onSelect={setSelectedWallet} />
                      </div>
                      <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg" onClick={handlePayment} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Confirmer le paiement'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        onClick={() => receiptInputRef.current?.click()}
                        className="border-2 border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
                      >
                        {receiptAnalyzing ? (
                          <>
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                            <p className="text-violet-300 text-sm font-semibold">Analyse IA en cours…</p>
                            <p className="text-slate-500 text-xs">Gemini examine votre reçu</p>
                          </>
                        ) : receiptResult ? (
                          <>
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            <p className="text-white font-bold text-sm">
                              {receiptResult.is_payment_receipt ? '✅ Reçu valide détecté' : '❌ Pas un reçu de paiement'}
                            </p>
                            {receiptResult.amount && (
                              <p className="text-slate-400 text-xs">Montant détecté : {receiptResult.amount?.toLocaleString()} {receiptResult.currency ?? 'FCFA'}</p>
                            )}
                            <p className="text-violet-400 text-xs">Cliquer pour réessayer avec une autre image</p>
                          </>
                        ) : (
                          <>
                            <ImagePlus className="w-8 h-8 text-violet-400" />
                            <p className="text-violet-300 font-bold text-sm">Prendre une photo de votre reçu</p>
                            <p className="text-slate-500 text-xs text-center">L'IA Likelemba analysera votre reçu MoMo et validera automatiquement votre cotisation</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={receiptInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleReceiptUpload}
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {!isPaid && (
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isLate ? 'text-red-400' : 'text-slate-500'}`}>
              {isLate ? 'EN RETARD' : `J-${daysLeft}`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
}
