'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { Bot, X, Send, User, ChevronDown } from 'lucide-react'

export function AICoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputState, setInputState] = useState('')
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
  })
  const isLoading = status === 'streaming' || status === 'submitting'
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all z-50 animate-bounce"
        aria-label="Ouvrir le Coach Likelemba"
      >
        <Bot size={28} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[350px] sm:max-w-[400px] h-[500px] flex flex-col bg-background border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden transform transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-emerald-600 dark:bg-emerald-800 text-white shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <h3 className="font-semibold text-lg">Coach Likelemba</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-emerald-500/30 rounded-md transition-colors"
          aria-label="Fermer"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            <Bot size={40} className="mx-auto mb-3 opacity-50" />
            <p>Bonjour ! Je suis le Coach Likelemba.</p>
            <p className="text-sm mt-1">Posez-moi une question sur vos tontines ou vos épargnes.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`p-3 rounded-2xl whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted rounded-tl-none text-sm leading-relaxed'
              }`}
            >
              {m.parts 
                ? m.parts.map((p: any, i: number) => p.type === 'text' ? <React.Fragment key={i}>{p.text}</React.Fragment> : null) 
                : (m as any).content || (m as any).text || ''
              }
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 max-w-[85%]">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-muted flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150"></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          if (!inputState.trim()) return
          append({ role: 'user', content: inputState })
          setInputState('')
        }} 
        className="p-3 border-t border-border shrink-0 bg-background flex items-center gap-2"
      >
        <input
          value={inputState}
          onChange={(e) => setInputState(e.target.value)}
          placeholder="Posez votre question..."
          className="flex-1 min-w-0 bg-muted px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputState.trim()}
          className="shrink-0 p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
        </button>
      </form>
    </div>
  )
}
