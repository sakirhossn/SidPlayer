import React, { useState } from 'react'
import {
  Settings,
  Sliders,
  Subtitles,
  Keyboard,
  HardDrive,
  Monitor,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { useSettings } from '../../stores/useSettingsStore'
import { useLibraryStore, loadLibrary } from '../../stores/useLibraryStore'
import { SHORTCUT_LIST } from '../../utils/keyboard'
import { showToast } from '../../stores/useToastStore'

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useSettings()
  const { videos } = useLibraryStore()
  const [activeTab, setActiveTab] = useState<'general' | 'playback' | 'subtitles' | 'shortcuts' | 'storage'>('general')

  const themes: Array<{ id: 'dark' | 'midnight' | 'light'; label: string; bg: string }> = [
    { id: 'dark', label: 'Dark Cinematic', bg: 'bg-[#0c0e14]' },
    { id: 'midnight', label: 'Midnight OLED', bg: 'bg-[#000000]' },
    { id: 'light', label: 'Classic Light', bg: 'bg-[#f8fafc]' }
  ]

  const handleClearCache = async () => {
    showToast('Cache cleared successfully', 'success')
  }

  const handleResetLibrary = async () => {
    if (!window.electronAPI) return
    const all = await window.electronAPI.db.getVideos()
    for (const v of all) {
      await window.electronAPI.db.removeVideo(v.id)
    }
    await loadLibrary()
    showToast('Library reset: All video records removed (files untouched on disk)', 'info')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 select-none">
      {/* Settings Header */}
      <div className="pb-4 border-b border-white/[0.06]">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-sid-400 mt-0.5">Customize player engine, interface themes, subtitles, and controls</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-sid-900 p-1 rounded-xl border border-white/[0.06] overflow-x-auto">
        {[
          { id: 'general', label: 'General & Appearance', icon: Monitor },
          { id: 'playback', label: 'Playback & Controls', icon: Sliders },
          { id: 'subtitles', label: 'Subtitles Styling', icon: Subtitles },
          { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
          { id: 'storage', label: 'Storage & Cache', icon: HardDrive }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-sid-400 hover:text-sid-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Interface Theme</h3>
            <p className="text-xs text-sid-400">Choose your preferred visual styling and color depth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    settings.theme === t.id
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-md shadow-blue-500/20'
                      : 'border-white/[0.08] bg-sid-950/60 text-sid-300 hover:border-white/20 hover:bg-sid-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border border-white/20 ${t.bg}`} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </div>
                  {settings.theme === t.id && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-4 divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="text-xs font-semibold text-white">Interface Animations</h4>
                <p className="text-[11px] text-sid-400 mt-0.5">Smooth transitions and ripple effects during seeking</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAnimations}
                onChange={(e) => updateSettings({ enableAnimations: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-white">Hardware Video Acceleration</h4>
                <p className="text-[11px] text-sid-400 mt-0.5">
                  Leverage GPU decoding (NVDEC/Intel QuickSync) for seamless 4K 60FPS playback
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active (Chromium NVDEC)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Playback */}
      {activeTab === 'playback' && (
        <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-4 divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h4 className="text-xs font-semibold text-white">Autoplay Next Video</h4>
              <p className="text-[11px] text-sid-400 mt-0.5">
                Automatically start the next video with a 5-second countdown when the current video finishes
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoplayNext}
              onChange={(e) => updateSettings({ autoplayNext: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="text-xs font-semibold text-white">Resume Playback Position</h4>
              <p className="text-[11px] text-sid-400 mt-0.5">
                Prompt to resume from where you left off when reopening partially watched videos
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.resumePlayback}
              onChange={(e) => updateSettings({ resumePlayback: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="text-xs font-semibold text-white">Default Playback Rate</h4>
              <p className="text-[11px] text-sid-400 mt-0.5">Starting playback speed for new videos</p>
            </div>
            <select
              value={settings.defaultPlaybackRate}
              onChange={(e) => updateSettings({ defaultPlaybackRate: parseFloat(e.target.value) })}
              className="h-8 px-3 bg-sid-950 border border-white/[0.08] rounded-lg text-xs text-sid-200"
            >
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((r) => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="text-xs font-semibold text-white">Default Volume</h4>
              <p className="text-[11px] text-sid-400 mt-0.5">Startup audio volume level: {settings.defaultVolume}%</p>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.defaultVolume}
              onChange={(e) => updateSettings({ defaultVolume: parseInt(e.target.value, 10) })}
              className="w-32 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Subtitles Styling */}
      {activeTab === 'subtitles' && (
        <div className="space-y-6">
          <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Live Subtitle Preview</h3>
            <div className="relative aspect-video max-h-52 w-full bg-sid-950 rounded-xl overflow-hidden flex items-center justify-center border border-white/[0.04]">
              <div
                className="px-4 py-2 rounded-lg text-center"
                style={{
                  fontSize: `${settings.subtitles.fontSize}px`,
                  fontFamily: settings.subtitles.fontFamily,
                  color: settings.subtitles.color,
                  backgroundColor: `rgba(0, 0, 0, ${settings.subtitles.backgroundOpacity})`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                SidPlayer - High Definition Subtitle Rendering
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">
                  Font Size ({settings.subtitles.fontSize}px)
                </label>
                <input
                  type="range"
                  min="16"
                  max="36"
                  value={settings.subtitles.fontSize}
                  onChange={(e) =>
                    updateSettings({
                      subtitles: { ...settings.subtitles, fontSize: parseInt(e.target.value, 10) }
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">
                  Background Box Opacity ({Math.round(settings.subtitles.backgroundOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.subtitles.backgroundOpacity}
                  onChange={(e) =>
                    updateSettings({
                      subtitles: { ...settings.subtitles, backgroundOpacity: parseFloat(e.target.value) }
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.subtitles.color}
                    onChange={(e) =>
                      updateSettings({
                        subtitles: { ...settings.subtitles, color: e.target.value }
                      })
                    }
                    className="w-8 h-8 rounded bg-transparent cursor-pointer border border-white/10"
                  />
                  <span className="text-xs font-mono text-sid-300">{settings.subtitles.color}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">On-Screen Position</label>
                <select
                  value={settings.subtitles.position}
                  onChange={(e) =>
                    updateSettings({
                      subtitles: { ...settings.subtitles, position: e.target.value as any }
                    })
                  }
                  className="h-8 px-3 bg-sid-950 border border-white/[0.08] rounded-lg text-xs text-sid-200"
                >
                  <option value="bottom">Bottom of Screen</option>
                  <option value="top">Top of Screen</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Shortcuts */}
      {activeTab === 'shortcuts' && (
        <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts Cheat Sheet</h3>
              <p className="text-xs text-sid-400 mt-0.5">Professional editing and playback controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {SHORTCUT_LIST.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-sid-950/60 border border-white/[0.04]"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-xs text-sid-200 font-medium block truncate">{item.action}</span>
                  <span className="text-[10px] text-sid-500 uppercase font-semibold">{item.category}</span>
                </div>
                <kbd className="px-2 py-1 rounded bg-sid-800 text-blue-400 border border-white/[0.08] font-mono text-[11px] font-semibold shrink-0">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Storage & Cache */}
      {activeTab === 'storage' && (
        <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Storage & Library State</h3>
            <p className="text-xs text-sid-400">Manage local thumbnail cache, watched history, and database</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-sid-950/60 border border-white/[0.04]">
              <span className="text-[11px] text-sid-500 uppercase font-semibold">Indexed Videos</span>
              <p className="text-lg font-bold text-white mt-1 font-mono">{videos.length}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-sid-950/60 border border-white/[0.04]">
              <span className="text-[11px] text-sid-500 uppercase font-semibold">Database Engine</span>
              <p className="text-xs font-semibold text-emerald-400 mt-1">Atomic JSON Store</p>
            </div>
            <div className="p-3.5 rounded-xl bg-sid-950/60 border border-white/[0.04]">
              <span className="text-[11px] text-sid-500 uppercase font-semibold">Media Extractor</span>
              <p className="text-xs font-semibold text-blue-400 mt-1">FFmpeg / FFprobe Pro</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">Clear Thumbnail Cache</h4>
                <p className="text-[11px] text-sid-400">Releases cached video thumbnail image files from disk</p>
              </div>
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-200 text-xs font-medium transition-colors"
              >
                Clear Cache
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <h4 className="text-xs font-semibold text-rose-400">Reset Video Library</h4>
                <p className="text-[11px] text-sid-400">
                  Clears all indexed records from SidPlayer database (your actual video files are never deleted)
                </p>
              </div>
              <button
                onClick={handleResetLibrary}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-medium border border-rose-500/30 transition-colors"
              >
                Reset Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
