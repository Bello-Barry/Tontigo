import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartHandshake } from 'lucide-react'
import { formatFCFA } from '@/lib/utils/format'

interface SolidarityPoolCardProps {
  balance: number
}

export function SolidarityPoolCard({ balance }: SolidarityPoolCardProps) {
  return (
    <Card className="glass-card overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <HeartHandshake className="w-4 h-4 text-primary" />
          Fonds de solidarité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatFCFA(balance)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Alimenté par 2% de chaque paiement pour couvrir les défauts.
        </p>
      </CardContent>
    </Card>
  )
}
