/**
 * Material Types
 *
 * Type system for Spline materials based on RootNodeMaterial structure
 * from Session 27 discoveries.
 */

/**
 * Material category in UI
 */
export type MaterialCategory =
  | 'metal'
  | 'glass'
  | 'stone'
  | 'ceramic'
  | 'toon'
  | 'fabric'
  | 'wood'
  | 'plastic';

/**
 * RootNodeMaterial uniforms (from Session 27)
 * Maps to Spline's internal material structure
 */
export interface MaterialUniforms {
  /** nodeU0 - Main color (RGB 0-1) */
  nodeU0: {
    r: number;
    g: number;
    b: number;
  };

  /** nodeU1 - Opacity (0-1) */
  nodeU1: number;

  /** nodeU2 - Secondary color (ambient) - optional */
  nodeU2?: {
    r: number;
    g: number;
    b: number;
  };

  /** nodeU5 - Roughness (0=glossy, 1=matte) */
  nodeU5: number;

  /** nodeU6 - Metalness (0=non-metallic, 1=metallic) */
  nodeU6: number;
}

/**
 * Texture map data for material
 */
export interface TextureMap {
  /** Base64 encoded texture data or URL */
  data: string;

  /** External URL for on-demand loading (Supabase Storage, CDN, source) */
  url?: string;

  /** Original texture resolution */
  resolution: {
    width: number;
    height: number;
  };

  /** Texture format (png, jpeg, webp) */
  format: 'png' | 'jpeg' | 'webp';

  /** File size in bytes */
  size: number;

  /** Is this a thumbnail or full resolution? */
  isThumbnail?: boolean;
}

/**
 * Material textures (from Blender/GLTF exports)
 */
export interface MaterialTextures {
  /** Base color/diffuse map */
  baseColor?: TextureMap;

  /** Normal map (tangent space) */
  normal?: TextureMap;

  /** Packed texture: R=Occlusion, G=Roughness, B=Metalness */
  metallicRoughness?: TextureMap;

  /** Ambient occlusion map (if separate) */
  occlusion?: TextureMap;

  /** Emissive/glow map */
  emissive?: TextureMap;

  /** Displacement/height map */
  displacement?: TextureMap;

  /** 512px thumbnail for UI preview (embedded base64) */
  thumbnail?: TextureMap;

  /** External storage references for full-resolution textures */
  external?: {
    /** Supabase Storage paths for full-res textures */
    supabase?: {
      baseColor?: string;
      normal?: string;
      metallicRoughness?: string;
      occlusion?: string;
      emissive?: string;
      displacement?: string;
    };
    /** CDN URLs for full-res textures */
    cdn?: {
      baseColor?: string;
      normal?: string;
      metallicRoughness?: string;
      occlusion?: string;
      emissive?: string;
      displacement?: string;
    };
    /** Original source links (PolyHaven, CGBookcase, etc.) */
    source?: {
      url: string;
      license: string;
      resolution?: string;  // e.g., "4K", "8K"
    };
  };
}

/**
 * Material preset from GLTF or manual definition
 */
export interface MaterialPreset {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Category for UI grouping */
  category: MaterialCategory;

  /** RootNodeMaterial uniforms */
  uniforms: MaterialUniforms;

  /** Texture maps (lazy loaded) */
  textures?: MaterialTextures;

  /** Optional preview image (base64 or URL) */
  preview?: string;

  /** Usage statistics */
  usageCount?: number;

  /** Tags for search */
  tags?: string[];

  /** Source file reference */
  source?: string;

  /** Material description for semantic search */
  description?: string;
}

/**
 * GLTF PBR Material data (input format)
 */
export interface GLTFPBRMaterial {
  pbrMetallicRoughness: {
    baseColorFactor: [number, number, number, number];
    metallicFactor: number;
    roughnessFactor: number;
  };
  name?: string;
  doubleSided?: boolean;
}

/**
 * React Three Fiber glass configuration
 */
export interface R3FGlassConfig {
  type: 'r3f-glass';
  /** Transmission (0-1, transparency) */
  transmission: number;
  /** Thickness (affects refraction) */
  thickness: number;
  /** Roughness (0-1) */
  roughness: number;
  /** IOR (Index of Refraction) */
  ior: number;
  /** Chromatic aberration */
  chromaticAberration?: number;
  /** Resolution for transmission buffer */
  resolution?: number;
}

/**
 * Advanced physical material properties (MeshPhysicalMaterial)
 * These extend beyond basic PBR for premium material effects
 */
export interface PhysicalMaterialProperties {
  // === Clearcoat (car paint, lacquered surfaces) ===
  /** Clearcoat intensity 0-1 */
  clearcoat?: number;
  /** Clearcoat roughness 0-1 */
  clearcoatRoughness?: number;

  // === Sheen (fabric, velvet) ===
  /** Sheen intensity 0-1 */
  sheen?: number;
  /** Sheen roughness 0-1 (0.3=silk, 0.8=velvet) */
  sheenRoughness?: number;
  /** Sheen tint color (hex) */
  sheenColor?: string;

  // === Transmission (glass, plastic) ===
  /** Transmission 0-1 (0=opaque, 1=fully transmissive) */
  transmission?: number;
  /** Material thickness for attenuation */
  thickness?: number;
  /** Index of refraction (default 1.5 for glass) */
  ior?: number;
  /** Attenuation color for colored glass */
  attenuationColor?: string;
  /** Attenuation distance */
  attenuationDistance?: number;

  // === Iridescence (soap bubbles, oil slicks) ===
  /** Iridescence intensity 0-1 */
  iridescence?: number;
  /** Iridescence IOR */
  iridescenceIOR?: number;
  /** Iridescence thickness range [min, max] in nm */
  iridescenceThicknessRange?: [number, number];

  // === Anisotropy (brushed metal) ===
  /** Anisotropy strength 0-1 */
  anisotropy?: number;
  /** Anisotropy rotation in radians */
  anisotropyRotation?: number;
}

/**
 * Environment/HDRI presets available in the editor
 */
export type EnvironmentPreset =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse';

/**
 * Scene environment configuration
 */
export interface SceneEnvironment {
  /** Environment preset or custom HDRI URL */
  preset?: EnvironmentPreset;
  /** Custom HDRI file URL */
  hdriUrl?: string;
  /** Show environment as background */
  background?: boolean;
  /** Background blur amount 0-1 */
  blur?: number;
  /** Environment map intensity multiplier */
  intensity?: number;
}

/**
 * Material preset with special effects
 */
export interface MaterialPresetWithEffects extends MaterialPreset {
  /** Special effects configuration */
  effects?: {
    glass?: R3FGlassConfig;
  };
  /** Advanced physical material properties */
  physical?: PhysicalMaterialProperties;
}
