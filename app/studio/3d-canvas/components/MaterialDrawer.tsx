'use client';

/**
 * MaterialDrawer - Full Material Library Browser
 *
 * Expandable drawer showing all materials (featured + advanced)
 * with category tabs, search, and grid layout.
 */

import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, Sparkles } from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import {
  MaterialConfig,
  CATEGORIES,
  getCategoryMaterials,
} from '@/lib/core/materials';

type MaterialCategory = 'metal' | 'glass' | 'wood' | 'stone' | 'fabric';

interface MaterialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaterialDrawer({ isOpen, onClose }: MaterialDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('metal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Get all materials for active category
  const categoryMaterials = useMemo(() => {
    return getCategoryMaterials(activeCategory);
  }, [activeCategory]);

  // Filter by search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return categoryMaterials;

    const query = searchQuery.toLowerCase();
    return categoryMaterials.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [categoryMaterials, searchQuery]);

  // Handle material selection
  const handleMaterialClick = async (material: MaterialConfig) => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected');
      return;
    }

    setSelectedMaterialId(material.id);

    // Apply PBR properties
    const colorHex = parseInt(material.properties.baseColorHex.replace('#', ''), 16);
    setColor(colorHex);
    setRoughness(material.properties.roughness);
    setMetalness(material.properties.metallic);

    // Load texture if available
    if (material.textures?.baseColor) {
      try {
        const { TextureLoader } = await import('three');
        const loader = new TextureLoader();

        loader.load(
          material.textures.baseColor,
          (texture) => {
            selectedObject.traverse((child: any) => {
              if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material)
                  ? child.material
                  : [child.material];
                materials.forEach((mat: any) => {
                  if (mat.map !== undefined) {
                    mat.map = texture;
                    mat.needsUpdate = true;
                  }
                });
              }
            });
            console.log(`✅ Applied "${material.name}" with texture`);
          },
          undefined,
          (error) => console.error('❌ Texture load failed:', error)
        );
      } catch (error) {
        console.error('❌ TextureLoader import failed:', error);
      }
    }

    console.log(`✅ Applied "${material.name}" to "${selectedObject.name}"`);
  };

  // Categories array - use all defined categories
  const categories = Object.values(CATEGORIES);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay - dims everything behind */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer panel - on top of everything, responsive width */}
      <div className="fixed inset-y-0 right-0 w-[90vw] max-w-[420px] sm:w-[420px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cta-orange" />
          <h2 className="text-lg font-semibold text-white">Material Library</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cta-orange/50 focus:border-cta-orange"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b border-zinc-800 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as MaterialCategory)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-cta-orange text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Object Selection Status */}
      {!selectedObject && (
        <div className="mx-4 mt-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
          <p className="text-sm text-amber-200">
            Select an object in the scene to apply materials
          </p>
        </div>
      )}

      {/* Material Grid - responsive columns */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          {filteredMaterials.map((material) => {
            const isSelected = selectedMaterialId === material.id;
            const isFeatured = material.tags?.includes('featured');
            const textureUrl = material.textures?.baseColor;

            return (
              <button
                key={material.id}
                onClick={() => handleMaterialClick(material)}
                disabled={!selectedObject}
                className={`relative group p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-cta-orange bg-cta-orange/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800'
                } ${!selectedObject ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {/* Material Swatch */}
                <div
                  className="w-full aspect-square rounded-lg mb-2 overflow-hidden"
                  style={{
                    backgroundColor: material.properties.baseColorHex,
                    backgroundImage: textureUrl ? `url(${textureUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Featured Badge */}
                  {isFeatured && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-cta-orange/90 rounded text-[10px] font-medium text-white">
                      Featured
                    </div>
                  )}

                  {/* Selected Checkmark */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-8 h-8 bg-cta-orange rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Material Info */}
                <div>
                  <h3 className="text-sm font-medium text-white truncate">
                    {material.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    R: {material.properties.roughness.toFixed(1)} · M:{' '}
                    {material.properties.metallic.toFixed(1)}
                  </p>
                </div>

                {/* Hover Arrow */}
                <ChevronRight
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ${
                    !selectedObject ? 'hidden' : ''
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No materials found</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-cta-orange hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <p className="text-xs text-zinc-500 text-center">
          {filteredMaterials.length} materials in {CATEGORIES[activeCategory]?.label || activeCategory}
        </p>
      </div>
      </div>
    </>
  );
}

export default MaterialDrawer;
