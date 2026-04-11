'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { Bot, Send, User, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, X, MessageSquare, History, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  const { 
    messages, 
    setMessages,
    append,
    status, 
    error 
  } = useChat({
    api: '/api/chat',
    onFinish: async (message) => {
      if (activeConversationId) {
        await supabase.from('ai_messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: message.content,
        })
      }
    }
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Fetch user and conversations
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        loadConversations(user.id)
      }
    }
    if (isOpen) init()
  }, [isOpen])

  const loadConversations = async (uid: string) => {
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    if (data) setConversations(data)
  }

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content
      })) as any)
    }
  }

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId])

  const startNewConversation = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: 'Nouvelle discussion'
      })
      .select()
      .single()

    if (data) {
      setConversations([data, ...conversations])
      setActiveConversationId(data.id)
    }
  }

  const deleteConversation = async (id: string) => {
    if (!confirm('Supprimer cette discussion ?')) return
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id)

    if (!error) {
      setConversations(conversations.filter(c => c.id !== id))
      if (activeConversationId === id) {
        setActiveConversationId(null)
        setMessages([])
      }
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading || !userId) return

    const messageToSend = chatInput
    setChatInput('')
    
    let currentConvId = activeConversationId

    if (!currentConvId) {
      // Auto-create conversation if none active
      const { data } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: messageToSend.substring(0, 30) + (messageToSend.length > 30 ? '...' : '')
        })
        .select()
        .single()

      if (data) {
        currentConvId = data.id
        setActiveConversationId(data.id)
        setConversations([data, ...conversations])
      }
    }

    if (currentConvId) {
      // Save user message
      await supabase.from('ai_messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: messageToSend,
      })

      // Update conversation timestamp
      await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', currentConvId)

      try {
        await append({
          role: 'user',
          content: messageToSend,
        })
      } catch (err) {
        console.error("Coach Likelemba Error:", err)
      }
    }
  }

  const renderMessageContent = (m: any) => {
    if (m.content) return m.content
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts
        .map((part: any) => (part.type === 'text' ? part.text : ''))
        .join('')
    }
    return ''
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-emerald-400 transition-colors"
            aria-label="Coach Likelemba"
          >
            <Bot size={22} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Button>
        }
      />

      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 flex flex-row bg-slate-950 border-none rounded-none outline-none overflow-hidden">
        {/* Sidebar - Conversation History */}
        {isSidebarOpen && (
          <div className="w-80 h-full border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800">
              <Button
                onClick={startNewConversation}
                className="w-full justify-start gap-2 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white"
                variant="outline"
              >
                <Plus size={18} />
                Nouvelle discussion
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Historique
              </div>
              {conversations.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center italic">
                  Aucune conversation
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                      activeConversationId === conv.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <MessageSquare size={16} />
                    <span className="flex-1 truncate text-sm">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
          <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-slate-400 hover:text-white"
              >
                <History className="w-5 h-5" />
              </Button>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 text-emerald-500" />
                Coach Likelemba
              </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Bot size={48} className="text-emerald-500" />
                <h3 className="text-xl font-medium text-white">Comment puis-je vous aider aujourd'hui ?</h3>
                <p className="max-w-md text-slate-400">
                  Je suis votre assistant financier expert en Tontines et Likelemba. Posez-moi n'importe quelle question.
                </p>
              </div>
            )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[90%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                m.role === 'user' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 text-emerald-400'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`p-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600/10 text-emerald-50 border border-emerald-600/20 rounded-tr-none'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                {renderMessageContent(m)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-emerald-400">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="text-xs text-slate-500 font-medium">Réflexion...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-900/10 border border-red-900/20 rounded-xl mx-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>Une erreur est survenue (API). Vérifiez votre connexion.</p>
            </div>
          )}
          
          <div ref={endOfMessagesRef} />
        </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 mt-auto shrink-0">
            <form onSubmit={handleCustomSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Écrivez votre question..."
              className="flex-1 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              size="icon"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 w-10 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-center text-slate-500 mt-3 font-medium opacity-50">
             Coach Likelemba • IA Prédictive
          </p>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
