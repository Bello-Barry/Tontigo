'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-12 rounded-xl bg-slate-700/20 border border-slate-600/30 animate-pulse" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        w-full h-12 rounded-xl
        bg-slate-700/50 hover:bg-slate-700
        border border-slate-600
        text-slate-300 font-medium text-sm
        flex items-center justify-between px-4
        transition-colors
      "
    >
      <div className="flex items-center gap-3">
        {isDark
          ? <Moon className="w-4 h-4 text-slate-400" />
          : <Sun  className="w-4 h-4 text-yellow-400" />
        }
        <span>{isDark ? 'Mode sombre' : 'Mode clair'}</span>
      </div>
      {/* Toggle visuel */}
      <div className={`
        w-10 h-6 rounded-full transition-colors relative
        ${isDark ? 'bg-slate-600' : 'bg-emerald-500'}
      `}>
        <div className={`
          w-4 h-4 bg-white rounded-full absolute top-1
          transition-transform
          ${isDark ? 'left-1' : 'left-5'}
        `} />
      </div>
    </button>
  )
}
