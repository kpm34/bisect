/**
 * Scene State Persistence
 *
 * Persists runtime scene state (added objects, environment, effects) to localStorage
 * for automatic restoration on page refresh.
 *
 * This complements scenePersistence.ts which handles the base scene file (GLTF/Spline).
 */

import { SceneObject, SceneVariable } from '../r3f/SceneSelectionContext';
import { SceneEnvironment } from '@/lib/core/materials/types';

// Keys for localStorage
const STORAGE_KEYS = {
  SCENE_STATE: 'bisect_scene_state',
  LAST_PROJECT_ID: 'bisect_last_project_id',
} as const;

export interface PersistedSceneState {
  projectId: string | null;
  addedObjects: SceneObject[];
  sceneVariables: SceneVariable[];
  environment: SceneEnvironment;
  effects: {
    bloom: boolean;
    glitch: boolean;
    noise: boolean;
    vignette: boolean;
  };
  timestamp: number;
}

const DEFAULT_ENVIRONMENT: SceneEnvironment = {
  preset: 'city',
  background: true,
  blur: 0.8,
  intensity: 1.0,
};

const DEFAULT_EFFECTS = {
  bloom: false,
  glitch: false,
  noise: false,
  vignette: false,
};

class SceneStatePersistence {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 500; // Save after 500ms of no changes

  /**
   * Save scene state to localStorage (debounced)
   */
  saveState(state: Partial<PersistedSceneState>): void {
    // Debounce to avoid excessive writes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveStateImmediate(state);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Save scene state immediately (no debounce)
   */
  saveStateImmediate(state: Partial<PersistedSceneState>): void {
    if (typeof window === 'undefined') return;

    try {
      // Get existing state and merge
      const existing = this.loadState();
      const newState: PersistedSceneState = {
        projectId: state.projectId ?? existing?.projectId ?? null,
        addedObjects: state.addedObjects ?? existing?.addedObjects ?? [],
        sceneVariables: state.sceneVariables ?? existing?.sceneVariables ?? [],
        environment: state.environment ?? existing?.environment ?? DEFAULT_ENVIRONMENT,
        effects: state.effects ?? existing?.effects ?? DEFAULT_EFFECTS,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.SCENE_STATE, JSON.stringify(newState));
      console.log('💾 Scene state saved:', {
        projectId: newState.projectId,
        objects: newState.addedObjects.length,
        variables: newState.sceneVariables.length,
        env: newState.environment.preset,
      });
    } catch (error) {
      console.error('Failed to save scene state:', error);
    }
  }

  /**
   * Load scene state from localStorage
   */
  loadState(): PersistedSceneState | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCENE_STATE);
      if (!stored) return null;

      const state = JSON.parse(stored) as PersistedSceneState;

      // Validate state structure
      if (!state || typeof state !== 'object') return null;

      // Check if state is too old (24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > MAX_AGE) {
        console.log('⏰ Scene state expired, clearing...');
        this.clearState();
        return null;
      }

      console.log('📂 Scene state loaded:', {
        projectId: state.projectId,
        objects: state.addedObjects?.length ?? 0,
        variables: state.sceneVariables?.length ?? 0,
        env: state.environment?.preset,
        age: Math.round((Date.now() - state.timestamp) / 1000) + 's ago',
      });

      return state;
    } catch (error) {
      console.error('Failed to load scene state:', error);
      return null;
    }
  }

  /**
   * Clear all persisted scene state
   */
  clearState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.SCENE_STATE);
      console.log('🧹 Scene state cleared');
    } catch (error) {
      console.error('Failed to clear scene state:', error);
    }
  }

  /**
   * Save only the last project ID (for quick restoration)
   */
  saveLastProjectId(projectId: string | null): void {
    if (typeof window === 'undefined') return;

    try {
      if (projectId) {
        localStorage.setItem(STORAGE_KEYS.LAST_PROJECT_ID, projectId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.LAST_PROJECT_ID);
      }
    } catch (error) {
      console.error('Failed to save last project ID:', error);
    }
  }

  /**
   * Get the last used project ID
   */
  getLastProjectId(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_PROJECT_ID);
    } catch (error) {
      console.error('Failed to get last project ID:', error);
      return null;
    }
  }

  /**
   * Check if there's a saved state for a specific project
   */
  hasStateForProject(projectId: string): boolean {
    const state = this.loadState();
    return state?.projectId === projectId;
  }
}

// Export singleton
export const sceneStatePersistence = new SceneStatePersistence();
