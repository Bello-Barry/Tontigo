'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { checkMomoStatus } from '@/lib/actions/paiement.actions'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

interface MomoStatusBadgeProps {
  referenceId: string
  type: 'collection' | 'disbursement'
  currentStatus?: string
}

export function MomoStatusBadge({ referenceId, type, currentStatus = 'pending' }: MomoStatusBadgeProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  const handleCheck = async () => {
    if (!referenceId) return
    setLoading(true)
    try {
      const result = await checkMomoStatus({ referenceId, type })
      if (result.success && result.data) {
        setStatus(result.data.status)
        if (result.data.status === 'SUCCESSFUL') {
          toast.success('Paiement confirmé !')
          router.refresh()
        } else if (result.data.status === 'FAILED' || result.data.status === 'REJECTED') {
          toast.error('Paiement échoué.')
          router.refresh()
        } else {
          toast.info('Toujours en attente...')
        }
      } else {
        toast.error(result.error || 'Erreur lors de la vérification')
      }
    } catch (err) {
      toast.error('Erreur technique')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'SUCCESSFUL' || status === 'success') {
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Confirmé</span>
      </div>
    )
  }

  if (status === 'FAILED' || status === 'REJECTED' || status === 'failed') {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
        <XCircle className="w-3.5 h-3.5" />
        <span>Échoué</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-medium animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        <span>En attente...</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCheck}
        disabled={loading}
        className="h-7 px-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 gap-1 border border-slate-700"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        Vérifier
      </Button>
    </div>
  )
}
