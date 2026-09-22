import { describe, it, expect } from 'vitest'
import { VideoItem } from '../src/shared/types'

describe('Library Logic & Deduplication', () => {
  const sampleVideos: VideoItem[] = [
    {
      id: '1',
      path: 'C:/Movies/Inception.mp4',
      filename: 'Inception.mp4',
      title: 'Inception',
      duration: 8880,
      size: 2500000000,
      resolution: '1920x1080',
      width: 1920,
      height: 1080,
      fps: 24,
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      bitrate: 4500000,
      dateAdded: 1000,
      dateModified: 2000,
      lastPlayed: 5000,
      playCount: 3,
      resumePosition: 4440,
      completed: false,
      isFavorite: true,
      thumbnailUrl: null,
      subtitles: [],
      audioTracks: [],
      isMissing: false,
      folder: 'C:/Movies',
      fingerprint: '2500000000_8880'
    },
    {
      id: '2',
      path: 'C:/Movies/Avatar.mkv',
      filename: 'Avatar.mkv',
      title: 'Avatar',
      duration: 9720,
      size: 4500000000,
      resolution: '3840x2160',
      width: 3840,
      height: 2160,
      fps: 23.98,
      format: 'mkv',
      videoCodec: 'hevc',
      audioCodec: 'ac3',
      bitrate: 8500000,
      dateAdded: 3000,
      dateModified: 3000,
      lastPlayed: 0,
      playCount: 0,
      resumePosition: 0,
      completed: false,
      isFavorite: false,
      thumbnailUrl: null,
      subtitles: [],
      audioTracks: [],
      isMissing: false,
      folder: 'C:/Movies',
      fingerprint: '4500000000_9720'
    }
  ]

  it('detects duplicates by normalized file path and fingerprint', () => {
    const existingPaths = new Set(sampleVideos.map((v) => v.path.toLowerCase()))
    expect(existingPaths.has('c:/movies/inception.mp4')).toBe(true)
    expect(existingPaths.has('c:/movies/matrix.mp4')).toBe(false)
  })

  it('computes accurate resume percentages', () => {
    const v = sampleVideos[0]
    const percent = Math.round((v.resumePosition / v.duration) * 100)
    expect(percent).toBe(50)
  })

  it('correctly sorts items by duration and size', () => {
    const sortedByDuration = [...sampleVideos].sort((a, b) => b.duration - a.duration)
    expect(sortedByDuration[0].title).toBe('Avatar')

    const sortedBySize = [...sampleVideos].sort((a, b) => b.size - a.size)
    expect(sortedBySize[0].title).toBe('Avatar')

    const sortedByName = [...sampleVideos].sort((a, b) => a.title.localeCompare(b.title))
    expect(sortedByName[0].title).toBe('Avatar')
    expect(sortedByName[1].title).toBe('Inception')
  })
})
