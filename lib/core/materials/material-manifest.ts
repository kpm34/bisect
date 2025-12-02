/**
 * Material Manifest - Bisect Material Library
 *
 * All textures served from Supabase Storage CDN
 * Base URL: https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews/
 */

const SUPABASE_CDN = 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-previews';

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
    metallicRoughness?: string;
    ao?: string;
    displacement?: string;
  };
  properties: {
    roughness: number;
    metallic: number;
    baseColorHex: string;
  };
  physical?: {
    transmission?: number;
    thickness?: number;
    ior?: number;
    attenuationColor?: string;
    attenuationDistance?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    sheen?: number;
    sheenRoughness?: number;
    sheenColor?: string;
    iridescence?: number;
    iridescenceIOR?: number;
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
// FABRIC MATERIALS (6 PBR Materials)
// ─────────────────────────────────────────────────────────────

const FBR_Cotton: MaterialConfig = {
  id: "FBR_Cotton",
  name: "Cotton",
  displayName: "Cotton",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/cotton/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/cotton/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/cotton/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/cotton/roughness.jpg`,
    ao: `${SUPABASE_CDN}/fabric/cotton/ao.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/cotton/displacement.jpg`,
  },
  properties: { roughness: 0.85, metallic: 0, baseColorHex: "#f5f5f5" },
  tags: ["fabric", "cotton", "soft", "natural"],
  description: "Soft cotton fabric with natural texture"
};

const FBR_Denim: MaterialConfig = {
  id: "FBR_Denim",
  name: "Denim",
  displayName: "Denim",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/denim/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/denim/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/denim/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/denim/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/denim/displacement.jpg`,
  },
  properties: { roughness: 0.8, metallic: 0, baseColorHex: "#4a6fa5" },
  tags: ["fabric", "denim", "jeans", "blue"],
  description: "Classic blue denim fabric"
};

const FBR_Leather: MaterialConfig = {
  id: "FBR_Leather",
  name: "Leather",
  displayName: "Leather",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/leather/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/leather/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/leather/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/leather/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/leather/displacement.jpg`,
  },
  properties: { roughness: 0.5, metallic: 0, baseColorHex: "#8B4513" },
  tags: ["fabric", "leather", "brown", "premium"],
  description: "Rich brown leather with natural grain"
};

const FBR_Silk: MaterialConfig = {
  id: "FBR_Silk",
  name: "Silk",
  displayName: "Silk",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/silk/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/silk/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/silk/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/silk/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/silk/displacement.jpg`,
  },
  properties: { roughness: 0.3, metallic: 0, baseColorHex: "#c41e3a" },
  physical: { sheen: 0.8, sheenRoughness: 0.3, sheenColor: "#ffffff" },
  tags: ["fabric", "silk", "luxury", "shiny"],
  description: "Lustrous silk with beautiful sheen"
};

const FBR_Wool: MaterialConfig = {
  id: "FBR_Wool",
  name: "Wool",
  displayName: "Wool",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/wool/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/wool/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/wool/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/wool/roughness.jpg`,
    ao: `${SUPABASE_CDN}/fabric/wool/ao.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/wool/displacement.jpg`,
  },
  properties: { roughness: 0.9, metallic: 0, baseColorHex: "#e8dcc4" },
  tags: ["fabric", "wool", "knit", "warm"],
  description: "Warm wool fabric with knit texture"
};

const FBR_Cashmere: MaterialConfig = {
  id: "FBR_Cashmere",
  name: "Cashmere",
  displayName: "Cashmere",
  category: "fabric",
  thumbnailPath: `${SUPABASE_CDN}/fabric/cashmere/diffuse.jpg`,
  textures: {
    baseColor: `${SUPABASE_CDN}/fabric/cashmere/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/fabric/cashmere/normal.jpg`,
    roughness: `${SUPABASE_CDN}/fabric/cashmere/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/fabric/cashmere/displacement.jpg`,
  },
  properties: { roughness: 0.7, metallic: 0, baseColorHex: "#d4c4b0" },
  physical: { sheen: 0.4, sheenRoughness: 0.5, sheenColor: "#f0e8dc" },
  tags: ["fabric", "cashmere", "luxury", "soft"],
  description: "Premium cashmere with soft texture"
};

// ─────────────────────────────────────────────────────────────
// METAL MATERIALS (8 Base + Variations)
// ─────────────────────────────────────────────────────────────

const MTL_Gold_Polished: MaterialConfig = {
  id: "MTL_Gold_Polished",
  name: "Gold Polished",
  displayName: "Gold",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/gold-polished.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/gold-polished.png` },
  properties: { roughness: 0.1, metallic: 1.0, baseColorHex: "#ffd700" },
  tags: ["metal", "gold", "polished", "luxury", "featured"],
  description: "Luxurious polished gold"
};

