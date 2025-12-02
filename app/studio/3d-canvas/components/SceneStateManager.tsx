'use client';

/**
 * SceneStateManager
 *
 * Invisible component that manages scene state persistence.
 * Must be rendered inside SelectionProvider to access context.
 *
 * Handles:
 * - Auto-saving addedObjects, environment, effects on changes
 * - Restoring state on page load/refresh
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { sceneStatePersistence, PersistedSceneState } from '../utils/sceneStatePersistence';
import { SceneEnvironment } from '@/lib/core/materials/types';

interface SceneStateManagerProps {
  projectId: string | null;
  environment: SceneEnvironment;
  onEnvironmentRestore: (env: SceneEnvironment) => void;
}

export function SceneStateManager({
  projectId,
  environment,
  onEnvironmentRestore,
}: SceneStateManagerProps) {
  const { addedObjects, effects, setAddedObjects, setEffects } = useSelection();
  const hasRestoredRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Restore state on initial mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const savedState = sceneStatePersistence.loadState();

    if (savedState) {
      // Only restore if same project or no project specified
      const shouldRestore =
        !projectId || // No project in URL
        savedState.projectId === projectId || // Same project
        (!savedState.projectId && !projectId); // Both null

      if (shouldRestore) {
        console.log('🔄 Restoring scene state...', {
          objects: savedState.addedObjects?.length ?? 0,
          environment: savedState.environment?.preset,
          effects: savedState.effects,
        });

        // Restore added objects
        if (savedState.addedObjects && savedState.addedObjects.length > 0) {
          setAddedObjects(savedState.addedObjects);
          console.log(`✅ Restored ${savedState.addedObjects.length} objects`);
        }

        // Restore environment
        if (savedState.environment) {
          onEnvironmentRestore(savedState.environment);
          console.log(`✅ Restored environment: ${savedState.environment.preset}`);
        }

        // Restore effects
        if (savedState.effects) {
          setEffects(savedState.effects);
          console.log('✅ Restored effects');
        }

        hasRestoredRef.current = true;
      } else {
        console.log('⏭️ Skipping state restore - different project');
        // Clear old state since we're loading a different project
        sceneStatePersistence.clearState();
      }
    }

    // Mark initial mount as complete after a short delay
    // This prevents auto-save from triggering immediately
    setTimeout(() => {
      isInitialMountRef.current = false;
    }, 1000);
  }, []); // Only run on mount

  // Auto-save when addedObjects changes
  useEffect(() => {
    if (isInitialMountRef.current) return;

    sceneStatePersistence.saveState({
      projectId,
      addedObjects,
    });
  }, [addedObjects, projectId]);

  // Auto-save when environment changes
  useEffect(() => {
    if (isInitialMountRef.current) return;

    sceneStatePersistence.saveState({
      projectId,
      environment,
    });
  }, [environment, projectId]);

  // Auto-save when effects change
  useEffect(() => {
    if (isInitialMountRef.current) return;

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

  // This component doesn't render anything
  return null;
}
