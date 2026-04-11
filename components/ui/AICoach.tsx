'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { Bot, Send, User, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const { 
    messages, 
    sendMessage, 
    status, 
    error 
  } = useChat({
    // api: '/api/chat', // SDK defaults to /api/chat
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Mbote ! Je suis le Coach Likelemba. Posez-moi une question sur vos tontines, vos coffres ou comment booster votre Trust Score."
      }
    ] as any[]
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

    const messageToSend = chatInput
    setChatInput('')
    
    try {
      await sendMessage({ text: messageToSend })
    } catch (err) {
      console.error("Coach Likelemba Error:", err)
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger 
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-emerald-400 transition-colors"
            aria-label="Coach Likelemba"
          />
        }
      >
        <Bot size={22} />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-950 border-slate-800">
        <SheetHeader className="p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-emerald-500" />
            Coach Likelemba
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        <div className="p-4 border-t border-slate-800 bg-slate-900 mt-auto">
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
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
      </SheetContent>
    </Sheet>
  )
}
