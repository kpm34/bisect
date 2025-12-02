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
  const [activeTab, setActiveTab] = useState<string>('finishes');
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
          if (result.category.display_mode === 'tabs' && result.presets.length > 0) {
            // Get unique tabs and set the first one as active
            const availableTabs = Array.from(new Set(result.presets.map((p: MaterialPreset) => p.tab).filter(Boolean)));
            if (availableTabs.length > 0) {
              // Use custom order for known tab types
              const glassOrder = ['Clear', 'Tinted', 'Frosted', 'MatCap', 'Specialty'];
              const metalOrder = ['finishes', 'tints', 'aged'];
              const sortedTabs = availableTabs.sort((a, b) => {
                const orderA = glassOrder.indexOf(a as string) !== -1 ? glassOrder.indexOf(a as string) : metalOrder.indexOf(a as string);
                const orderB = glassOrder.indexOf(b as string) !== -1 ? glassOrder.indexOf(b as string) : metalOrder.indexOf(b as string);
                if (orderA !== -1 && orderB !== -1) return orderA - orderB;
                return (a as string).localeCompare(b as string);
              });
              setActiveTab(sortedTabs[0] as string);
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

    // Check if this is a glass material (has transmission property)
    const isGlass = physicalProps?.transmission !== undefined && (physicalProps.transmission as number) > 0;

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materialConfig: Record<string, any> = {
          color: colorHex,
          metalness: preset.metalness,
          roughness: preset.roughness,
          clearcoat: preset.clearcoat ?? (preset.metalness > 0.5 && preset.roughness < 0.2 ? 0.5 : 0),
          clearcoatRoughness: (physicalProps?.clearcoatRoughness as number) ?? 0.1,
          envMapIntensity: (physicalProps?.envMapIntensity as number) ?? (preset.metalness > 0.5 ? 1.5 : 1.0),
        };

        // Add glass-specific properties
        if (isGlass) {
          materialConfig.transmission = physicalProps?.transmission ?? 0.95;
          materialConfig.thickness = (physicalProps?.thickness as number) ?? 0.5;
          materialConfig.ior = (physicalProps?.ior as number) ?? 1.5;
          materialConfig.transparent = true;
          materialConfig.opacity = 1;

          // Attenuation for tinted glass
          if (physicalProps?.attenuationColor) {
            materialConfig.attenuationColor = new THREE.Color(physicalProps.attenuationColor as string);
            materialConfig.attenuationDistance = (physicalProps?.attenuationDistance as number) ?? 0.5;
          }

          // Iridescence for specialty glass
          if (physicalProps?.iridescence !== undefined) {
            materialConfig.iridescence = physicalProps.iridescence as number;
            materialConfig.iridescenceIOR = (physicalProps?.iridescenceIOR as number) ?? 1.3;
          }

          // Emissive for neon glass
          if (physicalProps?.emissive) {
            materialConfig.emissive = new THREE.Color(physicalProps.emissive as string);
            materialConfig.emissiveIntensity = (physicalProps?.emissiveIntensity as number) ?? 0.3;
          }

          // Sheen for aurora effect
          if (physicalProps?.sheen !== undefined) {
            materialConfig.sheen = physicalProps.sheen as number;
            if (physicalProps?.sheenColor) {
              materialConfig.sheenColor = new THREE.Color(physicalProps.sheenColor as string);
            }
          }
        }

        const material = new THREE.MeshPhysicalMaterial(materialConfig);
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

  // Build tabs array dynamically from presets (only for tabs display_mode)
  const tabs = category?.display_mode === 'tabs'
    ? Array.from(new Set(presets.map(p => p.tab).filter(Boolean)))
        .map(tabName => ({
          id: tabName as string,
          label: tabName as string,
          count: presets.filter(p => p.tab === tabName).length
        }))
        .filter(tab => tab.count > 0)
        .sort((a, b) => {
          // Custom sort order for glass tabs
          const glassOrder = ['Clear', 'Tinted', 'Frosted', 'MatCap', 'Specialty'];
          const metalOrder = ['finishes', 'tints', 'aged'];
          const orderA = glassOrder.indexOf(a.id) !== -1 ? glassOrder.indexOf(a.id) : metalOrder.indexOf(a.id);
          const orderB = glassOrder.indexOf(b.id) !== -1 ? glassOrder.indexOf(b.id) : metalOrder.indexOf(b.id);
          if (orderA !== -1 && orderB !== -1) return orderA - orderB;
          return a.label.localeCompare(b.label);
        })
    : [];

  // Browse view for variations
  if (showBrowse && selectedPreset) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[85vh] overflow-hidden border border-zinc-800">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-amber-900/20 to-[#1a1a1a]">
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
          <div className="px-6 py-4 border-t border-zinc-800 bg-[#141414]">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[85vh] overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 bg-gradient-to-r ${materialType === 'glass' ? 'from-cyan-900/20' : 'from-amber-900/20'} to-[#1a1a1a]`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Sparkles className={`w-5 h-5 ${materialType === 'glass' ? 'text-cyan-400' : 'text-amber-400'} flex-shrink-0`} />
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
          <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 py-3 border-b border-zinc-800 bg-[#141414] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? materialType === 'glass'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
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
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-220px)] bg-[#111111]">
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
                        ? materialType === 'glass'
                          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#111111] scale-105'
                          : 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#111111] scale-105'
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
                      <div className={`absolute top-2 right-2 w-6 h-6 ${materialType === 'glass' ? 'bg-cyan-500' : 'bg-amber-500'} rounded-full flex items-center justify-center`}>
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-800 bg-[#141414]">
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
                    ? materialType === 'glass'
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
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
