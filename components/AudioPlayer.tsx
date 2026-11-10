'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'

export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => setIsError(true))
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <i className="fa-solid fa-music text-zinc-600 text-xl"></i>
        <p className="text-sm font-medium text-zinc-400">Audio unavailable</p>
      </div>
    )
  }

  return (
    <div className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-[#121214] p-3 shadow-md transition-all hover:border-[#D4AF37]/30">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsError(true)}
      />

      <button
        onClick={togglePlay}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <i className="fa-solid fa-pause text-lg"></i>
        ) : (
          <i className="fa-solid fa-play text-lg ml-1"></i>
        )}
      </button>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-[#D4AF37]">
            <i className="fa-solid fa-music text-[10px]"></i> Featured Audio
          </span>
          <span className="font-mono text-[10px] text-zinc-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="relative w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-100"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-1">
        <button onClick={toggleMute} className="text-zinc-400 transition-colors hover:text-[#D4AF37]">
          {isMuted || volume === 0 ? (
            <i className="fa-solid fa-volume-xmark text-sm"></i>
          ) : (
            <i className="fa-solid fa-volume-high text-sm"></i>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(Number(e.target.value))
            if (isMuted) setIsMuted(false)
          }}
          className="h-1 w-12 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#D4AF37]"
        />
      </div>
    </div>
  )
}