const MTL_Silver_Polished: MaterialConfig = {
  id: "MTL_Silver_Polished",
  name: "Silver Polished",
  displayName: "Silver",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/silver-polished.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/silver-polished.png` },
  properties: { roughness: 0.1, metallic: 1.0, baseColorHex: "#c0c0c0" },
  tags: ["metal", "silver", "polished", "featured"],
  description: "Polished silver with high reflectivity"
};

const MTL_Copper_Polished: MaterialConfig = {
  id: "MTL_Copper_Polished",
  name: "Copper Polished",
  displayName: "Copper",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/copper-polished.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/copper-polished.png` },
  properties: { roughness: 0.15, metallic: 1.0, baseColorHex: "#b87333" },
  tags: ["metal", "copper", "polished", "featured"],
  description: "Polished copper with warm tones"
};

const MTL_Aluminum_Brushed: MaterialConfig = {
  id: "MTL_Aluminum_Brushed",
  name: "Aluminum Brushed",
  displayName: "Brushed Aluminum",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/aluminum-brushed.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/aluminum-brushed.png` },
  properties: { roughness: 0.4, metallic: 1.0, baseColorHex: "#e9ebec" },
  tags: ["metal", "aluminum", "brushed", "featured"],
  description: "Brushed aluminum with directional finish"
};

const MTL_Chrome_Mirror: MaterialConfig = {
  id: "MTL_Chrome_Mirror",
  name: "Chrome Mirror",
  displayName: "Chrome",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/chrome-mirror.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/chrome-mirror.png` },
  properties: { roughness: 0.02, metallic: 1.0, baseColorHex: "#e6e6e6" },
  physical: { clearcoat: 1.0, clearcoatRoughness: 0.0 },
  tags: ["metal", "chrome", "mirror", "reflective"],
  description: "Mirror-finish chrome"
};

const MTL_Brass_Aged: MaterialConfig = {
  id: "MTL_Brass_Aged",
  name: "Brass Aged",
  displayName: "Aged Brass",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/brass-aged.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/brass-aged.png` },
  properties: { roughness: 0.35, metallic: 1.0, baseColorHex: "#c7911c" },
  tags: ["metal", "brass", "aged", "vintage"],
  description: "Aged brass with warm patina"
};

const MTL_Iron_Rusty: MaterialConfig = {
  id: "MTL_Iron_Rusty",
  name: "Iron Rusty",
  displayName: "Rusty Iron",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/iron-rusty.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/iron-rusty.png` },
  properties: { roughness: 0.7, metallic: 0.85, baseColorHex: "#734026" },
  tags: ["metal", "iron", "rusty", "weathered"],
  description: "Weathered rusty iron"
};

const MTL_Steel_Industrial: MaterialConfig = {
  id: "MTL_Steel_Industrial",
  name: "Steel Industrial",
  displayName: "Industrial Steel",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/steel-industrial.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/steel-industrial.png` },
  properties: { roughness: 0.5, metallic: 1.0, baseColorHex: "#8c8c8c" },
  tags: ["metal", "steel", "industrial"],
  description: "Industrial steel with semi-rough finish"
};

const MTL_Titanium_Anodized: MaterialConfig = {
  id: "MTL_Titanium_Anodized",
  name: "Titanium Anodized",
  displayName: "Anodized Titanium",
  category: "metal",
  thumbnailPath: `${SUPABASE_CDN}/metal/titanium-anodized.png`,
  textures: { baseColor: `${SUPABASE_CDN}/metal/titanium-anodized.png` },
  properties: { roughness: 0.25, metallic: 1.0, baseColorHex: "#6673a6" },
  physical: { iridescence: 0.5, iridescenceIOR: 1.3 },
  tags: ["metal", "titanium", "anodized", "iridescent"],
  description: "Anodized titanium with iridescent tones"
};

// ─────────────────────────────────────────────────────────────
// WOOD MATERIALS (12 PBR Materials)
// ─────────────────────────────────────────────────────────────

const WOD_Oak: MaterialConfig = {
  id: "WOD_Oak",
  name: "Oak",
  displayName: "Oak",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/oak.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/oak/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/oak/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/oak/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/oak/displacement.jpg`,
  },
  properties: { roughness: 0.5, metallic: 0, baseColorHex: "#c4a574" },
  tags: ["wood", "oak", "natural", "featured"],
  description: "Natural oak wood grain"
};

