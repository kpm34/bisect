/**
 * Scene State Sync Service
 *
 * Provides L1 (localStorage) + L2 (Supabase) caching for scene state.
 * - Writes to both layers (localStorage immediate, Supabase debounced)
 * - Restores from localStorage first, Supabase if empty
 * - Requires authentication for cloud sync
 */

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import type { Json } from './types';
import {
  sceneStatePersistence,
  PersistedSceneState,
} from '@/app/studio/3d-canvas/utils/scene-state-persistence';

class SceneSyncService {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 2000; // 2s debounce for Supabase writes

  /**
   * Check if user is logged in
   */
  async isAuthenticated(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  }

  /**
   * Save state to both L1 (localStorage) and L2 (Supabase)
   */
  saveState(state: Partial<PersistedSceneState>): void {
    // L1: Immediate localStorage save (uses existing 500ms debounce)
    sceneStatePersistence.saveState(state);

    // L2: Debounced Supabase save
    this.scheduleCloudSync();
  }

  /**
   * Save state immediately to both layers
   */
  saveStateImmediate(state: Partial<PersistedSceneState>): void {
    sceneStatePersistence.saveStateImmediate(state);
    this.syncToCloud();
  }

  private scheduleCloudSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncToCloud();
    }, this.DEBOUNCE_MS);
  }

  private async syncToCloud(): Promise<void> {
    const state = sceneStatePersistence.loadState();
    if (!state?.projectId) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, skip cloud sync silently
        return;
      }

      // Cast scene_data to Json type for Supabase compatibility
      const sceneData: Json = JSON.parse(JSON.stringify({
        addedObjects: state.addedObjects,
        sceneVariables: state.sceneVariables,
        environment: state.environment,
        effects: state.effects,
        deletedObjectNames: state.deletedObjectNames,
        timestamp: state.timestamp,
      }));

      const { error } = await supabase.from('scene_versions').upsert(
        {
          project_id: state.projectId,
          version_number: 0, // 0 = auto-save slot
          scene_data: sceneData,
          is_auto_save: true,
        },
        { onConflict: 'project_id,version_number' }
      );

      if (error) {
        console.warn('☁️ Cloud sync failed:', error.message);
      } else {
        console.log('☁️ Synced to cloud');
      }
    } catch (err) {
      console.warn('☁️ Cloud sync error:', err);
    }
  }

  /**
   * Load state with L1/L2 fallback
   */
  async loadState(projectId: string | null): Promise<PersistedSceneState | null> {
    // L1: Try localStorage first (fast)
    const localState = sceneStatePersistence.loadState();

    if (localState && (!projectId || localState.projectId === projectId)) {
      return localState;
    }

    // L2: Fallback to Supabase if logged in
    if (projectId) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const cloudState = await this.loadFromCloud(projectId);
          if (cloudState) {
            // Hydrate localStorage with cloud state
            sceneStatePersistence.saveStateImmediate(cloudState);
            console.log('☁️ Restored from cloud');
            return cloudState;
          }
        }
      } catch (err) {
        console.warn('☁️ Cloud load error:', err);
      }
    }

    return null;
  }

  private async loadFromCloud(projectId: string): Promise<PersistedSceneState | null> {
    const { data, error } = await supabase
      .from('scene_versions')
      .select('scene_data')
      .eq('project_id', projectId)
      .eq('is_auto_save', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.scene_data) {
      return null;
    }

    const sd = data.scene_data as any;
    return {
      projectId,
      addedObjects: sd.addedObjects || [],
      sceneVariables: sd.sceneVariables || [],
      environment: sd.environment || {
        preset: 'city',
        background: true,
        blur: 0.8,
        intensity: 1.0,
      },
      effects: sd.effects || {
        bloom: false,
        glitch: false,
        noise: false,
        vignette: false,
      },
      deletedObjectNames: sd.deletedObjectNames || [],
      timestamp: sd.timestamp || Date.now(),
    };
  }

  /**
   * Clear all persisted state (both L1 and L2)
   */
  clearState(): void {
    sceneStatePersistence.clearState();
    // Note: We don't delete from Supabase - that's handled by project deletion
  }

  /**
   * Save last project ID (passthrough to localStorage)
   */
  saveLastProjectId(projectId: string | null): void {
    sceneStatePersistence.saveLastProjectId(projectId);
  }

  /**
   * Get last project ID (passthrough to localStorage)
   */
  getLastProjectId(): string | null {
    return sceneStatePersistence.getLastProjectId();
  }

  /**
   * Check if there's a saved state for a specific project
   */
  hasStateForProject(projectId: string): boolean {
    return sceneStatePersistence.hasStateForProject(projectId);
  }
}

// Export singleton
export const sceneSyncService = new SceneSyncService();
