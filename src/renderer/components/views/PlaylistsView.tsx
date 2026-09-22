import React, { useState } from 'react'
import { ListMusic, Plus, Play, Shuffle, Trash2, ArrowLeft, Film } from 'lucide-react'
import {
  useLibraryStore,
  createPlaylist,
  deletePlaylist,
  removeVideoFromPlaylist,
  setActiveTab
} from '../../stores/useLibraryStore'
import { playVideo } from '../../stores/usePlayerStore'
import { formatDate, formatDuration } from '../../utils/formatters'

export const PlaylistsView: React.FC = () => {
  const { playlists, videos, selectedPlaylistId } = useLibraryStore()
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDesc, setPlaylistDesc] = useState('')

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playlistName.trim()) return
    const pl = await createPlaylist(playlistName.trim(), playlistDesc.trim())
    setPlaylistName('')
    setPlaylistDesc('')
    setNewModalOpen(false)
    if (pl) {
      setActiveTab('playlists', pl.id)
    }
  }

  // If a playlist is selected, show details
  if (activePlaylist) {
    const playlistVideos = activePlaylist.videoIds
      .map((id) => videos.find((v) => v.id === id))
      .filter((v): v is NonNullable<typeof v> => v !== undefined)

    const totalDuration = playlistVideos.reduce((acc, v) => acc + v.duration, 0)

    const handlePlayAll = (shuffle = false) => {
      if (playlistVideos.length === 0) return
      let q = [...playlistVideos]
      if (shuffle) {
        q = q.sort(() => Math.random() - 0.5)
      }
      playVideo(q[0], q, 0)
    }

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('playlists', null)}
              className="p-2 rounded-xl bg-sid-900 hover:bg-sid-850 text-sid-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-blue-400" />
                <h1 className="text-xl font-bold text-white">{activePlaylist.name}</h1>
              </div>
              {activePlaylist.description && (
                <p className="text-xs text-sid-400 mt-0.5">{activePlaylist.description}</p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-sid-500 mt-1 font-mono">
                <span>{playlistVideos.length} videos</span>
                <span>•</span>
                <span>{formatDuration(totalDuration)} total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayAll(false)}
              disabled={playlistVideos.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play All</span>
            </button>
            <button
              onClick={() => handlePlayAll(true)}
              disabled={playlistVideos.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sid-900 hover:bg-sid-850 disabled:opacity-40 text-sid-300 hover:text-white border border-white/[0.08] font-medium text-xs transition-colors cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-cyan-400" />
              <span>Shuffle</span>
            </button>
            <button
              onClick={() => deletePlaylist(activePlaylist.id)}
              className="p-2 rounded-xl bg-sid-900 hover:bg-rose-600/20 text-sid-400 hover:text-rose-400 border border-white/[0.08] transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video List */}
        {playlistVideos.length > 0 ? (
          <div className="bg-sid-900/60 border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
            {playlistVideos.map((video, idx) => (
              <div
                key={video.id}
                onClick={() => playVideo(video, playlistVideos, idx)}
                className="group flex items-center justify-between p-3 hover:bg-sid-850 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-sid-500 w-6 text-right">{idx + 1}</span>
                  <div className="w-16 aspect-video rounded bg-sid-950 overflow-hidden shrink-0 flex items-center justify-center">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-4 h-4 text-sid-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-sid-200 group-hover:text-blue-400 truncate">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-sid-500 truncate mt-0.5">{video.folder}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-sid-400 shrink-0">
                  <span>{formatDuration(video.duration)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeVideoFromPlaylist(activePlaylist.id, video.id)
                    }}
                    className="p-1 rounded text-sid-500 hover:text-rose-400"
                    title="Remove from Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sid-500">
            <Film className="w-12 h-12 mx-auto mb-3 text-sid-600" />
            <p className="text-xs">No videos in this playlist yet.</p>
            <p className="text-[11px] text-sid-600 mt-1">
              Add videos from the Videos page using the more menu on any video card.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Playlist Overview List
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold text-white">Playlists</h1>
          <p className="text-xs text-sid-400 mt-0.5">Organize and queue your favorite media collections</p>
        </div>
        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActiveTab('playlists', pl.id)}
              className="group bg-sid-900 border border-white/[0.06] hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 flex flex-col justify-between h-40"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-sid-500 font-mono">{pl.videoIds.length} videos</span>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                  {pl.name}
                </h3>
                {pl.description && (
                  <p className="text-xs text-sid-500 line-clamp-2 mt-1">{pl.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] text-sid-500">
                <span>Updated {formatDate(pl.updatedAt)}</span>
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">View →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-sid-500">
          <ListMusic className="w-12 h-12 mx-auto mb-3 text-sid-600" />
          <h3 className="text-sm font-semibold text-sid-300 mb-1">No playlists yet</h3>
          <p className="text-xs max-w-sm mx-auto mb-4">
            Create a custom playlist to group your series, movies, or workout videos together.
          </p>
          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
          >
            Create your first playlist
          </button>
        </div>
      )}

      {/* New Playlist Modal */}
      {newModalOpen && (
        <div
          onClick={() => setNewModalOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-sid-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-xs text-sid-300 animate-scale-in"
          >
            <h3 className="text-base font-semibold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="e.g., Sci-Fi Favorites, Chill Beats..."
                  className="w-full h-9 px-3 bg-sid-950 border border-white/[0.08] focus:border-blue-500 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sid-400 mb-1">Description (Optional)</label>
                <textarea
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  placeholder="What is this playlist about?"
                  rows={3}
                  className="w-full p-3 bg-sid-950 border border-white/[0.08] focus:border-blue-500 rounded-lg text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-sid-800 hover:bg-sid-700 text-sid-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
