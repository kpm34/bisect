/**
 * useSceneStatePersistence Hook
 *
 * Manages automatic saving and restoring of scene state across page refreshes.
 * Works in conjunction with scenePersistence (file storage) and SelectionProvider (runtime state).
 */

import { useEffect, useRef, useCallback } from 'react';
import { sceneStatePersistence, PersistedSceneState } from '../utils/scene-state-persistence';
import { SceneObject } from '../r3f/SceneSelectionContext';
import { SceneEnvironment } from '@/lib/core/materials/types';

interface UseSceneStatePersistenceOptions {
  projectId: string | null;
  addedObjects: SceneObject[];
  environment: SceneEnvironment;
  effects: {
    bloom: boolean;
    glitch: boolean;
    noise: boolean;
    vignette: boolean;
  };
  onRestoreState?: (state: PersistedSceneState) => void;
}

export function useSceneStatePersistence({
  projectId,
  addedObjects,
  environment,
  effects,
  onRestoreState,
}: UseSceneStatePersistenceOptions) {
  const hasRestoredRef = useRef(false);
  const isInitialMount = useRef(true);

  // Restore state on initial mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const savedState = sceneStatePersistence.loadState();

    if (savedState && onRestoreState) {
      // Only restore if same project or no project specified
      const shouldRestore =
        !projectId || // No project in URL
        savedState.projectId === projectId || // Same project
        (!savedState.projectId && !projectId); // Both null

      if (shouldRestore) {
        console.log('🔄 Restoring scene state...', {
          objects: savedState.addedObjects?.length ?? 0,
          environment: savedState.environment?.preset,
        });
        onRestoreState(savedState);
        hasRestoredRef.current = true;
      } else {
        console.log('⏭️ Skipping state restore - different project');
        // Clear old state since we're loading a different project
        sceneStatePersistence.clearState();
      }
    }

    isInitialMount.current = false;
  }, []); // Only run on mount

  // Auto-save when addedObjects changes
  useEffect(() => {
    if (isInitialMount.current) return;

    sceneStatePersistence.saveState({
      projectId,
      addedObjects,
    });
  }, [addedObjects, projectId]);

  // Auto-save when environment changes
  useEffect(() => {
    if (isInitialMount.current) return;

    sceneStatePersistence.saveState({
      projectId,
      environment,
    });
  }, [environment, projectId]);

  // Auto-save when effects change
  useEffect(() => {
    if (isInitialMount.current) return;

    sceneStatePersistence.saveState({
      projectId,
      effects,
    });
  }, [effects, projectId]);

  // Save project ID for quick restoration
  useEffect(() => {
    if (projectId) {
      sceneStatePersistence.saveLastProjectId(projectId);
    }
  }, [projectId]);

  // Clear state when explicitly requested
  const clearState = useCallback(() => {
    sceneStatePersistence.clearState();
    hasRestoredRef.current = false;
  }, []);

  // Force save current state
  const saveNow = useCallback(() => {
    sceneStatePersistence.saveStateImmediate({
      projectId,
      addedObjects,
      environment,
      effects,
    });
  }, [projectId, addedObjects, environment, effects]);

  return {
    clearState,
    saveNow,
    getLastProjectId: sceneStatePersistence.getLastProjectId.bind(sceneStatePersistence),
  };
}
