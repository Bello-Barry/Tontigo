import { Badge } from "@/components/ui/badge"

interface UserBadgeProps {
  badge: 'nouveau' | 'fiable' | 'expert' | 'fraudeur';
}

export function UserBadge({ badge }: UserBadgeProps) {
  switch (badge) {
    case 'expert':
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Expert</Badge>
    case 'fiable':
      return <Badge className="bg-blue-500/10 text-blue-500 border-none">Fiable</Badge>
    case 'nouveau':
      return <Badge className="bg-muted text-muted-foreground border-none">Nouveau</Badge>
    case 'fraudeur':
      return <Badge variant="destructive">Fraudeur</Badge>
    default:
      return null
  }
}
