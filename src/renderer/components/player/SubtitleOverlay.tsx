import React, { useMemo } from 'react'
import { usePlayerStore } from '../../stores/usePlayerStore'
import { useSettings } from '../../stores/useSettingsStore'

export const SubtitleOverlay: React.FC = () => {
  const { currentTime, subtitleCues, subtitleDelay, activeSubtitleId } = usePlayerStore()
  const { settings } = useSettings()

  const currentCueText = useMemo(() => {
    if (!activeSubtitleId || subtitleCues.length === 0) return null

    const adjustedTime = currentTime - subtitleDelay

    // Binary search or linear search for active cue
    const activeCue = subtitleCues.find(
      (c) => adjustedTime >= c.startTime && adjustedTime <= c.endTime
    )

    return activeCue ? activeCue.text : null
  }, [currentTime, subtitleCues, subtitleDelay, activeSubtitleId])

  if (!currentCueText) return null

  const {
    fontSize = 22,
    fontFamily = 'Segoe UI, sans-serif',
    color = '#ffffff',
    backgroundColor = '#000000',
    backgroundOpacity = 0.6,
    position = 'bottom'
  } = settings.subtitles || {}

  const positionClass = position === 'top' ? 'top-12' : 'bottom-16 md:bottom-20'

  return (
    <div
      className={`absolute left-0 right-0 ${positionClass} flex justify-center items-center pointer-events-none z-30 px-6`}
    >
      <div
        className="px-3.5 py-1.5 rounded-lg text-center shadow-lg transition-all duration-100 max-w-4xl"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          color,
          backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity})`,
          textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
          lineHeight: '1.35',
          whiteSpace: 'pre-line'
        }}
      >
        {currentCueText}
      </div>
    </div>
  )
}
