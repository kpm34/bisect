/**
 * Materials Module
 *
 * Complete material system with GLTF parsing, presets, and types
 */

// Export all types
export type {
  MaterialCategory,
  MaterialUniforms,
  MaterialPreset,
  MaterialPresetWithEffects,
  GLTFPBRMaterial,
} from './types';

// Export Material Manifest (generated from assets/materials/)
// This is client-safe (no Node.js dependencies)
export {
  type MaterialConfig,
  type CategoryConfig,
  MATERIALS,
  CATEGORIES,
  getMaterial,
  getCategoryMaterials,
  getFeaturedMaterials,
  searchMaterials,
  getActiveCategories,
} from './material-manifest';

// Note: GLTF parser functions (parseGLTFMaterial, rgbToHex) are NOT exported here
// because they contain Node.js dependencies (fs module) that break browser builds.
// Import them directly from './gltf-parser' in server-side code only.

// Export JSON data (re-export for convenience)
// Note: These can be imported directly from @/lib/core/src/materials/*.json
// but we don't re-export them here to avoid bundling issues
