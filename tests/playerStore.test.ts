import { describe, it, expect } from 'vitest'
import {
  getPlayerState,
  updateTime,
  setPlaying,
  seek
} from '../src/renderer/stores/usePlayerStore'

describe('Player Store - Realtime playback time updates', () => {
  it('updates currentTime, duration, and bufferedEnd in real time', () => {
    updateTime(15.5, 120, 30)
    const state = getPlayerState()
    expect(state.currentTime).toBe(15.5)
    expect(state.duration).toBe(120)
    expect(state.bufferedEnd).toBe(30)
  })

  it('updates isPlaying state via setPlaying', () => {
    setPlaying(true)
    expect(getPlayerState().isPlaying).toBe(true)

    setPlaying(false)
    expect(getPlayerState().isPlaying).toBe(false)
  })

  it('handles invalid or zero durations safely without overwriting valid durations', () => {
    updateTime(10, 100, 20)
    expect(getPlayerState().duration).toBe(100)

    // NaN, 0, or negative duration should not override known duration
    updateTime(12, NaN)
    expect(getPlayerState().currentTime).toBe(12)
    expect(getPlayerState().duration).toBe(100)

    updateTime(14, 0)
    expect(getPlayerState().currentTime).toBe(14)
    expect(getPlayerState().duration).toBe(100)
  })
})