const WOD_Walnut: MaterialConfig = {
  id: "WOD_Walnut",
  name: "Walnut",
  displayName: "Walnut",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/walnut.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/walnut/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/walnut/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/walnut/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/walnut/displacement.jpg`,
  },
  properties: { roughness: 0.45, metallic: 0, baseColorHex: "#5c4033" },
  tags: ["wood", "walnut", "dark", "featured"],
  description: "Rich dark walnut"
};

const WOD_Maple: MaterialConfig = {
  id: "WOD_Maple",
  name: "Maple",
  displayName: "Maple",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/maple.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/maple/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/maple/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/maple/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/maple/displacement.jpg`,
  },
  properties: { roughness: 0.4, metallic: 0, baseColorHex: "#e8d4b8" },
  tags: ["wood", "maple", "light", "featured"],
  description: "Light maple wood"
};

const WOD_Cherry: MaterialConfig = {
  id: "WOD_Cherry",
  name: "Cherry",
  displayName: "Cherry",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/cherry.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/cherry/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/cherry/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/cherry/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/cherry/displacement.jpg`,
  },
  properties: { roughness: 0.4, metallic: 0, baseColorHex: "#9b4722" },
  tags: ["wood", "cherry", "red", "warm"],
  description: "Warm cherry wood"
};

const WOD_Pine: MaterialConfig = {
  id: "WOD_Pine",
  name: "Pine",
  displayName: "Pine",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/pine.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/pine/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/pine/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/pine/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/pine/displacement.jpg`,
  },
  properties: { roughness: 0.55, metallic: 0, baseColorHex: "#deb887" },
  tags: ["wood", "pine", "knotty", "rustic"],
  description: "Rustic pine with knots"
};

const WOD_Mahogany: MaterialConfig = {
  id: "WOD_Mahogany",
  name: "Mahogany",
  displayName: "Mahogany",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/mahogany.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/mahogany/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/mahogany/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/mahogany/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/mahogany/displacement.jpg`,
  },
  properties: { roughness: 0.35, metallic: 0, baseColorHex: "#4a0000" },
  tags: ["wood", "mahogany", "rich", "luxury"],
  description: "Rich mahogany"
};

const WOD_Teak: MaterialConfig = {
  id: "WOD_Teak",
  name: "Teak",
  displayName: "Teak",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/teak.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/teak/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/teak/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/teak/roughness.jpg`,
    ao: `${SUPABASE_CDN}/wood/pbr/teak/ao.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/teak/displacement.jpg`,
  },
  properties: { roughness: 0.45, metallic: 0, baseColorHex: "#b8860b" },
  tags: ["wood", "teak", "tropical", "durable"],
  description: "Durable teak wood"
};

const WOD_Bamboo: MaterialConfig = {
  id: "WOD_Bamboo",
  name: "Bamboo",
  displayName: "Bamboo",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/bamboo.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/bamboo/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/bamboo/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/bamboo/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/bamboo/displacement.jpg`,
  },
  properties: { roughness: 0.4, metallic: 0, baseColorHex: "#d8bf8c" },
  tags: ["wood", "bamboo", "natural", "eco"],
  description: "Natural bamboo"
};

const WOD_Ash: MaterialConfig = {
  id: "WOD_Ash",
  name: "Ash",
  displayName: "Ash",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/ash.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/ash/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/ash/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/ash/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/ash/displacement.jpg`,
  },
  properties: { roughness: 0.5, metallic: 0, baseColorHex: "#e0d8c8" },
  tags: ["wood", "ash", "light", "grain"],
  description: "Light ash wood"
};

