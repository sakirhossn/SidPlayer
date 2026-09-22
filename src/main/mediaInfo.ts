import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import { AudioTrack, SubtitleTrack } from '../shared/types'

export interface ProbeResult {
  duration: number
  width: number
  height: number
  fps: number
  resolution: string
  format: string
  videoCodec: string
  audioCodec: string
  bitrate: number
  audioTracks: AudioTrack[]
  embeddedSubtitles: SubtitleTrack[]
  colorInfo?: string
}

let cachedFfprobePath: string | null = null

function findFfprobe(): string {
  if (cachedFfprobePath) return cachedFfprobePath

  const candidates = [
    'C:\\ffmpeg\\bin\\ffprobe.exe',
    'ffprobe.exe',
    'ffprobe'
  ]

  for (const c of candidates) {
    if (path.isAbsolute(c)) {
      if (fs.existsSync(c)) {
        cachedFfprobePath = c
        return c
      }
    } else {
      // Relative or on path
      cachedFfprobePath = c
      return c
    }
  }

  cachedFfprobePath = 'ffprobe'
  return cachedFfprobePath
}

export function probeMedia(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const ffprobeBin = findFfprobe()
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]

    execFile(ffprobeBin, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) {
        // Fallback default
        const ext = path.extname(filePath).replace('.', '').toLowerCase()
        return resolve({
          duration: 0,
          width: 1920,
          height: 1080,
          fps: 24,
          resolution: '1920x1080',
          format: ext,
          videoCodec: 'unknown',
          audioCodec: 'unknown',
          bitrate: 0,
          audioTracks: [],
          embeddedSubtitles: []
        })
      }

      try {
        const data = JSON.parse(stdout)
        const format = data.format || {}
        const streams: any[] = data.streams || []

        const duration = parseFloat(format.duration || '0') || 0
        const bitrate = parseInt(format.bit_rate || '0', 10) || 0
        const formatName = (format.format_name || path.extname(filePath).replace('.', '')).split(',')[0]

        // Find primary video stream
        const videoStream = streams.find((s) => s.codec_type === 'video')
        let width = 0
        let height = 0
        let fps = 24
        let videoCodec = 'unknown'
        let colorInfo: string | undefined = undefined

        if (videoStream) {
          width = videoStream.width || 0
          height = videoStream.height || 0
          videoCodec = videoStream.codec_name || 'unknown'

          if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number)
            if (den && den > 0) {
              fps = Math.round((num / den) * 100) / 100
            }
          }

          if (videoStream.color_transfer || videoStream.color_space) {
            colorInfo = `${videoStream.color_space || 'BT.709'} (${videoStream.color_transfer || 'SDR'})`
          }
        }

        // Collect audio streams
        const audioTracks: AudioTrack[] = streams
          .filter((s) => s.codec_type === 'audio')
          .map((s, idx) => ({
            id: s.index ?? idx,
            title: s.tags?.title || s.tags?.language || `Track ${idx + 1}`,
            language: s.tags?.language || 'und',
            codec: s.codec_name || 'unknown',
            channels: s.channels || 2,
            sampleRate: parseInt(s.sample_rate || '44100', 10)
          }))

        const audioCodec = audioTracks[0]?.codec || 'unknown'

        // Collect embedded subtitles
        const embeddedSubtitles: SubtitleTrack[] = streams
          .filter((s) => s.codec_type === 'subtitle')
          .map((s, idx) => ({
            id: `embedded_${s.index ?? idx}`,
            label: s.tags?.title || (s.tags?.language ? `Subtitle (${s.tags.language})` : `Subtitle ${idx + 1}`),
            language: s.tags?.language || 'und',
            format: (s.codec_name === 'ass' || s.codec_name === 'ssa' ? 'ass' : 'srt') as any,
            isExternal: false
          }))

        const resolution = width && height ? `${width}x${height}` : 'HD'

        resolve({
          duration,
          width,
          height,
          fps,
          resolution,
          format: formatName,
          videoCodec,
          audioCodec,
          bitrate,
          audioTracks,
          embeddedSubtitles,
          colorInfo
        })
      } catch (parseErr) {
        console.warn('ffprobe parse error:', parseErr)
        resolve({
          duration: 0,
          width: 1920,
          height: 1080,
          fps: 24,
          resolution: '1920x1080',
          format: path.extname(filePath).replace('.', '').toLowerCase(),
          videoCodec: 'unknown',
          audioCodec: 'unknown',
          bitrate: 0,
          audioTracks: [],
          embeddedSubtitles: []
        })
      }
    })
  })
}
