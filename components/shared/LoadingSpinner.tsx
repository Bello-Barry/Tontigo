import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
