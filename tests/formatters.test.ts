import { describe, it, expect } from 'vitest'
import { formatDuration, formatFileSize, formatBitrate, formatTimeAgo, getGreeting } from '../src/renderer/utils/formatters'

describe('Formatters', () => {
  it('formats duration correctly', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(45)).toBe('00:45')
    expect(formatDuration(125)).toBe('02:05')
    expect(formatDuration(3665)).toBe('01:01:05')
    expect(formatDuration(-10)).toBe('00:00')
  })

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1024 * 15)).toBe('15.0 MB')
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB')
  })

  it('formats bitrates properly', () => {
    expect(formatBitrate(0)).toBe('Variable')
    expect(formatBitrate(500000)).toBe('500 kbps')
    expect(formatBitrate(4500000)).toBe('4.5 Mbps')
  })

  it('formats time ago strings', () => {
    const now = Date.now()
    expect(formatTimeAgo(now - 10000)).toBe('Just now')
    expect(formatTimeAgo(now - 1000 * 60 * 5)).toBe('5m ago')
    expect(formatTimeAgo(now - 1000 * 60 * 60 * 2)).toBe('2h ago')
    expect(formatTimeAgo(now - 1000 * 60 * 60 * 24 * 3)).toBe('3d ago')
  })

  it('returns appropriate greeting', () => {
    const greeting = getGreeting()
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting)
  })
})