const WOD_Birch: MaterialConfig = {
  id: "WOD_Birch",
  name: "Birch",
  displayName: "Birch",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/birch.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/birch/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/birch/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/birch/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/birch/displacement.jpg`,
  },
  properties: { roughness: 0.45, metallic: 0, baseColorHex: "#f5deb3" },
  tags: ["wood", "birch", "pale", "scandinavian"],
  description: "Pale birch wood"
};

const WOD_Ebony: MaterialConfig = {
  id: "WOD_Ebony",
  name: "Ebony",
  displayName: "Ebony",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/ebony.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/ebony/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/ebony/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/ebony/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/ebony/displacement.jpg`,
  },
  properties: { roughness: 0.3, metallic: 0, baseColorHex: "#1a1a1a" },
  tags: ["wood", "ebony", "black", "exotic"],
  description: "Dark ebony wood"
};

const WOD_Rosewood: MaterialConfig = {
  id: "WOD_Rosewood",
  name: "Rosewood",
  displayName: "Rosewood",
  category: "wood",
  thumbnailPath: `${SUPABASE_CDN}/wood/rosewood.png`,
  textures: {
    baseColor: `${SUPABASE_CDN}/wood/pbr/rosewood/diffuse.jpg`,
    normal: `${SUPABASE_CDN}/wood/pbr/rosewood/normal.jpg`,
    roughness: `${SUPABASE_CDN}/wood/pbr/rosewood/roughness.jpg`,
    displacement: `${SUPABASE_CDN}/wood/pbr/rosewood/displacement.jpg`,
  },
  properties: { roughness: 0.35, metallic: 0, baseColorHex: "#65000b" },
  tags: ["wood", "rosewood", "exotic", "musical"],
  description: "Exotic rosewood"
};

// ─────────────────────────────────────────────────────────────
// GLASS MATERIALS (MatCap + Variations)
// ─────────────────────────────────────────────────────────────

const GLS_Clear: MaterialConfig = {
  id: "GLS_Clear",
  name: "Clear Glass",
  displayName: "Clear Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/clear/glass-clear-standard.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/clear/glass-clear-standard.png` },
  properties: { roughness: 0.05, metallic: 0, baseColorHex: "#f4fbff" },
  physical: { transmission: 0.95, thickness: 0.5, ior: 1.5 },
  tags: ["glass", "clear", "transparent", "featured"],
  description: "Crystal clear glass"
};

const GLS_Frosted: MaterialConfig = {
  id: "GLS_Frosted",
  name: "Frosted Glass",
  displayName: "Frosted Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/frosted/glass-frosted-satin.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/frosted/glass-frosted-satin.png` },
  properties: { roughness: 0.35, metallic: 0, baseColorHex: "#dfe7ee" },
  physical: { transmission: 0.7, thickness: 0.5, ior: 1.5 },
  tags: ["glass", "frosted", "privacy", "featured"],
  description: "Frosted satin glass"
};

const GLS_Tinted_Smoke: MaterialConfig = {
  id: "GLS_Tinted_Smoke",
  name: "Smoke Glass",
  displayName: "Smoke Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/tinted/glass-tinted-smoke.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/tinted/glass-tinted-smoke.png` },
  properties: { roughness: 0.15, metallic: 0, baseColorHex: "#404040" },
  physical: { transmission: 0.85, thickness: 0.5, ior: 1.5, attenuationColor: "#404040", attenuationDistance: 0.4 },
  tags: ["glass", "tinted", "smoke", "modern"],
  description: "Smoked glass"
};

const GLS_Tinted_Blue: MaterialConfig = {
  id: "GLS_Tinted_Blue",
  name: "Blue Glass",
  displayName: "Blue Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/tinted/glass-tinted-blue.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/tinted/glass-tinted-blue.png` },
  properties: { roughness: 0.08, metallic: 0, baseColorHex: "#4080ff" },
  physical: { transmission: 0.88, thickness: 0.5, ior: 1.5, attenuationColor: "#4080ff", attenuationDistance: 0.5 },
  tags: ["glass", "tinted", "blue", "accent"],
  description: "Blue tinted glass"
};

const GLS_Tinted_Amber: MaterialConfig = {
  id: "GLS_Tinted_Amber",
  name: "Amber Glass",
  displayName: "Amber Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/tinted/glass-tinted-amber.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/tinted/glass-tinted-amber.png` },
  properties: { roughness: 0.12, metallic: 0, baseColorHex: "#f8a540" },
  physical: { transmission: 0.85, thickness: 0.5, ior: 1.5, attenuationColor: "#f8a540", attenuationDistance: 0.5 },
  tags: ["glass", "tinted", "amber", "warm"],
  description: "Warm amber glass"
};

