'use client'
import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export function VaultCountdown({ unlockDate }: { unlockDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const target = new Date(unlockDate).getTime()

    const update = () => {
      const now   = new Date().getTime()
      const diff  = target - now

      if (diff <= 0) {
        setTimeLeft('Déblocage imminent...')
        return
      }

      const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) setTimeLeft(`${days}j ${hours}h restants`)
      else setTimeLeft(`${hours}h ${mins}m restants`)
    }

    update()
    const timer = setInterval(update, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [unlockDate])

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <Timer className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-amber-500 text-xs font-semibold uppercase tracking-wider">Compte à rebours</p>
          <p className="text-white font-bold">{timeLeft}</p>
        </div>
      </div>
    </div>
  )
}
