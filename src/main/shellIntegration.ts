import { app } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'

export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.webm',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.m4v',
  '.ts',
  '.mpg',
  '.mpeg',
  '.3gp',
  '.m2ts',
  '.vob'
]

function getTargetExePath(): string {
  if (app.isPackaged) {
    return app.getPath('exe')
  }
  // In dev mode, prefer the built SidPlayer.exe if it exists
  const builtExe = path.join(process.cwd(), 'release', 'win-unpacked', 'SidPlayer.exe')
  if (fs.existsSync(builtExe)) {
    return builtExe
  }
  return app.getPath('exe')
}

function runRegImport(regFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('reg.exe', ['import', regFilePath], (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message))
      } else {
        resolve()
      }
    })
  })
}

export function generateRegistrationReg(exePath: string): string {
  const escapedExe = exePath.replace(/\\/g, '\\\\')
  let reg = 'Windows Registry Editor Version 5.00\r\n\r\n'

  // Application Registration for Windows "Open with" flyout
  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe]\r\n'
  reg += '"FriendlyAppName"="SidPlayer"\r\n'
  reg += '"ApplicationCompany"="SidPlayer Team"\r\n'
  reg += `"Icon"="\\"${escapedExe}\\",0"\r\n\r\n`

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe\\DefaultIcon]\r\n'
  reg += `@="\\"${escapedExe}\\",0"\r\n\r\n`

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe\\shell\\open\\command]\r\n'
  reg += `@="\\"${escapedExe}\\" \\"%1\\""\r\n\r\n`

  // Supported file types for "Open with"
  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe\\SupportedTypes]\r\n'
  for (const ext of VIDEO_EXTENSIONS) {
    reg += `"${ext}"=""\r\n`
  }
  reg += '\r\n'

  // ProgID registration
  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video]\r\n'
  reg += '@="Video File"\r\n\r\n'

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video\\DefaultIcon]\r\n'
  reg += `@="\\"${escapedExe}\\",0"\r\n\r\n`

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video\\shell\\open\\command]\r\n'
  reg += `@="\\"${escapedExe}\\" \\"%1\\""\r\n\r\n`

  // Direct Explorer Context Menu Verb: "Play with SidPlayer"
  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\video\\shell\\SidPlayer]\r\n'
  reg += '@="Play with SidPlayer"\r\n'
  reg += `"Icon"="\\"${escapedExe}\\",0"\r\n\r\n`

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\video\\shell\\SidPlayer\\command]\r\n'
  reg += `@="\\"${escapedExe}\\" \\"%1\\""\r\n\r\n`

  // Folder Context Menu: "Play with SidPlayer"
  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\SidPlayer]\r\n'
  reg += '@="Play with SidPlayer"\r\n'
  reg += `"Icon"="\\"${escapedExe}\\",0"\r\n\r\n`

  reg += '[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\SidPlayer\\command]\r\n'
  reg += `@="\\"${escapedExe}\\" \\"%1\\""\r\n\r\n`

  // Extension OpenWith associations
  for (const ext of VIDEO_EXTENSIONS) {
    reg += `[HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithProgids]\r\n`
    reg += '"SidPlayer.Video"=""\r\n\r\n'
    reg += `[HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithList\\SidPlayer.exe]\r\n\r\n`
  }

  return reg
}

export function generateUnregistrationReg(): string {
  let reg = 'Windows Registry Editor Version 5.00\r\n\r\n'
  reg += '[-HKEY_CURRENT_USER\\Software\\Classes\\Applications\\SidPlayer.exe]\r\n\r\n'
  reg += '[-HKEY_CURRENT_USER\\Software\\Classes\\SidPlayer.Video]\r\n\r\n'
  reg += '[-HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\video\\shell\\SidPlayer]\r\n\r\n'
  reg += '[-HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\SidPlayer]\r\n\r\n'

  for (const ext of VIDEO_EXTENSIONS) {
    reg += `[HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithProgids]\r\n`
    reg += '"SidPlayer.Video"=-\r\n\r\n'
    reg += `[-HKEY_CURRENT_USER\\Software\\Classes\\${ext}\\OpenWithList\\SidPlayer.exe]\r\n\r\n`
  }

  return reg
}

export async function registerWindowsContextMenu(exePathOverride?: string): Promise<{ success: boolean; error?: string }> {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Context menu integration is only supported on Windows.' }
  }

  const exePath = exePathOverride || getTargetExePath()
  const regContent = generateRegistrationReg(exePath)
  const tmpPath = path.join(os.tmpdir(), `sidplayer_register_${Date.now()}.reg`)

  try {
    fs.writeFileSync(tmpPath, '\ufeff' + regContent, { encoding: 'utf16le' })
    await runRegImport(tmpPath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to import registry file.' }
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    } catch {}
  }
}

export async function unregisterWindowsContextMenu(): Promise<{ success: boolean; error?: string }> {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Context menu integration is only supported on Windows.' }
  }

  const regContent = generateUnregistrationReg()
  const tmpPath = path.join(os.tmpdir(), `sidplayer_unregister_${Date.now()}.reg`)

  try {
    fs.writeFileSync(tmpPath, '\ufeff' + regContent, { encoding: 'utf16le' })
    await runRegImport(tmpPath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove registry entries.' }
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    } catch {}
  }
}

export async function isWindowsContextMenuRegistered(): Promise<boolean> {
  if (process.platform !== 'win32') return false
  return new Promise<boolean>((resolve) => {
    execFile('reg.exe', ['query', 'HKCU\\Software\\Classes\\Applications\\SidPlayer.exe'], (error) => {
      resolve(!error)
    })
  })
}