const GLS_MatCap_Pearl: MaterialConfig = {
  id: "GLS_MatCap_Pearl",
  name: "Pearl Glass",
  displayName: "Pearl Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/matcap/glass-matcap-pearl.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/matcap/glass-matcap-pearl.png` },
  properties: { roughness: 0.2, metallic: 0.1, baseColorHex: "#f0ece8" },
  physical: { transmission: 0.6, ior: 1.45, iridescence: 0.3, iridescenceIOR: 1.3 },
  tags: ["glass", "matcap", "pearl", "iridescent"],
  description: "Pearlescent glass"
};

const GLS_Specialty_Holographic: MaterialConfig = {
  id: "GLS_Specialty_Holographic",
  name: "Holographic Glass",
  displayName: "Holographic Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/specialty/glass-specialty-holographic.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/specialty/glass-specialty-holographic.png` },
  properties: { roughness: 0.1, metallic: 0.2, baseColorHex: "#e0e0ff" },
  physical: { transmission: 0.7, ior: 1.5, iridescence: 0.8, iridescenceIOR: 1.5 },
  tags: ["glass", "specialty", "holographic", "futuristic"],
  description: "Holographic effect glass"
};

const GLS_Specialty_Diamond: MaterialConfig = {
  id: "GLS_Specialty_Diamond",
  name: "Diamond Glass",
  displayName: "Diamond Glass",
  category: "glass",
  thumbnailPath: `${SUPABASE_CDN}/glass/specialty/glass-specialty-diamond.png`,
  textures: { baseColor: `${SUPABASE_CDN}/glass/specialty/glass-specialty-diamond.png` },
  properties: { roughness: 0.02, metallic: 0, baseColorHex: "#ffffff" },
  physical: { transmission: 0.98, ior: 2.42, thickness: 0.3 },
  tags: ["glass", "specialty", "diamond", "luxury"],
  description: "Diamond-like brilliance"
};

// ─────────────────────────────────────────────────────────────
// STONE MATERIALS (Color-based for now, can add PBR later)
// ─────────────────────────────────────────────────────────────

const STN_Marble_White: MaterialConfig = {
  id: "STN_Marble_White",
  name: "White Marble",
  displayName: "White Marble",
  category: "stone",
  properties: { roughness: 0.15, metallic: 0, baseColorHex: "#f5f5f5" },
  tags: ["stone", "marble", "white", "luxury", "featured"],
  description: "Classic white marble"
};

const STN_Marble_Black: MaterialConfig = {
  id: "STN_Marble_Black",
  name: "Black Marble",
  displayName: "Black Marble",
  category: "stone",
  properties: { roughness: 0.12, metallic: 0, baseColorHex: "#1a1a1a" },
  tags: ["stone", "marble", "black", "luxury"],
  description: "Elegant black marble"
};

const STN_Granite: MaterialConfig = {
  id: "STN_Granite",
  name: "Granite",
  displayName: "Granite",
  category: "stone",
  properties: { roughness: 0.4, metallic: 0, baseColorHex: "#808080" },
  tags: ["stone", "granite", "speckled", "featured"],
  description: "Speckled granite"
};

const STN_Concrete: MaterialConfig = {
  id: "STN_Concrete",
  name: "Concrete",
  displayName: "Concrete",
  category: "stone",
  properties: { roughness: 0.7, metallic: 0, baseColorHex: "#a0a0a0" },
  tags: ["stone", "concrete", "industrial", "featured"],
  description: "Industrial concrete"
};

const STN_Slate: MaterialConfig = {
  id: "STN_Slate",
  name: "Slate",
  displayName: "Slate",
  category: "stone",
  properties: { roughness: 0.55, metallic: 0, baseColorHex: "#2f4f4f" },
  tags: ["stone", "slate", "dark", "natural"],
  description: "Natural slate"
};

// ─────────────────────────────────────────────────────────────
// MATERIALS MAP
// ─────────────────────────────────────────────────────────────

