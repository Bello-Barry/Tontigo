'use client'
import { useRef, useState, useEffect } from 'react'
import { Mic, Send, X, Loader2, Play, Pause } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendAudioMessage } from '@/lib/actions/chat.actions'
import { toast } from 'react-toastify'

interface AudioRecorderProps {
  groupId: string
  onOptimisticMessage?: (message: any) => void
  onReplaceOptimistic?: (tempId: string, realMessage: any) => void
}

export function AudioRecorder({ groupId, onOptimisticMessage, onReplaceOptimistic }: AudioRecorderProps) {
  const [recording, setRecording]     = useState(false)
  const [audioBlob, setAudioBlob]     = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl]       = useState<string | null>(null)
  const [duration, setDuration]       = useState(0)
  const [sending, setSending]         = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState(false)

  const mediaRecorderRef              = useRef<MediaRecorder | null>(null)
  const mediaStreamRef                = useRef<MediaStream | null>(null)
  const timerRef                      = useRef<NodeJS.Timeout | null>(null)
  const previewAudioRef               = useRef<HTMLAudioElement | null>(null)
  const chunks                        = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (timerRef.current) clearInterval(timerRef.current)

      // Fix 4 — Cleanup stream micro
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      chunks.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)

        // Stop stream tracks
        stream.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }

      recorder.start(100)
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
      console.error('Recording start error:', err)
      toast.error('Accès micro refusé. Vérifie tes paramètres.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const handleMicClick = async () => {
    if (recording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  const cancelAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl) // Fix 1 — Toujours révoquer
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setPreviewPlaying(false)
  }

  const togglePreview = () => {
    if (!previewAudioRef.current) return
    if (previewPlaying) {
      previewAudioRef.current.pause()
    } else {
      previewAudioRef.current.play()
    }
    setPreviewPlaying(!previewPlaying)
  }

  const sendAudio = async () => {
    if (!audioBlob || !audioUrl) return
    setSending(true)

    const tempId = `temp-audio-${Date.now()}`

    // Fix 3 — Optimistic update audio
    if (onOptimisticMessage) {
      onOptimisticMessage({
        id: tempId,
        message_type: 'audio',
        audio_url: audioUrl, // local preview
        audio_duration_seconds: duration,
        created_at: new Date().toISOString(),
        is_deleted: false,
        content: '🎤 Message vocal',
        isPending: true
      })
    }

    try {
      if (!audioBlob.size) {
        toast.error('Enregistrement vide, réessaie.')
        setSending(false)
        return
      }

      const supabase = createClient()
      const fileName = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`

      // Upload avec timeout de 30 secondes
      const uploadPromise = supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type || 'audio/webm',
          upsert:      false,
        })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), 30_000)
      )

      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise,
      ]).catch(err => ({ data: null, error: { message: err.message } })) as any

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName)

      const result = await sendAudioMessage(groupId, publicUrl, duration)
      if (result.error) {
        throw new Error(result.error)
      }

      if (onReplaceOptimistic && result.data) {
        onReplaceOptimistic(tempId, result.data)
      }

      cancelAudio()
    } catch (err: any) {
      console.error('Audio send error:', err)
      toast.error('Envoi échoué, réessaie')
      // Remove optimistic message will be handled by GroupChat logic if implemented there
    } finally {
      setSending(false)
    }
  }

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          onClick={togglePreview}
          className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0 hover:bg-slate-700 transition-colors"
        >
          {previewPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
        </button>

        <div className="flex flex-col min-w-[60px]">
            <span className="text-white text-[10px] font-mono tabular-nums">{formatDuration(duration)}</span>
        </div>

        <audio
          ref={previewAudioRef}
          src={audioUrl}
          onEnded={() => setPreviewPlaying(false)}
          className="hidden"
        />

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
      onClick={handleMicClick}
      className={`
        p-2.5 rounded-xl transition-all select-none flex items-center gap-2
        ${recording
          ? 'bg-red-500 shadow-lg shadow-red-500/40 animate-pulse'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400'
        }
      `}
      title={recording ? `Arrêter (${formatDuration(duration)})` : 'Enregistrer un message vocal'}
    >
      {recording ? (
        <>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-mono tabular-nums">{formatDuration(duration)}</span>
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  )
}
