'use client'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { formatFCFA } from "@/lib/utils/format"

interface DashboardChartsProps {
  transactions: any[]
}

export function DashboardCharts({ transactions }: DashboardChartsProps) {
  // 1. Préparer les données pour le graphique d'évolution (Épargne)
  // On trie par date et on calcule le cumul
  const savingsData = transactions
    .filter(t => t.type === 'epargne' && t.status === 'success')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce((acc: any[], t) => {
      const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      const lastAmount = acc.length > 0 ? acc[acc.length - 1].total : 0
      acc.push({ date, total: lastAmount + t.amount })
      return acc
    }, [])

  // 2. Préparer les données pour la répartition (Pie Chart)
  const typesCount = transactions.reduce((acc: any, t) => {
    if (t.status !== 'success') return acc
    acc[t.type] = (acc[t.type] || 0) + t.amount
    return acc
  }, {})

  const pieData = [
    { name: 'Cotisations', value: typesCount['cotisation'] || 0, color: '#ef4444' }, // Red
    { name: 'Épargne', value: typesCount['epargne'] || 0, color: '#10b981' },    // Emerald
    { name: 'Retraits', value: typesCount['retrait'] || 0, color: '#3b82f6' },     // Blue
    { name: 'Abonnements', value: typesCount['abonnement'] || 0, color: '#8b5cf6' } // Violet
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Graphique d'Évolution de l'Épargne */}
      <Card className="lg:col-span-2 glass-card border-emerald-500/10">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            📈 Évolution de l'Épargne
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {savingsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  formatter={(val: number) => [formatFCFA(val), 'Total Épargné']}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Pas assez de données pour le graphique.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Répartition par Type */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Répartition</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col justify-center">
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="200">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                     formatter={(val: number) => formatFCFA(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium">{formatFCFA(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
              Fais ta première transaction pour voir la répartition !
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
