'use client'
import { Copy } from 'lucide-react'

interface CopyInviteCodeProps {
  code: string
}

export function CopyInviteCode({ code }: CopyInviteCodeProps) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(code)}
      className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
      title="Copier le code"
    >
      <Copy className="w-4 h-4 text-slate-400" />
    </button>
  )
}
