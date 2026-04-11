"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface Message {
  id: string
  content: string
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
        .select('*, user:users(full_name, avatar_url)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMessages(data as any)
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
      }, async (payload: any) => {
        const newMessage = payload.new as Message

        // Fetch user details for the new message if not present
        if (!newMessage.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single()

          if (userData) {
            newMessage.user = userData
          }
        }

        setMessages((prev) => [...prev, newMessage])
        setTimeout(scrollToBottom, 100)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload: any) => {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id))
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Supprimer ce message ?')) return

    const { error } = await supabase
      .from('group_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Erreur suppression message:', error)
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }
  }

  const getSenderDetails = (msg: Message) => {
    if (msg.user) return msg.user
    const member = members.find(m => m.user_id === msg.user_id)
    return member?.user || { full_name: 'Utilisateur inconnu', avatar_url: null }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-transform z-50"
            size="icon"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        }
      />
      
      <DialogContent className="max-w-none w-screen h-[100dvh] m-0 p-0 flex flex-col bg-slate-950 border-none rounded-none outline-none fixed inset-0 translate-x-0 translate-y-0">
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900 flex flex-row items-center justify-between shrink-0 h-16">
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chat du Groupe
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

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
              const sender = getSenderDetails(msg)
              const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id

              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 object-cover overflow-hidden shadow-sm">
                      {sender.avatar_url ? (
                        <img src={sender.avatar_url} alt={sender.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">{sender.full_name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" /> // Spacer for alignment
                  )}
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {showAvatar && (
                      <span className={`text-[10px] font-medium text-slate-500 mb-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {isMe ? 'Moi' : sender.full_name}
                      </span>
                    )}
                    <div className="group relative">
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
      </DialogContent>
    </Dialog>
  )
}
