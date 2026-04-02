import { Rocket } from 'lucide-react'

export function MatchingBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 opacity-10 blur-xl">
        <Rocket className="w-64 h-64 text-primary" />
      </div>
      <div className="relative z-10 max-w-xl">
        <h2 className="text-2xl font-bold mb-2 text-primary">Trouvez la tontine parfaite</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Notre algorithme croise votre profil (Score de confiance, revenus) avec les groupes fiables ouverts aux inconnus pour vous garantir des tontines sereines.
        </p>
        <div className="flex gap-4 text-sm font-medium">
          <span className="bg-background/50 px-3 py-1.5 rounded-full border border-primary/20">Frais minimes (500F)</span>
          <span className="bg-background/50 px-3 py-1.5 rounded-full border border-primary/20">Profils vérifiés</span>
        </div>
      </div>
    </div>
  )
}
