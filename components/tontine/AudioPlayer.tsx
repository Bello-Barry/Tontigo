'use client'
import { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  url:      string
  duration: number | null
  isOwn:    boolean
}

export function AudioPlayer({ url, duration, isOwn }: AudioPlayerProps) {
  const [playing, setPlaying]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loaded, setLoaded]       = useState(false)
  const [error, setError]         = useState(false)
  const audioRef                  = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src     = url

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

  const formatTime = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  const totalDuration = duration ?? 0
  const displayTime   = playing ? currentTime : totalDuration

  const barColor    = isOwn ? 'bg-white/40'   : 'bg-slate-500'
  const fillColor   = isOwn ? 'bg-white'       : 'bg-emerald-400'
  const buttonColor = isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-700 hover:bg-slate-600'
  const textColor   = isOwn ? 'text-white/70'  : 'text-slate-400'

  if (error) {
    return (
      <p className={`text-xs ${textColor} italic`}>
        Audio indisponible
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2.5 w-48 py-1">
      <button
        onClick={togglePlay}
        disabled={!loaded}
        className={`
          w-9 h-9 rounded-full shrink-0
          flex items-center justify-center
          transition-all
          ${buttonColor}
          ${!loaded ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {!loaded ? (
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        ) : playing ? (
          <div className="flex gap-0.5">
            <div className="w-1 h-3.5 bg-white rounded-full" />
            <div className="w-1 h-3.5 bg-white rounded-full" />
          </div>
        ) : (
          <div
            className="w-0 h-0 ml-0.5"
            style={{
              borderTop:    '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft:   '10px solid white',
            }}
          />
        )}
      </button>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div
          className={`h-1.5 rounded-full cursor-pointer ${barColor} relative`}
          onClick={handleSeek}
        >
          <div
            className={`h-1.5 rounded-full transition-all ${fillColor}`}
            style={{ width: `${progress}%` }}
          />
          {loaded && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm"
              style={{ left: `calc(${progress}% - 5px)` }}
            />
          )}
        </div>
        <span className={`text-[10px] ${textColor} tabular-nums`}>
          {formatTime(displayTime)}
        </span>
      </div>
    </div>
  )
}
