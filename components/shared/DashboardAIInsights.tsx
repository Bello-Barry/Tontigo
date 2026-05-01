'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCcw, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardInsights, type AIInsight } from '@/lib/actions/ia.actions'
import { cn } from '@/lib/utils'

export function DashboardAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInsights = async () => {
    setIsLoading(true)
    const result = await getDashboardInsights()
    if (result.data) {
      setInsights(result.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const getIcon = (type: string, iconName?: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'milestone': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'tip': return <Lightbulb className="w-5 h-5 text-indigo-500" />
      default: return <TrendingUp className="w-5 h-5 text-primary" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-orange-500/10 border-orange-500/20'
      case 'milestone': return 'bg-emerald-500/10 border-emerald-500/20'
      case 'tip': return 'bg-indigo-500/10 border-indigo-500/20'
      default: return 'bg-primary/10 border-primary/20'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Intelligence Likelemba
          </h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchInsights} 
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCcw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.1 }}
                className="h-24 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-pulse"
              />
            ))
          ) : (
            insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', damping: 20 }}
              >
                <Card className={cn(
                  "border shadow-none h-full transition-all hover:shadow-md hover:shadow-emerald-500/5",
                  getBgColor(insight.type)
                )}>
                  <CardContent className="p-4 flex gap-3">
                    <div className="mt-1 shrink-0">
                      {getIcon(insight.type, insight.icon)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
