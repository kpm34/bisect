'use client';

/**
 * MaterialSelector - Circular Material Swatches with Vertical Popup
 *
 * Matches Spline AI Extension UI exactly:
 * - Horizontal row of circular material swatches
 * - Each category shows center variation by default
 * - Hover reveals 5 variations in vertical popup
 * - Click to apply PBR material with textures
 *
 * Now fetches materials from Appwrite database instead of local manifest
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSelection } from '../r3f/SelectionContext';
import {
  MaterialConfig,
  MaterialCategory,
  CATEGORIES,
  getCategoryMaterials,
  getFeaturedMaterials,
} from '@/lib/core/materials';

type MaterialCategoryType = MaterialCategory;

export function MaterialSelector() {
  const [hoveredCategory, setHoveredCategory] = useState<MaterialCategoryType | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<{
    category: string;
    id: string;
  } | null>(null);
  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Get all materials from local manifest
  const materials = useMemo(() => {
    const allMaterials: MaterialConfig[] = [];
    Object.values(CATEGORIES).forEach(category => {
      allMaterials.push(...getCategoryMaterials(category.id));
    });
    return allMaterials;
  }, []);

  // Group materials by category
  const materialsByCategory = useMemo(() => {
    return materials.reduce((acc, material) => {
      if (!acc[material.category]) {
        acc[material.category] = [];
      }
      acc[material.category].push(material);
      return acc;
    }, {} as Record<MaterialCategoryType, MaterialConfig[]>);
  }, [materials]);

  const activeCategories = Object.keys(materialsByCategory) as MaterialCategoryType[];

  // Handler for applying material
  const handleMaterialClick = async (material: MaterialConfig) => {
    if (!selectedObject) {
      console.warn('⚠️  No object selected');
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

    // Apply textures if available
    if (material.textures?.baseColor) {
      const textureUrl = material.textures.baseColor;
      console.log(`🖼️ Loading texture: ${textureUrl}`);

      // Load texture and apply to selected object's material
      try {
        const { TextureLoader } = await import('three');
        const loader = new TextureLoader();

        loader.load(
          textureUrl,
          (texture) => {
            // Apply texture to all meshes in selected object
            selectedObject.traverse((child: any) => {
              if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                  if (mat.map !== undefined) {
                    mat.map = texture;
                    mat.needsUpdate = true;
                  }
                });
              }
            });
            console.log(`✅ Applied texture to "${selectedObject.name}"`);
          },
          undefined,
          (error) => {
            console.error('❌ Failed to load texture:', error);
          }
        );
      } catch (error) {
        console.error('❌ Failed to import TextureLoader:', error);
      }
    }

    console.log(`✅ Applied "${material.name}" to "${selectedObject.name}"`);
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
      {
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>SELECT MATERIAL</h4>
          <div style={styles.swatchContainer}>
            {activeCategories.map((categoryId) => {
              const categoryMaterials = materialsByCategory[categoryId];
              if (!categoryMaterials || categoryMaterials.length === 0) return null;

              // Use first material as center (default visible)
              const centerIndex = 0;

              return (
                <div
                  key={categoryId}
                  style={styles.swatchWrapper}
                  onMouseEnter={() => setHoveredCategory(categoryId)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {/* Vertical Popup List */}
                  <ul
                    style={{
                      ...styles.variationList,
                      ...(hoveredCategory === categoryId ? styles.variationListHovered : {})
                    }}
                  >
                    {categoryMaterials.slice(0, 5).map((material, index) => {
                      const isCenter = index === centerIndex;
                      const isActive = selectedMaterialId?.category === material.category &&
                                       selectedMaterialId?.id === material.id;
                      const isVisible = hoveredCategory === categoryId || isCenter;

                      // Get texture URL from material config
                      const baseColorUrl = material.textures?.baseColor;

                      return (
                        <li
                          key={material.id}
                          style={{
                            ...styles.variationItem,
                            opacity: isVisible ? 1 : 0,
                            ...(isCenter ? styles.variationItemCenter : {})
                          }}
                          onClick={() => handleMaterialClick(material)}
                        >
                          {/* Material Swatch with Texture */}
                          <div
                            style={{
                              ...styles.swatch,
                              backgroundImage: baseColorUrl
                                ? `url(${baseColorUrl})`
                                : undefined,
                              backgroundColor: material.properties.baseColorHex,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />

                          {/* Active Indicator */}
                          {isActive && (
                            <div style={styles.activeIndicator}>✓</div>
                          )}

                          {/* Tooltip */}
                          <div style={styles.tooltip} className="material-tooltip">
                            {material.name}
                            <div style={styles.tooltipDetails}>
                              M: {material.properties.metallic.toFixed(1)} · R:{' '}
                              {material.properties.roughness.toFixed(1)}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Category Label - inside swatchWrapper */}
                  <span style={styles.swatchLabel}>
                    {categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      }

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Hover over categories · Click to apply
        </p>
      </div>
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
    gap: '12px',
    paddingTop: '48px',
    paddingBottom: '24px',
    flexWrap: 'nowrap',
    maxWidth: '100%',
    padding: '48px 12px 24px',
  },

  // Wrapper for each category (popup + label)
  swatchWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,

  // Vertical list of material variations (popup)
  variationList: {
    position: 'relative',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
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
    margin: '4px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease, transform 0.1s ease',
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
    marginTop: '8px',
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

  loadingText: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center',
    padding: '48px 24px',
  } as React.CSSProperties,

  footer: {
    padding: '12px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },

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
