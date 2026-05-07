'use client'
import { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  url:            string
  duration:       number | null
  isOwn:          boolean
  transcription?: string | null
}

const BARS = 30

export function AudioPlayer({ url, duration, isOwn, transcription }: AudioPlayerProps) {
  const [playing, setPlaying]         = useState(false)
  const [progress, setProgress]       = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loaded, setLoaded]           = useState(false)
  const [error, setError]             = useState(false)
  const [showText, setShowText]       = useState(false)
  const audioRef                      = useRef<HTMLAudioElement | null>(null)

  // Générer des hauteurs de barres pseudo-aléatoires stables (basées sur l'URL)
  const barHeights = useRef<number[]>(
    Array.from({ length: BARS }, (_, i) => {
      const seed = (url.charCodeAt(i % url.length) * (i + 1) * 7) % 100
      return Math.max(20, seed)
    })
  )

  useEffect(() => {
    const audio        = new Audio()
    audio.preload      = 'metadata'
    audio.src          = url
    audio.onloadedmetadata = () => setLoaded(true)
    audio.onerror          = () => setError(true)
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        setCurrentTime(Math.floor(audio.currentTime))
      }
    }
    audio.onended = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    }
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || error) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      document.querySelectorAll('audio').forEach(a => a.pause())
      audio.play().catch(() => setError(true))
      setPlaying(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
    setProgress(ratio * 100)
  }

  const fmt = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  const totalDuration = duration ?? 0
  const displayTime   = playing ? currentTime : totalDuration

  // Palette couleurs selon ownership
  const btnBg     = isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-700 hover:bg-slate-600'
  const barActive = isOwn ? '#fff'        : '#10b981'  // white | emerald-500
  const barBg     = isOwn ? 'rgba(255,255,255,0.25)' : 'rgba(100,116,139,0.4)'
  const textCol   = isOwn ? 'text-white/60' : 'text-slate-400'

  if (error) return <p className={`text-xs ${textCol} italic`}>Audio indisponible</p>

  // Nombre de barres "remplies" selon la progression
  const filledBars = Math.round((progress / 100) * BARS)

  return (
    <div className="space-y-1.5 w-52">
      <div className="flex items-center gap-2.5">
        {/* Bouton play/pause */}
        <button
          onClick={togglePlay}
          disabled={!loaded}
          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all ${btnBg} ${!loaded ? 'opacity-50 cursor-wait' : ''}`}
        >
          {!loaded ? (
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <div className="flex gap-[3px]">
              <div className="w-[3px] h-3.5 bg-white rounded-full" />
              <div className="w-[3px] h-3.5 bg-white rounded-full" />
            </div>
          ) : (
            <div className="w-0 h-0 ml-0.5" style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid white' }} />
          )}
        </button>

        {/* Waveform cliquable */}
        <div
          className="flex-1 flex items-end gap-[2px] h-8 cursor-pointer"
          onClick={handleSeek}
        >
          {barHeights.current.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-75"
              style={{
                height:          `${(h / 100) * 100}%`,
                backgroundColor: i < filledBars ? barActive : barBg,
                opacity:         playing && i === filledBars ? 1 : 0.9,
                transform:       playing && i === filledBars ? 'scaleY(1.3)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Durée + bouton transcription */}
      <div className="flex items-center justify-between pl-11">
        <span className={`text-[10px] ${textCol} tabular-nums`}>{fmt(displayTime)}</span>
        {transcription && (
          <button
            onClick={() => setShowText(v => !v)}
            className={`text-[10px] font-bold ${isOwn ? 'text-white/50 hover:text-white/80' : 'text-emerald-500/70 hover:text-emerald-400'} transition-colors`}
          >
            {showText ? 'Masquer' : 'Lire le texte'}
          </button>
        )}
      </div>

      {/* Transcription dépliable */}
      {showText && transcription && (
        <div className={`text-xs leading-relaxed pl-11 pr-1 ${isOwn ? 'text-white/70' : 'text-slate-300'} italic animate-in fade-in slide-in-from-top-1 duration-200`}>
          "{transcription}"
        </div>
      )}
    </div>
  )
}
