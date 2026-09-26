import fs from 'fs'
import path from 'path'

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

type FolderChangeCallback = (data: { folder: string; eventType: string; filename: string }) => void

class FolderWatcherManager {
  private watchers = new Map<string, fs.FSWatcher>()
  private changeCallback: FolderChangeCallback | null = null
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  public setCallback(cb: FolderChangeCallback): void {
    this.changeCallback = cb
  }

  public updateFolders(folders: string[]): void {
    const currentFolders = new Set(this.watchers.keys())
    const targetFolders = new Set(folders.filter((f) => f && fs.existsSync(f)))

    // Stop watchers for removed folders
    for (const folder of currentFolders) {
      if (!targetFolders.has(folder)) {
        this.stopWatching(folder)
      }
    }

    // Start watchers for new folders
    for (const folder of targetFolders) {
      if (!this.watchers.has(folder)) {
        this.startWatching(folder)
      }
    }
  }

  private startWatching(folderPath: string): void {
    try {
      if (!fs.existsSync(folderPath)) return

      const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return

        const ext = path.extname(filename).toLowerCase()
        // If file extension is not video and not empty (empty might be directory), ignore
        if (ext && !VIDEO_EXTENSIONS.has(ext)) return

        // Debounce by full path
        const key = `${folderPath}:${filename}`
        if (this.debounceTimers.has(key)) {
          clearTimeout(this.debounceTimers.get(key)!)
        }

        const timer = setTimeout(() => {
          this.debounceTimers.delete(key)
          if (this.changeCallback) {
            this.changeCallback({
              folder: folderPath,
              eventType,
              filename: filename.toString()
            })
          }
        }, 1500)

        this.debounceTimers.set(key, timer)
      })

      watcher.on('error', (err) => {
        console.warn(`Watcher error for folder ${folderPath}:`, err)
        this.stopWatching(folderPath)
      })

      this.watchers.set(folderPath, watcher)
    } catch (err) {
      console.warn(`Failed to watch folder ${folderPath}:`, err)
    }
  }

  private stopWatching(folderPath: string): void {
    const watcher = this.watchers.get(folderPath)
    if (watcher) {
      try {
        watcher.close()
      } catch (e) {
        // Ignore close error
      }
      this.watchers.delete(folderPath)
    }
  }

  public stopAll(): void {
    for (const watcher of this.watchers.values()) {
      try {
        watcher.close()
      } catch (e) {
        // Ignore
      }
    }
    this.watchers.clear()
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
  }
}

export const folderWatcher = new FolderWatcherManager()
