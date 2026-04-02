import { FolderOpen } from 'lucide-react'
import { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string, description: string, action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed bg-card/30">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderOpen className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
