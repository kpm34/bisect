'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Loader2,
  Plus,
  Grid3X3,
  List,
  Search,
  Download,
  Trash2,
  Copy,
  MoreHorizontal,
  PenTool,
  Calendar,
  Tag,
  Video,
  Film,
  Clock
} from 'lucide-react';
import type { Asset, AssetType } from '@/lib/services/supabase/types';

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'created' | 'name';
type AssetTab = 'svg' | 'video';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<AssetTab>('svg');

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      try {
        const { getAssetsByType } = await import('@/lib/services/supabase/assets');
        const data = await getAssetsByType(activeTab as AssetType);
        setAssets(data);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load assets');
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, [activeTab]);

  // Filter and sort assets
  const filteredAssets = assets
    .filter(a => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(query) ||
               a.tags?.some(t => t.toLowerCase().includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      }
    });

  const toggleSelect = (id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedAssets.size === 0) return;
    if (!confirm(`Delete ${selectedAssets.size} asset(s)?`)) return;

    try {
      const { deleteAsset } = await import('@/lib/services/supabase/assets');
      await Promise.all([...selectedAssets].map(id => deleteAsset(id)));
      setAssets(prev => prev.filter(a => !selectedAssets.has(a.id)));
      setSelectedAssets(new Set());
    } catch (err) {
      console.error('Failed to delete assets:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAssetIcon = () => {
    return activeTab === 'video' ? Video : PenTool;
  };

  const AssetIcon = getAssetIcon();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ash-grey-900">Asset Library</h1>
          <p className="text-ash-grey-500 mt-1">
            {activeTab === 'svg' ? 'SVG vectors created in Vector Studio' : 'Video projects from Video Studio'}
          </p>
        </div>
        <a
          href={activeTab === 'svg' ? '/studio/svg-canvas' : '/studio/video-studio'}
          className="flex items-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'svg' ? 'Create New SVG' : 'Create New Video'}
        </a>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-ash-grey-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => {
            setActiveTab('svg');
            setSelectedAssets(new Set());
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'svg'
              ? 'bg-white text-ash-grey-900 shadow-sm'
              : 'text-ash-grey-600 hover:text-ash-grey-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Vectors
        </button>
        <button
          onClick={() => {
            setActiveTab('video');
            setSelectedAssets(new Set());
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'bg-white text-ash-grey-900 shadow-sm'
              : 'text-ash-grey-600 hover:text-ash-grey-900'
          }`}
        >
          <Video className="w-4 h-4" />
          Videos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${activeTab === 'video' ? 'bg-orange-100' : 'bg-indigo-100'}`}>
              <AssetIcon className={`w-5 h-5 ${activeTab === 'video' ? 'text-orange-600' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ash-grey-900">{assets.length}</p>
              <p className="text-sm text-ash-grey-500">Total {activeTab === 'svg' ? 'SVGs' : 'Videos'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ash-grey-900">
                {assets.filter(a => {
                  const date = new Date(a.created_at || 0);
                  const week = new Date();
                  week.setDate(week.getDate() - 7);
                  return date > week;
                }).length}
              </p>
              <p className="text-sm text-ash-grey-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ash-grey-900">
                {new Set(assets.flatMap(a => a.tags || [])).size}
              </p>
              <p className="text-sm text-ash-grey-500">Unique Tags</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-grey-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ash-grey-50 border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
            />
          </div>

          {/* Bulk Actions */}
          {selectedAssets.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ash-grey-500">
                {selectedAssets.size} selected
              </span>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-ash-grey-600 hover:bg-ash-grey-50 rounded-lg transition-colors"
                title="Download selected"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-white border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Date Created</option>
            <option value="name">Name</option>
          </select>

          {/* View Mode */}
          <div className="flex rounded-lg border border-ash-grey-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-ash-grey-100' : 'hover:bg-ash-grey-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-ash-grey-100' : 'hover:bg-ash-grey-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid/List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-ash-grey-400 mx-auto mb-3 animate-spin" />
          <p className="text-ash-grey-500">Loading assets...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredAssets.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`group bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
                  selectedAssets.has(asset.id)
                    ? 'border-cta-orange ring-2 ring-cta-orange/20'
                    : 'border-ash-grey-200 hover:border-ash-grey-300 hover:shadow-md'
                }`}
                onClick={() => toggleSelect(asset.id)}
              >
                {/* Preview */}
                <div className="aspect-square bg-ash-grey-50 p-4 flex items-center justify-center relative">
                  {asset.thumbnail_path ? (
                    <img
                      src={asset.thumbnail_path}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <AssetIcon className="w-12 h-12 text-ash-grey-300" />
                  )}

                  {/* Video Duration Badge */}
                  {activeTab === 'video' && asset.data && (asset.data as { duration?: number }).duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration((asset.data as { duration: number }).duration)}
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedAssets.has(asset.id)
                      ? 'bg-cta-orange border-cta-orange'
                      : 'bg-white border-ash-grey-300 opacity-0 group-hover:opacity-100'
                  }`}>
                    {selectedAssets.has(asset.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open context menu
                      }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-ash-grey-50"
                    >
                      <MoreHorizontal className="w-4 h-4 text-ash-grey-600" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-ash-grey-900 truncate text-sm">{asset.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-ash-grey-500">
                      {new Date(asset.updated_at || asset.created_at || Date.now()).toLocaleDateString()}
                    </p>
                    {activeTab === 'video' && asset.data && (asset.data as { clipCount?: number }).clipCount && (
                      <>
                        <span className="text-ash-grey-300">•</span>
                        <p className="text-xs text-ash-grey-500 flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {(asset.data as { clipCount: number }).clipCount} clips
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-ash-grey-200 divide-y divide-ash-grey-100">
            {/* Select All Header */}
            <div className="flex items-center gap-4 p-3 bg-ash-grey-50">
              <input
                type="checkbox"
                checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-ash-grey-300 text-cta-orange focus:ring-cta-orange"
              />
              <span className="text-sm text-ash-grey-500">Name</span>
              {activeTab === 'video' && <span className="text-sm text-ash-grey-500">Duration</span>}
              <span className="text-sm text-ash-grey-500 ml-auto">Updated</span>
            </div>
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`flex items-center gap-4 p-3 hover:bg-ash-grey-50 transition-colors cursor-pointer ${
                  selectedAssets.has(asset.id) ? 'bg-cta-orange/5' : ''
                }`}
                onClick={() => toggleSelect(asset.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedAssets.has(asset.id)}
                  onChange={() => toggleSelect(asset.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-ash-grey-300 text-cta-orange focus:ring-cta-orange"
                />
                <div className="w-10 h-10 bg-ash-grey-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  {asset.thumbnail_path ? (
                    <img src={asset.thumbnail_path} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <AssetIcon className="w-5 h-5 text-ash-grey-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ash-grey-900 truncate">{asset.name}</h3>
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {asset.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-ash-grey-100 rounded text-xs text-ash-grey-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {activeTab === 'video' && asset.data && (
                  <div className="flex items-center gap-4 text-sm text-ash-grey-500">
                    {(asset.data as { duration?: number }).duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration((asset.data as { duration: number }).duration)}
                      </span>
                    )}
                    {(asset.data as { clipCount?: number }).clipCount && (
                      <span className="flex items-center gap-1">
                        <Film className="w-4 h-4" />
                        {(asset.data as { clipCount: number }).clipCount}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-sm text-ash-grey-500">
                  {new Date(asset.updated_at || Date.now()).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Download
                    }}
                    className="p-1.5 text-ash-grey-400 hover:text-ash-grey-600 hover:bg-ash-grey-100 rounded"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Copy
                    }}
                    className="p-1.5 text-ash-grey-400 hover:text-ash-grey-600 hover:bg-ash-grey-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <Layers className="w-12 h-12 text-ash-grey-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ash-grey-900 mb-1">
            {searchQuery ? 'No matching assets' : `No ${activeTab === 'svg' ? 'SVG' : 'video'} assets yet`}
          </h3>
          <p className="text-ash-grey-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : activeTab === 'svg'
                ? 'Create SVGs in Vector Studio and they will appear here'
                : 'Create videos in Video Studio and save them as assets'}
          </p>
          {!searchQuery && (
            <a
              href={activeTab === 'svg' ? '/studio/svg-canvas' : '/studio/video-studio'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <AssetIcon className="w-4 h-4" />
              Open {activeTab === 'svg' ? 'Vector' : 'Video'} Studio
            </a>
          )}
        </div>
      )}
    </div>
  );
}
