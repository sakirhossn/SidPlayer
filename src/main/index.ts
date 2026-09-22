import { app, BrowserWindow, ipcMain, dialog, shell, protocol, clipboard, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { registerMediaProtocol } from './protocol'
import { store } from './store'
import { scanFolder, cancelScan } from './scanner'
import { probeMedia } from './mediaInfo'
import { generateThumbnail } from './thumbnails'
import { detectSiblingSubtitles, parseSubtitleFile } from './subtitles'
import { VideoItem, Playlist, WatchHistoryItem, AppSettings } from '../shared/types'

// Register privileged scheme before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
])

let mainWindow: BrowserWindow | null = null
let pendingFilePath: string | null = null

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // If another instance is launched (e.g. double-clicked file in Windows Explorer)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()

      const targetFile = extractVideoFromArgv(commandLine)
      if (targetFile) {
        mainWindow.webContents.send('open-external-file', targetFile)
      }
    }
  })
}

function extractVideoFromArgv(argv: string[]): string | null {
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg && !arg.startsWith('--') && !arg.startsWith('-') && fs.existsSync(arg)) {
      const ext = path.extname(arg).toLowerCase()
      if (['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v', '.mpg', '.mpeg', '.wmv', '.flv', '.ts'].includes(ext)) {
        return arg
      }
    }
  }
  return null
}

// Check initial argv for double-clicked file
pendingFilePath = extractVideoFromArgv(process.argv)

function createWindow(): void {
  // Load saved bounds
  const savedSettings = store.getSettings()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    backgroundColor: '#07080b',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // Perform lazy file integrity check
    store.checkMissingFiles()

    if (pendingFilePath) {
      mainWindow?.webContents.send('open-external-file', pendingFilePath)
      pendingFilePath = null
    }
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-change', false)
  })

  // Load URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

app.whenReady().then(() => {
  registerMediaProtocol()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// --- Window IPC ---
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

ipcMain.handle('window-set-progress', (_event, progress: number) => {
  // progress between 0 and 1, or -1 to clear
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setProgressBar(progress)
  }
})

// --- File & Folder Picker IPC ---
ipcMain.handle('dialog-open-file', async () => {
  if (!mainWindow) return null
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Video File',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv', 'ts', 'm2ts']
      },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths
})

ipcMain.handle('dialog-open-folder', async () => {
  if (!mainWindow) return null
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder containing Videos',
    properties: ['openDirectory']
  })

  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
})

ipcMain.handle('dialog-open-subtitle', async () => {
  if (!mainWindow) return null
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Subtitle File',
    properties: ['openFile'],
    filters: [
      { name: 'Subtitles', extensions: ['srt', 'vtt', 'ass', 'ssa'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
})

ipcMain.handle('show-item-in-folder', (_event, filePath: string) => {
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath)
  }
})

// --- Process File directly into a VideoItem ---
ipcMain.handle('process-single-file', async (_event, filePath: string): Promise<VideoItem | null> => {
  try {
    if (!fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    const probe = await probeMedia(filePath)
    const thumb = await generateThumbnail(filePath, probe.duration)
    const subtitles = detectSiblingSubtitles(filePath)

    const id = crypto.createHash('md5').update(filePath).digest('hex')
    const fingerprint = `${stat.size}_${Math.round(probe.duration)}`

    const item: VideoItem = {
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

    store.upsertVideo(item)
    return item
  } catch (err) {
    console.error('Error processing single file:', err)
    return null
  }
})

// --- Folder Scanner IPC ---
ipcMain.handle('scan-folder', async (_event, folderPath: string, includeSubfolders: boolean) => {
  return await scanFolder(folderPath, includeSubfolders, mainWindow)
})

ipcMain.handle('cancel-scan', () => {
  cancelScan()
})

// --- Subtitles IPC ---
ipcMain.handle('get-sibling-subtitles', (_event, videoPath: string) => {
  return detectSiblingSubtitles(videoPath)
})

ipcMain.handle('parse-subtitle', (_event, subPath: string) => {
  return parseSubtitleFile(subPath)
})

// --- Screenshot capture & save ---
ipcMain.handle('save-screenshot', async (_event, dataUrl: string, videoTitle: string) => {
  try {
    const picturesDir = app.getPath('pictures')
    const sidFolder = path.join(picturesDir, 'SidPlayer')
    if (!fs.existsSync(sidFolder)) {
      fs.mkdirSync(sidFolder, { recursive: true })
    }

    const cleanTitle = videoTitle.replace(/[\\/:*?"<>|]/g, '_')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `${cleanTitle}_${timestamp}.png`
    const targetFile = path.join(sidFolder, fileName)

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(targetFile, buffer)

    // Also write to Windows clipboard
    const image = nativeImage.createFromBuffer(buffer)
    clipboard.writeImage(image)

    return { success: true, filePath: targetFile }
  } catch (err: any) {
    console.error('Failed to save screenshot:', err)
    return { success: false, error: err.message }
  }
})

// --- Store IPC ---
ipcMain.handle('db-get-videos', () => store.getVideos())
ipcMain.handle('db-get-video', (_event, id: string) => store.getVideo(id))
ipcMain.handle('db-remove-video', (_event, id: string) => store.removeVideo(id))
ipcMain.handle('db-toggle-favorite', (_event, id: string) => store.toggleFavorite(id))
ipcMain.handle('db-update-resume', (_event, id: string, pos: number, completed = false) => {
  store.updateResumePosition(id, pos, completed)
})
ipcMain.handle('db-relink-file', (_event, id: string, newPath: string) => store.relinkMissingFile(id, newPath))
ipcMain.handle('db-check-missing', () => {
  store.checkMissingFiles()
  return store.getVideos()
})

ipcMain.handle('db-get-history', () => store.getHistory())
ipcMain.handle('db-add-history', (_event, item: WatchHistoryItem) => store.addToHistory(item))
ipcMain.handle('db-clear-history', () => store.clearHistory())

ipcMain.handle('db-get-playlists', () => store.getPlaylists())
ipcMain.handle('db-create-playlist', (_event, name: string, desc?: string) => store.createPlaylist(name, desc))
ipcMain.handle('db-update-playlist', (_event, id: string, updates: Partial<Playlist>) => store.updatePlaylist(id, updates))
ipcMain.handle('db-delete-playlist', (_event, id: string) => store.deletePlaylist(id))

ipcMain.handle('db-get-settings', () => store.getSettings())
ipcMain.handle('db-update-settings', (_event, settings: Partial<AppSettings>) => store.updateSettings(settings))
