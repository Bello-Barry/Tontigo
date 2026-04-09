import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Vous êtes hors ligne</h1>
      <p className="text-slate-400 max-w-xs mb-8">
        Certaines fonctionnalités de Likelemba nécessitent une connexion internet.
        Vos données seront synchronisées dès que vous serez de retour.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
      >
        Réessayer
      </Link>
    </div>
  )
}
