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
 * - Syncing to Supabase cloud when user is logged in (L1/L2 caching)
 */

import { useEffect, useRef } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { sceneSyncService } from '@/lib/services/supabase/scene-sync';
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

  // Restore state on initial mount (async with L1/L2 fallback)
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const restoreState = async () => {
      // Try L1 (localStorage) first, then L2 (Supabase) if empty
      const savedState = await sceneSyncService.loadState(projectId);

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
          sceneSyncService.clearState();
        }
      }

      // Mark initial mount as complete after a short delay
      // This prevents auto-save from triggering immediately
      setTimeout(() => {
        isInitialMountRef.current = false;
      }, 1000);
    };

    restoreState();
  }, []); // Only run on mount

  // Auto-save when addedObjects changes (L1 + L2)
  useEffect(() => {
    if (isInitialMountRef.current) return;

    sceneSyncService.saveState({
      projectId,
      addedObjects,
    });
  }, [addedObjects, projectId]);

  // Auto-save when environment changes (L1 + L2)
  useEffect(() => {
    if (isInitialMountRef.current) return;

    sceneSyncService.saveState({
      projectId,
      environment,
    });
  }, [environment, projectId]);

  // Auto-save when effects change (L1 + L2)
  useEffect(() => {
    if (isInitialMountRef.current) return;

    sceneSyncService.saveState({
      projectId,
      effects,
    });
  }, [effects, projectId]);

  // Save project ID for quick restoration
  useEffect(() => {
    if (projectId) {
      sceneSyncService.saveLastProjectId(projectId);
    }
  }, [projectId]);

  // This component doesn't render anything
  return null;
}
