"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import { usePathname } from 'next/navigation'

import {
  Send, Bot, User, History, X, Plus, Trash2,
  MessageSquare, Loader2, AlertCircle, ChevronLeft,
  Copy, Check, RefreshCw, Volume2, VolumeX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getAIConversations,
  loadAIConversation,
  deleteAIConversation,
  deleteAllAIConversations,
  AIConversation
} from '@/lib/actions/ia.actions'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'

function getContextualSuggestions(pathname: string | null): string[] {
  if (pathname?.includes('/tontine/')) return ["Comment maximiser mon Tour ?", "Comment éviter une pénalité ?", "Quand épargner davantage ?"]
  if (pathname?.includes('/epargne/')) return ["Comment bien utiliser mon coffre-fort ?", "Quelle durée d'épargne choisir ?", "Atteindre mon objectif"]
  if (pathname?.includes('/matching')) return ["Comment fonctionne le Matching ?", "Quel groupe me convient ?", "Améliorer mon Trust Score"]
  if (pathname?.includes('/portefeuille')) return ["Gérer mon portefeuille", "Quand retirer mes fonds ?", "Épargner intelligemment"]
  return ["Comment marche une tontine ?", "Comment améliorer mon Trust Score ?", "Parler au Coach"]
}

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [messages, setMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  useEffect(() => { setMounted(true); return () => setMounted(false) }, [])

  const refreshConversations = useCallback(async () => {
    try {
      const res = await getAIConversations()
      if (res.data) setConversations(res.data)
    } catch (e) { console.error("Error fetching conversations:", e) }
  }, [])

  useEffect(() => { if (isOpen) refreshConversations() }, [isOpen, refreshConversations])

  const doSubmit = useCallback(async (text: string, historyOverride?: any[]) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setChatInput('')
    setIsLoading(true)
    setError(null)

    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed }
    const currentHistory = historyOverride ?? messages
    const newHistory = [...currentHistory, userMsg]
    setMessages(newHistory)

    const streamingMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }
    setMessages([...newHistory, streamingMsg])

    try {
      const response = await fetch('/api/ia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: currentHistory.map((m: any) => ({ role: m.role, content: m.content || '' })),
          conversationId: activeConversationId,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'Erreur API IA')
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // On traite le chunk brut. Si c'est du texte brut, on l'ajoute.
        // On n'essaie plus de nettoyer les marqueurs SSE ici pour éviter de casser le texte normal.
        fullText += chunk

        setMessages(prev => {
          const updated = [...prev]
          const last = updated.length - 1
          if (updated[last]?.role === 'assistant') {
            updated[last] = { ...updated[last], content: fullText }
          }
          return updated
        })
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
      refreshConversations()
    } catch (err: any) {
      console.error("Chatbot submission error:", err)
      setMessages(prev => prev.filter(m => m.id !== streamingMsg.id))
      setError(err.message)
      toast.error(`Le Coach: ${err.message || "indisponible"}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isLoading, messages, activeConversationId, refreshConversations])

  const handleCustomSubmit = (e: React.FormEvent) => { e.preventDefault(); doSubmit(chatInput) }

  const startNewConversation = () => {
    setActiveConversationId(null); setMessages([]); setView('chat')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const selectConversation = async (id: string) => {
    try {
      const result = await loadAIConversation(id)
      if (result.data) {
        setMessages(result.data.messages.map((m, i) => ({ ...m, id: i.toString() })))
        setActiveConversationId(id); setView('chat')
      }
    } catch (e) { toast.error("Erreur chargement conversation") }
  }

  const suggestions = getContextualSuggestions(pathname)

  if (!mounted) return null

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl md:w-16 md:h-16 active:scale-95 transition-all"
      >
        <Bot size={28} />
      </Button>

      {isOpen && createPortal(
        <div className="fixed z-[100] inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-[420px] md:h-[640px] flex flex-col bg-slate-950 shadow-2xl md:rounded-2xl border-none outline-none overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 h-16">
             <div className="flex items-center gap-3">
               {view === 'history' ? (
                 <Button variant="ghost" size="icon" onClick={() => setView('chat')} className="text-slate-400"><ChevronLeft /></Button>
               ) : (
                 <Button variant="ghost" size="icon" onClick={() => setView('history')} className="text-slate-400"><History /></Button>
               )}
               <span className="text-white text-sm font-semibold">Coach Likelemba</span>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400"><X /></Button>
          </div>

          {view === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <Bot size={48} className="text-emerald-500" />
                    <p className="text-sm text-white">Comment puis-je vous aider ?</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((s, i) => (
                        <Button key={i} variant="outline" size="sm" onClick={() => doSubmit(s)} className="text-xs border-slate-800 bg-slate-900">{s}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, idx) => (
                  <div key={m.id || idx} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("shrink-0 w-8 h-8 rounded-full flex items-center justify-center", m.role === 'user' ? "bg-emerald-600" : "bg-slate-800 text-emerald-400")}>
                      {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={cn("p-3 rounded-2xl text-sm max-w-[85%]", m.role === 'user' ? "bg-emerald-600/20 text-white" : "bg-slate-900 text-slate-200 border border-slate-800")}>
                      {m.role === 'user' ? m.content : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length-1]?.role === 'user' && <div className="flex gap-3"><Loader2 className="animate-spin text-emerald-500" /></div>}
                {error && <div className="p-3 text-xs text-red-400 bg-red-900/10 rounded-xl border border-red-900/20">{error}</div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900">
                <form onSubmit={handleCustomSubmit} className="flex gap-2">
                  <input
                    ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-sm text-white focus:outline-none"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !chatInput.trim()} size="icon" className="bg-emerald-600"><Send size={16} /></Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversations.length === 0 && <p className="text-center text-slate-500 text-xs py-10">Aucun historique</p>}
              {conversations.map(c => (
                <div key={c.id} onClick={() => selectConversation(c.id)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800">
                  <div className="text-sm font-medium text-white truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-500">{new Date(c.updated_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
