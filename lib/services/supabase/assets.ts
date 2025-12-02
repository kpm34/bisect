import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type {
  Asset,
  AssetInsert,
  AssetUpdate,
  AssetType,
  AssetSource
} from './types';

// ============================================================================
// ASSETS
// ============================================================================

export interface AssetFilters {
  userId?: string;
  projectId?: string;
  folderId?: string;
  type?: AssetType;
  source?: AssetSource;
  tags?: string[];
}

/**
 * Get assets with optional filters
 */
export async function getAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  let query = supabase
    .from('assets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId);
  }
  if (filters.folderId) {
    query = query.eq('folder_id', filters.folderId);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch assets:', error);
    return [];
  }

  return (data as Asset[]) || [];
}

/**
 * Get assets for a specific project
 */
export async function getAssetsByProject(projectId: string): Promise<Asset[]> {
  return getAssets({ projectId });
}

/**
 * Get assets by type (e.g., all SVGs)
 */
export async function getAssetsByType(type: AssetType): Promise<Asset[]> {
  return getAssets({ type });
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Create a new asset
 */
export async function createAsset(asset: AssetInsert): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single();

  if (error) {
    console.error('Failed to create asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Update an existing asset
 */
export async function updateAsset(
  id: string,
  updates: AssetUpdate
): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Delete an asset
 */
export async function deleteAsset(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete asset:', error);
    return false;
  }

  return true;
}

/**
 * Move asset to a different folder
 */
export async function moveAssetToFolder(
  assetId: string,
  folderId: string | null
): Promise<Asset | null> {
  return updateAsset(assetId, { folder_id: folderId });
}

/**
 * Add tags to an asset
 */
export async function addAssetTags(
  assetId: string,
  newTags: string[]
): Promise<Asset | null> {
  const asset = await getAssetById(assetId);
  if (!asset) return null;

  const existingTags = asset.tags || [];
  const mergedTags = [...new Set([...existingTags, ...newTags])];

  return updateAsset(assetId, { tags: mergedTags });
}

/**
 * Remove tags from an asset
 */
export async function removeAssetTags(
  assetId: string,
  tagsToRemove: string[]
): Promise<Asset | null> {
  const asset = await getAssetById(assetId);
  if (!asset) return null;

  const existingTags = asset.tags || [];
  const filteredTags = existingTags.filter(tag => !tagsToRemove.includes(tag));

  return updateAsset(assetId, { tags: filteredTags });
}
