import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { VideoItem, Playlist, WatchHistoryItem, AppSettings } from '../shared/types'

interface StoreSchema {
  videos: Record<string, VideoItem>
  playlists: Playlist[]
  history: WatchHistoryItem[]
  settings: AppSettings
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoplayNext: true,
  resumePlayback: true,
  defaultVolume: 80,
  defaultPlaybackRate: 1.0,
  skipBackwardSeconds: 5,
  skipForwardSeconds: 5,
  hardwareAcceleration: true,
  enableAnimations: true,
  compactMode: false,
  subtitles: {
    fontSize: 22,
    fontFamily: 'Segoe UI, Inter, sans-serif',
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.6,
    position: 'bottom',
    defaultDelay: 0
  },
  watchedFolders: [],
  autoScanWatchedFolders: true
}

export class AppStore {
  private filePath: string
  private data: StoreSchema
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'sidplayer_data.json')
    this.data = this.load()
  }

  private load(): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          videos: parsed.videos || {},
          playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
        }
      }
    } catch (err) {
      console.error('Failed to load store, initializing defaults:', err)
    }

    return {
      videos: {},
      playlists: [],
      history: [],
      settings: DEFAULT_SETTINGS
    }
  }

  public saveImmediate(): void {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const tempPath = `${this.filePath}.tmp`
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8')
      fs.renameSync(tempPath, this.filePath)
    } catch (err) {
      console.error('Failed to save store to disk:', err)
    }
  }

  public saveDebounced(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate()
      this.saveTimeout = null
    }, 500)
  }

  // --- Videos ---
  public getVideos(): VideoItem[] {
    return Object.values(this.data.videos)
  }

  public getVideo(id: string): VideoItem | undefined {
    return this.data.videos[id]
  }

  public upsertVideo(video: VideoItem): void {
    this.data.videos[video.id] = video
    this.saveDebounced()
  }

  public upsertVideos(videos: VideoItem[]): void {
    for (const v of videos) {
      // If video exists, preserve custom flags like isFavorite, resumePosition, playCount
      const existing = this.data.videos[v.id]
      if (existing) {
        this.data.videos[v.id] = {
          ...v,
          isFavorite: existing.isFavorite,
          resumePosition: existing.resumePosition || v.resumePosition,
          lastPlayed: existing.lastPlayed || v.lastPlayed,
          playCount: existing.playCount || v.playCount,
          completed: existing.completed || v.completed
        }
      } else {
        this.data.videos[v.id] = v
      }
    }
    this.saveDebounced()
  }

  public removeVideo(id: string): boolean {
    if (this.data.videos[id]) {
      delete this.data.videos[id]
      // Also remove from playlists
      for (const p of this.data.playlists) {
        p.videoIds = p.videoIds.filter((vId) => vId !== id)
      }
      this.saveDebounced()
      return true
    }
    return false
  }

  public toggleFavorite(id: string): boolean {
    if (this.data.videos[id]) {
      this.data.videos[id].isFavorite = !this.data.videos[id].isFavorite
      this.saveDebounced()
      return this.data.videos[id].isFavorite
    }
    return false
  }

  public updateResumePosition(id: string, position: number, completed = false): void {
    if (this.data.videos[id]) {
      this.data.videos[id].resumePosition = position
      this.data.videos[id].lastPlayed = Date.now()
      this.data.videos[id].completed = completed
      if (completed) {
        this.data.videos[id].playCount = (this.data.videos[id].playCount || 0) + 1
      }
      this.saveDebounced()
    }
  }

  public checkMissingFiles(): void {
    for (const video of Object.values(this.data.videos)) {
      video.isMissing = !fs.existsSync(video.path)
    }
    this.saveDebounced()
  }

  public relinkMissingFile(id: string, newPath: string): boolean {
    const video = this.data.videos[id]
    if (video && fs.existsSync(newPath)) {
      const stats = fs.statSync(newPath)
      video.path = newPath
      video.filename = path.basename(newPath)
      video.title = path.parse(newPath).name
      video.size = stats.size
      video.folder = path.dirname(newPath)
      video.isMissing = false
      this.saveDebounced()
      return true
    }
    return false
  }

  // --- History ---
  public getHistory(): WatchHistoryItem[] {
    return this.data.history
  }

  public addToHistory(item: WatchHistoryItem): void {
    // Remove duplicate entry for same video
    this.data.history = this.data.history.filter((h) => h.videoId !== item.videoId)
    this.data.history.unshift(item)
    // Keep max 200 items
    if (this.data.history.length > 200) {
      this.data.history = this.data.history.slice(0, 200)
    }
    this.saveDebounced()
  }

  public clearHistory(): void {
    this.data.history = []
    this.saveDebounced()
  }

  // --- Playlists ---
  public getPlaylists(): Playlist[] {
    return this.data.playlists
  }

  public createPlaylist(name: string, description?: string): Playlist {
    const playlist: Playlist = {
      id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name,
      description,
      videoIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    this.data.playlists.push(playlist)
    this.saveDebounced()
    return playlist
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const pl = this.data.playlists.find((p) => p.id === id)
    if (pl) {
      Object.assign(pl, updates, { updatedAt: Date.now() })
      this.saveDebounced()
      return pl
    }
    return null
  }

  public deletePlaylist(id: string): boolean {
    const initialLen = this.data.playlists.length
    this.data.playlists = this.data.playlists.filter((p) => p.id !== id)
    if (this.data.playlists.length !== initialLen) {
      this.saveDebounced()
      return true
    }
    return false
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return this.data.settings
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...settings }
    this.saveDebounced()
    return this.data.settings
  }
}

export const store = new AppStore()
