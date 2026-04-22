'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Bot, X, Send, User, Loader2, MessageSquare,
  Trash2, Plus, History, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getAIConversations,
  loadAIConversation,
  deleteAIConversation,
  deleteAllAIConversations
} from '@/lib/actions/ia.actions'
import { MarkdownMessage } from '@/components/ia/MarkdownMessage'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    loadConversations()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadConversations = async () => {
    const res = await getAIConversations()
    if (res.data) setConversations(res.data)
  }

  const startNewConversation = () => {
    setMessages([])
    setActiveConversationId(null)
    setView('chat')
    setError(null)
  }

  const selectConversation = async (id: string) => {
    setActiveConversationId(id)
    const res = await loadAIConversation(id)
    if (res.data) setMessages(res.data.messages)
    setView('chat')
    setError(null)
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Supprimer cette discussion ?')) {
      await deleteAIConversation(id)
      if (activeConversationId === id) startNewConversation()
      loadConversations()
    }
  }

  const handleDeleteAll = async () => {
    if (confirm('Supprimer tout l\'historique ?')) {
      await deleteAllAIConversations()
      startNewConversation()
      loadConversations()
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput.trim() }
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)
    setChatInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages,
          conversationId: activeConversationId
        })
      })

      if (!response.ok) throw new Error('Failed to stream')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }

      setMessages(prev => [...prev, assistantMsg])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantMsg.content += chunk

        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { ...assistantMsg }
          return next
        })
      }

      loadConversations()
    } catch (err) {
      console.error('Stream error:', err)
      setError('Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessageContent = (m: any) => {
    return m.content || ''
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-[100] transition-all duration-300",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          "bg-emerald-600 hover:bg-emerald-500 text-white p-0 flex items-center justify-center group"
        )}
      >
        <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
        </span>
      </Button>

      {/* Chat Panel */}
      {createPortal(
        <div className={cn(
          "fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-slate-950 sm:rounded-3xl shadow-2xl border-l sm:border border-slate-800 z-[100] transition-all duration-500 flex flex-col overflow-hidden",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        )}>
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {view === 'chat' ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20 shadow-inner">
                  <Bot className="w-6 h-6 text-emerald-500" />
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setView('chat')} className="text-slate-400">
                  <History className="w-5 h-5" />
                </Button>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-white text-sm font-semibold">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  {view === 'history' ? 'Historique' : 'Coach Likelemba'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Assistant financier</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {view === 'history' && conversations.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleDeleteAll} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {view === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <Bot size={48} className="text-emerald-500" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white">Comment puis-je vous aider ?</h3>
                      <p className="max-w-xs text-xs text-slate-400 mx-auto">
                        Posez-moi vos questions sur l'épargne collaborative, les tontines ou vos finances.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] bg-slate-900 border-slate-800"
                        onClick={() => { setChatInput("Comment marche une tontine ?"); inputRef.current?.focus(); }}
                      >
                        Comment ça marche ?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] bg-slate-900 border-slate-800"
                        onClick={() => { setChatInput("Conseils pour épargner"); inputRef.current?.focus(); }}
                      >
                        Conseils d'épargne
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex gap-3 max-w-[90%]", m.role === 'user' ? 'ml-auto flex-row-reverse' : 'flex-row')}
                  >
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                      m.role === 'user' ? "bg-emerald-600 text-white" : "bg-slate-800 text-emerald-400 border border-slate-700"
                    )}>
                      {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative",
                      m.role === 'user'
                        ? "bg-emerald-600/10 text-emerald-50 border border-emerald-600/20 rounded-tr-none"
                        : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
                    )}>
                      {m.role === 'assistant' ? (
                        <div>
                          <MarkdownMessage content={renderMessageContent(m)} />
                          {isLoading && m === messages[messages.length - 1] && (
                            <span className="inline-block w-1 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />
                          )}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words text-sm">
                          {renderMessageContent(m)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm">
                      <Bot size={14} />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Réflexion...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/10 border border-red-900/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>Une erreur est survenue. Vérifiez votre connexion.</p>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !chatInput.trim()}
                    size="icon"
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 w-10 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                  >
                    <Send size={18} />
                  </Button>
                </form>
                <p className="text-[9px] text-center text-slate-500 mt-3 font-medium opacity-50 uppercase tracking-tighter">
                   Propulsé par Likelemba Intelligence
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
              <div className="p-4 border-b border-slate-800">
                <Button
                  onClick={startNewConversation}
                  className="w-full justify-start gap-2 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all rounded-xl"
                  variant="outline"
                >
                  <Plus size={18} />
                  Nouvelle discussion
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30">
                    <MessageSquare size={32} />
                    <p className="text-xs">Aucun historique disponible</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                        activeConversationId === conv.id
                          ? "bg-slate-800 border-slate-700 text-white shadow-md"
                          : "bg-slate-900/50 border-transparent text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                    )}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      activeConversationId === conv.id ? "bg-emerald-600" : "bg-slate-800"
                    )}>
                      <MessageSquare size={16} className={activeConversationId === conv.id ? "text-white" : "text-slate-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(conv.updated_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 text-center opacity-20">
              <Bot size={24} className="mx-auto" />
            </div>
          </div>
        )}
      </div>,
        document.body
      )}
    </>
  )
}
