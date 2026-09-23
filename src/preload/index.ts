import { contextBridge, ipcRenderer } from 'electron'
import { VideoItem, Playlist, WatchHistoryItem, AppSettings, ScanProgress, SubtitleTrack, SubtitleCue, PrepareMediaResult, PrepareMediaProgress } from '../shared/types'

export const electronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    setProgressBar: (progress: number) => ipcRenderer.invoke('window-set-progress', progress),
    onMaximizeChange: (callback: (isMax: boolean) => void) => {
      const listener = (_: any, val: boolean) => callback(val)
      ipcRenderer.on('window-maximize-change', listener)
      return () => {
        ipcRenderer.removeListener('window-maximize-change', listener)
      }
    },
    onOpenExternalFile: (callback: (filePath: string) => void) => {
      const listener = (_: any, path: string) => callback(path)
      ipcRenderer.on('open-external-file', listener)
      return () => {
        ipcRenderer.removeListener('open-external-file', listener)
      }
    }
  },
  dialogs: {
    openFileDialog: (): Promise<string[] | null> => ipcRenderer.invoke('dialog-open-file'),
    openFolderDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog-open-folder'),
    openSubtitleDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog-open-subtitle'),
    showItemInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path)
  },
  scanner: {
    scanFolder: (folderPath: string, includeSubfolders: boolean): Promise<VideoItem[]> =>
      ipcRenderer.invoke('scan-folder', folderPath, includeSubfolders),
    cancelScan: () => ipcRenderer.invoke('cancel-scan'),
    onScanProgress: (callback: (progress: ScanProgress) => void) => {
      const listener = (_: any, p: ScanProgress) => callback(p)
      ipcRenderer.on('scan-progress', listener)
      return () => {
        ipcRenderer.removeListener('scan-progress', listener)
      }
    }
  },
  media: {
    processSingleFile: (filePath: string): Promise<VideoItem | null> =>
      ipcRenderer.invoke('process-single-file', filePath),
    saveScreenshot: (dataUrl: string, videoTitle: string) =>
      ipcRenderer.invoke('save-screenshot', dataUrl, videoTitle),
    preparePlayableMedia: (video: VideoItem, forceRemux = false): Promise<PrepareMediaResult> =>
      ipcRenderer.invoke('prepare-playable-media', video, forceRemux),
    cancelTransmux: (videoId: string): Promise<void> =>
      ipcRenderer.invoke('cancel-transmux', videoId),
    onPrepareProgress: (callback: (progress: PrepareMediaProgress) => void) => {
      const listener = (_: any, p: PrepareMediaProgress) => callback(p)
      ipcRenderer.on('prepare-media-progress', listener)
      return () => {
        ipcRenderer.removeListener('prepare-media-progress', listener)
      }
    }
  },
  subtitles: {
    getSiblingSubtitles: (videoPath: string): Promise<SubtitleTrack[]> =>
      ipcRenderer.invoke('get-sibling-subtitles', videoPath),
    parseSubtitle: (subPath: string): Promise<SubtitleCue[]> =>
      ipcRenderer.invoke('parse-subtitle', subPath)
  },
  db: {
    getVideos: (): Promise<VideoItem[]> => ipcRenderer.invoke('db-get-videos'),
    getVideo: (id: string): Promise<VideoItem | undefined> => ipcRenderer.invoke('db-get-video', id),
    removeVideo: (id: string): Promise<boolean> => ipcRenderer.invoke('db-remove-video', id),
    toggleFavorite: (id: string): Promise<boolean> => ipcRenderer.invoke('db-toggle-favorite', id),
    updateResume: (id: string, pos: number, completed = false): Promise<void> =>
      ipcRenderer.invoke('db-update-resume', id, pos, completed),
    relinkFile: (id: string, newPath: string): Promise<boolean> =>
      ipcRenderer.invoke('db-relink-file', id, newPath),
    checkMissing: (): Promise<VideoItem[]> => ipcRenderer.invoke('db-check-missing'),
    getHistory: (): Promise<WatchHistoryItem[]> => ipcRenderer.invoke('db-get-history'),
    addToHistory: (item: WatchHistoryItem): Promise<void> => ipcRenderer.invoke('db-add-history', item),
    clearHistory: (): Promise<void> => ipcRenderer.invoke('db-clear-history'),
    getPlaylists: (): Promise<Playlist[]> => ipcRenderer.invoke('db-get-playlists'),
    createPlaylist: (name: string, desc?: string): Promise<Playlist> =>
      ipcRenderer.invoke('db-create-playlist', name, desc),
    updatePlaylist: (id: string, updates: Partial<Playlist>): Promise<Playlist | null> =>
      ipcRenderer.invoke('db-update-playlist', id, updates),
    deletePlaylist: (id: string): Promise<boolean> => ipcRenderer.invoke('db-delete-playlist', id),
    getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('db-get-settings'),
    updateSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke('db-update-settings', settings)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
