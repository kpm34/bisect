import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type {
  Folder,
  FolderInsert,
  FolderUpdate
} from './types';

// ============================================================================
// FOLDERS
// ============================================================================

/**
 * Get all folders, optionally filtered by user
 */
export async function getFolders(userId?: string): Promise<Folder[]> {
  let query = supabase
    .from('folders')
    .select('*')
    .order('sort_order', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }

  return (data as Folder[]) || [];
}

/**
 * Get root folders (no parent)
 */
export async function getRootFolders(userId?: string): Promise<Folder[]> {
  let query = supabase
    .from('folders')
    .select('*')
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch root folders:', error);
    return [];
  }

  return (data as Folder[]) || [];
}

/**
 * Get child folders of a parent
 */
export async function getChildFolders(parentId: string): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch child folders:', error);
    return [];
  }

  return (data as Folder[]) || [];
}

/**
 * Get a single folder by ID
 */
export async function getFolderById(id: string): Promise<Folder | null> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch folder:', error);
    return null;
  }

  return data as Folder;
}

/**
 * Create a new folder
 */
export async function createFolder(folder: FolderInsert): Promise<Folder | null> {
  const { data, error } = await supabase
    .from('folders')
    .insert(folder)
    .select()
    .single();

  if (error) {
    console.error('Failed to create folder:', error);
    return null;
  }

  return data as Folder;
}

/**
 * Update an existing folder
 */
export async function updateFolder(
  id: string,
  updates: FolderUpdate
): Promise<Folder | null> {
  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update folder:', error);
    return null;
  }

  return data as Folder;
}

/**
 * Delete a folder (cascades to child folders)
 */
export async function deleteFolder(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete folder:', error);
    return false;
  }

  return true;
}

/**
 * Move a folder to a new parent
 */
export async function moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<Folder | null> {
  return updateFolder(folderId, { parent_id: newParentId });
}

/**
 * Get folder tree structure
 */
export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
}

export async function getFolderTree(userId?: string): Promise<FolderWithChildren[]> {
  const allFolders = await getFolders(userId);

  // Build tree from flat list
  const folderMap = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];

  // First pass: create map
  allFolders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Second pass: build tree
  allFolders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
