import React from 'react'
import { Search, LayoutGrid, List, ArrowDownAZ, AlertCircle, X } from 'lucide-react'
import {
  useLibraryStore,
  setSearchQuery,
  setSortOption,
  setFilterOption,
  setViewMode,
  SortOption,
  FilterOption
} from '../../stores/useLibraryStore'

export const FilterBar: React.FC = () => {
  const { searchQuery, sortOption, filterOption, viewMode, videos } = useLibraryStore()
  const missingCount = videos.filter((v) => v.isMissing).length

  const filterTabs: Array<{ id: FilterOption; label: string }> = [
    { id: 'all', label: 'All Videos' },
    { id: 'unwatched', label: 'Unwatched' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'large', label: 'Large Files (>1GB)' }
  ]

  const sortOptions: Array<{ id: SortOption; label: string }> = [
    { id: 'recent', label: 'Recently Added' },
    { id: 'modified', label: 'Date Modified' },
    { id: 'name', label: 'Name (A-Z)' },
    { id: 'duration', label: 'Duration' },
    { id: 'size', label: 'File Size' },
    { id: 'mostWatched', label: 'Most Watched' }
  ]

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-sid-950 border-b border-white/[0.06]">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sid-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, extension, or folder..."
          className="w-full h-9 pl-9 pr-8 bg-sid-900 border border-white/[0.08] focus:border-blue-500 rounded-lg text-xs text-sid-100 placeholder-sid-500 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sid-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterOption(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterOption === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-sid-900 text-sid-400 hover:text-sid-200 border border-white/[0.06] hover:bg-sid-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Controls: Sort & View Mode */}
      <div className="flex items-center gap-2">
        {/* Missing Files warning banner */}
        {missingCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{missingCount} missing</span>
          </div>
        )}

        {/* Sort Select */}
        <div className="relative flex items-center">
          <ArrowDownAZ className="w-3.5 h-3.5 text-sid-400 absolute left-2.5 pointer-events-none" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="h-8 pl-8 pr-6 bg-sid-900 border border-white/[0.08] hover:border-white/20 rounded-lg text-xs text-sid-300 focus:outline-none cursor-pointer appearance-none"
          >
            {sortOptions.map((s) => (
              <option key={s.id} value={s.id} className="bg-sid-900 text-sid-200">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-sid-900 p-0.5 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-sid-800 text-blue-400' : 'text-sid-500 hover:text-sid-300'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-sid-800 text-blue-400' : 'text-sid-500 hover:text-sid-300'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
