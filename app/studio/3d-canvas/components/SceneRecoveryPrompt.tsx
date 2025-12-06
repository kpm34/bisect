'use client';

/**
 * SceneRecoveryPrompt
 *
 * Modal that appears when user enters the studio with saved work.
 * Offers options to continue with saved scene or start fresh.
 */

import { useState, useEffect } from 'react';
import { sceneStatePersistence } from '../utils/scene-state-persistence';

interface SceneRecoveryPromptProps {
  projectId: string | null;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function SceneRecoveryPrompt({
  projectId,
  onContinue,
  onStartFresh,
}: SceneRecoveryPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{
    objectCount: number;
    lastSaved: string;
  } | null>(null);

  useEffect(() => {
    // Check if there's saved state
    const savedState = sceneStatePersistence.loadState();

    if (savedState && savedState.addedObjects && savedState.addedObjects.length > 0) {
      // Only show if matching project or no specific project
      const shouldShow =
        !projectId ||
        savedState.projectId === projectId ||
        (!savedState.projectId && !projectId);

      if (shouldShow) {
        setSavedInfo({
          objectCount: savedState.addedObjects.length,
          lastSaved: savedState.timestamp
            ? new Date(savedState.timestamp).toLocaleString()
            : 'Recently',
        });
        setIsVisible(true);
      }
    }
  }, [projectId]);

  const handleContinue = () => {
    setIsVisible(false);
    onContinue();
  };

  const handleStartFresh = () => {
    // Clear the saved state
    sceneStatePersistence.clearState();
    setIsVisible(false);
    onStartFresh();
  };

  if (!isVisible || !savedInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome Back</h2>
            <p className="text-sm text-gray-400">You have unsaved work</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Objects in scene:</span>
            <span className="text-white font-medium">{savedInfo.objectCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-400">Last saved:</span>
            <span className="text-white font-medium">{savedInfo.lastSaved}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleStartFresh}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Start Fresh
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your work is saved locally and syncs to cloud when signed in
        </p>
      </div>
    </div>
  );
}
