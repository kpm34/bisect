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

// Preview URLs for metal subcategories (polished variants as defaults)
const METAL_PREVIEW_URLS: Record<string, string> = {
  gold: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/gold-variations/gold-polished.png',
  silver: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/silver-variations/silver-polished.png',
  copper: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/copper-variations/copper-polished.png',
  iron: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/iron-variations/iron-polished.png',
  titanium: 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/metal/titanium-variations/titanium-polished.png',
};

// Default material properties for metal subcategories
const METAL_DEFAULTS: Record<string, { color: string; roughness: number; metalness: number }> = {
  gold: { color: '#FFD700', roughness: 0.15, metalness: 1.0 },
  silver: { color: '#C0C0C0', roughness: 0.15, metalness: 1.0 },
  copper: { color: '#B87333', roughness: 0.2, metalness: 1.0 },
  iron: { color: '#434343', roughness: 0.4, metalness: 1.0 },
  titanium: { color: '#878681', roughness: 0.25, metalness: 1.0 },
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
    const colorHex = parseInt(material.properties.baseColorHex.replace('#', ''), 16);
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
  };

  // Handler for applying metal subcategory (gold, silver, etc.)
  const handleMetalSubcategoryClick = async (item: typeof metalSubcategoryItems[0]) => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected');
      return;
    }

    setSelectedMaterialId({
      category: 'metal',
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
            const categoryMaterials = materialsByCategory[categoryId];

            if (!isMetalCategory && (!categoryMaterials || categoryMaterials.length === 0)) return null;

            // For metal, use the 5 subcategories; for others, use local manifest
            const items = isMetalCategory ? metalSubcategoryItems : categoryMaterials;

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
                    const itemId = isMetalCategory ? (item as any).id : (item as MaterialConfig).id;
                    const isActive = selectedMaterialId?.category === categoryId &&
                      selectedMaterialId?.id === itemId;
                    const isVisible = hoveredCategory === categoryId || isCenter;

                    // Get preview URL
                    const previewUrl = isMetalCategory
                      ? (item as any).previewUrl
                      : ((item as MaterialConfig).thumbnailPath || (item as MaterialConfig).textures?.baseColor);

                    const itemName = isMetalCategory ? (item as any).name : (item as MaterialConfig).name;
                    const itemRoughness = isMetalCategory ? (item as any).roughness : (item as MaterialConfig).properties.roughness;
                    const itemMetalness = isMetalCategory ? (item as any).metalness : (item as MaterialConfig).properties.metallic;

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
                          if (isMetalCategory) {
                            handleMetalSubcategoryClick(item as any);
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
                            backgroundColor: isMetalCategory ? (item as any).color : (item as MaterialConfig).properties.baseColorHex,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            cursor: selectedObject ? 'pointer' : 'not-allowed',
                            opacity: selectedObject ? 1 : 0.5,
                          }}
                        />

                        {/* Active Indicator */}
                        {isActive && (
                          <div style={styles.activeIndicator}>✓</div>
                        )}

                        {/* Tooltip */}
                        <div style={styles.tooltip} className="material-tooltip">
                          {itemName}
                          <div style={styles.tooltipDetails}>
                            M: {itemMetalness.toFixed(1)} · R: {itemRoughness.toFixed(1)}
                          </div>
                          {isMetalCategory && (
                            <div style={styles.tooltipHint}>Click for more →</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Category Label */}
                <span style={styles.swatchLabel}>
                  {CATEGORIES[categoryId]?.label || categoryId}
                </span>

                {/* Browse more link on hover for metal */}
                {hoveredCategory === categoryId && isMetalCategory && (
                  <button
                    style={styles.browseMoreButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open with the center item's category (gold by default)
                      handleBrowseCategory('gold');
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

      {/* Footer with Browse All Button */}
      <div style={styles.footer}>
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
    paddingTop: '120px', // Space for 2 swatches above
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

  // The circular swatch itself
  swatch: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.1)',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 1px 5px rgba(0, 0, 0, 0.3)',
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

  // Tooltip on hover
  tooltip: {
    position: 'absolute',
    left: '60px',
    top: '50%',
    transform: 'translateY(-50%) translateX(-5px)',
    borderRadius: '4px',
    background: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    fontSize: '12px',
    padding: '6px 12px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    zIndex: 9999,
  } as React.CSSProperties,

  tooltipDetails: {
    fontSize: '10px',
    color: '#d1d5db',
    marginTop: '2px',
  },

  tooltipHint: {
    fontSize: '9px',
    color: '#f59e0b',
    marginTop: '4px',
  },

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
