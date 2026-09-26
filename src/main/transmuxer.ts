import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { VideoItem, PrepareMediaResult, PrepareMediaProgress } from '../shared/types'

let cachedFfmpegPath: string | null = null

export function findFfmpeg(): string {
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

export function isDirectlyPlayable(video: VideoItem): boolean {
  const ext = path.extname(video.path).toLowerCase()
  const format = (video.format || '').toLowerCase()
  const videoCodec = (video.videoCodec || '').toLowerCase()
  const audioCodec = (video.audioCodec || '').toLowerCase()

  // Incompatible containers for Chromium HTML5 <video>
  if (
    format.includes('mpegts') ||
    ext === '.ts' ||
    ext === '.m2ts' ||
    ext === '.mts' ||
    format.includes('avi') ||
    ext === '.avi' ||
    format.includes('flv') ||
    ext === '.flv' ||
    format.includes('asf') ||
    ext === '.wmv' ||
    ext === '.wma'
  ) {
    return false
  }

  // Incompatible audio codecs for standard Chromium build
  const unsupportedAudio = ['ac3', 'eac3', 'dts', 'truehd', 'wma', 'wmav2', 'mlp']
  if (unsupportedAudio.some((a) => audioCodec.includes(a))) {
    return false
  }

  // Incompatible video codecs (Note: HEVC will try direct or remux first, then transcode if OS lacks decoder)
  const unsupportedVideo = ['mpeg2video', 'mpeg1video', 'wmv3', 'vc1', 'msmpeg4', 'dvvideo', 'rv40']
  if (unsupportedVideo.some((v) => videoCodec.includes(v))) {
    return false
  }

  return true
}

const activeTransmuxProcesses = new Map<string, ChildProcess>()

export function cancelTransmux(videoId: string): void {
  const proc = activeTransmuxProcesses.get(videoId)
  if (proc) {
    try {
      proc.kill('SIGKILL')
    } catch {}
    activeTransmuxProcesses.delete(videoId)
  }
}

export async function preparePlayableMedia(
  video: VideoItem,
  forceRemux = false,
  forceTranscode = false,
  onProgress?: (progress: PrepareMediaProgress) => void
): Promise<PrepareMediaResult> {
  const cacheDir = path.join(app.getPath('temp'), 'SidPlayer', 'cache')
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  // Hash based on path + file stats to verify cache validity
  let statSize = video.size
  let statMtime = video.dateModified
  try {
    if (fs.existsSync(video.path)) {
      const stat = fs.statSync(video.path)
      statSize = stat.size
      statMtime = stat.mtimeMs
    }
  } catch {}

  const videoCodec = (video.videoCodec || '').toLowerCase()
  const audioCodec = (video.audioCodec || '').toLowerCase()
  const format = (video.format || '').toLowerCase()
  const ext = path.extname(video.path).toLowerCase()
  const isMpegTs = format.includes('mpegts') || ext === '.ts' || ext === '.m2ts'
  const isHEVC = videoCodec.includes('hevc') || videoCodec.includes('h265')

  const copyableVideoCodecs = ['h264', 'avc1', 'hevc', 'h265', 'vp9', 'av1']
  const canCopyVideo = copyableVideoCodecs.some((c) => videoCodec.includes(c))
  const shouldTranscodeVideo = forceTranscode || (forceRemux && isHEVC) || !canCopyVideo

  const cacheKey = crypto
    .createHash('md5')
    .update(`${video.path}_${statSize}_${statMtime}_${shouldTranscodeVideo ? 'h264' : 'copy'}`)
    .digest('hex')
  const cachedFilePath = path.join(cacheDir, `${cacheKey}.mp4`)
  const tempFilePath = path.join(cacheDir, `${cacheKey}.temp.mp4`)

  // Check if already cached
  if (!forceRemux && !forceTranscode && fs.existsSync(cachedFilePath)) {
    const cachedStat = fs.statSync(cachedFilePath)
    if (cachedStat.size > 1024) {
      return {
        ready: true,
        playablePath: cachedFilePath,
        isOptimized: true
      }
    }
  }

  // If directly playable and not forced, return original path
  if (!forceRemux && !forceTranscode && isDirectlyPlayable(video)) {
    return {
      ready: true,
      playablePath: video.path,
      isOptimized: false
    }
  }

  // Needs remuxing or transcoding
  return new Promise((resolve) => {
    cancelTransmux(video.id)

    const ffmpegPath = findFfmpeg()
    const is4K = (video.width && video.width >= 3840) || (video.height && video.height >= 2160)
    const args: string[] = ['-y', '-i', video.path]

    if (!shouldTranscodeVideo && canCopyVideo) {
      args.push('-c:v', 'copy')
    } else {
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20')
    }

    // Determine Audio Copy or Transcode
    const copyableAudioCodecs = ['aac', 'mp3', 'opus', 'flac']
    const canCopyAudio = copyableAudioCodecs.some((a) => audioCodec.includes(a))

    if (canCopyAudio) {
      if (isMpegTs && audioCodec.includes('aac')) {
        args.push('-c:a', 'copy', '-bsf:a', 'aac_adtstoasc')
      } else {
        args.push('-c:a', 'copy')
      }
    } else {
      args.push('-c:a', 'aac', '-b:a', '192k')
    }

    // Output faststart MP4
    args.push('-f', 'mp4', '-movflags', '+faststart', tempFilePath)

    const initialStatus = shouldTranscodeVideo
      ? is4K
        ? 'Transcoding 4K HEVC video to H.264 (Press Esc to cancel)...'
        : 'Transcoding video to H.264...'
      : 'Optimizing container for instant playback...'

    onProgress?.({
      videoId: video.id,
      percent: 0,
      status: initialStatus
    })

    const proc = spawn(ffmpegPath, args)
    activeTransmuxProcesses.set(video.id, proc)

    let stderrBuffer = ''

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      stderrBuffer += text

      const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/)
      if (match && video.duration > 0) {
        const hours = parseFloat(match[1])
        const minutes = parseFloat(match[2])
        const seconds = parseFloat(match[3])
        const currentSecs = hours * 3600 + minutes * 60 + seconds
        const pct = Math.min(99, Math.max(1, Math.round((currentSecs / video.duration) * 100)))

        const statusMsg = shouldTranscodeVideo
          ? is4K
            ? `Transcoding 4K HEVC to H.264 (${pct}%)... Press Esc to cancel`
            : `Transcoding video (${pct}%)...`
          : `Remuxing ${format.toUpperCase() || 'video'} to MP4 (${pct}%)...`

        onProgress?.({
          videoId: video.id,
          percent: pct,
          status: statusMsg
        })
      }
    })

    proc.on('error', (err) => {
      activeTransmuxProcesses.delete(video.id)
      console.error('Transmux process error:', err)
      resolve({
        ready: false,
        playablePath: video.path,
        isOptimized: false,
        error: err.message
      })
    })

    proc.on('close', (code) => {
      activeTransmuxProcesses.delete(video.id)

      if (code === 0 && fs.existsSync(tempFilePath)) {
        try {
          if (fs.existsSync(cachedFilePath)) {
            fs.unlinkSync(cachedFilePath)
          }
          fs.renameSync(tempFilePath, cachedFilePath)

          onProgress?.({
            videoId: video.id,
            percent: 100,
            status: 'Ready'
          })

          resolve({
            ready: true,
            playablePath: cachedFilePath,
            isOptimized: true
          })
          return
        } catch (err: any) {
          console.error('Failed to finalize cached file:', err)
        }
      }

      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath)
        }
      } catch {}

      resolve({
        ready: false,
        playablePath: video.path,
        isOptimized: false,
        error: `Process exited with code ${code}: ${stderrBuffer.slice(-300)}`
      })
    })
  })
}

