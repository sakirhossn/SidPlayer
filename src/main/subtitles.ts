import fs from 'node:fs'
import path from 'node:path'
import { SubtitleTrack, SubtitleCue } from '../shared/types'

const SUB_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa']

const LANG_MAP: Record<string, string> = {
  en: 'English',
  eng: 'English',
  es: 'Spanish',
  spa: 'Spanish',
  fr: 'French',
  fra: 'French',
  fre: 'French',
  de: 'German',
  deu: 'German',
  ger: 'German',
  hi: 'Hindi',
  hin: 'Hindi',
  bn: 'Bengali',
  ben: 'Bengali',
  ja: 'Japanese',
  jpn: 'Japanese',
  zh: 'Chinese',
  zho: 'Chinese',
  chi: 'Chinese',
  ko: 'Korean',
  kor: 'Korean',
  it: 'Italian',
  ita: 'Italian',
  pt: 'Portuguese',
  por: 'Portuguese',
  ru: 'Russian',
  rus: 'Russian',
  ar: 'Arabic',
  ara: 'Arabic'
}

export function detectSiblingSubtitles(videoPath: string): SubtitleTrack[] {
  try {
    const dir = path.dirname(videoPath)
    const baseName = path.parse(videoPath).name.toLowerCase()
    const files = fs.readdirSync(dir)
    const tracks: SubtitleTrack[] = []

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (!SUB_EXTENSIONS.includes(ext)) continue

      const subBaseName = path.parse(file).name.toLowerCase()

      // Exact match e.g. "movie.srt"
      if (subBaseName === baseName) {
        const fullPath = path.join(dir, file)
        tracks.push({
          id: `sub_${tracks.length}_${file}`,
          label: `Default (${ext.slice(1).toUpperCase()})`,
          language: 'und',
          path: fullPath,
          format: ext.slice(1) as any,
          isExternal: true
        })
        continue
      }

      // Suffix match e.g. "movie.en.srt", "movie.eng.srt", "movie_english.srt"
      if (subBaseName.startsWith(baseName)) {
        const rest = subBaseName.slice(baseName.length).replace(/^[-_.]/, '').trim()
        const langCode = rest.toLowerCase()
        const langName = LANG_MAP[langCode] || rest.toUpperCase() || 'External'
        const fullPath = path.join(dir, file)

        tracks.push({
          id: `sub_${tracks.length}_${file}`,
          label: `${langName} (${ext.slice(1).toUpperCase()})`,
          language: langCode,
          path: fullPath,
          format: ext.slice(1) as any,
          isExternal: true
        })
      }
    }

    return tracks
  } catch (err) {
    console.warn('Error detecting sibling subtitles:', err)
    return []
  }
}

export function parseSrtTimeToSeconds(timeStr: string): number {
  // Format: "00:01:20,123" or "00:01:20.123"
  const clean = timeStr.trim().replace(',', '.')
  const parts = clean.split(':')
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0
    const mins = parseFloat(parts[1]) || 0
    const secs = parseFloat(parts[2]) || 0
    return hours * 3600 + mins * 60 + secs
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0
    const secs = parseFloat(parts[1]) || 0
    return mins * 60 + secs
  }
  return parseFloat(clean) || 0
}

export function parseAssTimeToSeconds(timeStr: string): number {
  // Format: "0:01:20.12"
  const parts = timeStr.trim().split(':')
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0
    const mins = parseFloat(parts[1]) || 0
    const secs = parseFloat(parts[2]) || 0
    return hours * 3600 + mins * 60 + secs
  }
  return 0
}

export function parseSubtitleFile(filePath: string): SubtitleCue[] {
  try {
    if (!fs.existsSync(filePath)) return []
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.srt' || ext === '.vtt') {
      return parseSrtOrVtt(content)
    } else if (ext === '.ass' || ext === '.ssa') {
      return parseAss(content)
    }

    return parseSrtOrVtt(content)
  } catch (err) {
    console.error('Failed to parse subtitle file:', err)
    return []
  }
}

export function parseSrtOrVtt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Check for timestamp line "00:00:01,000 --> 00:00:04,000"
    if (line.includes('-->')) {
      const parts = line.split('-->')
      const start = parseSrtTimeToSeconds(parts[0])
      // Handle optional settings after end time in WebVTT
      const endPart = parts[1].trim().split(/\s+/)[0]
      const end = parseSrtTimeToSeconds(endPart)

      i++
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip HTML styling tags like <b>, <i>, <font>
        const cleanText = lines[i].replace(/<[^>]+>/g, '').trim()
        if (cleanText) textLines.push(cleanText)
        i++
      }

      if (textLines.length > 0 && end > start) {
        cues.push({
          startTime: start,
          endTime: end,
          text: textLines.join('\n')
        })
      }
    }
    i++
  }

  return cues
}

export function parseAss(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  let inEvents = false
  let formatFields: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.toLowerCase() === '[events]') {
      inEvents = true
      continue
    }

    if (inEvents) {
      if (line.startsWith('Format:')) {
        formatFields = line.slice(7).split(',').map((f) => f.trim().toLowerCase())
      } else if (line.startsWith('Dialogue:')) {
        const payload = line.slice(9).trim()
        const parts = payload.split(',')

        // Format is usually: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
        const startIndex = formatFields.indexOf('start') !== -1 ? formatFields.indexOf('start') : 1
        const endIndex = formatFields.indexOf('end') !== -1 ? formatFields.indexOf('end') : 2
        const textIndex = formatFields.indexOf('text') !== -1 ? formatFields.indexOf('text') : 9

        if (parts.length > textIndex) {
          const start = parseAssTimeToSeconds(parts[startIndex])
          const end = parseAssTimeToSeconds(parts[endIndex])
          // Everything after textIndex is part of text (may contain commas)
          let text = parts.slice(textIndex).join(',')
          // Remove ASS tags like {\an8}, {\b1}, \N (newline)
          text = text.replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim()

          if (text && end > start) {
            cues.push({
              startTime: start,
              endTime: end,
              text
            })
          }
        }
      }
    }
  }

  return cues.sort((a, b) => a.startTime - b.startTime)
}
