import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let cachedFfmpegPath: string | null = null
let cachedFfprobePath: string | null = null

/**
 * Centralized, prioritized resolution of FFmpeg binary.
 * Checks packaged resources, standard installation paths, local directories, and PATH.
 */
export function findFfmpeg(): string {
  if (cachedFfmpegPath && (cachedFfmpegPath === 'ffmpeg' || fs.existsSync(cachedFfmpegPath))) {
    return cachedFfmpegPath
  }

  const candidates: string[] = []

  // 1. Packaged extraResources in production build
  try {
    if (app && app.isPackaged) {
      candidates.push(path.join(process.resourcesPath, 'ffmpeg.exe'))
      candidates.push(path.join(process.resourcesPath, 'bin', 'ffmpeg.exe'))
    }
  } catch {}

  // 2. Standard Windows install path
  candidates.push('C:\\ffmpeg\\bin\\ffmpeg.exe')

  // 3. Project or executable local bin directory
  candidates.push(path.join(process.cwd(), 'bin', 'ffmpeg.exe'))
  candidates.push(path.join(process.cwd(), 'ffmpeg.exe'))

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedFfmpegPath = candidate
      return candidate
    }
  }

  // 4. Default to system PATH
  cachedFfmpegPath = 'ffmpeg'
  return cachedFfmpegPath
}

/**
 * Centralized, prioritized resolution of FFprobe binary.
 */
export function findFfprobe(): string {
  if (cachedFfprobePath && (cachedFfprobePath === 'ffprobe' || fs.existsSync(cachedFfprobePath))) {
    return cachedFfprobePath
  }

  const candidates: string[] = []

  try {
    if (app && app.isPackaged) {
      candidates.push(path.join(process.resourcesPath, 'ffprobe.exe'))
      candidates.push(path.join(process.resourcesPath, 'bin', 'ffprobe.exe'))
    }
  } catch {}

  candidates.push('C:\\ffmpeg\\bin\\ffprobe.exe')
  candidates.push(path.join(process.cwd(), 'bin', 'ffprobe.exe'))
  candidates.push(path.join(process.cwd(), 'ffprobe.exe'))

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedFfprobePath = candidate
      return candidate
    }
  }

  cachedFfprobePath = 'ffprobe'
  return cachedFfprobePath
}

export function resetBinaryCacheForTesting(): void {
  cachedFfmpegPath = null
  cachedFfprobePath = null
}
