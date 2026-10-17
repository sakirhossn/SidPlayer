import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findFfmpeg, findFfprobe, resetBinaryCacheForTesting } from '../src/main/binaries'
import fs from 'fs'

vi.mock('electron', () => ({
  app: {
    isPackaged: false
  }
}))

describe('Binary Discovery Module', () => {
  beforeEach(() => {
    resetBinaryCacheForTesting()
    vi.restoreAllMocks()
  })

  it('locates standard C:\\ffmpeg\\bin binaries when present', () => {
    vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
      return String(p).includes('C:\\ffmpeg\\bin')
    })

    const ffmpeg = findFfmpeg()
    const ffprobe = findFfprobe()

    expect(ffmpeg).toBe('C:\\ffmpeg\\bin\\ffmpeg.exe')
    expect(ffprobe).toBe('C:\\ffmpeg\\bin\\ffprobe.exe')
  })

  it('falls back to PATH command names when no disk files are matched', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false)

    const ffmpeg = findFfmpeg()
    const ffprobe = findFfprobe()

    expect(ffmpeg).toBe('ffmpeg')
    expect(ffprobe).toBe('ffprobe')
  })
})
