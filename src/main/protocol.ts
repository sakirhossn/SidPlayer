import { protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

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
  '.flv': 'video/x-flv',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

export function registerMediaProtocol(): void {
  // Register media scheme as privileged beforehand in main before app ready
  protocol.handle('media', async (request) => {
    try {
      const url = new URL(request.url)
      let targetPath = url.searchParams.get('path')

      if (!targetPath) {
        // Fallback to pathname
        let p = decodeURIComponent(url.pathname)
        if (process.platform === 'win32' && p.startsWith('/')) {
          p = p.slice(1)
        }
        targetPath = p
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        return new Response('File Not Found', { status: 404 })
      }

      const stat = fs.statSync(targetPath)
      const fileSize = stat.size
      const ext = path.extname(targetPath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

        if (start >= fileSize || end >= fileSize || start > end) {
          return new Response('Requested Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`
            }
          })
        }

        const chunkSize = end - start + 1
        const nodeStream = fs.createReadStream(targetPath, { start, end })
        const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          }
        })
      } else {
        const nodeStream = fs.createReadStream(targetPath)
        const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream

        return new Response(webStream, {
          status: 200,
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    } catch (err: any) {
      console.error('Media protocol error:', err)
      return new Response('Internal Server Error: ' + err.message, { status: 500 })
    }
  })
}
