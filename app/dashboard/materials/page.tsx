'use client';

import React, { useEffect, useState } from 'react';
import {
  Palette,
  Loader2,
  Search,
  Grid3X3,
  List,
  Star,
  Heart,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  Circle
} from 'lucide-react';
import type { MaterialCategory, MaterialPreset } from '@/lib/services/supabase/types';

type ViewMode = 'grid' | 'list';

// Material preview card component
function MaterialCard({
  preset,
  category,
  onSelect
}: {
  preset: MaterialPreset;
  category?: MaterialCategory;
  onSelect: (preset: MaterialPreset) => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div
      className="group bg-white rounded-xl border border-ash-grey-200 overflow-hidden hover:border-ash-grey-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(preset)}
    >
      {/* Preview */}
      <div className="aspect-square relative">
        {preset.preview_url ? (
          <img
            src={preset.preview_url}
            alt={preset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: preset.color }}
          >
            <Circle
              className="w-16 h-16 text-white/30"
              style={{
                filter: `drop-shadow(0 2px 8px ${preset.color}40)`,
              }}
            />
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={`p-2 rounded-full transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-ash-grey-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Copy material settings
              navigator.clipboard.writeText(JSON.stringify({
                color: preset.color,
                roughness: preset.roughness,
                metalness: preset.metalness,
                clearcoat: preset.clearcoat,
              }));
            }}
            className="p-2 rounded-full bg-white/90 text-ash-grey-600 hover:bg-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Badge */}
        {preset.tab && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              preset.tab === 'finishes' ? 'bg-blue-100 text-blue-700' :
              preset.tab === 'tints' ? 'bg-purple-100 text-purple-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {preset.tab}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-ash-grey-900 truncate text-sm">{preset.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-3 h-3 rounded-full border border-ash-grey-200"
            style={{ backgroundColor: preset.color }}
          />
          <span className="text-xs text-ash-grey-500">
            R: {preset.roughness.toFixed(2)} · M: {preset.metalness.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [presets, setPresets] = useState<MaterialPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<MaterialPreset | null>(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const { getCategories, getPresetsByCategory } = await import('@/lib/services/supabase/materials');
        const cats = await getCategories();
        setCategories(cats);

        // Fetch presets for all categories
        const allPresets: MaterialPreset[] = [];
        for (const cat of cats) {
          const catPresets = await getPresetsByCategory(cat.id);
          allPresets.push(...catPresets);
        }
        setPresets(allPresets);

        if (cats.length > 0) {
          setSelectedCategory(cats[0].slug);
        }
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  // Get current category
  const currentCategory = categories.find(c => c.slug === selectedCategory);

  // Filter presets
  const filteredPresets = presets.filter(p => {
    // Category filter
    const cat = categories.find(c => c.id === p.category_id);
    if (selectedCategory && cat?.slug !== selectedCategory) return false;

    // Tab filter (for tabbed categories)
    if (selectedTab && p.tab !== selectedTab) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) ||
             p.slug.toLowerCase().includes(query);
    }

    return true;
  });

  // Get available tabs for current category
  const availableTabs = currentCategory?.display_mode === 'tabs'
    ? ['finishes', 'tints', 'aged']
    : null;

  // Stats
  const totalMaterials = presets.length;
  const categoryCount = categories.length;

  const handleSelectPreset = (preset: MaterialPreset) => {
    setSelectedPreset(preset);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ash-grey-900">Material Library</h1>
          <p className="text-ash-grey-500 mt-1">
            {totalMaterials}+ PBR materials across {categoryCount} categories
          </p>
        </div>
        <a
          href="/studio/3d-canvas"
          className="flex items-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open 3D Editor
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {categories.slice(0, 4).map((cat) => {
          const count = presets.filter(p => p.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSelectedTab(null);
              }}
              className={`bg-white rounded-xl border p-4 text-left transition-all ${
                selectedCategory === cat.slug
                  ? 'border-cta-orange ring-2 ring-cta-orange/20'
                  : 'border-ash-grey-200 hover:border-ash-grey-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedCategory === cat.slug ? 'bg-cta-orange/10' : 'bg-ash-grey-100'
                }`}>
                  <Sparkles className={`w-5 h-5 ${
                    selectedCategory === cat.slug ? 'text-cta-orange' : 'text-ash-grey-500'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-ash-grey-900">{cat.name}</p>
                  <p className="text-sm text-ash-grey-500">{count} materials</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* More Categories */}
      {categories.length > 4 && (
        <div className="flex flex-wrap gap-2">
          {categories.slice(4).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSelectedTab(null);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-cta-orange text-white'
                  : 'bg-ash-grey-100 text-ash-grey-600 hover:bg-ash-grey-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs for tabbed categories */}
      {availableTabs && (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTab === null
                ? 'bg-ash-grey-900 text-white'
                : 'bg-white border border-ash-grey-200 text-ash-grey-600 hover:bg-ash-grey-50'
            }`}
          >
            All
          </button>
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                selectedTab === tab
                  ? tab === 'finishes' ? 'bg-blue-600 text-white' :
                    tab === 'tints' ? 'bg-purple-600 text-white' :
                    'bg-amber-600 text-white'
                  : 'bg-white border border-ash-grey-200 text-ash-grey-600 hover:bg-ash-grey-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Search & View Controls */}
      <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-grey-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ash-grey-50 border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
            />
          </div>

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

      {/* Materials Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-ash-grey-400 mx-auto mb-3 animate-spin" />
          <p className="text-ash-grey-500">Loading materials...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredPresets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredPresets.map((preset) => (
            <MaterialCard
              key={preset.id}
              preset={preset}
              category={categories.find(c => c.id === preset.category_id)}
              onSelect={handleSelectPreset}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <Palette className="w-12 h-12 text-ash-grey-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ash-grey-900 mb-1">No materials found</h3>
          <p className="text-ash-grey-500">
            {searchQuery ? 'Try adjusting your search' : 'Select a category to view materials'}
          </p>
        </div>
      )}

      {/* Material Detail Modal */}
      {selectedPreset && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPreset(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview */}
            <div className="aspect-video relative">
              {selectedPreset.preview_url ? (
                <img
                  src={selectedPreset.preview_url}
                  alt={selectedPreset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: selectedPreset.color }}
                >
                  <Circle className="w-24 h-24 text-white/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-ash-grey-900">{selectedPreset.name}</h2>
              <p className="text-ash-grey-500 mt-1">
                {categories.find(c => c.id === selectedPreset.category_id)?.name}
                {selectedPreset.tab && ` · ${selectedPreset.tab}`}
              </p>

              {/* Properties */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-ash-grey-50 rounded-lg">
                  <p className="text-xs text-ash-grey-500">Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-ash-grey-200"
                      style={{ backgroundColor: selectedPreset.color }}
                    />
                    <span className="font-mono text-sm">{selectedPreset.color}</span>
                  </div>
                </div>
                <div className="p-3 bg-ash-grey-50 rounded-lg">
                  <p className="text-xs text-ash-grey-500">Roughness</p>
                  <p className="font-semibold text-ash-grey-900 mt-1">{selectedPreset.roughness}</p>
                </div>
                <div className="p-3 bg-ash-grey-50 rounded-lg">
                  <p className="text-xs text-ash-grey-500">Metalness</p>
                  <p className="font-semibold text-ash-grey-900 mt-1">{selectedPreset.metalness}</p>
                </div>
                {selectedPreset.clearcoat !== null && (
                  <div className="p-3 bg-ash-grey-50 rounded-lg">
                    <p className="text-xs text-ash-grey-500">Clearcoat</p>
                    <p className="font-semibold text-ash-grey-900 mt-1">{selectedPreset.clearcoat}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <a
                  href={`/studio/3d-canvas?material=${selectedPreset.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Use in 3D Editor
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({
                      color: selectedPreset.color,
                      roughness: selectedPreset.roughness,
                      metalness: selectedPreset.metalness,
                      clearcoat: selectedPreset.clearcoat,
                    }, null, 2));
                  }}
                  className="px-4 py-2 border border-ash-grey-200 text-ash-grey-700 hover:bg-ash-grey-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
