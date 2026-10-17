import { describe, it, expect, vi } from 'vitest'
import { sanitizeBackupPayload } from '../src/main/store'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => 'C:\\Users\\Test\\AppData\\Roaming\\SidPlayer')
  }
}))

describe('Backup Sanitization (Prototype Pollution Prevention)', () => {
  it('strips __proto__ and prototype properties from objects', () => {
    const rawMalicious = JSON.parse('{"validProp": 123, "__proto__": {"polluted": true}, "constructor": {"evil": true}}')
    const sanitized = sanitizeBackupPayload(rawMalicious) as any

    expect(sanitized.validProp).toBe(123)
    expect(sanitized.__proto__).toBe(Object.prototype)
    expect((sanitized as any).polluted).toBeUndefined()
    expect(sanitized.constructor).toBe(Object)
  })

  it('recursively sanitizes nested objects and arrays', () => {
    const complex = {
      videos: {
        vid1: {
          id: 'vid1',
          title: 'Safe Title',
          nested: JSON.parse('{"__proto__": {"isAdmin": true}, "level": 2}')
        }
      },
      tags: [
        'safe',
        JSON.parse('{"__proto__": {"injected": "yes"}, "name": "tag1"}')
      ]
    }

    const sanitized = sanitizeBackupPayload(complex) as any
    expect(sanitized.videos.vid1.title).toBe('Safe Title')
    expect(sanitized.videos.vid1.nested.level).toBe(2)
    expect((sanitized.videos.vid1.nested as any).isAdmin).toBeUndefined()
    expect(sanitized.tags[0]).toBe('safe')
    expect(sanitized.tags[1].name).toBe('tag1')
    expect((sanitized.tags[1] as any).injected).toBeUndefined()
  })

  it('handles primitive values safely', () => {
    expect(sanitizeBackupPayload(null)).toBeNull()
    expect(sanitizeBackupPayload(undefined)).toBeUndefined()
    expect(sanitizeBackupPayload('string')).toBe('string')
    expect(sanitizeBackupPayload(42)).toBe(42)
    expect(sanitizeBackupPayload(true)).toBe(true)
  })
})
