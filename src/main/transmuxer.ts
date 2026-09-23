import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { VideoItem, PrepareMediaResult, PrepareMediaProgress } from '../shared/types'

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
  if (unsupportedAudio.some(a => audioCodec.includes(a))) {
    return false
  }

  // Incompatible video codecs
  const unsupportedVideo = ['mpeg2video', 'mpeg1video', 'wmv3', 'vc1', 'msmpeg4', 'dvvideo', 'rv40']
  if (unsupportedVideo.some(v => videoCodec.includes(v))) {
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

  const cacheKey = crypto
    .createHash('md5')
    .update(`${video.path}_${statSize}_${statMtime}`)
    .digest('hex')
  const cachedFilePath = path.join(cacheDir, `${cacheKey}.mp4`)
  const tempFilePath = path.join(cacheDir, `${cacheKey}.temp.mp4`)

  // Check if already cached
  if (!forceRemux && fs.existsSync(cachedFilePath)) {
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
  if (!forceRemux && isDirectlyPlayable(video)) {
    return {
      ready: true,
      playablePath: video.path,
      isOptimized: false
    }
  }

  // Needs remuxing or transcoding
  return new Promise((resolve) => {
    // Cancel any previous process for this video
    cancelTransmux(video.id)

    const ffmpegPath = findFfmpeg()
    const format = (video.format || '').toLowerCase()
    const ext = path.extname(video.path).toLowerCase()
    const videoCodec = (video.videoCodec || '').toLowerCase()
    const audioCodec = (video.audioCodec || '').toLowerCase()
    const isMpegTs = format.includes('mpegts') || ext === '.ts' || ext === '.m2ts'

    const args: string[] = ['-y', '-i', video.path]

    // Determine Video Copy or Transcode
    const copyableVideoCodecs = ['h264', 'avc1', 'hevc', 'h265', 'vp9', 'av1']
    const canCopyVideo = copyableVideoCodecs.some(c => videoCodec.includes(c))

    if (canCopyVideo) {
      args.push('-c:v', 'copy')
    } else {
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20')
    }

    // Determine Audio Copy or Transcode
    const copyableAudioCodecs = ['aac', 'mp3', 'opus', 'flac']
    const canCopyAudio = copyableAudioCodecs.some(a => audioCodec.includes(a))

    if (canCopyAudio) {
      if (isMpegTs && audioCodec.includes('aac')) {
        // MPEG-TS ADTS header fix for MP4 container
        args.push('-c:a', 'copy', '-bsf:a', 'aac_adtstoasc')
      } else {
        args.push('-c:a', 'copy')
      }
    } else {
      // Convert unsupported audio (AC3, EAC3, DTS, WMA) to AAC
      args.push('-c:a', 'aac', '-b:a', '192k')
    }

    // Output faststart MP4
    args.push('-f', 'mp4', '-movflags', '+faststart', tempFilePath)

    onProgress?.({
      videoId: video.id,
      percent: 0,
      status: canCopyVideo ? 'Optimizing container for instant playback...' : 'Transcoding media for playback...'
    })

    const proc = spawn(ffmpegPath, args)
    activeTransmuxProcesses.set(video.id, proc)

    let stderrBuffer = ''

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      stderrBuffer += text

      // Parse time=HH:MM:SS.ms
      const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/)
      if (match && video.duration > 0) {
        const hours = parseFloat(match[1])
        const minutes = parseFloat(match[2])
        const seconds = parseFloat(match[3])
        const currentSecs = hours * 3600 + minutes * 60 + seconds
        const pct = Math.min(99, Math.max(1, Math.round((currentSecs / video.duration) * 100)))

        onProgress?.({
          videoId: video.id,
          percent: pct,
          status: canCopyVideo
            ? `Remuxing ${format.toUpperCase() || 'video'} to MP4 (${pct}%)...`
            : `Transcoding video (${pct}%)...`
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

      // If ffmpeg failed or was aborted
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath)
        }
      } catch {}

      resolve({
        ready: false,
        playablePath: video.path,
        isOptimized: false,
        error: `Remux exited with code ${code}: ${stderrBuffer.slice(-300)}`
      })
    })
  })
}
