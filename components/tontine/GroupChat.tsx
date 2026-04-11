"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
}

interface GroupChatProps {
  groupId: string
  currentUserId: string
  members: any[]
}

export function GroupChat({ groupId, currentUserId, members }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initial load
  useEffect(() => {
    if (!isOpen) return

    const loadMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMessages(data)
      }
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    loadMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`chat_${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload: any) => {
        const newMessage = payload.new as Message
        setMessages((prev) => [...prev, newMessage])
        setTimeout(scrollToBottom, 100)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, groupId, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const content = newMessage.trim()
    setNewMessage('') // Optimistic clear

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: currentUserId,
        content: content,
      })

    if (error) {
      console.error('Erreur envoi message:', error)
      // Optionally show toast error
    } else {
      setTimeout(scrollToBottom, 100)
    }
  }

  const getSenderDetails = (userId: string) => {
    const member = members.find(m => m.user_id === userId)
    return member?.user || { full_name: 'Utilisateur inconnu', avatar_url: null }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger 
        render={
          <Button 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-transform"
            size="icon"
          />
        }
      >
        <MessageSquare className="w-6 h-6" />
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-slate-950 border-slate-800">
        <SheetHeader className="p-4 border-b border-slate-800 bg-slate-900">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chat du Groupe
          </SheetTitle>
        </SheetHeader>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Chargement des messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
              <MessageSquare className="w-12 h-12" />
              <p>Aucun message pour l'instant.<br/>Soyez le premier à dire bonjour !</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user_id === currentUserId
              const sender = getSenderDetails(msg.user_id)
              const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id

              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 object-cover overflow-hidden">
                      {sender.avatar_url ? (
                        <img src={sender.avatar_url} alt={sender.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{sender.full_name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" /> // Spacer for alignment
                  )}
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!isMe && showAvatar && (
                      <span className="text-xs text-slate-400 mb-1 ml-1">{sender.full_name}</span>
                    )}
                    <div 
                      className={`px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 mt-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez un message..."
              className="flex-1 bg-slate-950 border-slate-800 focus-visible:ring-primary h-12"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()} className="h-12 w-12 shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
