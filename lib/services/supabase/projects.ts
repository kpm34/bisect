import { supabase } from './client';
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  SceneVersion,
  Json
} from './types';

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * Get all projects, optionally filtered by user
 */
export async function getProjects(userId?: string): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }

  return (data as Project[]) || [];
}

/**
 * Get recent projects for dashboard
 */
export async function getRecentProjects(limit: number = 8): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent projects:', error);
    return [];
  }

  return (data as Project[]) || [];
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch project:', error);
    return null;
  }

  return data as Project;
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectInsert): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error('Failed to create project:', error);
    return null;
  }

  return data as Project;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update project:', error);
    return null;
  }

  return data as Project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete project:', error);
    return false;
  }

  return true;
}

// ============================================================================
// SCENE VERSIONS
// ============================================================================

/**
 * Get all versions for a project
 */
export async function getSceneVersions(projectId: string): Promise<SceneVersion[]> {
  const { data, error } = await supabase
    .from('scene_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Failed to fetch scene versions:', error);
    return [];
  }

  return (data as SceneVersion[]) || [];
}

/**
 * Get the latest scene version for a project
 */
export async function getLatestSceneVersion(projectId: string): Promise<SceneVersion | null> {
  const { data, error } = await supabase
    .from('scene_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to fetch latest scene version:', error);
    return null;
  }

  return data as SceneVersion;
}

/**
 * Create a new scene version
 */
export async function createSceneVersion(
  projectId: string,
  sceneData: Json,
  isAutoSave: boolean = false
): Promise<SceneVersion | null> {
  // Get the next version number
  const { data: latestVersion } = await supabase
    .from('scene_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('scene_versions')
    .insert({
      project_id: projectId,
      version_number: nextVersion,
      scene_data: sceneData,
      is_auto_save: isAutoSave
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create scene version:', error);
    return null;
  }

  // Update project's updated_at timestamp
  await updateProject(projectId, {});

  return data as SceneVersion;
}
