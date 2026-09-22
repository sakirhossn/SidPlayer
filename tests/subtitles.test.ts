import { describe, it, expect } from 'vitest'
import {
  parseSrtTimeToSeconds,
  parseAssTimeToSeconds,
  parseSrtOrVtt,
  parseAss
} from '../src/main/subtitles'

describe('Subtitle Parsing', () => {
  it('parses SRT timecodes to seconds', () => {
    expect(parseSrtTimeToSeconds('00:00:05,500')).toBe(5.5)
    expect(parseSrtTimeToSeconds('00:01:20.123')).toBeCloseTo(80.123, 3)
    expect(parseSrtTimeToSeconds('01:00:00,000')).toBe(3600)
    expect(parseSrtTimeToSeconds('02:30.500')).toBe(150.5)
  })

  it('parses ASS timecodes to seconds', () => {
    expect(parseAssTimeToSeconds('0:00:05.50')).toBe(5.5)
    expect(parseAssTimeToSeconds('1:20:10.00')).toBe(4810)
  })

  it('parses standard SRT formatted content', () => {
    const srtSample = `
1
00:00:01,000 --> 00:00:04,000
Welcome to SidPlayer

2
00:00:05,500 --> 00:00:08,200
<i>Enjoy high-definition playback</i>
`
    const cues = parseSrtOrVtt(srtSample)
    expect(cues).toHaveLength(2)
    expect(cues[0].startTime).toBe(1.0)
    expect(cues[0].endTime).toBe(4.0)
    expect(cues[0].text).toBe('Welcome to SidPlayer')
    expect(cues[1].text).toBe('Enjoy high-definition playback')
  })

  it('parses WebVTT content with inline tags and settings', () => {
    const vttSample = `WEBVTT

00:00:02.000 --> 00:00:05.000 line:0 position:20%
<b>Next-generation media player</b>
`
    const cues = parseSrtOrVtt(vttSample)
    expect(cues).toHaveLength(1)
    expect(cues[0].startTime).toBe(2.0)
    expect(cues[0].endTime).toBe(5.0)
    expect(cues[0].text).toBe('Next-generation media player')
  })

  it('parses ASS / SSA dialogue lines and strips styling override tags', () => {
    const assSample = `[Script Info]
Title: Sample ASS
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,{\\an8\\b1}Top Center Subtitle{\\b0}
Dialogue: 0,0:00:05.50,0:00:09.00,Default,,0,0,0,,Line 1\\NLine 2
`
    const cues = parseAss(assSample)
    expect(cues).toHaveLength(2)
    expect(cues[0].startTime).toBe(1.0)
    expect(cues[0].endTime).toBe(4.0)
    expect(cues[0].text).toBe('Top Center Subtitle')
    expect(cues[1].text).toBe('Line 1\nLine 2')
  })
})
