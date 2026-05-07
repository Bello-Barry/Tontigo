'use client'
import { useState, useTransition } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2, TrendingUp, TrendingDown, Minus, MessageSquare, CheckSquare } from 'lucide-react'

interface GroupSummaryResult {
  summary:       string
  key_topics:    string[]
  mood:          'positif' | 'neutre' | 'tendu'
  action_items:  string[]
}

interface GroupSummaryWidgetProps {
  groupId: string
  onGenerate: (groupId: string) => Promise<GroupSummaryResult | null>
}

const MOOD_CONFIG = {
  positif: { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Ambiance Positive' },
  neutre:  { icon: Minus,        color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',   label: 'Ambiance Neutre'   },
  tendu:   { icon: TrendingDown, color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', label: 'Ambiance Tendue'   },
}

export function GroupSummaryWidget({ groupId, onGenerate }: GroupSummaryWidgetProps) {
  const [summary, setSummary]   = useState<GroupSummaryResult | null>(null)
  const [open, setOpen]         = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await onGenerate(groupId)
      setSummary(result)
      setOpen(true)
    })
  }

  const moodCfg = summary ? MOOD_CONFIG[summary.mood] : null

  return (
    <div className="glass-card border-slate-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={summary ? () => setOpen(v => !v) : handleGenerate}
        disabled={isPending}
        className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
            {isPending
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Sparkles className="w-4 h-4 text-white" />
            }
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Résumé IA du groupe</p>
            <p className="text-slate-500 text-xs">
              {isPending ? 'Analyse en cours…' : summary ? 'Généré par Likelemba AI' : 'Résumer les derniers échanges'}
            </p>
          </div>
        </div>

        {summary && (
          open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />
        )}

        {!summary && !isPending && (
          <span className="text-xs font-bold text-violet-400 group-hover:text-violet-300 transition-colors">
            Générer →
          </span>
        )}
      </button>

      {/* Contenu */}
      {open && summary && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Humeur */}
          {moodCfg && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${moodCfg.bg} ${moodCfg.color}`}>
              <moodCfg.icon className="w-3.5 h-3.5" />
              {moodCfg.label}
            </div>
          )}

          {/* Résumé narratif */}
          <div className="flex gap-3">
            <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-slate-300 text-sm leading-relaxed">{summary.summary}</p>
          </div>

          {/* Sujets clés */}
          {summary.key_topics.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Sujets abordés</p>
              <div className="flex flex-wrap gap-2">
                {summary.key_topics.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {summary.action_items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">À retenir</p>
              <ul className="space-y-1.5">
                {summary.action_items.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-générer */}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            {isPending ? '⏳ Actualisation…' : '↻ Actualiser le résumé'}
          </button>
        </div>
      )}
    </div>
  )
}
