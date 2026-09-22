import React from 'react'
import { FolderSearch, FolderTree, X } from 'lucide-react'
import { useLibraryStore, closeScanModal, startFolderScan } from '../../stores/useLibraryStore'

export const ScanPromptModal: React.FC = () => {
  const { scanModalOpen, pendingScanFolder } = useLibraryStore()

  if (!scanModalOpen || !pendingScanFolder) return null

  return (
    <div
      onClick={closeScanModal}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-sid-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-xs text-sid-300 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FolderSearch className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Scan Video Folder</h3>
          </div>
          <button
            onClick={closeScanModal}
            className="p-1 rounded-lg text-sid-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sid-400 mb-2">Folder selected for indexing:</p>
        <div className="p-2.5 rounded-lg bg-sid-950 font-mono text-[11px] text-sid-300 break-all border border-white/[0.04] mb-6">
          {pendingScanFolder}
        </div>

        <p className="text-xs text-white font-medium mb-4">Would you like to include subfolders?</p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => startFolderScan(true)}
            className="flex items-center justify-between p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FolderTree className="w-4 h-4" />
              <span>Yes, Scan All Subfolders (Recursive)</span>
            </div>
            <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded">Recommended</span>
          </button>

          <button
            onClick={() => startFolderScan(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-sid-800 hover:bg-sid-700 text-sid-200 font-medium transition-colors cursor-pointer"
          >
            <span>No, Top Level Only</span>
          </button>
        </div>
      </div>
    </div>
  )
}
