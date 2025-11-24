/**
 * useSceneHistory Hook
 *
 * Manages undo/redo history with IndexedDB storage and keyboard shortcuts.
 *
 * Features:
 * - Undo/redo with Ctrl+Z / Ctrl+Shift+Z
 * - History stored in IndexedDB (larger capacity)
 * - Maximum history size with automatic cleanup
 * - Can undo/redo across browser refreshes
 *
 * Usage:
 * ```tsx
 * const { canUndo, canRedo, undo, redo, pushHistory } = useSceneHistory(session, editor);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UniversalEditor } from '@/lib/core/adapters';
import { historyStore } from '../lib/persistence/IndexedDBStore';
import type { SceneSession, EditDelta, HistoryState } from '../lib/persistence/types';
import { applyEditDelta } from '../utils/editHelpers';

interface UseSceneHistoryOptions {
  /** Maximum history size (default: 100) */
  maxSize?: number;

  /** Enable keyboard shortcuts (default: true) */
  enableShortcuts?: boolean;

  /** Callback when undo is performed */
  onUndo?: (delta: EditDelta) => void;

  /** Callback when redo is performed */
  onRedo?: (delta: EditDelta) => void;
}

interface UseSceneHistoryReturn {
  /** Whether undo is available */
  canUndo: boolean;

  /** Whether redo is available */
  canRedo: boolean;

  /** Perform undo */
  undo: () => Promise<void>;

  /** Perform redo */
  redo: () => Promise<void>;

  /** Add edit to history */
  pushHistory: (delta: EditDelta) => Promise<void>;

  /** Clear history */
  clearHistory: () => Promise<void>;

  /** Current history state */
  history: HistoryState | null;
}

export function useSceneHistory(
  session: SceneSession | null,
  editor: UniversalEditor | null,
  options: UseSceneHistoryOptions = {}
): UseSceneHistoryReturn {
  const { maxSize = 100, enableShortcuts = true, onUndo, onRedo } = options;

  const [history, setHistory] = useState<HistoryState | null>(null);
  const isApplyingRef = useRef(false);

  /**
   * Load history from IndexedDB
   */
  const loadHistory = useCallback(async () => {
    if (!session) {
      setHistory(null);
      return;
    }

    try {
      const state = await historyStore.getHistoryState(session.sessionId, maxSize);
      setHistory(state);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory({ entries: [], currentIndex: -1, maxSize });
    }
  }, [session, maxSize]);

  /**
   * Load history when session changes
   */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Apply a delta (for undo/redo) - uses shared helper
   */
  const applyDelta = useCallback(
    async (delta: EditDelta, isUndo: boolean): Promise<boolean> => {
      if (!editor || isApplyingRef.current) return false;

      isApplyingRef.current = true;

      try {
        return await applyEditDelta(editor, delta, isUndo);
      } finally {
        isApplyingRef.current = false;
      }
    },
    [editor]
  );

  /**
   * Perform undo
   */
  const undo = useCallback(async () => {
    if (!history || !session || history.currentIndex < 0) return;

    const entry = history.entries[history.currentIndex];
    const success = await applyDelta(entry.delta, true);

    if (success) {
      const newIndex = history.currentIndex - 1;
      setHistory({ ...history, currentIndex: newIndex });

      if (onUndo) {
        onUndo(entry.delta);
      }

      console.info('Undo:', entry.delta.description || `${entry.delta.property} change`);
    }
  }, [history, session, applyDelta, onUndo]);

  /**
   * Perform redo
   */
  const redo = useCallback(async () => {
    if (!history || !session || history.currentIndex >= history.entries.length - 1) return;

    const nextIndex = history.currentIndex + 1;
    const entry = history.entries[nextIndex];
    const success = await applyDelta(entry.delta, false);

    if (success) {
      setHistory({ ...history, currentIndex: nextIndex });

      if (onRedo) {
        onRedo(entry.delta);
      }

      console.info('Redo:', entry.delta.description || `${entry.delta.property} change`);
    }
  }, [history, session, applyDelta, onRedo]);

  /**
   * Add new edit to history
   */
  const pushHistory = useCallback(
    async (delta: EditDelta) => {
      if (!session || isApplyingRef.current) return;

      try {
        // If we're not at the end of history, remove everything after current position
        if (history && history.currentIndex < history.entries.length - 1) {
          await historyStore.removeEntriesAfter(session.sessionId, history.currentIndex);
        }

        // Add new entry
        const position = history ? history.currentIndex + 1 : 0;
        const entry = await historyStore.addEntry(session.sessionId, delta, position);

        // Update state
        const newEntries = history ? [...history.entries.slice(0, position), entry] : [entry];

        // Enforce max size
        if (newEntries.length > maxSize) {
          const toRemove = newEntries.length - maxSize;
          await historyStore.cleanupSessionHistory(session.sessionId, maxSize);
          newEntries.splice(0, toRemove);
        }

        setHistory({
          entries: newEntries,
          currentIndex: newEntries.length - 1,
          maxSize,
        });
      } catch (error) {
        console.error('Failed to push history:', error);
      }
    },
    [session, history, maxSize]
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    if (!session) return;

    try {
      await historyStore.deleteSessionHistory(session.sessionId);
      setHistory({ entries: [], currentIndex: -1, maxSize });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [session, maxSize]);

  /**
   * Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
   */
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for undo/redo shortcuts
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey) return;

      if (e.key === 'z' && !e.shiftKey) {
        // Undo: Ctrl+Z (Windows) or Cmd+Z (Mac)
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey) {
        // Redo: Ctrl+Shift+Z (Windows) or Cmd+Shift+Z (Mac)
        e.preventDefault();
        redo();
      } else if (e.key === 'y' && !e.shiftKey) {
        // Alternative redo: Ctrl+Y (Windows only)
        if (!isMac) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts, undo, redo]);

  // Compute derived state
  const canUndo = history !== null && history.currentIndex >= 0;
  const canRedo = history !== null && history.currentIndex < history.entries.length - 1;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    clearHistory,
    history,
  };
}