export const MATERIALS: Record<string, MaterialConfig> = {
  // Fabric
  'FBR_Cotton': FBR_Cotton,
  'FBR_Denim': FBR_Denim,
  'FBR_Leather': FBR_Leather,
  'FBR_Silk': FBR_Silk,
  'FBR_Wool': FBR_Wool,
  'FBR_Cashmere': FBR_Cashmere,
  // Metal
  'MTL_Gold_Polished': MTL_Gold_Polished,
  'MTL_Silver_Polished': MTL_Silver_Polished,
  'MTL_Copper_Polished': MTL_Copper_Polished,
  'MTL_Aluminum_Brushed': MTL_Aluminum_Brushed,
  'MTL_Chrome_Mirror': MTL_Chrome_Mirror,
  'MTL_Brass_Aged': MTL_Brass_Aged,
  'MTL_Iron_Rusty': MTL_Iron_Rusty,
  'MTL_Steel_Industrial': MTL_Steel_Industrial,
  'MTL_Titanium_Anodized': MTL_Titanium_Anodized,
  // Wood
  'WOD_Oak': WOD_Oak,
  'WOD_Walnut': WOD_Walnut,
  'WOD_Maple': WOD_Maple,
  'WOD_Cherry': WOD_Cherry,
  'WOD_Pine': WOD_Pine,
  'WOD_Mahogany': WOD_Mahogany,
  'WOD_Teak': WOD_Teak,
  'WOD_Bamboo': WOD_Bamboo,
  'WOD_Ash': WOD_Ash,
  'WOD_Birch': WOD_Birch,
  'WOD_Ebony': WOD_Ebony,
  'WOD_Rosewood': WOD_Rosewood,
  // Glass
  'GLS_Clear': GLS_Clear,
  'GLS_Frosted': GLS_Frosted,
  'GLS_Tinted_Smoke': GLS_Tinted_Smoke,
  'GLS_Tinted_Blue': GLS_Tinted_Blue,
  'GLS_Tinted_Amber': GLS_Tinted_Amber,
  'GLS_MatCap_Pearl': GLS_MatCap_Pearl,
  'GLS_Specialty_Holographic': GLS_Specialty_Holographic,
  'GLS_Specialty_Diamond': GLS_Specialty_Diamond,
  // Stone
  'STN_Marble_White': STN_Marble_White,
  'STN_Marble_Black': STN_Marble_Black,
  'STN_Granite': STN_Granite,
  'STN_Concrete': STN_Concrete,
  'STN_Slate': STN_Slate,
};

// ─────────────────────────────────────────────────────────────
// CATEGORY CONFIGURATIONS
// ─────────────────────────────────────────────────────────────

export const CATEGORIES: Record<MaterialCategory, CategoryConfig> = {
  fabric: {
    id: 'fabric',
    label: 'Fabric',
    featured: ['FBR_Cotton', 'FBR_Denim', 'FBR_Leather', 'FBR_Silk', 'FBR_Wool'],
    all: ['FBR_Cotton', 'FBR_Denim', 'FBR_Leather', 'FBR_Silk', 'FBR_Wool', 'FBR_Cashmere']
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    featured: ['MTL_Gold_Polished', 'MTL_Silver_Polished', 'MTL_Copper_Polished', 'MTL_Aluminum_Brushed', 'MTL_Chrome_Mirror'],
    all: ['MTL_Gold_Polished', 'MTL_Silver_Polished', 'MTL_Copper_Polished', 'MTL_Aluminum_Brushed', 'MTL_Chrome_Mirror', 'MTL_Brass_Aged', 'MTL_Iron_Rusty', 'MTL_Steel_Industrial', 'MTL_Titanium_Anodized']
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    featured: ['WOD_Oak', 'WOD_Walnut', 'WOD_Maple', 'WOD_Cherry', 'WOD_Mahogany'],
    all: ['WOD_Oak', 'WOD_Walnut', 'WOD_Maple', 'WOD_Cherry', 'WOD_Pine', 'WOD_Mahogany', 'WOD_Teak', 'WOD_Bamboo', 'WOD_Ash', 'WOD_Birch', 'WOD_Ebony', 'WOD_Rosewood']
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    featured: [], // Hidden from UI - not production ready
    all: [] // Glass materials preserved in code but hidden until production ready
  },
  stone: {
    id: 'stone',
    label: 'Stone',
    featured: ['STN_Marble_White', 'STN_Granite', 'STN_Concrete', 'STN_Slate'],
    all: ['STN_Marble_White', 'STN_Marble_Black', 'STN_Granite', 'STN_Concrete', 'STN_Slate']
  },
  ceramic: {
    id: 'ceramic',
    label: 'Ceramic',
    featured: [],
    all: []
  },
  plastic: {
    id: 'plastic',
    label: 'Plastic',
    featured: [],
    all: []
  },
  toon: {
    id: 'toon',
    label: 'Toon',
    featured: [],
    all: []
  },
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
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
