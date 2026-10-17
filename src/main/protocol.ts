import { app, protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { store } from './store'

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.ts': 'video/mp2t',
  '.m2ts': 'video/mp2t',
  '.flv': 'video/x-flv',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.srt': 'text/plain',
  '.vtt': 'text/vtt',
  '.ass': 'text/plain',
  '.ssa': 'text/plain'
}

export interface RangeSpec {
  start: number
  end: number
}

/**
 * RFC 7233 compliant HTTP Range parser.
 * Supports prefix ranges (bytes=0-499), open-ended ranges (bytes=500-),
 * and suffix ranges (bytes=-500).
 */
export function parseHttpRange(rangeHeader: string, fileSize: number): RangeSpec | 'invalid' | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null
  }
  const spec = rangeHeader.slice(6).trim()
  if (!spec) return 'invalid'

  const dashIndex = spec.indexOf('-')
  if (dashIndex === -1) return 'invalid'

  const startStr = spec.slice(0, dashIndex).trim()
  const endStr = spec.slice(dashIndex + 1).trim()

  if (startStr === '' && endStr === '') {
    return 'invalid'
  }

  if (fileSize <= 0) {
    return 'invalid'
  }

  // Suffix range: bytes=-500 (meaning last 500 bytes)
  if (startStr === '') {
    const suffixLength = parseInt(endStr, 10)
    if (isNaN(suffixLength) || suffixLength <= 0) return 'invalid'
    const actualSuffix = Math.min(suffixLength, fileSize)
    return {
      start: fileSize - actualSuffix,
      end: fileSize - 1
    }
  }

  const start = parseInt(startStr, 10)
  if (isNaN(start) || start < 0) return 'invalid'

  // Open-ended range: bytes=1000-
  if (endStr === '') {
    if (start >= fileSize) return 'invalid'
    return {
      start,
      end: fileSize - 1
    }
  }

  // Explicit bounded range: bytes=0-499
  const end = parseInt(endStr, 10)
  if (isNaN(end) || end < start) return 'invalid'
  if (start >= fileSize) return 'invalid'

  return {
    start,
    end: Math.min(end, fileSize - 1)
  }
}

const authorizedPaths = new Set<string>()

/**
 * Authorize an individual path (e.g., when picked via open file dialog or drag-and-drop).
 */
export function authorizeMediaPath(targetPath: string): void {
  if (!targetPath) return
  try {
    const normalized = path.resolve(targetPath).toLowerCase()
    authorizedPaths.add(normalized)
  } catch {}
}

/**
 * Check if the target file path is authorized to be streamed through media://
 */
export function isPathAuthorized(targetPath: string): boolean {
  if (!targetPath) return false
  try {
    const normalized = path.resolve(targetPath).toLowerCase()

    if (authorizedPaths.has(normalized)) {
      return true
    }

    // Allow SidPlayer cache / temp directory
    try {
      const tempCache = path.resolve(app.getPath('temp'), 'SidPlayer').toLowerCase()
      if (normalized.startsWith(tempCache)) return true
    } catch {}

    // Allow user data directory (e.g. thumbnails)
    try {
      const userData = path.resolve(app.getPath('userData')).toLowerCase()
      if (normalized.startsWith(userData)) return true
    } catch {}

    // Allow pictures directory (screenshots/GIFs)
    try {
      const picDir = path.resolve(app.getPath('pictures'), 'SidPlayer').toLowerCase()
      if (normalized.startsWith(picDir)) return true
    } catch {}

    // Allow any registered video or subtitle in database
    const videos = store.getVideos()
    for (const v of videos) {
      if (path.resolve(v.path).toLowerCase() === normalized) {
        return true
      }
      if (v.subtitles) {
        for (const sub of v.subtitles) {
          if (sub.path && path.resolve(sub.path).toLowerCase() === normalized) {
            return true
          }
        }
      }
    }

    // Allow files within watched folders
    const watched = store.getSettings().watchedFolders || []
    for (const folder of watched) {
      const folderNorm = path.resolve(folder).toLowerCase()
      if (normalized.startsWith(folderNorm)) {
        return true
      }
    }
  } catch (err) {
    console.warn('Error verifying path authorization:', err)
  }

  return false
}

function createWebStreamFromNode(nodeStream: fs.ReadStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        try {
          controller.enqueue(chunk)
        } catch {
          nodeStream.destroy()
        }
      })
      nodeStream.on('end', () => {
        try {
          controller.close()
        } catch {}
      })
      nodeStream.on('error', (err) => {
        try {
          controller.error(err)
        } catch {}
      })
    },
    cancel() {
      nodeStream.destroy()
    }
  })
}

export function registerMediaProtocol(): void {
  protocol.handle('media', async (request) => {
    try {
      const url = new URL(request.url)
      let targetPath = url.searchParams.get('path')

      if (!targetPath) {
        let p = decodeURIComponent(url.pathname)
        if (process.platform === 'win32' && p.startsWith('/')) {
          p = p.slice(1)
        }
        targetPath = p
      }

      if (!targetPath) {
        return new Response('File Not Found', { status: 404 })
      }

      const resolvedPath = path.resolve(targetPath)

      // Path authorization check
      if (!isPathAuthorized(resolvedPath)) {
        console.warn(`[Security] Blocked unauthorized media:// request for: ${resolvedPath}`)
        return new Response('Forbidden: Access to requested path is not authorized', { status: 403 })
      }

      if (!fs.existsSync(resolvedPath)) {
        return new Response('File Not Found', { status: 404 })
      }

      const stat = fs.statSync(resolvedPath)
      const fileSize = stat.size
      const ext = path.extname(resolvedPath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      if (fileSize === 0) {
        return new Response(new Uint8Array(0), {
          status: 200,
          headers: {
            'Content-Length': '0',
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes'
          }
        })
      }

      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const range = parseHttpRange(rangeHeader, fileSize)

        if (range === 'invalid') {
          return new Response('Requested Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`,
              'Accept-Ranges': 'bytes'
            }
          })
        }

        if (range) {
          const { start, end } = range
          const chunkSize = end - start + 1
          const nodeStream = fs.createReadStream(resolvedPath, { start, end })
          const webStream = createWebStreamFromNode(nodeStream)

          return new Response(webStream, {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize.toString(),
              'Content-Type': contentType
            }
          })
        }
      }

      // Full content delivery
      const nodeStream = fs.createReadStream(resolvedPath)
      const webStream = createWebStreamFromNode(nodeStream)

      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        }
      })
    } catch (err: any) {
      console.error('Media protocol error:', err)
      return new Response('Internal Server Error: ' + (err?.message || 'Unknown error'), { status: 500 })
    }
  })
}
