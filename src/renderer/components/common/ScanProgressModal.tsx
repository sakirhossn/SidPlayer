import React, { useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { useLibraryStore, cancelFolderScan } from '../../stores/useLibraryStore'

export const ScanProgressModal: React.FC = () => {
  const { isScanning, scanProgress } = useLibraryStore()

  useEffect(() => {
    if (window.electronAPI) {
      const unbind = window.electronAPI.scanner.onScanProgress((p) => {
        // Handled via listener in App or main
      })
      return () => {
        unbind?.()
      }
    }
  }, [])

  if (!isScanning || !scanProgress) return null

  const percent =
    scanProgress.total > 0 ? Math.round((scanProgress.current / scanProgress.total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-sid-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-xs text-sid-300 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <h3 className="text-sm font-semibold text-white">Scanning Media Folder...</h3>
          </div>
          <button
            onClick={cancelFolderScan}
            className="p-1 rounded-lg text-sid-400 hover:text-white hover:bg-white/10"
            title="Cancel Scan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sid-400">
              {scanProgress.phase === 'counting'
                ? 'Discovering video files...'
                : `Analyzing ${scanProgress.current} of ${scanProgress.total} files`}
            </span>
            <span className="text-blue-400 font-bold">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-sid-950 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-[11px] text-sid-500 truncate font-mono">
            {scanProgress.currentFile || 'Processing media streams...'}
          </p>
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-white/[0.06]">
          <button
            onClick={cancelFolderScan}
            className="px-4 py-1.5 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
