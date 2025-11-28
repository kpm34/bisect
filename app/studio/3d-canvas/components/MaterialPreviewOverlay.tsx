'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Search, Loader2 } from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import type { MaterialPreset, MaterialVariation, MaterialCategory } from '@/lib/services/supabase/types';

interface MaterialPreviewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  materialType?: string; // Now accepts any category slug (gold, silver, wood, etc.)
}

export function MaterialPreviewOverlay({ isOpen, onClose, materialType = 'gold' }: MaterialPreviewOverlayProps) {
  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [presets, setPresets] = useState<MaterialPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<MaterialPreset | null>(null);
  const [activeTab, setActiveTab] = useState<'finishes' | 'tints' | 'aged'>('finishes');
  const [isLoading, setIsLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseVariations, setBrowseVariations] = useState<MaterialVariation[]>([]);
  const { selectedObject, setColor, setRoughness, setMetalness } = useSelection();

  // Fetch category and presets from Supabase on mount
  useEffect(() => {
    async function fetchCategoryAndPresets() {
      setIsLoading(true);
      try {
        const { getCategoryWithPresets } = await import('@/lib/services/supabase/materials');
        const result = await getCategoryWithPresets(materialType);

        if (result) {
          setCategory(result.category);
          setPresets(result.presets);

          // Set initial tab based on available presets (for tabs mode)
          if (result.category.display_mode === 'tabs' && result.grouped) {
            if (result.grouped.finishes.length > 0) {
              setActiveTab('finishes');
            } else if (result.grouped.tints.length > 0) {
              setActiveTab('tints');
            } else if (result.grouped.aged.length > 0) {
              setActiveTab('aged');
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      fetchCategoryAndPresets();
    }
  }, [isOpen, materialType]);

  // Fetch browse variations when a preset is selected
  const handleBrowseClick = async () => {
    if (!selectedPreset) return;

    setShowBrowse(true);
    setIsLoading(true);

    try {
      const { getVariationsByPreset } = await import('@/lib/services/supabase/materials');
      const variations = await getVariationsByPreset(selectedPreset.id);
      setBrowseVariations(variations);
    } catch (error) {
      console.warn('Failed to fetch variations:', error);
      setBrowseVariations([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get presets to display based on display_mode
  const displayPresets = category?.display_mode === 'tabs'
    ? presets.filter(p => p.tab === activeTab)
    : presets; // flat mode shows all

  const handleApplyPreset = async (preset: MaterialPreset) => {
    if (!selectedObject) {
      console.warn('No object selected');
      return;
    }

    setSelectedPreset(preset);

    // Convert hex color to number
    const colorHex = parseInt(preset.color.replace('#', ''), 16);

    // Apply via context
    setColor(colorHex);
    setRoughness(preset.roughness);
    setMetalness(preset.metalness);

    // Apply MeshPhysicalMaterial for enhanced rendering
    const THREE = await import('three');
    const physicalProps = preset.physical_props as Record<string, number | string> | null;

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const material = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          metalness: preset.metalness,
          roughness: preset.roughness,
          clearcoat: preset.clearcoat ?? (preset.metalness > 0.5 && preset.roughness < 0.2 ? 0.5 : 0),
          clearcoatRoughness: (physicalProps?.clearcoatRoughness as number) ?? 0.1,
          envMapIntensity: (physicalProps?.envMapIntensity as number) ?? (preset.metalness > 0.5 ? 1.5 : 1.0),
        });
        child.material = material;
      }
    });

    console.log(`Applied ${preset.name} to ${selectedObject.name}`);
  };

  const handleApplyVariation = async (variation: MaterialVariation) => {
    if (!selectedObject || !selectedPreset) return;

    const color = variation.color_shift || selectedPreset.color;
    const colorHex = parseInt(color.replace('#', ''), 16);

    setColor(colorHex);
    setRoughness(variation.roughness);
    setMetalness(variation.metalness);

    const THREE = await import('three');
    const physicalProps = selectedPreset.physical_props as Record<string, number> | null;

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const material = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          metalness: variation.metalness,
          roughness: variation.roughness,
          clearcoat: selectedPreset.clearcoat ?? (variation.roughness < 0.2 ? 0.5 : 0),
          clearcoatRoughness: physicalProps?.clearcoatRoughness ?? 0.1,
          envMapIntensity: physicalProps?.envMapIntensity ?? 1.5,
        });
        child.material = material;
      }
    });

    console.log(`Applied variation ${variation.name} to ${selectedObject.name}`);
  };

  // Build tabs array (only for tabs display_mode)
  const tabs = category?.display_mode === 'tabs' ? [
    { id: 'finishes' as const, label: 'Finishes', count: presets.filter(p => p.tab === 'finishes').length },
    { id: 'tints' as const, label: 'Tints', count: presets.filter(p => p.tab === 'tints').length },
    { id: 'aged' as const, label: 'Aged', count: presets.filter(p => p.tab === 'aged').length },
  ].filter(tab => tab.count > 0) : [];

  // Browse view for variations
  if (showBrowse && selectedPreset) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[85vh] overflow-hidden border border-zinc-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-700 bg-gradient-to-r from-amber-900/20 to-zinc-900">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setShowBrowse(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">Browse: {selectedPreset.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Variations Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : browseVariations.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {browseVariations.map((variation) => (
                  <button
                    key={variation.id}
                    onClick={() => handleApplyVariation(variation)}
                    className="group relative aspect-square rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 hover:ring-1 hover:ring-zinc-600"
                  >
                    <img
                      src={variation.preview_url ?? undefined}
                      alt={variation.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium text-center truncate">
                        {variation.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-500">No additional variations available yet.</p>
                <p className="text-zinc-600 text-sm mt-2">More variations coming soon!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Fine-tune variations of {selectedPreset.name}
              </p>
              <button
                onClick={() => setShowBrowse(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Back to Presets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main preset view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[85vh] overflow-hidden border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-700 bg-gradient-to-r from-amber-900/20 to-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-white capitalize truncate">
              {category?.name || materialType} {category?.display_mode === 'flat' ? '' : 'Variations'}
            </h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded flex-shrink-0 hidden sm:inline">
              {presets.length} {presets.length === 1 ? 'preset' : 'presets'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs - Only shown for tabs display_mode */}
        {category?.display_mode === 'tabs' && tabs.length > 0 && (
          <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tab.label}
                <span className="ml-1 sm:ml-2 text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Preview Grid - responsive columns */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : displayPresets.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {displayPresets.map((preset) => {
                const isSelected = selectedPreset?.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900 scale-105'
                        : 'hover:scale-105 hover:ring-1 hover:ring-zinc-600'
                    }`}
                  >
                    {/* Preview Image */}
                    <img
                      src={preset.preview_url ?? undefined}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium text-center truncate">
                        {preset.name}
                      </p>
                      <p className="text-zinc-400 text-[10px] text-center">
                        R: {preset.roughness.toFixed(2)} M: {preset.metalness.toFixed(2)}
                      </p>
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">No presets available for this category.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-500 truncate max-w-full">
              {selectedObject
                ? `Applying to: ${selectedObject.name || 'Selected Object'}`
                : 'Select an object to apply materials'
              }
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {/* Browse button - only enabled when a preset is selected */}
              <button
                onClick={handleBrowseClick}
                disabled={!selectedPreset}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  selectedPreset
                    ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Search className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">Browse</span>
              </button>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                disabled={!selectedPreset}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  selectedPreset
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaterialPreviewOverlay;
