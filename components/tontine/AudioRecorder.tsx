'use client'
import { useRef, useState } from 'react'
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendAudioMessage } from '@/lib/actions/chat.actions'
import { toast } from 'react-toastify'

interface AudioRecorderProps {
  groupId: string
}

export function AudioRecorder({ groupId }: AudioRecorderProps) {
  const [recording, setRecording]     = useState(false)
  const [audioBlob, setAudioBlob]     = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl]       = useState<string | null>(null)
  const [duration, setDuration]       = useState(0)
  const [sending, setSending]         = useState(false)
  const mediaRecorder                 = useRef<MediaRecorder | null>(null)
  const timerRef                      = useRef<NodeJS.Timeout | null>(null)
  const chunks                        = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4'

      mediaRecorder.current = new MediaRecorder(stream, { mimeType })

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.current.start(100)
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 120) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

    } catch (err) {
      toast.error('Accès micro refusé. Vérifie tes paramètres.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const cancelAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
  }

  const sendAudio = async () => {
    if (!audioBlob) return
    setSending(true)

    try {
      const supabase = createClient()
      const fileName = `${groupId}/${Date.now()}.webm`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert:      false,
        })

      if (uploadError) {
        toast.error('Erreur upload audio')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName)

      const result = await sendAudioMessage(groupId, publicUrl, duration)
      if (result.error) {
        toast.error(result.error)
        return
      }

      cancelAudio()
    } catch (err) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <audio src={audioUrl} controls className="h-8 w-32" />
        <span className="text-slate-400 text-[10px] shrink-0 font-medium">{formatDuration(duration)}</span>
        <button onClick={cancelAudio} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={sendAudio}
          disabled={sending}
          className="p-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>
    )
  }

  return (
    <button
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      onPointerLeave={stopRecording}
      className={`
        p-2.5 rounded-xl transition-all select-none
        ${recording
          ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50 animate-pulse'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400'
        }
      `}
      title={recording ? `Enregistrement... ${formatDuration(duration)}` : 'Maintenir pour enregistrer'}
    >
      {recording
        ? <MicOff className="w-5 h-5 text-white" />
        : <Mic className="w-5 h-5" />
      }
    </button>
  )
}
