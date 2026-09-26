import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import https from 'https'
import { UpdateStatus, UpdateInfo, UpdateProgress } from '../shared/types'

let updateStatus: UpdateStatus = {
  status: 'idle',
  currentVersion: app.getVersion()
}

let targetWindow: BrowserWindow | null = null

function sendStatusToRenderer(status: UpdateStatus) {
  updateStatus = status
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('updater-status-changed', updateStatus)
  }
}

/**
 * Fallback direct release check against GitHub Releases API
 */
async function fetchLatestGitHubRelease(): Promise<{ version: string; releaseNotes: string; downloadUrl: string; publishedAt: string } | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/sakirhossn/SidPlayer/releases/latest',
      headers: {
        'User-Agent': 'SidPlayer-Desktop-App'
      },
      timeout: 8000
    }

    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data)
            const tagName = parsed.tag_name || ''
            const version = tagName.replace(/^v/, '')
            const downloadUrl = parsed.html_url || 'https://github.com/sakirhossn/SidPlayer/releases'
            resolve({
              version,
              releaseNotes: parsed.body || 'No release notes provided.',
              downloadUrl,
              publishedAt: parsed.published_at
            })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })

    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

function compareSemver(current: string, latest: string): boolean {
  // Returns true if latest > current
  const cParts = current.replace(/^v/, '').split('.').map((p) => parseInt(p, 10) || 0)
  const lParts = latest.replace(/^v/, '').split('.').map((p) => parseInt(p, 10) || 0)

  for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
    const c = cParts[i] || 0
    const l = lParts[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  targetWindow = mainWindow
  updateStatus.currentVersion = app.getVersion()

  // Configure autoUpdater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    sendStatusToRenderer({
      status: 'checking',
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('update-available', (info) => {
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      downloadUrl: `https://github.com/sakirhossn/SidPlayer/releases/tag/v${info.version}`
    }

    sendStatusToRenderer({
      status: 'available',
      currentVersion: app.getVersion(),
      updateInfo
    })
  })

  autoUpdater.on('update-not-available', () => {
    sendStatusToRenderer({
      status: 'not-available',
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('download-progress', (prog) => {
    const progress: UpdateProgress = {
      percent: Math.round(prog.percent * 10) / 10,
      bytesPerSecond: prog.bytesPerSecond,
      transferred: prog.transferred,
      total: prog.total
    }

    sendStatusToRenderer({
      status: 'downloading',
      currentVersion: app.getVersion(),
      updateInfo: updateStatus.updateInfo,
      progress
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendStatusToRenderer({
      status: 'downloaded',
      currentVersion: app.getVersion(),
      updateInfo: {
        version: info.version,
        releaseDate: info.releaseDate
      }
    })
  })

  autoUpdater.on('error', async (err) => {
    console.warn('electron-updater error or unpackaged environment:', err?.message || err)
    
    // In dev / unpackaged mode or fallback, check GitHub API directly
    const ghRelease = await fetchLatestGitHubRelease()
    if (ghRelease && compareSemver(app.getVersion(), ghRelease.version)) {
      sendStatusToRenderer({
        status: 'available',
        currentVersion: app.getVersion(),
        updateInfo: {
          version: ghRelease.version,
          releaseDate: ghRelease.publishedAt,
          releaseNotes: ghRelease.releaseNotes,
          downloadUrl: ghRelease.downloadUrl
        }
      })
    } else {
      sendStatusToRenderer({
        status: 'not-available',
        currentVersion: app.getVersion(),
        error: err?.message
      })
    }
  })

  // Register IPC handlers
  ipcMain.handle('updater-check-for-updates', async () => {
    sendStatusToRenderer({
      status: 'checking',
      currentVersion: app.getVersion()
    })

    if (!app.isPackaged) {
      // In dev mode, test via GitHub Releases API directly
      const ghRelease = await fetchLatestGitHubRelease()
      if (ghRelease && compareSemver(app.getVersion(), ghRelease.version)) {
        sendStatusToRenderer({
          status: 'available',
          currentVersion: app.getVersion(),
          updateInfo: {
            version: ghRelease.version,
            releaseDate: ghRelease.publishedAt,
            releaseNotes: ghRelease.releaseNotes,
            downloadUrl: ghRelease.downloadUrl
          }
        })
      } else {
        sendStatusToRenderer({
          status: 'not-available',
          currentVersion: app.getVersion()
        })
      }
      return updateStatus
    }

    try {
      await autoUpdater.checkForUpdates()
    } catch (err: any) {
      // Fallback to GitHub API
      const ghRelease = await fetchLatestGitHubRelease()
      if (ghRelease && compareSemver(app.getVersion(), ghRelease.version)) {
        sendStatusToRenderer({
          status: 'available',
          currentVersion: app.getVersion(),
          updateInfo: {
            version: ghRelease.version,
            releaseDate: ghRelease.publishedAt,
            releaseNotes: ghRelease.releaseNotes,
            downloadUrl: ghRelease.downloadUrl
          }
        })
      } else {
        sendStatusToRenderer({
          status: 'error',
          currentVersion: app.getVersion(),
          error: err.message
        })
      }
    }
    return updateStatus
  })

  ipcMain.handle('updater-download-update', async () => {
    if (!app.isPackaged) {
      if (updateStatus.updateInfo?.downloadUrl) {
        shell.openExternal(updateStatus.updateInfo.downloadUrl)
      }
      return { success: true, openedBrowser: true }
    }

    try {
      sendStatusToRenderer({
        status: 'downloading',
        currentVersion: app.getVersion(),
        updateInfo: updateStatus.updateInfo
      })
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err: any) {
      if (updateStatus.updateInfo?.downloadUrl) {
        shell.openExternal(updateStatus.updateInfo.downloadUrl)
      }
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('updater-quit-and-install', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  ipcMain.handle('updater-get-status', () => {
    return updateStatus
  })
}
