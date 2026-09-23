import { describe, it, expect } from 'vitest'
import { isDirectlyPlayable } from '../src/main/transmuxer'
import { VideoItem } from '../src/shared/types'

describe('isDirectlyPlayable', () => {
  const baseVideo: VideoItem = {
    id: '1',
    path: 'C:\\Videos\\sample.mp4',
    filename: 'sample.mp4',
    title: 'sample',
    duration: 100,
    size: 1000,
    resolution: '1080p',
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'mp4',
    videoCodec: 'h264',
    audioCodec: 'aac',
    bitrate: 500000,
    dateAdded: Date.now(),
    dateModified: Date.now(),
    lastPlayed: 0,
    playCount: 0,
    resumePosition: 0,
    completed: false,
    isFavorite: false,
    thumbnailUrl: null,
    subtitles: [],
    audioTracks: [],
    isMissing: false,
    folder: 'C:\\Videos',
    fingerprint: '1000_100'
  }

  it('identifies standard MP4 with h264 and aac as directly playable', () => {
    expect(isDirectlyPlayable(baseVideo)).toBe(true)
  })

  it('identifies MPEG-TS container as needing transmuxing', () => {
    const tsVideo = { ...baseVideo, format: 'mpegts' }
    expect(isDirectlyPlayable(tsVideo)).toBe(false)
  })

  it('identifies .ts file extension as needing transmuxing', () => {
    const tsVideo = { ...baseVideo, path: 'C:\\Videos\\lecture.ts' }
    expect(isDirectlyPlayable(tsVideo)).toBe(false)
  })

  it('identifies AVI container as needing transmuxing', () => {
    const aviVideo = { ...baseVideo, format: 'avi', path: 'C:\\Videos\\old.avi' }
    expect(isDirectlyPlayable(aviVideo)).toBe(false)
  })

  it('identifies unsupported audio codec (ac3) as needing remuxing', () => {
    const ac3Video = { ...baseVideo, audioCodec: 'ac3' }
    expect(isDirectlyPlayable(ac3Video)).toBe(false)
  })

  it('identifies unsupported video codec (wmv3) as needing transcoding', () => {
    const wmvVideo = { ...baseVideo, videoCodec: 'wmv3' }
    expect(isDirectlyPlayable(wmvVideo)).toBe(false)
  })
})
