'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFCFA, formatDate, getDaysUntil } from '@/lib/utils/format'
import { payContribution } from '@/lib/actions/tontine.actions'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { Loader2, AlertTriangle, CheckCircle2, Wallet, Calendar } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<'mtn' | 'airtel'>('mtn')
  const [isOpen, setIsOpen] = useState(false)
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
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
                  Payer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Règlement de cotisation</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Saisie ton paiement mobile pour valider ton tour.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-2 space-y-6">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total à payer</span>
                    <span className="text-2xl font-bold text-emerald-400">{formatFCFA(totalAmount)}</span>
                  </div>
                  
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
