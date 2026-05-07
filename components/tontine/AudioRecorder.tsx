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
  const canvasRef                     = useRef<HTMLCanvasElement | null>(null)
  const animationRef                  = useRef<number | null>(null)
  const chunks                        = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
    }
  }, [audioUrl])

  const drawVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    if (!ctx) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source       = audioContext.createMediaStreamSource(stream)
    const analyser     = audioContext.createAnalyser()
    analyser.fftSize   = 32
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray    = new Uint8Array(bufferLength)

    const draw = () => {
      if (!recording) return
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        ctx.fillStyle = `rgb(16, 185, 129)` // Emerald 500
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 2
      }
    }
    draw()
  }

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

        stream.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }

      recorder.start(100)
      setRecording(true)
      setDuration(0)
      drawVisualizer(stream)

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
      URL.revokeObjectURL(audioUrl)
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

    if (onOptimisticMessage) {
      onOptimisticMessage({
        id: tempId,
        message_type: 'audio',
        audio_url: audioUrl,
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
      const fileName = `${groupId}/${Date.now()}.webm`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type || 'audio/webm',
          upsert:      false,
        })

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
    } finally {
      setSending(false)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/20 rounded-2xl px-3 py-2 shadow-lg animate-in zoom-in-95 duration-300">
        <button
          onClick={togglePreview}
          className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-900/40"
        >
          {previewPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </button>

        <div className="flex flex-col min-w-[60px] ml-2">
            <span className="text-emerald-400 text-xs font-black tabular-nums tracking-wider">{formatDuration(duration)}</span>
            <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Pré-écoute</span>
        </div>

        <audio
          ref={previewAudioRef}
          src={audioUrl}
          onEnded={() => setPreviewPlaying(false)}
          className="hidden"
        />

        <div className="flex gap-1 ml-auto">
          <button onClick={cancelAudio} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={sendAudio}
            disabled={sending}
            className="w-9 h-9 flex items-center justify-center bg-emerald-600/20 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {recording && (
        <canvas 
          ref={canvasRef} 
          width={60} 
          height={30} 
          className="rounded-lg bg-emerald-500/5 border border-emerald-500/10"
        />
      )}
      <button
        onClick={handleMicClick}
        className={`
          relative w-12 h-12 rounded-2xl transition-all duration-500 flex items-center justify-center
          ${recording
            ? 'bg-red-500 shadow-lg shadow-red-900/40 scale-110'
            : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30'
          }
        `}
      >
        {recording ? (
          <div className="flex flex-col items-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mb-0.5" />
              <span className="text-white text-[10px] font-black">{formatDuration(duration)}</span>
          </div>
        ) : (
          <Mic className="w-5 h-5" />
        )}
        
        {recording && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-red-500 animate-ping opacity-20 pointer-events-none" />
        )}
      </button>
    </div>
  )
}

