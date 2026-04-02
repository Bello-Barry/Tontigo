import { Badge } from '@/components/ui/badge'

export function GroupStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'en_attente':
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">En attente de membres</Badge>
    case 'actif':
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Actif</Badge>
    case 'suspendu':
      return <Badge variant="destructive">Suspendu (Litige)</Badge>
    case 'termine':
      return <Badge variant="secondary">Terminé</Badge>
    default:
      return null
  }
}
