import { describe, it, expect, vi } from 'vitest'
import { parseHttpRange, isPathAuthorized, authorizeMediaPath } from '../src/main/protocol'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'temp') return 'C:\\Users\\Test\\AppData\\Local\\Temp'
      if (name === 'userData') return 'C:\\Users\\Test\\AppData\\Roaming\\SidPlayer'
      if (name === 'pictures') return 'C:\\Users\\Test\\Pictures'
      return 'C:\\Users\\Test'
    })
  },
  protocol: {
    handle: vi.fn()
  }
}))

vi.mock('../src/main/store', () => ({
  store: {
    getVideos: vi.fn(() => [
      {
        id: 'vid1',
        path: 'D:\\Media\\Movies\\avatar.mp4',
        subtitles: [
          { path: 'D:\\Media\\Movies\\avatar.en.srt' }
        ]
      }
    ]),
    getSettings: vi.fn(() => ({
      watchedFolders: ['D:\\Media\\Series']
    }))
  }
}))

describe('RFC 7233 HTTP Range Header Parser', () => {
  const fileSize = 1000

  it('parses standard bounded range (bytes=0-499)', () => {
    const range = parseHttpRange('bytes=0-499', fileSize)
    expect(range).toEqual({ start: 0, end: 499 })
  })

  it('parses open-ended range (bytes=500-)', () => {
    const range = parseHttpRange('bytes=500-', fileSize)
    expect(range).toEqual({ start: 500, end: 999 })
  })

  it('parses suffix range (bytes=-200) for last 200 bytes', () => {
    const range = parseHttpRange('bytes=-200', fileSize)
    expect(range).toEqual({ start: 800, end: 999 })
  })

  it('caps suffix range if larger than file size (bytes=-2000)', () => {
    const range = parseHttpRange('bytes=-2000', fileSize)
    expect(range).toEqual({ start: 0, end: 999 })
  })

  it('returns invalid if start is beyond file size (bytes=1000-)', () => {
    const range = parseHttpRange('bytes=1000-', fileSize)
    expect(range).toBe('invalid')
  })

  it('returns invalid if start > end (bytes=600-400)', () => {
    const range = parseHttpRange('bytes=600-400', fileSize)
    expect(range).toBe('invalid')
  })

  it('returns invalid on empty dash (bytes=-)', () => {
    const range = parseHttpRange('bytes=-', fileSize)
    expect(range).toBe('invalid')
  })

  it('returns invalid on non-numeric values', () => {
    expect(parseHttpRange('bytes=abc-def', fileSize)).toBe('invalid')
    expect(parseHttpRange('bytes=-abc', fileSize)).toBe('invalid')
  })

  it('returns invalid when fileSize is 0', () => {
    expect(parseHttpRange('bytes=0-10', 0)).toBe('invalid')
  })

  it('returns null if header does not start with bytes=', () => {
    expect(parseHttpRange('none', fileSize)).toBeNull()
    expect(parseHttpRange('', fileSize)).toBeNull()
  })
})

describe('Media Path Authorization (LFI Prevention)', () => {
  it('blocks arbitrary local system files', () => {
    expect(isPathAuthorized('C:\\Windows\\System32\\cmd.exe')).toBe(false)
    expect(isPathAuthorized('C:\\Users\\Admin\\.ssh\\id_rsa')).toBe(false)
    expect(isPathAuthorized('C:\\Windows\\win.ini')).toBe(false)
  })

  it('allows files in SidPlayer temp cache', () => {
    expect(isPathAuthorized('C:\\Users\\Test\\AppData\\Local\\Temp\\SidPlayer\\cache\\output.mp4')).toBe(true)
  })

  it('allows files in SidPlayer userData (e.g. thumbnails)', () => {
    expect(isPathAuthorized('C:\\Users\\Test\\AppData\\Roaming\\SidPlayer\\thumbnails\\thumb1.jpg')).toBe(true)
  })

  it('allows registered videos and subtitles from store', () => {
    expect(isPathAuthorized('D:\\Media\\Movies\\avatar.mp4')).toBe(true)
    expect(isPathAuthorized('D:\\Media\\Movies\\avatar.en.srt')).toBe(true)
  })

  it('allows files located inside watched library folders', () => {
    expect(isPathAuthorized('D:\\Media\\Series\\BreakingBad\\s01e01.mkv')).toBe(true)
  })

  it('authorizes dynamically added paths', () => {
    const customVideo = 'E:\\ExternalDrive\\clip.mp4'
    expect(isPathAuthorized(customVideo)).toBe(false)
    authorizeMediaPath(customVideo)
    expect(isPathAuthorized(customVideo)).toBe(true)
  })
})
