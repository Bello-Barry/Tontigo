import { WifiOff } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 bg-slate-950">
      <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center">
        <WifiOff className="w-10 h-10 text-slate-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Tu es hors ligne</h1>
        <p className="text-slate-400 max-w-xs mx-auto">
          Il semblerait que tu n'aies pas de connexion internet.
          Vérifie ton réseau pour continuer à utiliser Likelemba.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition-colors"
      >
        Réessayer
      </Link>
    </div>
  )
}