export async function switchAudioTrack(video: VideoItem, audioTrackIndex: number): Promise<string> {
  const cacheDir = path.join(app.getPath('temp'), 'SidPlayer', 'cache')
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  const cacheKey = crypto
    .createHash('md5')
    .update(`${video.path}_${video.size}_a${audioTrackIndex}`)
    .digest('hex')
  const cachedPath = path.join(cacheDir, `${cacheKey}.mp4`)

  if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 1024) {
    return cachedPath
  }

  return new Promise((resolve, reject) => {
    const ffmpegPath = findFfmpeg()
    const args = [
      '-y',
      '-i',
      video.path,
      '-map',
      '0:v:0',
      '-map',
      `0:a:${audioTrackIndex}`,
      '-c:v',
      'copy',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
      cachedPath
    ]

    const proc = spawn(ffmpegPath, args)
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(cachedPath)) {
        resolve(cachedPath)
      } else {
        // Fallback to transcoding audio to AAC if direct copy fails
        const fallbackArgs = [
          '-y',
          '-i',
          video.path,
          '-map',
          '0:v:0',
          '-map',
          `0:a:${audioTrackIndex}`,
          '-c:v',
          'copy',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-movflags',
          '+faststart',
          cachedPath
        ]
        const proc2 = spawn(ffmpegPath, fallbackArgs)
        proc2.on('close', (code2) => {
          if (code2 === 0 && fs.existsSync(cachedPath)) {
            resolve(cachedPath)
          } else {
            reject(new Error(`Failed to switch audio track: code ${code2}`))
          }
        })
      }
    })
    proc.on('error', reject)
  })
}

export async function captureGifSegment(
  videoPath: string,
  startSec: number,
  endSec: number,
  targetDir?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const destDir = targetDir || path.join(app.getPath('pictures'), 'SidPlayer')
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const outPath = path.join(destDir, `segment_${timestamp}.gif`)
    const duration = Math.max(0.5, endSec - startSec)

    const ffmpegPath = findFfmpeg()
    const args = [
      '-y',
      '-ss',
      startSec.toString(),
      '-t',
      duration.toString(),
      '-i',
      videoPath,
      '-vf',
      'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      outPath
    ]

    return new Promise((resolve) => {
      const proc = spawn(ffmpegPath, args)
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outPath)) {
          resolve({ success: true, filePath: outPath })
        } else {
          resolve({ success: false, error: `GIF export failed with code ${code}` })
        }
      })
      proc.on('error', (err) => resolve({ success: false, error: err.message }))
    })
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
