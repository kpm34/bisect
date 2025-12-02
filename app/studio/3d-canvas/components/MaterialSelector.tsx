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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { VariationsDrawer } from './VariationsDrawer';
import { ColorTintPicker } from './ColorTintPicker';
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

// PBR Texture Maps from Supabase storage (downloaded from AmbientCG/Polyhaven)
// These provide realistic texturing for non-metal materials
const SUPABASE_TEXTURES_BASE = 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-textures';

const TEXTURE_MAP_URLS: Record<string, { diffuse?: string; normal?: string; roughness?: string; ao?: string }> = {
  // Stone textures
  marble: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/stone/marble/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/stone/marble/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/stone/marble/roughness.jpg`,
  },
  granite: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/stone/granite/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/stone/granite/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/stone/granite/roughness.jpg`,
  },
  concrete: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/stone/concrete/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/stone/concrete/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/stone/concrete/roughness.jpg`,
  },
  sandstone: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/roughness.jpg`,
  },
  slate: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/stone/slate/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/stone/slate/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/stone/slate/roughness.jpg`,
  },
  // Fabric textures
  cotton: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/roughness.jpg`,
  },
  silk: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/silk/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/fabric/silk/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/fabric/silk/roughness.jpg`,
  },
  denim: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/denim/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/fabric/denim/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/fabric/denim/roughness.jpg`,
  },
  leather: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/leather/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/fabric/leather/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/fabric/leather/roughness.jpg`,
  },
  velvet: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/roughness.jpg`,
  },
  // Wood textures
  oak: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/wood/oak/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/wood/oak/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/wood/oak/roughness.jpg`,
  },
  walnut: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/wood/walnut/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/wood/walnut/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/wood/walnut/roughness.jpg`,
  },
  maple: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/wood/maple/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/wood/maple/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/wood/maple/roughness.jpg`,
  },
  cherry: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/wood/cherry/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/wood/cherry/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/wood/cherry/roughness.jpg`,
  },
  bamboo: {
    diffuse: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/diffuse.jpg`,
    normal: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/normal.jpg`,
    roughness: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/roughness.jpg`,
  },
};

type MaterialCategoryType = MaterialCategory;

export function MaterialSelector() {
  const [hoveredCategory, setHoveredCategory] = useState<MaterialCategoryType | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<{
    category: string;
    id: string;
  } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [tintColor, setTintColor] = useState<string>('#FFFFFF');
  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Get materials from local manifest, grouped by category
  const materialsByCategory = useMemo(() => {
    const result: Record<MaterialCategoryType, MaterialConfig[]> = {} as any;

    // Get active categories with materials (glass hidden - not production ready)
    const activeCategories: MaterialCategoryType[] = ['metal', 'fabric', 'wood', 'stone'];

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

    // Reset category/preset selection for non-subcategory materials
    setSelectedCategorySlug(null);
    setSelectedCategoryName('');
    setSelectedPresetId(null);
  };

  // Handler for applying subcategory (Metal, Stone, Fabric, Wood)
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
    const textureLoader = new THREE.TextureLoader();

    // Check if this material has PBR textures
    const textureMaps = item.textureMaps || TEXTURE_MAP_URLS[item.slug];

    // Load textures if available (for Stone, Fabric, Wood)
    let diffuseMap: THREE.Texture | null = null;
    let normalMap: THREE.Texture | null = null;
    let roughnessMap: THREE.Texture | null = null;
    let aoMap: THREE.Texture | null = null;

    if (textureMaps && (category === 'stone' || category === 'fabric' || category === 'wood')) {
      try {
        const loadTexture = (url: string): Promise<THREE.Texture | null> => {
          return new Promise((resolve) => {
            if (!url) {
              resolve(null);
              return;
            }
            textureLoader.load(
              url,
              (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2); // Tile texture
                resolve(texture);
              },
              undefined,
              () => resolve(null)
            );
          });
        };

        // Load all available textures in parallel
        const [diff, norm, rough, ao] = await Promise.all([
          textureMaps.diffuse ? loadTexture(textureMaps.diffuse) : Promise.resolve(null),
          textureMaps.normal ? loadTexture(textureMaps.normal) : Promise.resolve(null),
          textureMaps.roughness ? loadTexture(textureMaps.roughness) : Promise.resolve(null),
          textureMaps.ao ? loadTexture(textureMaps.ao) : Promise.resolve(null),
        ]);

        diffuseMap = diff;
        normalMap = norm;
        roughnessMap = rough;
        aoMap = ao;

        console.log(`📦 Loaded textures for ${item.name}:`, {
          diffuse: !!diffuseMap,
          normal: !!normalMap,
          roughness: !!roughnessMap,
          ao: !!aoMap
        });
      } catch (error) {
        console.warn('Failed to load textures, falling back to color:', error);
      }
    }

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Create material with textures if available
        // Keep the selected color to tint the texture (multiplied by the diffuse map)
        // This allows the base color swatch to influence the final appearance
        const materialParams: any = {
          color: colorHex, // Keep user's color to tint the texture
          metalness: item.metalness,
          roughness: item.roughness,
          envMapIntensity: category === 'metal' ? 1.5 : 1.0,
        };

        // Add textures if loaded
        if (diffuseMap) materialParams.map = diffuseMap;
        if (normalMap) materialParams.normalMap = normalMap;
        if (roughnessMap) materialParams.roughnessMap = roughnessMap;
        if (aoMap) {
          materialParams.aoMap = aoMap;
          materialParams.aoMapIntensity = 1.0;
        }

        // Add clearcoat for polished surfaces
        if (item.roughness < 0.2) {
          materialParams.clearcoat = 0.5;
          materialParams.clearcoatRoughness = 0.1;
        }

        const material = new THREE.MeshPhysicalMaterial(materialParams);
        child.material = material;

        // Ensure UV2 exists for aoMap
        if (aoMap && child.geometry && !child.geometry.attributes.uv2) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }
      }
    });

    console.log(`✅ Applied "${item.name}" to "${selectedObject.name}"`);

    // Store category info for variations drawer
    setSelectedCategorySlug(item.slug);
    setSelectedCategoryName(item.name);
    setSelectedPresetId(null); // Reset preset selection when changing subcategory
  };

  // Handler for applying a preset from the drawer
  const handleApplyPreset = async (preset: MaterialPreset) => {
    if (!selectedObject) return;

    setSelectedPresetId(preset.id);

    const color = preset.color || '#cccccc';
    const colorHex = parseInt(color.replace('#', ''), 16);

    setColor(colorHex);
    setRoughness(preset.roughness);
    setMetalness(preset.metalness);

    const THREE = await import('three');

    const physicalProps = preset.physical_props;

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const material = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          metalness: preset.metalness,
          roughness: preset.roughness,
          clearcoat: preset.clearcoat ?? (preset.roughness < 0.2 ? 0.5 : 0),
          clearcoatRoughness: physicalProps?.clearcoatRoughness ?? 0.1,
          envMapIntensity: physicalProps?.envMapIntensity ?? 1.5,
        });
        child.material = material;
      }
    });

    console.log(`✅ Applied preset "${preset.name}" to "${selectedObject.name}"`);
  };

  // Handler for applying tint color to current material
  const handleTintColorChange = useCallback(async (color: string) => {
    setTintColor(color);

    if (!selectedObject) return;

    const colorHex = parseInt(color.replace('#', ''), 16);
    setColor(colorHex);

    // Also update the material color directly for immediate feedback
    const THREE = await import('three');

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          if (mat.color) {
            mat.color.setHex(colorHex);
            mat.needsUpdate = true;
          }
        });
      }
    });

    console.log(`🎨 Applied tint color ${color} to "${selectedObject.name}"`);
  }, [selectedObject, setColor]);

  return (
    <div style={styles.container}>
      {/* Selection Status */}
      {selectedObject ? (
        <p style={styles.subtitle}>
          Selected: {selectedObject.name || 'Unnamed Object'}
        </p>
      ) : (
        <p style={styles.subtitleInactive}>
          Select an object to apply materials
        </p>
      )}

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

                    // Calculate top position: center (index 2) at 0, others offset above/below
                    // Each item is 46px + 6px margin = 52px
                    const itemHeight = 52;
                    const centerIndex = 2;
                    const topOffset = (displayIndex - centerIndex) * itemHeight;

                    return (
                      <li
                        key={itemId}
                        style={{
                          ...styles.variationItem,
                          opacity: isVisible ? 1 : 0,
                          pointerEvents: isVisible ? 'auto' : 'none',
                          top: `${topOffset}px`, // All items use absolute positioning now
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Tint Picker - Progressive Disclosure (shows after material selected) */}
      {selectedMaterialId && selectedObject && (
        <div style={styles.tintSection}>
          <ColorTintPicker
            value={tintColor}
            onChange={handleTintColorChange}
            label="Tint Color"
          />
        </div>
      )}

      {/* Footer with Browse Variations Button */}
      <div style={styles.footer}>
        {selectedMaterialId ? (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            <span>Browse Variations</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <p className="text-xs text-zinc-500 text-center py-2">
            Select a material to browse variations
          </p>
        )}
      </div>

      {/* Variations Drawer */}
      <VariationsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categorySlug={selectedCategorySlug}
        categoryName={selectedCategoryName}
        onApplyPreset={handleApplyPreset}
        selectedPresetId={selectedPresetId}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#2d2d2d',
    overflow: 'visible', // Allow material popups to overflow container
  },

  subtitle: {
    margin: '0 0 8px 0',
    padding: '0 24px',
    fontSize: '12px',
    color: '#b0b0b0',
  },

  subtitleInactive: {
    margin: '0 0 8px 0',
    padding: '0 24px',
    fontSize: '12px',
    color: '#808080',
  },

  section: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    overflow: 'visible', // Allow material popups to overflow
    backgroundColor: '#262626',
  },

  tintSection: {
    padding: '20px 24px',
    marginTop: '8px',
    borderTop: '1px solid #3a3a3a',
    borderBottom: '1px solid #3a3a3a',
    backgroundColor: '#1f1f1f',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 600,
    color: '#909090',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  // Horizontal container for all category swatches - responsive to panel width
  swatchContainer: {
    display: 'flex',
    justifyContent: 'space-evenly', // Distribute evenly across available width
    alignItems: 'flex-start', // Align to top so all columns start at same point
    gap: '8px', // Minimum gap between items
    paddingTop: '120px', // Room for 2 items above center (2 * 52px = 104px + buffer)
    paddingBottom: '16px',
    flexWrap: 'nowrap', // Keep all in one row
    maxWidth: '100%',
    overflow: 'visible', // Allow popups to overflow
  },

  // Wrapper for each category (popup + label) - responsive sizing
  // Padding creates generous hover zone covering full popup height
  swatchWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0px',
    flex: '1 1 0', // Allow growing and shrinking equally
    minWidth: '46px', // Minimum width for smallest swatch
    maxWidth: '70px', // Maximum width to prevent over-expansion
    // Add padding to create larger hover detection area
    paddingTop: '110px', // Cover 2 items above (2 * 52px + buffer)
    paddingBottom: '110px', // Cover 2 items below
    paddingLeft: '8px',
    paddingRight: '8px',
    marginTop: '-110px', // Compensate for padding to maintain layout
    marginBottom: '-110px',
  } as React.CSSProperties,

  // Vertical list of material variations (popup) - fixed height container
  variationList: {
    position: 'relative',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 99,
    height: '52px', // Fixed height - center swatch only (46px + 6px margin)
    overflow: 'visible', // Allow items to overflow above/below
  } as React.CSSProperties,

  variationListHovered: {
    zIndex: 999,
  },

  // Individual material swatch in popup
  variationItem: {
    width: '46px',
    height: '46px',
    margin: '3px 0',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)', // Center horizontally
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,

  variationItemCenter: {
    // Center item also absolute - no longer relative to prevent layout shift
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
    color: '#a1a1a1',
    textAlign: 'center',
    marginTop: '4px',
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
    padding: '16px 24px',
    marginTop: '8px',
    backgroundColor: '#2d2d2d',
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
