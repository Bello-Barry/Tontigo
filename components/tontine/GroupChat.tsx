"use client"

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { deleteMessage } from '@/lib/actions/chat.actions'
import { toast } from 'react-toastify'
import { AudioRecorder } from './AudioRecorder'
import { AudioPlayer } from './AudioPlayer'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  message_type: 'text' | 'audio' | 'system'
  audio_url?: string
  audio_duration_seconds?: number
  is_deleted: boolean
  created_at: string
  user_id: string
  user?: {
    full_name: string
    avatar_url: string | null
  }
}

interface GroupChatProps {
  groupId: string
  currentUserId: string
  currentUserProfile: { full_name: string; avatar_url: string | null }
  members: any[]
}

export function GroupChat({ groupId, currentUserId, currentUserProfile, members }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  const supabase = createClient()

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    if (!isOpen) return

    const loadMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('group_messages')
        .select('*, user:users(full_name, avatar_url)')
        .eq('group_id', groupId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (!error && data) {
        setMessages(data as any)
      }
      setIsLoading(false)
      setTimeout(() => scrollToBottom('auto'), 100)
    }

    loadMessages()

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload: any) => {
        setMessages((prev) => {
          const tempIndex = prev.findIndex(m =>
            m.id.startsWith('temp-') &&
            m.content === payload.new.content &&
            m.user_id === payload.new.user_id
          )

          if (tempIndex !== -1) {
            const updated = [...prev]
            updated[tempIndex] = { ...payload.new, user: prev[tempIndex].user } as any
            return updated
          }

          if (prev.some(m => m.id === payload.new.id)) return prev

          // Fetch profile for others
          const loadOtherProfile = async () => {
             const { data } = await supabase.from('users').select('full_name, avatar_url').eq('id', payload.new.user_id).single()
             if (data) {
                setMessages(current => current.map(m => m.id === payload.new.id ? { ...m, user: data } as any : m))
             }
          }
          loadOtherProfile()

          return [...prev, payload.new as any]
        })
        setTimeout(() => scrollToBottom(), 100)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload: any) => {
        if (payload.new.is_deleted) {
          setMessages(prev => prev.filter(m => m.id !== payload.new.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, groupId, supabase])

    const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed || isSending) return

    setNewMessage('')
    setIsSending(true)

    const tempId = `temp-${Date.now()}-${Math.random()}`
    const optimisticMessage = {
      id: tempId,
      content: trimmed,
      message_type: 'text',
      is_deleted: false,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user: currentUserProfile,
    }

    setMessages(prev => [...prev, optimisticMessage as any])
    setTimeout(() => scrollToBottom(), 50)

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: currentUserId,
        content: trimmed,
        message_type: 'text'
      })

    if (error) {
      toast.error("Erreur lors de l'envoi")
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(trimmed)
    }
    setIsSending(false)
  }

  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage(messageId)
    if (result.error) {
      toast.error(result.error)
    }
  }

  const getSenderColor = (userId: string): string => {
    const colors = [
      '#ef4444', '#f97316', '#eab308',
      '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899',
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-transform z-[100] bg-emerald-600 hover:bg-emerald-500 text-white"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {isOpen && mounted && createPortal(
        <div
          className={cn(
            "fixed z-[100] flex flex-col bg-slate-950 border-none outline-none overflow-hidden shadow-2xl",
            // Mobile style
            "inset-0 top-0 left-0 w-full h-full rounded-none",
            // Desktop style
            "md:inset-auto md:bottom-4 md:right-4 md:left-auto md:top-auto md:w-[384px] md:h-[600px] md:rounded-2xl md:border md:border-slate-800"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-row items-center justify-between shrink-0 h-16">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <h2 className="text-white font-medium">Chat du Groupe</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Chargement...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30">
                <MessageSquare className="w-12 h-12" />
                <p className="text-sm">Aucun message pour l'instant.<br/>Dites bonjour au groupe !</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_id === currentUserId
                const sender = msg.user || { full_name: 'Membre', avatar_url: null }

                return (
                  <div key={msg.id} className={cn("flex gap-2 items-end", isMe ? 'flex-row-reverse' : 'flex-row')}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 overflow-hidden border border-slate-700">
                        {sender.avatar_url ? (
                          <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {(sender.full_name || 'M')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={cn("flex flex-col max-w-[75%] gap-0.5", isMe ? 'items-end' : 'items-start')}>
                      {!isMe && (
                        <span className="text-[10px] font-semibold px-1" style={{ color: getSenderColor(msg.user_id) }}>
                          {sender.full_name}
                        </span>
                      )}
                      <div className="relative group">
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl text-sm shadow-sm",
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                          )}
                        >
                          {msg.message_type === 'audio' ? (
                            <AudioPlayer url={msg.audio_url!} duration={msg.audio_duration_seconds!} isOwn={isMe} />
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                        </div>

                        {isMe && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 px-1">
                        {format(new Date(msg.created_at), 'HH:mm')}
                        {isMe && ' ✓'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0 min-h-[70px]">
            <div className="flex items-end gap-2 max-w-full">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none max-h-32 scrollbar-hide min-w-0"
                style={{ minHeight: '40px' }}
              />

              {!newMessage.trim() && (
                <div className="shrink-0">
                  <AudioRecorder groupId={groupId} />
                </div>
              )}

              {newMessage.trim() && (
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isSending}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
