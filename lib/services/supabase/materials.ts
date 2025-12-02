import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type {
  Database,
  MaterialCategory,
  MaterialPreset,
  MaterialVariation,
  MaterialProperties,
  MaterialPresetWithCategory,
  PhysicalProps
} from './types';

// Type aliases for insert operations
type CategoryInsert = Database['public']['Tables']['material_categories']['Insert'];
type PresetInsert = Database['public']['Tables']['material_presets']['Insert'];
type VariationInsert = Database['public']['Tables']['material_variations']['Insert'];

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<MaterialCategory[]> {
  const { data, error } = await supabase
    .from('material_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch material categories:', error);
    return [];
  }

  return (data as MaterialCategory[]) || [];
}

export async function getCategoryBySlug(slug: string): Promise<MaterialCategory | null> {
  const { data, error } = await supabase
    .from('material_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Failed to fetch category:', error);
    return null;
  }

  return data as MaterialCategory;
}

export async function createCategory(
  category: CategoryInsert
): Promise<MaterialCategory | null> {
  const { data, error } = await supabase
    .from('material_categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Failed to create category:', error);
    return null;
  }

  return data as MaterialCategory;
}

// ============================================================================
// PRESETS
// ============================================================================

export async function getPresetsByCategory(categoryId: string): Promise<MaterialPreset[]> {
  const { data, error } = await supabase
    .from('material_presets')
    .select('*')
    .eq('category_id', categoryId)
    .order('tab')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch presets:', error);
    return [];
  }

  return (data as MaterialPreset[]) || [];
}

export async function getPresetsByCategorySlug(categorySlug: string): Promise<MaterialPreset[]> {
  // First get category by slug
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];

  return getPresetsByCategory(category.id);
}

export async function getPresetsByCategoryAndTab(
  categoryId: string,
  tab: 'finishes' | 'tints' | 'aged'
): Promise<MaterialPreset[]> {
  const { data, error } = await supabase
    .from('material_presets')
    .select('*')
    .eq('category_id', categoryId)
    .eq('tab', tab)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch presets by tab:', error);
    return [];
  }

  return (data as MaterialPreset[]) || [];
}

export async function getPresetBySlug(slug: string): Promise<MaterialPreset | null> {
  const { data, error } = await supabase
    .from('material_presets')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Failed to fetch preset:', error);
    return null;
  }

  return data as MaterialPreset;
}

