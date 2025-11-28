'use client';

/**
 * MaterialSelector - Circular Material Swatches with Vertical Popup
 *
 * Features:
 * - Horizontal row of circular swatches for main categories (Metal, Glass, Fabric, Wood, Stone)
 * - Hover reveals 5 quick-access variations in vertical popup
 * - For Metal: shows Gold, Silver, Copper, Iron, Titanium as the 5 variations
 * - Click to apply immediately
 * - "Browse All Materials" opens full MaterialPreviewOverlay with detailed presets
 *
 * Uses local manifest for main categories, Supabase for detailed metal presets
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Grid3X3, ChevronRight, Loader2 } from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { MaterialPreviewOverlay } from './MaterialPreviewOverlay';
import {
  MaterialConfig,
  MaterialCategory,
  CATEGORIES,
  getCategoryMaterials,
  getFeaturedMaterials,
  MATERIALS,
} from '@/lib/core/materials';
import type { MaterialPreset } from '@/lib/services/supabase/types';

// Metal subcategories with their default presets from Supabase
const METAL_SUBCATEGORIES = ['gold', 'silver', 'copper', 'iron', 'titanium'] as const;

// Preview URLs for metal subcategories - using distinct variations for visual differentiation
const METAL_PREVIEW_URLS: Record<string, string> = {
  gold: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/gold-variations/gold-polished.png',
  silver: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/silver-variations/silver-polished.png',
  copper: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/copper-variations/copper-matte.png',
  iron: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/iron-variations/iron-rusted.png',
  titanium: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/titanium-variations/titanium-brushed.png',
};

// Default material properties for metal subcategories - matched to preview variants
const METAL_DEFAULTS: Record<string, { color: string; roughness: number; metalness: number }> = {
  gold: { color: '#FFD700', roughness: 0.15, metalness: 1.0 },
  silver: { color: '#C0C0C0', roughness: 0.15, metalness: 1.0 },
  copper: { color: '#B87333', roughness: 0.5, metalness: 1.0 },  // Matte copper
  iron: { color: '#8B4513', roughness: 0.8, metalness: 0.4 },    // Rusted brown
  titanium: { color: '#878681', roughness: 0.35, metalness: 1.0 }, // Brushed titanium
};

// Stone subcategories - using Supabase-hosted previews
const STONE_SUBCATEGORIES = ['marble', 'granite', 'concrete', 'sandstone', 'slate'] as const;

const STONE_PREVIEW_URLS: Record<string, string> = {
  marble: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/stone/marble-black.png',
  granite: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/stone/granite-speckled.png',
  concrete: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/stone/concrete-smooth.png',
  sandstone: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/stone/sandstone-beige.png',
  slate: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/stone/slate-dark.png',
};

const STONE_DEFAULTS: Record<string, { color: string; roughness: number; metalness: number }> = {
  marble: { color: '#F5F5F5', roughness: 0.1, metalness: 0.0 },
  granite: { color: '#9E9E9E', roughness: 0.4, metalness: 0.0 },
  concrete: { color: '#808080', roughness: 0.8, metalness: 0.0 },
  sandstone: { color: '#D2B48C', roughness: 0.9, metalness: 0.0 },
  slate: { color: '#4A4A4A', roughness: 0.6, metalness: 0.0 },
};

// Fabric subcategories - using Supabase-hosted previews
const FABRIC_SUBCATEGORIES = ['cotton', 'silk', 'denim', 'leather', 'velvet'] as const;

const FABRIC_PREVIEW_URLS: Record<string, string> = {
  cotton: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/fabric/cotton-white.png',
  silk: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/fabric/silk-red.png',
  denim: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/fabric/denim-blue.png',
  leather: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/fabric/leather-brown.png',
  velvet: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/fabric/velvet-purple.png',
};

const FABRIC_DEFAULTS: Record<string, { color: string; roughness: number; metalness: number }> = {
  cotton: { color: '#FFFFFF', roughness: 0.9, metalness: 0.0 },
  silk: { color: '#8B0000', roughness: 0.4, metalness: 0.0 },
  denim: { color: '#1E3A8A', roughness: 0.8, metalness: 0.0 },
  leather: { color: '#8B4513', roughness: 0.6, metalness: 0.0 },
  velvet: { color: '#800080', roughness: 0.7, metalness: 0.0 },
};

// Wood subcategories - using Supabase-hosted previews
const WOOD_SUBCATEGORIES = ['oak', 'walnut', 'maple', 'cherry', 'bamboo'] as const;

const WOOD_PREVIEW_URLS: Record<string, string> = {
  oak: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/wood/oak.png',
  walnut: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/wood/walnut.png',
  maple: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/wood/maple.png',
  cherry: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/wood/cherry.png',
  bamboo: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/wood/bamboo.png',
};

const WOOD_DEFAULTS: Record<string, { color: string; roughness: number; metalness: number }> = {
  oak: { color: '#8B7355', roughness: 0.5, metalness: 0.0 },
  walnut: { color: '#5C4033', roughness: 0.5, metalness: 0.0 },
  maple: { color: '#D4A76A', roughness: 0.4, metalness: 0.0 },
  cherry: { color: '#9B4F36', roughness: 0.45, metalness: 0.0 },
  bamboo: { color: '#D8BF8C', roughness: 0.4, metalness: 0.0 },
};

type MaterialCategoryType = MaterialCategory;

export function MaterialSelector() {
  const [hoveredCategory, setHoveredCategory] = useState<MaterialCategoryType | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<{
    category: string;
    id: string;
  } | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayCategory, setOverlayCategory] = useState<string>('gold');
  const [footerPresets, setFooterPresets] = useState<MaterialPreset[]>([]);
  const [isLoadingFooter, setIsLoadingFooter] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Get materials from local manifest, grouped by category
  const materialsByCategory = useMemo(() => {
    const result: Record<MaterialCategoryType, MaterialConfig[]> = {} as any;

    // Get active categories with materials
    const activeCategories: MaterialCategoryType[] = ['metal', 'glass', 'fabric', 'wood', 'stone'];

    activeCategories.forEach(category => {
      const featured = getFeaturedMaterials(category);
      if (featured.length > 0) {
        result[category] = featured.slice(0, 5); // Max 5 for hover popup
      }
    });

    return result;
  }, []);

  // For metal category, we'll show the 5 subcategories (gold, silver, copper, iron, titanium)
  // instead of the local manifest materials
  const metalSubcategoryItems = useMemo(() => {
    return METAL_SUBCATEGORIES.map(slug => ({
      id: `metal-${slug}`,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      previewUrl: METAL_PREVIEW_URLS[slug],
      ...METAL_DEFAULTS[slug],
    }));
  }, []);

  const stoneSubcategoryItems = useMemo(() => {
    return STONE_SUBCATEGORIES.map(slug => ({
      id: `stone-${slug}`,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      previewUrl: STONE_PREVIEW_URLS[slug],
      ...STONE_DEFAULTS[slug],
    }));
  }, []);

  const fabricSubcategoryItems = useMemo(() => {
    return FABRIC_SUBCATEGORIES.map(slug => ({
      id: `fabric-${slug}`,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      previewUrl: FABRIC_PREVIEW_URLS[slug],
      ...FABRIC_DEFAULTS[slug],
    }));
  }, []);

  const woodSubcategoryItems = useMemo(() => {
    return WOOD_SUBCATEGORIES.map(slug => ({
      id: `wood-${slug}`,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      previewUrl: WOOD_PREVIEW_URLS[slug],
      ...WOOD_DEFAULTS[slug],
    }));
  }, []);

  const activeCategories = Object.keys(materialsByCategory) as MaterialCategoryType[];

  // Handler for applying local manifest material
  const handleMaterialClick = async (material: MaterialConfig) => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected');
      return;
    }

    setSelectedMaterialId({
      category: material.category,
      id: material.id
    });

    // Apply PBR properties
    const colorHex = parseInt((material.properties?.baseColorHex || '#cccccc').replace('#', ''), 16);
    setColor(colorHex);
    setRoughness(material.properties.roughness);
    setMetalness(material.properties.metallic);

    // Import Three.js modules
    const THREE = await import('three');

    // Check if material has physical properties
    const hasPhysical = material.physical && (
      material.physical.transmission !== undefined ||
      material.physical.clearcoat !== undefined ||
      material.physical.sheen !== undefined
    );

    // Apply material to all meshes in selected object
    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const isGlass = material.category === 'glass' && material.physical?.transmission;

        if (isGlass) {
          const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: material.properties.metallic,
            roughness: material.properties.roughness,
            transmission: material.physical?.transmission ?? 0.95,
            thickness: material.physical?.thickness ?? 0.5,
            ior: material.physical?.ior ?? 1.5,
            transparent: true,
          });
          if (material.physical?.attenuationColor) {
            glassMaterial.attenuationColor = new THREE.Color(material.physical.attenuationColor);
            glassMaterial.attenuationDistance = material.physical.attenuationDistance ?? 0.5;
          }
          child.material = glassMaterial;
        } else if (hasPhysical) {
          const physicalMaterial = new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: material.properties.metallic,
            roughness: material.properties.roughness,
          });
          if (material.physical?.clearcoat !== undefined) {
            physicalMaterial.clearcoat = material.physical.clearcoat;
            physicalMaterial.clearcoatRoughness = material.physical.clearcoatRoughness ?? 0.1;
          }
          if (material.physical?.sheen !== undefined) {
            physicalMaterial.sheen = material.physical.sheen;
            physicalMaterial.sheenRoughness = material.physical.sheenRoughness ?? 0.5;
            if (material.physical.sheenColor) {
              physicalMaterial.sheenColor = new THREE.Color(material.physical.sheenColor);
            }
          }
          child.material = physicalMaterial;
        } else {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat.color) mat.color.setHex(colorHex);
            if (mat.roughness !== undefined) mat.roughness = material.properties.roughness;
            if (mat.metalness !== undefined) mat.metalness = material.properties.metallic;
            mat.needsUpdate = true;
          });
        }
      }
    });

    console.log(`✅ Applied "${material.name}" to "${selectedObject.name}"`);

    // Clear footer presets for non-metal materials for now
    setFooterPresets([]);
    setSelectedPresetId(null);
  };

  // Handler for applying preset from footer
  const handlePresetClick = async (preset: MaterialPreset) => {
    if (!selectedObject) return;

    setSelectedPresetId(preset.id);

    // Apply PBR properties
    const colorHex = parseInt(preset.color.replace('#', ''), 16);
    setColor(colorHex);
    setRoughness(preset.roughness);
    setMetalness(preset.metalness);

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

    console.log(`Applied preset ${preset.name}`);
  };

  // Handler for applying subcategory (Metal, Stone, Fabric)
  const handleSubcategoryClick = async (item: any, category: string) => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected');
      return;
    }

    setSelectedMaterialId({
      category: category,
      id: item.id
    });

    const colorHex = parseInt(item.color.replace('#', ''), 16);
    setColor(colorHex);
    setRoughness(item.roughness);
    setMetalness(item.metalness);

    const THREE = await import('three');

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const material = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          metalness: item.metalness,
          roughness: item.roughness,
          clearcoat: item.roughness < 0.2 ? 0.5 : 0,
          clearcoatRoughness: 0.1,
          envMapIntensity: 1.5,
        });
        child.material = material;
      }
    });

    console.log(`✅ Applied "${item.name}" to "${selectedObject.name}"`);

    // Fetch presets for this subcategory
    setIsLoadingFooter(true);
    setOverlayCategory(item.slug);

    try {
      const { getCategoryWithPresets } = await import('@/lib/services/supabase/materials');
      const result = await getCategoryWithPresets(item.slug);

      if (result && result.presets) {
        setFooterPresets(result.presets);
      } else {
        setFooterPresets([]);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
      setFooterPresets([]);
    } finally {
      setIsLoadingFooter(false);
    }
  };

  // Handler for opening full overlay
  const handleBrowseCategory = (categorySlug: string) => {
    setOverlayCategory(categorySlug);
    setIsOverlayOpen(true);
  };

  // Handler for closing overlay
  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Materials</h3>
        {selectedObject ? (
          <p style={styles.subtitle}>
            Selected: {selectedObject.name || 'Unnamed Object'}
          </p>
        ) : (
          <p style={styles.subtitleInactive}>
            Select an object to apply materials
          </p>
        )}
      </div>

      <div style={styles.divider} />

      {/* Material Swatches - Horizontal Row */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>SELECT MATERIAL</h4>
        <div style={styles.swatchContainer}>
          {activeCategories.map((categoryId) => {
            const isMetalCategory = categoryId === 'metal';
            const isStoneCategory = categoryId === 'stone';
            const isFabricCategory = categoryId === 'fabric';
            const isWoodCategory = categoryId === 'wood';
            const categoryMaterials = materialsByCategory[categoryId];

            if (!isMetalCategory && !isStoneCategory && !isFabricCategory && !isWoodCategory && (!categoryMaterials || categoryMaterials.length === 0)) return null;

            // Use subcategories for Metal, Stone, Fabric, Wood; local manifest for others (Glass)
            let items: any[] = categoryMaterials;
            if (isMetalCategory) items = metalSubcategoryItems;
            if (isStoneCategory) items = stoneSubcategoryItems;
            if (isFabricCategory) items = fabricSubcategoryItems;
            if (isWoodCategory) items = woodSubcategoryItems;

            // Reorder: [1, 2, 0, 3, 4] so center (0) is in the middle
            const reordered = [
              items[1],
              items[2],
              items[0], // center
              items[3],
              items[4],
            ].filter(Boolean);

            return (
              <div
                key={categoryId}
                style={styles.swatchWrapper}
                onMouseEnter={() => setHoveredCategory(categoryId)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Vertical Popup List - 2 above, center, 2 below */}
                <ul
                  style={{
                    ...styles.variationList,
                    ...(hoveredCategory === categoryId ? styles.variationListHovered : {})
                  }}
                >
                  {reordered.map((item, displayIndex) => {
                    if (!item) return null;
                    const isCenter = displayIndex === 2;
                    const isSubcategory = isMetalCategory || isStoneCategory || isFabricCategory || isWoodCategory;
                    const itemId = isSubcategory ? (item as any).id : (item as MaterialConfig).id;
                    const isActive = selectedMaterialId?.category === categoryId &&
                      selectedMaterialId?.id === itemId;
                    const isVisible = hoveredCategory === categoryId || isCenter;

                    // Get preview URL
                    const previewUrl = isSubcategory
                      ? (item as any).previewUrl
                      : ((item as MaterialConfig).thumbnailPath || (item as MaterialConfig).textures?.baseColor);

                    const itemName = isSubcategory ? (item as any).name : (item as MaterialConfig).name;
                    const itemRoughness = isSubcategory ? (item as any).roughness : (item as MaterialConfig).properties.roughness;
                    const itemMetalness = isSubcategory ? (item as any).metalness : (item as MaterialConfig).properties.metallic;

                    return (
                      <li
                        key={itemId}
                        style={{
                          ...styles.variationItem,
                          opacity: isVisible ? 1 : 0,
                          pointerEvents: isVisible ? 'auto' : 'none',
                          ...(isCenter ? styles.variationItemCenter : {})
                        }}
                        onClick={() => {
                          if (isSubcategory) {
                            handleSubcategoryClick(item, categoryId);
                          } else {
                            handleMaterialClick(item as MaterialConfig);
                          }
                        }}
                      >
                        {/* Material Swatch with Texture */}
                        <div
                          style={{
                            ...styles.swatch,
                            backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                            backgroundColor: previewUrl ? 'transparent' : (isSubcategory ? (item as any).color : (item as MaterialConfig).properties?.baseColorHex || '#cccccc'),
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                          }}
                        />

                        {/* Active Indicator */}
                        {isActive && (
                          <div style={styles.activeIndicator}>✓</div>
                        )}

                        {/* Tooltip - Subtle label */}
                        <div style={styles.tooltip} className="material-tooltip">
                          {itemName}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Category Label */}
                <span style={styles.swatchLabel}>
                  {CATEGORIES[categoryId]?.label || categoryId}
                </span>

                {/* Browse more link on hover for subcategories */}
                {hoveredCategory === categoryId && (isMetalCategory || isStoneCategory || isFabricCategory || isWoodCategory) && (
                  <button
                    style={styles.browseMoreButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open with the center item's category
                      const defaultSub = isMetalCategory ? 'gold' : isStoneCategory ? 'marble' : isFabricCategory ? 'cotton' : 'wood';
                      handleBrowseCategory(defaultSub);
                    }}
                  >
                    Browse all
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with Presets or Browse All Button */}
      <div style={styles.footer}>
        {isLoadingFooter ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : footerPresets.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {selectedMaterialId?.category === 'metal' || selectedMaterialId?.category === 'stone' || selectedMaterialId?.category === 'fabric'
                  ? `${selectedMaterialId.id.replace(selectedMaterialId.category + '-', '')} Variations`
                  : 'Variations'}
              </p>
              <button
                onClick={() => handleBrowseCategory(overlayCategory)}
                className="text-xs text-cta-orange hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {footerPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className="group relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-zinc-200 hover:border-cta-orange transition-all focus:outline-none focus:ring-2 focus:ring-cta-orange/50"
                  title={preset.name}
                >
                  <img
                    src={preset.preview_url || ''}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedPresetId === preset.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleBrowseCategory('gold')}
              style={styles.browseButton}
              className="group"
            >
              <Grid3X3 style={{ width: 16, height: 16 }} />
              <span>Browse All Materials</span>
              <ChevronRight style={{ width: 14, height: 14, opacity: 0.5 }} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p style={styles.footerText}>
              Hover over categories · Click to apply
            </p>
          </>
        )}
      </div>

      {/* Material Preview Overlay */}
      <MaterialPreviewOverlay
        isOpen={isOverlayOpen}
        onClose={handleCloseOverlay}
        materialType={overlayCategory}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#ffffff',
  },

  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
  },

  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  subtitle: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },

  subtitleInactive: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#9ca3af',
  },

  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
  },

  section: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  // Horizontal container for all category swatches
  swatchContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    paddingTop: '60px', // Moved up ~15% towards midpoint
    paddingBottom: '16px',
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },

  // Wrapper for each category (popup + label)
  swatchWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0px',
  } as React.CSSProperties,

  // Vertical list of material variations (popup)
  variationList: {
    position: 'relative',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 99,
    transition: 'z-index 0.2s',
  } as React.CSSProperties,

  variationListHovered: {
    zIndex: 999,
  },

  // Individual material swatch in popup
  variationItem: {
    width: '46px',
    height: '46px',
    margin: '3px 0',
    position: 'relative',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease, transform 0.15s ease',
  } as React.CSSProperties,

  variationItemCenter: {
    // Center variation always visible
  },

  // The circular swatch itself - flat sticker style
  swatch: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
  },

  // Active checkmark
  activeIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    pointerEvents: 'none',
    zIndex: 10,
  } as React.CSSProperties,

  // Category label below swatch
  swatchLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '4px',
  } as React.CSSProperties,

  // Browse more button
  browseMoreButton: {
    marginTop: '4px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 500,
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  // Tooltip on hover - subtle label
  tooltip: {
    position: 'absolute',
    left: '54px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderRadius: '3px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '10px',
    fontWeight: 500,
    padding: '3px 6px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.15s ease',
    zIndex: 9999,
  } as React.CSSProperties,


  footer: {
    padding: '12px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },

  browseButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 16px',
    marginBottom: '8px',
    backgroundColor: '#18181b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,

  footerText: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
  },
};

// Add CSS for tooltip hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .material-tooltip {
      opacity: 0 !important;
    }
    li:hover .material-tooltip {
      opacity: 1 !important;
    }
  `;
  if (!document.getElementById('material-tooltip-styles')) {
    style.id = 'material-tooltip-styles';
    document.head.appendChild(style);
  }
}
