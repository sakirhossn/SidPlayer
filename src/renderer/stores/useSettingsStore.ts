import { useState, useEffect } from 'react'
import { AppSettings } from '../../shared/types'

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

let currentSettings: AppSettings = DEFAULT_SETTINGS
let settingsListeners: Array<(settings: AppSettings) => void> = []

function notify() {
  settingsListeners.forEach((l) => l({ ...currentSettings }))
}

export async function initSettings(): Promise<void> {
  if (window.electronAPI) {
    try {
      const saved = await window.electronAPI.db.getSettings()
      if (saved) {
        currentSettings = { ...DEFAULT_SETTINGS, ...saved }
        applyTheme(currentSettings.theme)
        notify()
      }
    } catch (err) {
      console.error('Failed to init settings:', err)
    }
  }
}

export function applyTheme(theme: string): void {
  const root = document.documentElement
  root.classList.remove('dark', 'midnight', 'light')
  if (theme === 'midnight') {
    root.classList.add('dark', 'midnight')
  } else if (theme === 'light') {
    root.classList.add('light')
  } else {
    root.classList.add('dark')
  }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  currentSettings = { ...currentSettings, ...updates }
  if (updates.theme) {
    applyTheme(updates.theme)
  }
  notify()

  if (window.electronAPI) {
    try {
      await window.electronAPI.db.updateSettings(updates)
    } catch (err) {
      console.error('Failed to persist settings:', err)
    }
  }
}

export function useSettings(): {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
} {
  const [settings, setSettings] = useState<AppSettings>(currentSettings)

  useEffect(() => {
    settingsListeners.push(setSettings)
    return () => {
      settingsListeners = settingsListeners.filter((l) => l !== setSettings)
    }
  }, [])

  return { settings, updateSettings }
}
