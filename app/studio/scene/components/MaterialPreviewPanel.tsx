'use client';

import { useState } from 'react';
import { X, Star, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

// Material variation data matching the Blender render script
const METAL_VARIATIONS = {
  gold: [
    { id: 'gold-v1-mirror', name: 'Mirror Gold', description: 'Pure mirror gold', roughness: 0.02, metallic: 1.0 },
    { id: 'gold-v2-polished', name: 'Polished Gold', description: 'Polished gold', roughness: 0.08, metallic: 1.0 },
    { id: 'gold-v3-satin', name: 'Satin Gold', description: 'Satin gold', roughness: 0.15, metallic: 1.0 },
    { id: 'gold-v4-brushed', name: 'Brushed Gold', description: 'Brushed gold', roughness: 0.25, metallic: 1.0 },
    { id: 'gold-v5-rose', name: 'Rose Gold', description: 'Rose gold', roughness: 0.12, metallic: 1.0 },
    { id: 'gold-v6-white', name: 'White Gold', description: 'White gold', roughness: 0.10, metallic: 1.0 },
    { id: 'gold-v7-antique', name: 'Antique Gold', description: 'Antique gold', roughness: 0.35, metallic: 1.0 },
    { id: 'gold-v8-champagne', name: 'Champagne Gold', description: 'Champagne gold', roughness: 0.18, metallic: 1.0 },
    { id: 'gold-v9-matte', name: 'Matte Gold', description: 'Matte gold', roughness: 0.45, metallic: 1.0 },
    { id: 'gold-v10-worn', name: 'Worn Gold', description: 'Worn gold', roughness: 0.40, metallic: 0.92 },
  ],
  silver: [
    { id: 'silver-v1-mirror', name: 'Mirror Silver', description: 'Mirror silver', roughness: 0.02, metallic: 1.0 },
    { id: 'silver-v2-polished', name: 'Polished Silver', description: 'Polished silver', roughness: 0.06, metallic: 1.0 },
    { id: 'silver-v3-sterling', name: 'Sterling Silver', description: 'Sterling silver', roughness: 0.12, metallic: 1.0 },
    { id: 'silver-v4-brushed', name: 'Brushed Silver', description: 'Brushed silver', roughness: 0.28, metallic: 1.0 },
    { id: 'silver-v5-satin', name: 'Satin Silver', description: 'Satin silver', roughness: 0.18, metallic: 1.0 },
    { id: 'silver-v6-oxidized', name: 'Oxidized Silver', description: 'Oxidized silver', roughness: 0.35, metallic: 0.95 },
    { id: 'silver-v7-warm', name: 'Warm Silver', description: 'Warm silver', roughness: 0.10, metallic: 1.0 },
    { id: 'silver-v8-cool', name: 'Cool Silver', description: 'Cool silver', roughness: 0.10, metallic: 1.0 },
    { id: 'silver-v9-matte', name: 'Matte Silver', description: 'Matte silver', roughness: 0.42, metallic: 1.0 },
    { id: 'silver-v10-aged', name: 'Aged Silver', description: 'Aged silver', roughness: 0.38, metallic: 0.92 },
  ],
  titanium: [
    { id: 'titanium-v1-natural', name: 'Natural Titanium', description: 'Natural titanium', roughness: 0.25, metallic: 1.0 },
    { id: 'titanium-v2-polished', name: 'Polished Titanium', description: 'Polished titanium', roughness: 0.12, metallic: 1.0 },
    { id: 'titanium-v3-anodized-blue', name: 'Anodized Blue', description: 'Anodized blue', roughness: 0.22, metallic: 1.0 },
    { id: 'titanium-v4-anodized-purple', name: 'Anodized Purple', description: 'Anodized purple', roughness: 0.22, metallic: 1.0 },
    { id: 'titanium-v5-anodized-gold', name: 'Anodized Gold', description: 'Anodized gold', roughness: 0.22, metallic: 1.0 },
    { id: 'titanium-v6-anodized-green', name: 'Anodized Green', description: 'Anodized green', roughness: 0.22, metallic: 1.0 },
    { id: 'titanium-v7-brushed', name: 'Brushed Titanium', description: 'Brushed titanium', roughness: 0.35, metallic: 1.0 },
    { id: 'titanium-v8-matte', name: 'Matte Titanium', description: 'Matte titanium', roughness: 0.50, metallic: 1.0 },
    { id: 'titanium-v9-dark', name: 'Dark Titanium', description: 'Dark titanium', roughness: 0.30, metallic: 1.0 },
    { id: 'titanium-v10-rainbow', name: 'Rainbow Titanium', description: 'Rainbow titanium', roughness: 0.20, metallic: 1.0 },
  ],
  iron: [
    { id: 'iron-v1-polished', name: 'Polished Iron', description: 'Polished iron', roughness: 0.15, metallic: 1.0 },
    { id: 'iron-v2-brushed', name: 'Brushed Iron', description: 'Brushed iron', roughness: 0.35, metallic: 1.0 },
    { id: 'iron-v3-cast', name: 'Cast Iron', description: 'Cast iron', roughness: 0.55, metallic: 0.95 },
    { id: 'iron-v4-wrought', name: 'Wrought Iron', description: 'Wrought iron', roughness: 0.60, metallic: 0.90 },
    { id: 'iron-v5-rusty-light', name: 'Light Rust', description: 'Light rust', roughness: 0.65, metallic: 0.75 },
    { id: 'iron-v6-rusty-heavy', name: 'Heavy Rust', description: 'Heavy rust', roughness: 0.75, metallic: 0.65 },
    { id: 'iron-v7-patina', name: 'Iron Patina', description: 'Iron patina', roughness: 0.50, metallic: 0.85 },
    { id: 'iron-v8-blackened', name: 'Blackened Iron', description: 'Blackened iron', roughness: 0.45, metallic: 0.95 },
    { id: 'iron-v9-galvanized', name: 'Galvanized Iron', description: 'Galvanized iron', roughness: 0.28, metallic: 1.0 },
    { id: 'iron-v10-weathered', name: 'Weathered Iron', description: 'Weathered iron', roughness: 0.58, metallic: 0.80 },
  ],
  copper: [
    { id: 'copper-v1-mirror', name: 'Mirror Copper', description: 'Mirror copper', roughness: 0.04, metallic: 1.0 },
    { id: 'copper-v2-polished', name: 'Polished Copper', description: 'Polished copper', roughness: 0.10, metallic: 1.0 },
    { id: 'copper-v3-brushed', name: 'Brushed Copper', description: 'Brushed copper', roughness: 0.30, metallic: 1.0 },
    { id: 'copper-v4-satin', name: 'Satin Copper', description: 'Satin copper', roughness: 0.18, metallic: 1.0 },
    { id: 'copper-v5-antique', name: 'Antique Copper', description: 'Antique copper', roughness: 0.38, metallic: 0.95 },
    { id: 'copper-v6-patina-green', name: 'Green Patina', description: 'Green patina', roughness: 0.55, metallic: 0.70 },
    { id: 'copper-v7-patina-blue', name: 'Blue Patina', description: 'Blue patina', roughness: 0.52, metallic: 0.70 },
    { id: 'copper-v8-rose', name: 'Rose Copper', description: 'Rose copper', roughness: 0.15, metallic: 1.0 },
    { id: 'copper-v9-matte', name: 'Matte Copper', description: 'Matte copper', roughness: 0.45, metallic: 1.0 },
    { id: 'copper-v10-weathered', name: 'Weathered Copper', description: 'Weathered copper', roughness: 0.48, metallic: 0.82 },
  ],
};

type MetalType = keyof typeof METAL_VARIATIONS;

interface MaterialPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset?: (metalType: string, variationId: string) => void;
  onSelectLibrary?: (metalType: string, variationId: string) => void;
}

