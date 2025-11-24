/**
 * Material Manifest - Auto-generated from PBR assets
 *
 * Generated: 2025-11-15T05:20:29.795Z
 * Source: /public/materials/
 */

export type MaterialCategory = 'fabric' | 'metal' | 'stone' | 'wood' | 'ceramic' | 'glass' | 'plastic' | 'toon';

export interface MaterialConfig {
  id: string;
  name: string;
  displayName: string;
  category: MaterialCategory;
  thumbnailPath?: string;
  textures?: {
    baseColor?: string;
    normal?: string;
    roughness?: string;
    metallic?: string;
  };
  properties: {
    roughness: number;
    metallic: number;
    baseColorHex: string;
  };
  tags: string[];
  description: string;
}

export interface CategoryConfig {
  id: MaterialCategory;
  label: string;
  featured: string[];
  all: string[];
}

// ─────────────────────────────────────────────────────────────
// Materials
// ─────────────────────────────────────────────────────────────

export const MATERIALS: Record<string, MaterialConfig> = {
  "fabric_Fabric051": {
    "id": "fabric_Fabric051",
    "name": "Fabric051",
    "displayName": "Cotton Fabric",
    "category": "fabric",
    "textures": {
      "baseColor": "/materials/fabric/Fabric051/baseColor.jpg",
      "normal": "/materials/fabric/Fabric051/normal.jpg",
      "roughness": "/materials/fabric/Fabric051/roughness.jpg"
    },
    "properties": {
      "roughness": 0.8,
      "metallic": 0,
      "baseColorHex": "#cccccc"
    },
    "tags": [
      "fabric",
      "fabric051"
    ],
    "description": "Cotton Fabric PBR material with realistic textures"
  },
  "metal_Metal034": {
    "id": "metal_Metal034",
    "name": "Metal034",
    "displayName": "Brushed Aluminum",
    "category": "metal",
    "textures": {
      "baseColor": "/materials/metal/Metal034/baseColor.jpg",
      "normal": "/materials/metal/Metal034/normal.jpg",
      "roughness": "/materials/metal/Metal034/roughness.jpg",
      "metallic": "/materials/metal/Metal034/metallic.jpg"
    },
    "properties": {
      "roughness": 0.3,
      "metallic": 0.9,
      "baseColorHex": "#cccccc"
    },
    "tags": [
      "metal",
      "metal034"
    ],
    "description": "Brushed Aluminum PBR material with realistic textures"
  },
  "wood_Wood051": {
    "id": "wood_Wood051",
    "name": "Wood051",
    "displayName": "Oak Wood Planks",
    "category": "wood",
    "textures": {
      "baseColor": "/materials/wood/Wood051/baseColor.jpg",
      "normal": "/materials/wood/Wood051/normal.jpg",
      "roughness": "/materials/wood/Wood051/roughness.jpg"
    },
    "properties": {
      "roughness": 0.5,
      "metallic": 0,
      "baseColorHex": "#cccccc"
    },
    "tags": [
      "wood",
      "wood051"
    ],
    "description": "Oak Wood Planks PBR material with realistic textures"
  },
  "stone_Rock035": {
    "id": "stone_Rock035",
    "name": "Rock035",
    "displayName": "Granite Rock",
    "category": "stone",
    "textures": {
      "baseColor": "/materials/stone/Rock035/baseColor.jpg",
      "normal": "/materials/stone/Rock035/normal.jpg",
      "roughness": "/materials/stone/Rock035/roughness.jpg"
    },
    "properties": {
      "roughness": 0.5,
      "metallic": 0,
      "baseColorHex": "#cccccc"
    },
    "tags": [
      "stone",
      "rock035"
    ],
    "description": "Granite Rock PBR material with realistic textures"
  },
  "plastic_Plastic008": {
    "id": "plastic_Plastic008",
    "name": "Plastic008",
    "displayName": "Smooth Plastic",
    "category": "plastic",
    "textures": {
      "baseColor": "/materials/plastic/Plastic008/baseColor.jpg",
      "normal": "/materials/plastic/Plastic008/normal.jpg",
      "roughness": "/materials/plastic/Plastic008/roughness.jpg"
    },
    "properties": {
      "roughness": 0.5,
      "metallic": 0,
      "baseColorHex": "#cccccc"
    },
    "tags": [
      "plastic",
      "plastic008"
    ],
    "description": "Smooth Plastic PBR material with realistic textures"
  }
};

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export const CATEGORIES: Record<MaterialCategory, CategoryConfig> = {
  fabric: {
    id: 'fabric',
    label: 'Fabric',
    featured: ["fabric_Fabric051"],
    all: ["fabric_Fabric051"]
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    featured: ["metal_Metal034"],
    all: ["metal_Metal034"]
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    featured: ["wood_Wood051"],
    all: ["wood_Wood051"]
  },
  stone: {
    id: 'stone',
    label: 'Stone',
    featured: ["stone_Rock035"],
    all: ["stone_Rock035"]
  },
  plastic: {
    id: 'plastic',
    label: 'Plastic',
    featured: ["plastic_Plastic008"],
    all: ["plastic_Plastic008"]
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    featured: [],
    all: []
  },
  ceramic: {
    id: 'ceramic',
    label: 'Ceramic',
    featured: [],
    all: []
  },
  toon: {
    id: 'toon',
    label: 'Toon',
    featured: [],
    all: []
  }
};

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function getMaterial(id: string): MaterialConfig | undefined {
  return MATERIALS[id];
}

export function getCategoryMaterials(category: MaterialCategory): MaterialConfig[] {
  const categoryConfig = CATEGORIES[category];
  return categoryConfig.all.map(id => MATERIALS[id]).filter(Boolean);
}

export function getFeaturedMaterials(category: MaterialCategory): MaterialConfig[] {
  const categoryConfig = CATEGORIES[category];
  return categoryConfig.featured.map(id => MATERIALS[id]).filter(Boolean);
}

export function searchMaterials(query: string): MaterialConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(MATERIALS).filter(material => {
    return (
      material.name.toLowerCase().includes(lowerQuery) ||
      material.displayName.toLowerCase().includes(lowerQuery) ||
      material.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

export function getActiveCategories(): MaterialCategory[] {
  return Object.keys(CATEGORIES).filter(
    category => CATEGORIES[category as MaterialCategory].all.length > 0
  ) as MaterialCategory[];
}
