/**
 * useMaterialThumbnails Hook
 *
 * Simple material preview system - uses BaseColor texture images directly as thumbnails.
 * No complex rendering, just displays the actual texture files.
 */

import { useState, useEffect } from 'react';
import { MaterialConfig } from '@/lib/core/materials';

interface ThumbnailState {
  dataUrl: string | null;
  loading: boolean;
  error: Error | null;
}

export interface MaterialThumbnailMap {
  [materialId: string]: ThumbnailState;
}

/**
 * Simple thumbnail system - uses BaseColor texture images directly
 *
 * @param materials - Array of material configs
 * @returns Map of materialId -> thumbnail state (dataUrl, loading, error)
 *
 * @example
 * const featuredMaterials = getFeaturedMaterials('metal');
 * const thumbnails = useMaterialThumbnails(featuredMaterials);
 *
 * // Access thumbnail for a specific material
 * const thumbnail = thumbnails['MTL_Brass_Aged'];
 * return <img src={thumbnail.dataUrl || fallbackColor} />;
 */
export function useMaterialThumbnails(
  materials: MaterialConfig[]
): MaterialThumbnailMap {
  const [thumbnails, setThumbnails] = useState<MaterialThumbnailMap>({});

  useEffect(() => {
    if (!materials || materials.length === 0) {
      return;
    }

    // Initialize thumbnail states - use BaseColor texture or thumbnailPath
    const initialState: MaterialThumbnailMap = {};
    for (const material of materials) {
      // Use BaseColor texture as thumbnail if available
      if (material.textures?.baseColor) {
        initialState[material.id] = {
          dataUrl: material.textures.baseColor,
          loading: false,
          error: null,
        };
      }
      // Check if material has pre-rendered thumbnail
      else if (material.thumbnailPath) {
        initialState[material.id] = {
          dataUrl: material.thumbnailPath,
          loading: false,
          error: null,
        };
      } else {
        initialState[material.id] = {
          dataUrl: null,
          loading: false,
          error: null,
        };
      }
    }

    setThumbnails(initialState);
  }, [materials]);

  return thumbnails;
}

/**
 * Helper: Get thumbnail data URL or fallback
 */
export function getThumbnailUrl(
  thumbnails: MaterialThumbnailMap,
  materialId: string,
  fallback: string
): string {
  const state = thumbnails[materialId];
  return state?.dataUrl || fallback;
}

/**
 * Helper: Check if thumbnail is loading
 */
export function isThumbnailLoading(
  thumbnails: MaterialThumbnailMap,
  materialId: string
): boolean {
  return thumbnails[materialId]?.loading || false;
}

/**
 * Helper: Get thumbnail error
 */
export function getThumbnailError(
  thumbnails: MaterialThumbnailMap,
  materialId: string
): Error | null {
  return thumbnails[materialId]?.error || null;
}
