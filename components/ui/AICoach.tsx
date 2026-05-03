"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User, X, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true); return () => setMounted(false) }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const doSubmit = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setChatInput('')
    setIsLoading(true)
    setError(null)

    const userMsg = { role: 'user', content: trimmed, id: Date.now().toString() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)

    const assistantMsgId = (Date.now() + 1).toString()
    setMessages([...newHistory, { role: 'assistant', content: '', id: assistantMsgId }])

    try {
      const response = await fetch('/api/ia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        const txt = await response.text()
        throw new Error(txt || `Erreur ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Flux inaccessible")

      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        setMessages(prev => {
          const updated = [...prev]
          const last = updated.length - 1
          if (last >= 0 && updated[last].id === assistantMsgId) {
            updated[last] = { ...updated[last], content: accumulatedText }
            return updated
          }
          return prev
        })
      }
    } catch (err: any) {
      console.error("AICoach Error:", err)
      setError(err.message || "Erreur de connexion")
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isLoading, messages])

  const handleCustomSubmit = (e: React.FormEvent) => { e.preventDefault(); doSubmit(chatInput) }

  if (!mounted) return null

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 transition-all hover:scale-110"
      >
        <Bot size={28} />
      </Button>

      {isOpen && createPortal(
        <div className="fixed z-[100] inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-[420px] md:h-[640px] flex flex-col bg-slate-950 shadow-2xl md:rounded-2xl border border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                 <Bot className="text-emerald-500 w-5 h-5" />
               </div>
               <span className="text-white text-sm font-semibold">Coach Likelemba</span>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X /></Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40 py-20">
                <MessageSquare size={48} className="mb-2" />
                <p className="text-sm">Une question ? Je suis là pour vous aider.</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={m.id || idx} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm", m.role === 'user' ? "bg-emerald-600" : "bg-slate-800 text-emerald-400 border border-slate-700")}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn("p-3 rounded-2xl text-sm max-w-[85%] shadow-sm", m.role === 'user' ? "bg-emerald-600/15 text-white border border-emerald-600/25" : "bg-slate-900 text-slate-200 border border-slate-800")}>
                  {m.role === 'user' ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length-1]?.role === 'user' && (
              <div className="flex gap-2 items-center text-xs text-slate-500 ml-11">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> Réflexion...
              </div>
            )}
            {error && <div className="p-3 text-xs text-red-400 bg-red-900/10 rounded-xl border border-red-900/20 mx-11 italic">{error}</div>}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !chatInput.trim()} size="icon" className="bg-emerald-600 hover:bg-emerald-500 h-10 w-10">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
