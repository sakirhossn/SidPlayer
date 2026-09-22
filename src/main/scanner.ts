import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { BrowserWindow } from 'electron'
import { VideoItem, ScanProgress } from '../shared/types'
import { probeMedia } from './mediaInfo'
import { generateThumbnail } from './thumbnails'
import { detectSiblingSubtitles } from './subtitles'
import { store } from './store'

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.webm',
  '.avi',
  '.mov',
  '.m4v',
  '.mpg',
  '.mpeg',
  '.wmv',
  '.flv',
  '.ts',
  '.m2ts'
])

let cancelScanFlag = false

export function cancelScan(): void {
  cancelScanFlag = true
}

export async function scanFolder(
  folderPath: string,
  includeSubfolders: boolean,
  window?: BrowserWindow | null
): Promise<VideoItem[]> {
  cancelScanFlag = false

  const emitProgress = (progress: ScanProgress) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('scan-progress', progress)
    }
  }

  emitProgress({ current: 0, total: 0, currentFile: folderPath, phase: 'counting' })

  // Phase 1: Collect all video file paths
  const filePaths: string[] = []

  function walk(dir: string) {
    if (cancelScanFlag) return
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (cancelScanFlag) return
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (includeSubfolders) {
            walk(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (VIDEO_EXTENSIONS.has(ext)) {
            filePaths.push(fullPath)
          }
        }
      }
    } catch (err) {
      console.warn(`Error reading dir ${dir}:`, err)
    }
  }

  walk(folderPath)

  if (cancelScanFlag) {
    emitProgress({ current: 0, total: filePaths.length, currentFile: '', phase: 'cancelled' })
    return []
  }

  const total = filePaths.length
  emitProgress({ current: 0, total, currentFile: '', phase: 'scanning' })

  const existingVideos = store.getVideos()
  const existingMap = new Map<string, VideoItem>()
  for (const v of existingVideos) {
    existingMap.set(v.path, v)
  }

  const results: VideoItem[] = []

  for (let i = 0; i < total; i++) {
    if (cancelScanFlag) {
      emitProgress({ current: i, total, currentFile: filePaths[i], phase: 'cancelled' })
      break
    }

    const filePath = filePaths[i]
    emitProgress({ current: i + 1, total, currentFile: filePath, phase: 'scanning' })

    try {
      const stat = fs.statSync(filePath)
      const existing = existingMap.get(filePath)

      // If exists and file hasn't changed, reuse
      if (existing && existing.size === stat.size && existing.dateModified === stat.mtimeMs) {
        results.push(existing)
        continue
      }

      const probe = await probeMedia(filePath)
      const thumb = await generateThumbnail(filePath, probe.duration)
      const subtitles = detectSiblingSubtitles(filePath)

      const id = crypto.createHash('md5').update(filePath).digest('hex')
      const fingerprint = `${stat.size}_${Math.round(probe.duration)}`

      const videoItem: VideoItem = {
        id,
        path: filePath,
        filename: path.basename(filePath),
        title: path.parse(filePath).name,
        duration: probe.duration,
        size: stat.size,
        resolution: probe.resolution,
        width: probe.width,
        height: probe.height,
        fps: probe.fps,
        format: probe.format,
        videoCodec: probe.videoCodec,
        audioCodec: probe.audioCodec,
        bitrate: probe.bitrate,
        dateAdded: Date.now(),
        dateModified: stat.mtimeMs,
        lastPlayed: 0,
        playCount: 0,
        resumePosition: 0,
        completed: false,
        isFavorite: false,
        thumbnailUrl: thumb,
        subtitles: [...probe.embeddedSubtitles, ...subtitles],
        audioTracks: probe.audioTracks,
        isMissing: false,
        folder: path.dirname(filePath),
        fingerprint
      }

      results.push(videoItem)
      store.upsertVideo(videoItem)
    } catch (fileErr) {
      console.error(`Error processing file ${filePath}:`, fileErr)
    }
  }

  emitProgress({ current: total, total, currentFile: '', phase: 'done' })
  return results
}