export async function getPresetWithCategory(slug: string): Promise<MaterialPresetWithCategory | null> {
  const { data, error } = await supabase
    .from('material_presets')
    .select(`
      *,
      category:material_categories(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Failed to fetch preset with category:', error);
    return null;
  }

  return data as MaterialPresetWithCategory;
}

export async function createPreset(
  preset: PresetInsert
): Promise<MaterialPreset | null> {
  const { data, error } = await supabase
    .from('material_presets')
    .insert(preset)
    .select()
    .single();

  if (error) {
    console.error('Failed to create preset:', error);
    return null;
  }

  return data as MaterialPreset;
}

// ============================================================================
// VARIATIONS (Browse)
// ============================================================================

export async function getVariationsByPreset(presetId: string): Promise<MaterialVariation[]> {
  const { data, error } = await supabase
    .from('material_variations')
    .select('*')
    .eq('preset_id', presetId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch variations:', error);
    return [];
  }

  return (data as MaterialVariation[]) || [];
}

export async function getVariationsByPresetSlug(presetSlug: string): Promise<MaterialVariation[]> {
  const preset = await getPresetBySlug(presetSlug);
  if (!preset) return [];

  return getVariationsByPreset(preset.id);
}

export async function createVariation(
  variation: VariationInsert
): Promise<MaterialVariation | null> {
  const { data, error } = await supabase
    .from('material_variations')
    .insert(variation)
    .select()
    .single();

  if (error) {
    console.error('Failed to create variation:', error);
    return null;
  }

  return data as MaterialVariation;
}

// ============================================================================
// STORAGE
// ============================================================================

export async function uploadPreviewImage(file: File, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('material-previews')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Failed to upload preview image:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('material-previews')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export function getPreviewUrl(path: string): string {
  const { data } = supabase.storage
    .from('material-previews')
    .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert hex color string to Three.js color number
 */
export function hexToThreeColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Convert preset to material properties for Three.js MeshPhysicalMaterial
 */
export function presetToMaterialProperties(preset: MaterialPreset): MaterialProperties {
  const props: MaterialProperties = {
    color: hexToThreeColor(preset.color),
    roughness: preset.roughness,
    metalness: preset.metalness,
  };

  // Add clearcoat if present
  if (preset.clearcoat != null) {
    props.clearcoat = preset.clearcoat;
  }

  // Merge physical_props if present
  if (preset.physical_props) {
    const pp = preset.physical_props;
    if (pp.clearcoatRoughness != null) props.clearcoatRoughness = pp.clearcoatRoughness;
    if (pp.envMapIntensity != null) props.envMapIntensity = pp.envMapIntensity;
    if (pp.sheen != null) props.sheen = pp.sheen;
    if (pp.sheenRoughness != null) props.sheenRoughness = pp.sheenRoughness;
    if (pp.sheenColor) props.sheenColor = hexToThreeColor(pp.sheenColor);
    if (pp.iridescence != null) props.iridescence = pp.iridescence;
    if (pp.iridescenceIOR != null) props.iridescenceIOR = pp.iridescenceIOR;
    if (pp.anisotropy != null) props.anisotropy = pp.anisotropy;
    if (pp.anisotropyRotation != null) props.anisotropyRotation = pp.anisotropyRotation;
  }

  // Default envMapIntensity for metals
  if (props.envMapIntensity == null && preset.metalness > 0.5) {
    props.envMapIntensity = 1.5;
  }

  return props;
}

/**
 * Convert variation to material properties for Three.js
 */
export function variationToMaterialProperties(
  variation: MaterialVariation,
  basePreset: MaterialPreset
): MaterialProperties {
  // Start with base preset properties
  const baseProps = presetToMaterialProperties(basePreset);

  // Override with variation-specific values
  const props: MaterialProperties = {
    ...baseProps,
    color: variation.color_shift
      ? hexToThreeColor(variation.color_shift)
      : baseProps.color,
    roughness: variation.roughness,
    metalness: variation.metalness,
  };

  // Merge variation's physical_props if present
  if (variation.physical_props) {
    const pp = variation.physical_props;
    if (pp.clearcoatRoughness != null) props.clearcoatRoughness = pp.clearcoatRoughness;
    if (pp.envMapIntensity != null) props.envMapIntensity = pp.envMapIntensity;
    if (pp.sheen != null) props.sheen = pp.sheen;
    if (pp.sheenRoughness != null) props.sheenRoughness = pp.sheenRoughness;
    if (pp.sheenColor) props.sheenColor = hexToThreeColor(pp.sheenColor);
    if (pp.iridescence != null) props.iridescence = pp.iridescence;
    if (pp.iridescenceIOR != null) props.iridescenceIOR = pp.iridescenceIOR;
    if (pp.anisotropy != null) props.anisotropy = pp.anisotropy;
    if (pp.anisotropyRotation != null) props.anisotropyRotation = pp.anisotropyRotation;
  }

  return props;
}

/**
 * Group presets by tab for UI rendering (only for display_mode='tabs')
 */
export function groupPresetsByTab(presets: MaterialPreset[]): {
  finishes: MaterialPreset[];
  tints: MaterialPreset[];
  aged: MaterialPreset[];
} {
  return {
    finishes: presets.filter(p => p.tab === 'finishes'),
    tints: presets.filter(p => p.tab === 'tints'),
    aged: presets.filter(p => p.tab === 'aged'),
  };
}

/**
 * Get category with all its presets and display mode info
 */
export async function getCategoryWithPresets(categorySlug: string): Promise<{
  category: MaterialCategory;
  presets: MaterialPreset[];
  grouped: { finishes: MaterialPreset[]; tints: MaterialPreset[]; aged: MaterialPreset[] } | null;
} | null> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;

  const presets = await getPresetsByCategory(category.id);

  // Only group by tabs if display_mode is 'tabs'
  const grouped = category.display_mode === 'tabs' ? groupPresetsByTab(presets) : null;

  return { category, presets, grouped };
}

/**
 * Get all categories with preset counts
 */
export async function getCategoriesWithCounts(): Promise<(MaterialCategory & { presetCount: number })[]> {
  const categories = await getCategories();

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const presets = await getPresetsByCategory(category.id);
      return { ...category, presetCount: presets.length };
    })
  );

  return categoriesWithCounts;
}
