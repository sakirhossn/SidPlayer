import React from 'react'
import { Play, X, Heart, Shield, Cpu, ExternalLink } from 'lucide-react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-sid-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-xs text-sid-300 animate-scale-in"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SidPlayer Desktop</h3>
              <span className="text-[10px] text-blue-400 font-mono font-medium">Version 1.0.0 Production</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sid-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sid-400 leading-relaxed mb-4">
          SidPlayer is a modern, high-performance local video player built for Windows desktops and laptops. Engineered with hardware acceleration, byte-range streaming, frame-accurate stepping, automated subtitle detection, and library intelligence.
        </p>

        <div className="space-y-2.5 bg-sid-950/60 p-3.5 rounded-xl border border-white/[0.04] mb-4">
          <div className="flex items-center gap-2 text-sid-300">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
            <span>NVDEC / Intel QuickSync hardware-accelerated playback</span>
          </div>
          <div className="flex items-center gap-2 text-sid-300">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Offline-first: zero cloud dependence, privacy-preserving</span>
          </div>
          <div className="flex items-center gap-2 text-sid-300">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Crafted with Electron, React, TypeScript, Tailwind & FFmpeg</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-sid-500">
          <span>© 2026 SidPlayer Team. MIT License.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
