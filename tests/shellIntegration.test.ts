import { describe, it, expect } from 'vitest'
import {
  generateRegistrationReg,
  generateUnregistrationReg,
  VIDEO_EXTENSIONS
} from '../src/main/shellIntegration'

describe('Shell Integration - Windows Context Menu & Open With', () => {
  it('includes common video extensions', () => {
    expect(VIDEO_EXTENSIONS).toContain('.mp4')
    expect(VIDEO_EXTENSIONS).toContain('.mkv')
    expect(VIDEO_EXTENSIONS).toContain('.webm')
    expect(VIDEO_EXTENSIONS).toContain('.avi')
    expect(VIDEO_EXTENSIONS).toContain('.mov')
    expect(VIDEO_EXTENSIONS).toContain('.ts')
  })

  it('generates valid registration .reg file with properly escaped paths', () => {
    const fakeExe = 'C:\\Program Files\\SidPlayer\\SidPlayer.exe'
    const reg = generateRegistrationReg(fakeExe)

    // Version header
    expect(reg).toContain('Windows Registry Editor Version 5.00')

    // Escaped executable path
    expect(reg).toContain('C:\\\\Program Files\\\\SidPlayer\\\\SidPlayer.exe')

    // Friendly App Name
    expect(reg).toContain('"FriendlyAppName"="SidPlayer"')

    // Open with command
    expect(reg).toContain('[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe\\shell\\open\\command]')
    expect(reg).toContain('@="\\"C:\\\\Program Files\\\\SidPlayer\\\\SidPlayer.exe\\" \\"%1\\""')

    // Context Menu verb
    expect(reg).toContain('[HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\video\\shell\\SidPlayer]')
    expect(reg).toContain('@="Play with SidPlayer"')

    // Supported types for "Open with"
    for (const ext of ['.mp4', '.mkv', '.webm']) {
      expect(reg).toContain(`"${ext}"=""`)
      expect(reg).toContain(`[HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithProgids]`)
      expect(reg).toContain(`[HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithList\\SidPlayer.exe]`)
    }

    // ProgID
    expect(reg).toContain('[HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video]')
  })

  it('generates clean unregistration .reg file', () => {
    const reg = generateUnregistrationReg()

    expect(reg).toContain('Windows Registry Editor Version 5.00')
    expect(reg).toContain('[-HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe]')
    expect(reg).toContain('[-HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video]')
    expect(reg).toContain('[-HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\video\\shell\\SidPlayer]')
    expect(reg).toContain('[-HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\SidPlayer]')
    expect(reg).toContain('"SidPlayer.Video"=-')
    expect(reg).toContain('[-HKEY_CURRENT_USER\\Software\\Classes\\.mp4\\OpenWithList\\SidPlayer.exe]')
  })
})
