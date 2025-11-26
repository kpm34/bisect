/**
 * useMaterials Hook
 *
 * React hooks for fetching material data from Supabase.
 * Includes caching, loading states, and error handling.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCategories,
  getCategoryBySlug,
  getPresetsByCategory,
  getPresetsByCategorySlug,
  getPresetsByCategoryAndTab,
  getPresetBySlug,
  getVariationsByPreset,
  getVariationsByPresetSlug,
  groupPresetsByTab,
  presetToMaterialProperties,
  variationToMaterialProperties,
} from '@/lib/services/supabase/materials';
import type {
  MaterialCategory,
  MaterialPreset,
  MaterialVariation,
  MaterialProperties,
} from '@/lib/services/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

interface UseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseMaterialPresetsResult extends UseQueryState<MaterialPreset[]> {
  grouped: {
    finishes: MaterialPreset[];
    tints: MaterialPreset[];
    aged: MaterialPreset[];
  };
  refetch: () => Promise<void>;
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Fetch all material categories
 */
export function useMaterialCategories() {
  const [state, setState] = useState<UseQueryState<MaterialCategory[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getCategories();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Fetch a single category by slug
 */
export function useMaterialCategory(slug: string | null) {
  const [state, setState] = useState<UseQueryState<MaterialCategory>>({
    data: null,
    loading: !!slug,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!slug) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getCategoryBySlug(slug);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ============================================================================
// PRESETS
// ============================================================================

/**
 * Fetch presets by category slug with grouped output
 *
 * @example
 * const { data, grouped, loading } = useMaterialPresets('gold');
 * // grouped.finishes = [Mirror, Polished, Satin, ...]
 * // grouped.tints = [Rose Gold, White Gold, ...]
 * // grouped.aged = [Aged, Antique, ...]
 */
export function useMaterialPresets(categorySlug: string | null): UseMaterialPresetsResult {
  const [state, setState] = useState<UseQueryState<MaterialPreset[]>>({
    data: null,
    loading: !!categorySlug,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!categorySlug) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getPresetsByCategorySlug(categorySlug);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize grouped presets
  const grouped = useMemo(() => {
    if (!state.data) {
      return { finishes: [], tints: [], aged: [] };
    }
    return groupPresetsByTab(state.data);
  }, [state.data]);

  return { ...state, grouped, refetch: fetchData };
}

/**
 * Fetch presets by category ID and tab
 */
export function useMaterialPresetsByTab(
  categoryId: string | null,
  tab: 'finishes' | 'tints' | 'aged'
) {
  const [state, setState] = useState<UseQueryState<MaterialPreset[]>>({
    data: null,
    loading: !!categoryId,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!categoryId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getPresetsByCategoryAndTab(categoryId, tab);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [categoryId, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Fetch a single preset by slug
 */
export function useMaterialPreset(slug: string | null) {
  const [state, setState] = useState<UseQueryState<MaterialPreset>>({
    data: null,
    loading: !!slug,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!slug) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getPresetBySlug(slug);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ============================================================================
// VARIATIONS
// ============================================================================

/**
 * Fetch variations for a preset by preset ID
 */
export function useMaterialVariations(presetId: string | null) {
  const [state, setState] = useState<UseQueryState<MaterialVariation[]>>({
    data: null,
    loading: !!presetId,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!presetId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getVariationsByPreset(presetId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [presetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Fetch variations for a preset by preset slug
 */
export function useMaterialVariationsBySlug(presetSlug: string | null) {
  const [state, setState] = useState<UseQueryState<MaterialVariation[]>>({
    data: null,
    loading: !!presetSlug,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!presetSlug) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getVariationsByPresetSlug(presetSlug);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [presetSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ============================================================================
// MATERIAL PROPERTIES (for Three.js)
// ============================================================================

/**
 * Get Three.js material properties from a preset
 *
 * @example
 * const { data: preset } = useMaterialPreset('gold-polished');
 * const props = usePresetMaterialProperties(preset);
 * // Use props with MeshPhysicalMaterial
 */
export function usePresetMaterialProperties(
  preset: MaterialPreset | null
): MaterialProperties | null {
  return useMemo(() => {
    if (!preset) return null;
    return presetToMaterialProperties(preset);
  }, [preset]);
}

/**
 * Get Three.js material properties from a variation
 *
 * @example
 * const { data: variation } = useMaterialVariation('gold-polished-warm');
 * const { data: preset } = useMaterialPreset('gold-polished');
 * const props = useVariationMaterialProperties(variation, preset);
 */
export function useVariationMaterialProperties(
  variation: MaterialVariation | null,
  basePreset: MaterialPreset | null
): MaterialProperties | null {
  return useMemo(() => {
    if (!variation || !basePreset) return null;
    return variationToMaterialProperties(variation, basePreset);
  }, [variation, basePreset]);
}

// ============================================================================
// COMBINED HOOK
// ============================================================================

/**
 * All-in-one hook for the material selector UI
 *
 * @example
 * const {
 *   categories,
 *   selectedCategory,
 *   setSelectedCategory,
 *   presets,
 *   selectedPreset,
 *   setSelectedPreset,
 *   variations,
 *   materialProps,
 *   loading,
 * } = useMaterialSelector('gold');
 */
export function useMaterialSelector(initialCategory: string = 'gold') {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(initialCategory);
  const [selectedPresetSlug, setSelectedPresetSlug] = useState<string | null>(null);

  // Fetch categories
  const { data: categories, loading: categoriesLoading } = useMaterialCategories();

  // Fetch presets for selected category
  const {
    data: presets,
    grouped: groupedPresets,
    loading: presetsLoading,
  } = useMaterialPresets(selectedCategorySlug);

  // Fetch single preset details
  const { data: selectedPreset, loading: presetLoading } = useMaterialPreset(selectedPresetSlug);

  // Fetch variations for selected preset
  const { data: variations, loading: variationsLoading } = useMaterialVariations(
    selectedPreset?.id ?? null
  );

  // Get material properties for Three.js
  const materialProps = usePresetMaterialProperties(selectedPreset);

  // Select first preset when category changes
  useEffect(() => {
    if (presets && presets.length > 0 && !selectedPresetSlug) {
      setSelectedPresetSlug(presets[0].slug);
    }
  }, [presets, selectedPresetSlug]);

  // Change category handler
  const selectCategory = useCallback((slug: string) => {
    setSelectedCategorySlug(slug);
    setSelectedPresetSlug(null); // Reset preset selection
  }, []);

  // Change preset handler
  const selectPreset = useCallback((slug: string) => {
    setSelectedPresetSlug(slug);
  }, []);

  return {
    // Categories
    categories,
    selectedCategorySlug,
    selectCategory,

    // Presets
    presets,
    groupedPresets,
    selectedPreset,
    selectedPresetSlug,
    selectPreset,

    // Variations
    variations,

    // Three.js properties
    materialProps,

    // Loading states
    loading: categoriesLoading || presetsLoading || presetLoading,
    variationsLoading,
  };
}