export default function MaterialPreviewPanel({
  isOpen,
  onClose,
  onSelectPreset,
  onSelectLibrary,
}: MaterialPreviewPanelProps) {
  const [expandedMetal, setExpandedMetal] = useState<MetalType | null>('gold');
  const [selectedPresets, setSelectedPresets] = useState<Record<MetalType, string | null>>({
    gold: null,
    silver: null,
    titanium: null,
    iron: null,
    copper: null,
  });
  const [librarySelections, setLibrarySelections] = useState<Record<MetalType, Set<string>>>({
    gold: new Set(),
    silver: new Set(),
    titanium: new Set(),
    iron: new Set(),
    copper: new Set(),
  });

  if (!isOpen) return null;

  const handlePresetSelect = (metalType: MetalType, variationId: string) => {
    setSelectedPresets((prev) => ({
      ...prev,
      [metalType]: prev[metalType] === variationId ? null : variationId,
    }));
    onSelectPreset?.(metalType, variationId);
  };

  const handleLibraryToggle = (metalType: MetalType, variationId: string) => {
    setLibrarySelections((prev) => {
      const newSet = new Set(prev[metalType]);
      if (newSet.has(variationId)) {
        newSet.delete(variationId);
      } else {
        newSet.add(variationId);
      }
      return { ...prev, [metalType]: newSet };
    });
    onSelectLibrary?.(metalType, variationId);
  };

  const toggleMetal = (metal: MetalType) => {
    setExpandedMetal((prev) => (prev === metal ? null : metal));
  };

  const getSelectionSummary = () => {
    const presetCount = Object.values(selectedPresets).filter(Boolean).length;
    const libraryCount = Object.values(librarySelections).reduce((sum, set) => sum + set.size, 0);
    return { presetCount, libraryCount };
  };

  const { presetCount, libraryCount } = getSelectionSummary();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[90vw] max-w-6xl h-[85vh] bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-800/50">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Material Preview Panel
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium">
                DEV MODE
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Select the best variations for presets (⭐) and library additions (✓)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Star size={14} fill="currentColor" />
                {presetCount} Presets
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Check size={14} />
                {libraryCount} Library
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(Object.entries(METAL_VARIATIONS) as [MetalType, typeof METAL_VARIATIONS.gold][]).map(
            ([metalType, variations]) => (
              <div
                key={metalType}
                className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700/50"
              >
                {/* Metal Header */}
                <button
                  onClick={() => toggleMetal(metalType)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl capitalize font-semibold text-white">
                      {metalType.charAt(0).toUpperCase() + metalType.slice(1)}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {variations.length} variations
                    </span>
                    {selectedPresets[metalType] && (
                      <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                        Preset selected
                      </span>
                    )}
                    {librarySelections[metalType].size > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                        {librarySelections[metalType].size} for library
                      </span>
                    )}
                  </div>
                  {expandedMetal === metalType ? (
                    <ChevronUp size={20} className="text-zinc-400" />
                  ) : (
                    <ChevronDown size={20} className="text-zinc-400" />
                  )}
                </button>

                {/* Variations Grid */}
                {expandedMetal === metalType && (
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-5 gap-4">
                      {variations.map((variation) => {
                        const isPreset = selectedPresets[metalType] === variation.id;
                        const isLibrary = librarySelections[metalType].has(variation.id);

                        return (
                          <div
                            key={variation.id}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                              isPreset
                                ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                                : isLibrary
                                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : 'border-zinc-700 hover:border-zinc-500'
                            }`}
                          >
                            {/* Image */}
                            <div className="aspect-square bg-zinc-800 relative">
                              <Image
                                src={`/assets/materials/metal/variations/${variation.id}.png`}
                                alt={variation.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 20vw"
                              />

                              {/* Selection badges */}
                              <div className="absolute top-2 left-2 flex gap-1">
                                {isPreset && (
                                  <span className="w-6 h-6 flex items-center justify-center bg-amber-500 rounded-full">
                                    <Star size={14} fill="white" className="text-white" />
                                  </span>
                                )}
                                {isLibrary && (
                                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-500 rounded-full">
                                    <Check size={14} className="text-white" />
                                  </span>
                                )}
                              </div>

                              {/* Hover Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handlePresetSelect(metalType, variation.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isPreset
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-zinc-700 hover:bg-amber-500 text-zinc-300 hover:text-white'
                                  }`}
                                  title="Set as preset"
                                >
                                  <Star size={18} fill={isPreset ? 'white' : 'none'} />
                                </button>
                                <button
                                  onClick={() => handleLibraryToggle(metalType, variation.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isLibrary
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-zinc-700 hover:bg-emerald-500 text-zinc-300 hover:text-white'
                                  }`}
                                  title="Add to library"
                                >
                                  <Check size={18} />
                                </button>
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-zinc-800">
                              <h4 className="font-medium text-white text-sm truncate">
                                {variation.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                <span>R: {variation.roughness}</span>
                                <span>M: {variation.metallic}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-800/50 flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            <span className="text-amber-400">⭐ Preset</span> = Featured in category hover popup
            <span className="mx-3">|</span>
            <span className="text-emerald-400">✓ Library</span> = Available in full material drawer
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Presets:', selectedPresets);
                console.log('Library:', Object.fromEntries(
                  Object.entries(librarySelections).map(([k, v]) => [k, Array.from(v)])
                ));
                onClose();
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
            >
              Save Selections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
