/**
 * Type definitions for Material Library Configuration (SSOT)
 *
 * ⚠️ IMPORTANT: These types match the structure of material-library-config.json
 *
 * If you change the config schema, update these types accordingly and increment schemaVersion.
 */

/**
 * Main configuration object for the material library system.
 * This is the Single Source of Truth (SSOT) for all material organization decisions.
 */
export interface MaterialLibraryConfig {
  /** Semantic version of the configuration (e.g., "1.0.0") */
  version: string;

  /** Schema version for backward compatibility (increment on breaking changes) */
  schemaVersion: string;

  /** ISO 8601 timestamp of last configuration update */
  lastUpdated: string;

  /** Human-readable description of this configuration */
  description: string;

  /** Material categories and their organization */
  categories: CategoryConfig[];

  /** UI component configuration (dimensions, animations) */
  ui: UIConfig;

  /** Processing pipeline configuration */
  processing: ProcessingConfig;

  /** Developer notes and instructions */
  notes: string[];
}

/**
 * Configuration for a single material category (e.g., Metal, Glass, Wood).
 * Defines which materials are "featured" (shown on hover) vs "advanced" (shown in drawer).
 */
export interface CategoryConfig {
  /** Unique category identifier (lowercase, no spaces) */
  id: string;

  /** Display name for UI (e.g., "Metal", "Glass") */
  label: string;

  /** Sort order in main panel (1 = first, 2 = second, etc.) */
  order: number;

  /** Whether this category is currently active */
  enabled: boolean;

  /** Material IDs shown in hover popup (typically 5 materials) */
  featured: string[];

  /** Additional material IDs shown in drawer (typically 3+ materials) */
  advanced: string[];
}

/**
 * UI component configuration for layout, sizing, and animations
 */
export interface UIConfig {
  /** Main panel configuration (horizontal row of category swatches) */
  mainPanel: {
    /** Maximum number of categories to show (V1: 6) */
    maxCategories: number;

    /** Diameter of category swatch circles in pixels */
    swatchSize: number;

    /** Horizontal gap between swatches in pixels */
    swatchGap: number;

    /** Developer comment (ignored by code) */
    comment?: string;
  };

  /** Hover popup configuration (vertical list of featured materials) */
  hoverPopup: {
    /** If true, only show materials from 'featured' array */
    showFeaturedOnly: boolean;

    /** Maximum number of items to show in popup */
    maxItems: number;

    /** Height of each item in pixels (includes margin) */
    itemHeight: number;

    /** Animation duration in milliseconds */
    animationDuration: number;

    /** Developer comment (ignored by code) */
    comment?: string;
  };

  /** Drawer configuration (slide-out panel for advanced materials) */
  drawer: {
    /** If true, show both featured and advanced materials */
    showAllMaterials: boolean;

    /** Drawer width in pixels */
    width: number;

    /** Number of columns in material grid */
    columns: number;

    /** Animation duration in milliseconds */
    animationDuration: number;

    /** Developer comment (ignored by code) */
    comment?: string;
  };
}

/**
 * Configuration for the material processing pipeline (build-time)
 */
export interface ProcessingConfig {
  /** Thumbnail size in pixels (square, e.g., 128 = 128x128) */
  thumbnailSize: number;

  /** Which tiers to include in processing (typically both) */
  includeTiers: ('featured' | 'advanced')[];

  /** Whether to generate natural language descriptions for ChromaDB */
  generateDescriptions: boolean;

  /** Whether to index materials in ChromaDB for semantic search */
  indexInChromaDB: boolean;

  /** Developer comment (ignored by code) */
  comment?: string;
}

/**
 * Helper type: Material tier classification
 */
export type MaterialTier = 'featured' | 'advanced';

/**
 * Helper type: Enabled categories only
 */
export type EnabledCategory = CategoryConfig & { enabled: true };

/**
 * Helper functions (exported as types for documentation)
 */
export interface MaterialLibraryConfigHelpers {
  /** Get all enabled categories sorted by order */
  getEnabledCategories(config: MaterialLibraryConfig): EnabledCategory[];

  /** Get featured material IDs for a specific category */
  getFeaturedMaterials(config: MaterialLibraryConfig, categoryId: string): string[];

  /** Get all material IDs (featured + advanced) for a specific category */
  getAllMaterials(config: MaterialLibraryConfig, categoryId: string): string[];

  /** Get all material IDs across all categories */
  getAllMaterialIds(config: MaterialLibraryConfig): string[];

  /** Check if a material ID is featured in any category */
  isFeaturedMaterial(config: MaterialLibraryConfig, materialId: string): boolean;

  /** Get the category ID for a material ID */
  getCategoryForMaterial(config: MaterialLibraryConfig, materialId: string): string | undefined;
}

/**
 * Validation result from validate-material-config.ts
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalCategories: number;
    enabledCategories: number;
    totalMaterials: number;
    featuredMaterials: number;
    advancedMaterials: number;
  };
}
