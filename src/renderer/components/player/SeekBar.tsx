import React, { useRef, useState, useEffect } from 'react'
import { formatDuration } from '../../utils/formatters'
import { usePlayerStore, seek } from '../../stores/usePlayerStore'

export const SeekBar: React.FC = () => {
  const { currentTime, duration, bufferedEnd, abRepeat } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverX, setHoverX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0

  const getTimeFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent): number => {
    if (!barRef.current || duration <= 0) return 0
    const rect = barRef.current.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = clickX / rect.width
    return ratio * duration
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || duration <= 0) return
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setHoverX(x)
    setHoverTime((x / rect.width) * duration)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    const targetTime = getTimeFromEvent(e)
    seek(targetTime)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && barRef.current && duration > 0) {
        const rect = barRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        setHoverX(x)
        const targetTime = (x / rect.width) * duration
        setHoverTime(targetTime)
        seek(targetTime)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, duration])

  // A-B loop marker percentages
  const aPercent = abRepeat.start !== null && duration > 0 ? (abRepeat.start / duration) * 100 : null
  const bPercent = abRepeat.end !== null && duration > 0 ? (abRepeat.end / duration) * 100 : null

  return (
    <div
      ref={barRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      className="relative w-full h-4 flex items-center cursor-pointer select-none group"
    >
      {/* Background Track */}
      <div className="w-full h-1 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-150 relative">
        {/* Buffered Progress */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all duration-200"
          style={{ width: `${Math.min(100, bufferedPercent)}%` }}
        />

        {/* A-B Range Highlight */}
        {aPercent !== null && bPercent !== null && (
          <div
            className="absolute top-0 bottom-0 bg-amber-400/40 border-l border-r border-amber-400"
            style={{ left: `${aPercent}%`, width: `${bPercent - aPercent}%` }}
          />
        )}

        {/* Played Progress */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>

      {/* Scrub Handle Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-black/50 border border-blue-500 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all pointer-events-none"
        style={{ left: `${Math.min(100, progressPercent)}%` }}
      />

      {/* Point A Marker */}
      {aPercent !== null && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10 pointer-events-none"
          style={{ left: `${aPercent}%` }}
          title={`Point A: ${formatDuration(abRepeat.start || 0)}`}
        />
      )}

      {/* Point B Marker */}
      {bPercent !== null && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10 pointer-events-none"
          style={{ left: `${bPercent}%` }}
          title={`Point B: ${formatDuration(abRepeat.end || 0)}`}
        />
      )}

      {/* Hover Timestamp Badge */}
      {(isHovering || isDragging) && duration > 0 && (
        <div
          className="absolute bottom-6 -translate-x-1/2 px-2 py-1 rounded bg-sid-900/95 border border-white/20 text-white text-[11px] font-mono shadow-xl pointer-events-none whitespace-nowrap z-30"
          style={{ left: `${hoverX}px` }}
        >
          {formatDuration(hoverTime)}
        </div>
      )}
    </div>
  )
}
