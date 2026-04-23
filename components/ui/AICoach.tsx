"use client"

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'

import {
  Send,
  Bot,
  User,
  History,
  X,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  saveAIConversation,
  getAIConversations,
  loadAIConversation,
  deleteAIConversation,
  deleteAllAIConversations,
  AIConversation
} from '@/lib/actions/ia.actions'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])



  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setIsInitializing(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (isOpen) {
      setView('chat')
      refreshConversations()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const refreshConversations = async () => {
    const result = await getAIConversations()
    if (result.data) {
      setConversations(result.data)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

    const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed || isLoading) return

    setChatInput('')
    setIsLoading(true)
    setError(null)

    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)

    const streamingMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }
    setMessages([...newHistory, streamingMsg])

    try {
      const response = await fetch('/api/ia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m: any) => ({ role: m.role, content: m.content || '' })),
          conversationId: activeConversationId,
        }),
      })

      if (!response.ok) throw new Error('Erreur API IA')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        setMessages(prev => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          if (updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { ...updated[lastIndex], content: fullText }
          }
          return updated
        })

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }

      refreshConversations()

    } catch (err: any) {
      setError(err.message)
      toast.error("L'IA est momentanément indisponible.")
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }
  const startNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setView('chat')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const selectConversation = async (id: string) => {
    const result = await loadAIConversation(id)
    if (result.data) {
      setMessages(result.data.messages.map((m, i) => ({
        ...m,
        id: i.toString(),
        parts: [{ type: 'text', text: m.content }]
      })) as any)
      setActiveConversationId(id)
      setView('chat')
    } else {
      toast.error(result.error || 'Erreur chargement conversation')
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette conversation ?')) return
    const result = await deleteAIConversation(id)
    if (result.success) {
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversationId === id) {
        startNewConversation()
      }
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Tout supprimer ?')) return
    const result = await deleteAllAIConversations()
    if (result.success) {
      setConversations([])
      startNewConversation()
    }
  }

  const renderMessageContent = (m: any) => {
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts
        .map((part: any) => (part.type === 'text' ? part.text : ''))
        .join('')
    }
    return m.content || ''
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative text-slate-400 hover:text-emerald-400 transition-colors"
        aria-label="Coach Likelemba"
      >
        <Bot size={22} />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </Button>

      {isOpen && mounted && createPortal(
        <div
          className={cn(
            "fixed z-[100] flex flex-col bg-slate-950 border-none outline-none overflow-hidden shadow-2xl",
            "inset-0 top-0 left-0 w-full h-full rounded-none",
            "md:inset-auto md:bottom-4 md:right-4 md:left-auto md:top-auto md:w-[384px] md:h-[600px] md:rounded-2xl md:border md:border-slate-800"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-row items-center justify-between shrink-0 h-16">
            <div className="flex items-center gap-3">
              {view === 'history' ? (
                <Button variant="ghost" size="icon" onClick={() => setView('chat')} className="text-slate-400">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setView('history')} className="text-slate-400">
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
                      {m.role === 'user' ? (
                        <span className="whitespace-pre-wrap break-words">{renderMessageContent(m)}</span>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none
                          prose-p:my-1 prose-p:leading-relaxed
                          prose-headings:text-emerald-400 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                          prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                          prose-strong:text-white prose-strong:font-semibold
                          prose-em:text-slate-300
                          prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                          prose-ol:my-1 prose-ol:pl-4
                          prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                          prose-blockquote:border-l-emerald-500 prose-blockquote:text-slate-400 prose-blockquote:italic
                          prose-hr:border-slate-700
                        ">
                          <ReactMarkdown>
                            {renderMessageContent(m)}
                          </ReactMarkdown>
                          {isLoading && m === messages[messages.length - 1] && (
                            <span className="inline-block w-1 h-4 bg-emerald-500 ml-1 animate-pulse align-middle" />
                          )}
                        </div>
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
