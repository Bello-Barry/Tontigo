'use client'
import { useRef, useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

export function AudioPlayer({
  url,
  duration,
}: {
  url:      string
  duration: number | null
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3 min-w-[180px] py-1">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors"
      >
        {playing
          ? <Pause className="w-4 h-4 text-white fill-white" />
          : <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        }
      </button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] text-white/60 font-medium">
          <span>{audioRef.current ? formatDuration(audioRef.current.currentTime) : '0:00'}</span>
          <span>{duration ? formatDuration(duration) : '0:00'}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current && audioRef.current.duration) {
            setProgress(
              (audioRef.current.currentTime / audioRef.current.duration) * 100
            )
          }
        }}
        onEnded={() => {
          setPlaying(false)
          setProgress(0)
        }}
        className="hidden"
      />
    </div>
  )
}
