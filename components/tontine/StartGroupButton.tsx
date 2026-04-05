'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { startGroup } from '@/lib/actions/tontine.actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'

export function StartGroupButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    setLoading(true)
    const result = await startGroup(groupId)
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success('🚀 La tontine a démarré !')
    router.refresh() // Rafraîchir la page pour voir le nouveau statut
  }

  return (
    <Button
      onClick={handleStart}
      disabled={loading}
      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Démarrage...</>
        : <><Play className="w-4 h-4" /> Démarrer la tontine</>
      }
    </Button>
  )
}
