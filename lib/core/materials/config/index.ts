/**
 * Material Library Configuration (SSOT) - Entry Point
 *
 * This module provides access to the Single Source of Truth for all material
 * organization decisions.
 *
 * Usage:
 * ```typescript
 * import { materialLibraryConfig, type MaterialLibraryConfig } from '@/lib/core/materials/config';
 * ```
 */

import config from './material-library-config.json';
import type {
  MaterialLibraryConfig,
  CategoryConfig,
  UIConfig,
  ProcessingConfig,
  MaterialTier,
  EnabledCategory,
  ValidationResult,
} from './material-library-config.types';

// Export the configuration object
export const materialLibraryConfig: MaterialLibraryConfig = config as MaterialLibraryConfig;

// Export all types
export type {
  MaterialLibraryConfig,
  CategoryConfig,
  UIConfig,
  ProcessingConfig,
  MaterialTier,
  EnabledCategory,
  ValidationResult,
};

// Export helper functions
export function getEnabledCategories(config: MaterialLibraryConfig = materialLibraryConfig): EnabledCategory[] {
  return config.categories
    .filter((cat): cat is EnabledCategory => cat.enabled)
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedMaterials(categoryId: string, config: MaterialLibraryConfig = materialLibraryConfig): string[] {
  const category = config.categories.find((c) => c.id === categoryId);
  return category?.featured || [];
}

export function getAllMaterials(categoryId: string, config: MaterialLibraryConfig = materialLibraryConfig): string[] {
  const category = config.categories.find((c) => c.id === categoryId);
  if (!category) return [];
  return [...category.featured, ...category.advanced];
}

export function getAllMaterialIds(config: MaterialLibraryConfig = materialLibraryConfig): string[] {
  return config.categories.flatMap((cat) => [...cat.featured, ...cat.advanced]);
}

export function isFeaturedMaterial(materialId: string, config: MaterialLibraryConfig = materialLibraryConfig): boolean {
  return config.categories.some((cat) => cat.featured.includes(materialId));
}

export function getCategoryForMaterial(materialId: string, config: MaterialLibraryConfig = materialLibraryConfig): string | undefined {
  const category = config.categories.find(
    (cat) => cat.featured.includes(materialId) || cat.advanced.includes(materialId)
  );
  return category?.id;
}

export function getMaterialTier(materialId: string, config: MaterialLibraryConfig = materialLibraryConfig): MaterialTier | undefined {
  for (const category of config.categories) {
    if (category.featured.includes(materialId)) return 'featured';
    if (category.advanced.includes(materialId)) return 'advanced';
  }
  return undefined;
}
