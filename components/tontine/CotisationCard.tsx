'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatFCFA, formatDate, getDaysUntil } from '@/lib/utils/format'
import { payContribution } from '@/lib/actions/tontine.actions'
import { WalletSelector } from '@/components/shared/WalletSelector'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Contribution } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface CotisationCardProps {
  contribution: Contribution
}

export function CotisationCard({ contribution }: CotisationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<'mtn'|'airtel'>('mtn')
  const [isOpen, setIsOpen] = useState(false)

  const isPaid = contribution.status === 'paye'
  const isLate = contribution.status === 'retard' || contribution.status === 'penalise'
  const daysLeft = getDaysUntil(contribution.due_date)

  const handlePayment = async () => {
    setIsLoading(true)
    const res = await payContribution(contribution.id, selectedWallet)
    setIsLoading(false)
    if (res.success || res.data) {
      setIsOpen(false)
    } else {
      alert(res.error)
    }
  }

  const totalAmount = contribution.amount + (contribution.penalty_amount || 0)

  return (
    <Card className={`overflow-hidden border-l-4 ${
      isPaid ? 'border-l-emerald-500' : 
      isLate ? 'border-l-red-500' : 
      'border-l-blue-500'
    }`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Échéance: <span className="font-medium text-foreground">{formatDate(contribution.due_date)}</span>
          </p>
          <div className="text-2xl font-bold mt-1">
            {formatFCFA(totalAmount)}
          </div>
          {contribution.penalty_amount > 0 && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Inclut {formatFCFA(contribution.penalty_amount)} de pénalités
            </p>
          )}
        </div>

        <div>
          {isPaid ? (
            <div className="flex items-center gap-2 text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Payé
            </div>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Payer
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Payer la cotisation</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="bg-muted p-4 rounded-lg flex justify-between items-center text-lg font-bold">
                    <span>Total à payer:</span>
                    <span>{formatFCFA(totalAmount)}</span>
                  </div>
                  
                  <WalletSelector selected={selectedWallet} onSelect={setSelectedWallet} />
                  
                  <Button className="w-full" onClick={handlePayment} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirmer le paiement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {!isPaid && !isLate && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              J-{daysLeft}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
