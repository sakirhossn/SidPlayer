import { app } from 'electron'
import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

let cachedFfmpegPath: string | null = null

function findFfmpeg(): string {
  if (cachedFfmpegPath) return cachedFfmpegPath

  const candidates = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'ffmpeg.exe',
    'ffmpeg'
  ]

  for (const c of candidates) {
    if (path.isAbsolute(c)) {
      if (fs.existsSync(c)) {
        cachedFfmpegPath = c
        return c
      }
    } else {
      cachedFfmpegPath = c
      return c
    }
  }

  cachedFfmpegPath = 'ffmpeg'
  return cachedFfmpegPath
}

export async function generateThumbnail(filePath: string, duration = 0): Promise<string | null> {
  try {
    const userData = app.getPath('userData')
    const thumbDir = path.join(userData, 'thumbnails')
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true })
    }

    const hash = crypto.createHash('md5').update(filePath).digest('hex')
    const thumbPath = path.join(thumbDir, `${hash}.jpg`)

    if (fs.existsSync(thumbPath)) {
      return `media://local?path=${encodeURIComponent(thumbPath)}`
    }

    const ffmpegBin = findFfmpeg()
    // Seek to 10% of duration, or 5 seconds, min 1 second
    let seekTime = 5
    if (duration > 20) {
      seekTime = Math.min(Math.floor(duration * 0.1), 120)
    }

    const args = [
      '-ss', seekTime.toString(),
      '-i', filePath,
      '-vframes', '1',
      '-vf', 'scale=480:-1',
      '-q:v', '3',
      '-y',
      thumbPath
    ]

    return new Promise((resolve) => {
      execFile(ffmpegBin, args, { timeout: 10000 }, (err) => {
        if (err || !fs.existsSync(thumbPath)) {
          // Retry at 1 second if 5s failed (e.g. very short video)
          const fallbackArgs = [
            '-ss', '00:00:01',
            '-i', filePath,
            '-vframes', '1',
            '-vf', 'scale=480:-1',
            '-q:v', '3',
            '-y',
            thumbPath
          ]
          execFile(ffmpegBin, fallbackArgs, { timeout: 5000 }, (fallbackErr) => {
            if (fallbackErr || !fs.existsSync(thumbPath)) {
              return resolve(null)
            }
            resolve(`media://local?path=${encodeURIComponent(thumbPath)}`)
          })
          return
        }

        resolve(`media://local?path=${encodeURIComponent(thumbPath)}`)
      })
    })
  } catch (err) {
    console.error('Thumbnail generation error:', err)
    return null
  }
}

export async function generateFilmstrip(
  filePath: string,
  duration: number,
  count = 10
): Promise<string[]> {
  try {
    if (!duration || duration <= 2) return []

    const userData = app.getPath('userData')
    const hash = crypto.createHash('md5').update(filePath).digest('hex')
    const stripDir = path.join(userData, 'thumbnails', 'filmstrip', hash)
    if (!fs.existsSync(stripDir)) {
      fs.mkdirSync(stripDir, { recursive: true })
    }

    const ffmpegBin = findFfmpeg()
    const results: string[] = []
    const step = duration / (count + 1)

    const promises: Promise<string | null>[] = []

    for (let i = 1; i <= count; i++) {
      const seekSec = Math.round(step * i)
      const framePath = path.join(stripDir, `frame_${i}.jpg`)

      if (fs.existsSync(framePath) && fs.statSync(framePath).size > 0) {
        promises.push(Promise.resolve(`media://local?path=${encodeURIComponent(framePath)}`))
        continue
      }

      const p = new Promise<string | null>((resolve) => {
        const args = [
          '-ss',
          seekSec.toString(),
          '-i',
          filePath,
          '-vframes',
          '1',
          '-vf',
          'scale=240:-1',
          '-q:v',
          '4',
          '-y',
          framePath
        ]
        execFile(ffmpegBin, args, { timeout: 6000 }, (err) => {
          if (err || !fs.existsSync(framePath)) {
            resolve(null)
          } else {
            resolve(`media://local?path=${encodeURIComponent(framePath)}`)
          }
        })
      })
      promises.push(p)
    }

    const settled = await Promise.all(promises)
    for (const url of settled) {
      if (url) results.push(url)
    }
    return results
  } catch (err) {
    console.warn('Failed to generate filmstrip:', err)
    return []
  }
}
