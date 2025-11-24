/**
 * useSceneSession Hook
 *
 * Manages scene editing sessions with auto-save and restoration.
 *
 * Features:
 * - Auto-save edits to localStorage
 * - Restore previous session on file re-upload
 * - Session cleanup
 * - Storage statistics
 *
 * Usage:
 * ```tsx
 * const { session, recordEdit, isRestoring } = useSceneSession(file, editor);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { UniversalEditor } from '@/lib/core/adapters';
import { sessionManager } from '../lib/persistence/SceneSessionManager';
import type { SceneSession, EditDelta, RestoreResult } from '../lib/persistence/types';
import { applyEditDelta } from '../utils/editHelpers';

interface UseSceneSessionOptions {
  /** Enable auto-save (default: true) */
  autoSave?: boolean;

  /** Auto-save interval in ms (default: 2000) */
  autoSaveInterval?: number;

  /** Enable automatic session restoration (default: true) */
  autoRestore?: boolean;

  /** Callback when session is restored */
  onRestore?: (result: RestoreResult) => void;

  /** Callback when edit is recorded */
  onEditRecorded?: (delta: EditDelta) => void;
}

interface UseSceneSessionReturn {
  /** Current session */
  session: SceneSession | null;

  /** Whether a session is being restored */
  isRestoring: boolean;

  /** Record a new edit */
  recordEdit: (delta: EditDelta) => void;

  /** Clear current session */
  clearSession: () => void;

  /** Get storage statistics */
  getStats: () => ReturnType<typeof sessionManager.getStorageStats>;

  /** Force save current session */
  forceSave: () => void;
}

export function useSceneSession(
  file: File | null,
  editor: UniversalEditor | null,
  options: UseSceneSessionOptions = {}
): UseSceneSessionReturn {
  const {
    autoSave = true,
    autoSaveInterval = 2000,
    autoRestore = true,
    onRestore,
    onEditRecorded,
  } = options;

  const [session, setSession] = useState<SceneSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const pendingEditsRef = useRef<EditDelta[]>([]);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);

  /**
   * Apply a single edit delta to the scene (wrapper for shared helper)
   */
  const applyEditDeltaWrapper = useCallback(
    async (delta: EditDelta): Promise<boolean> => {
      if (!editor) return false;
      return applyEditDelta(editor, delta, false);
    },
    [editor]
  );

  /**
   * Restore a session by applying all edits
   */
  const restoreSession = useCallback(
    async (sessionToRestore: SceneSession) => {
      if (!editor || isRestoredRef.current) return;

      setIsRestoring(true);
      console.info('Restoring session:', sessionToRestore.fileName);

      try {
        const result = await sessionManager.restoreSession(
          sessionToRestore.sessionId,
          applyEditDeltaWrapper
        );

        if (result.success) {
          console.info(`Session restored: ${result.editsApplied} edits applied`);
          setSession(result.session);
          isRestoredRef.current = true;

          if (onRestore) {
            onRestore(result);
          }
        } else {
          console.error('Failed to restore session:', result.error);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsRestoring(false);
      }
    },
    [editor, applyEditDeltaWrapper, onRestore]
  );

  /**
   * Initialize or restore session when file changes
   */
  useEffect(() => {
    if (!file) {
      setSession(null);
      isRestoredRef.current = false;
      return;
    }

    const initSession = async () => {
      // Check for existing session
      const existingSession = await sessionManager.findSessionByFile(file);

      if (existingSession && autoRestore && editor) {
        // Restore existing session
        await restoreSession(existingSession);
      } else {
        // Create new session
        const newSession = await sessionManager.createSession(file);
        setSession(newSession);
        isRestoredRef.current = false;
        console.info('Created new session:', newSession.sessionId);
      }
    };

    initSession();
  }, [file, editor, autoRestore, restoreSession]);

  /**
   * Save pending edits to session
   */
  const savePendingEdits = useCallback(() => {
    if (!session || pendingEditsRef.current.length === 0) return;

    const editsToSave = [...pendingEditsRef.current];
    pendingEditsRef.current = [];

    // Add all pending edits to session
    for (const delta of editsToSave) {
      sessionManager.addEdit(session.sessionId, delta);
    }

    // Update local session state
    const updatedSession = sessionManager.getSession(session.sessionId);
    if (updatedSession) {
      setSession(updatedSession);
    }
  }, [session]);

  /**
   * Auto-save timer
   */
  useEffect(() => {
    if (!autoSave) return;

    saveTimerRef.current = setInterval(() => {
      savePendingEdits();
    }, autoSaveInterval);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        savePendingEdits(); // Save any remaining edits
      }
    };
  }, [autoSave, autoSaveInterval, savePendingEdits]);

  /**
   * Record a new edit
   */
  const recordEdit = useCallback(
    (delta: EditDelta) => {
      if (!session) return;

      // Add to pending edits
      pendingEditsRef.current.push(delta);

      // Call callback
      if (onEditRecorded) {
        onEditRecorded(delta);
      }
    },
    [session, onEditRecorded]
  );

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    if (session) {
      sessionManager.deleteSession(session.sessionId);
      setSession(null);
      pendingEditsRef.current = [];
      isRestoredRef.current = false;
    }
  }, [session]);

  /**
   * Get storage statistics
   */
  const getStats = useCallback(() => {
    return sessionManager.getStorageStats();
  }, []);

  /**
   * Force save current session
   */
  const forceSave = useCallback(() => {
    savePendingEdits();
  }, [savePendingEdits]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Save any pending edits before unmounting
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
      if (pendingEditsRef.current.length > 0) {
        savePendingEdits();
      }

      // Cleanup old sessions (optional, could be done on mount instead)
      sessionManager.cleanupOldSessions();
    };
  }, [savePendingEdits]);

  return {
    session,
    isRestoring,
    recordEdit,
    clearSession,
    getStats,
    forceSave,
  };
}
