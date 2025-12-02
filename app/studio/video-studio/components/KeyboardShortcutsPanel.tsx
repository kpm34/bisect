'use client';

/**
 * KeyboardShortcutsPanel Component
 *
 * Shows all available keyboard shortcuts for the video editor.
 */

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutCategory {
  name: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    name: 'Playback',
    shortcuts: [
      { keys: 'Space', description: 'Play / Pause' },
      { keys: '← / →', description: 'Step frame backward / forward' },
      { keys: 'Home / Cmd+←', description: 'Jump to start' },
      { keys: 'End / Cmd+→', description: 'Jump to end' },
      { keys: 'L', description: 'Toggle loop playback' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { keys: 'Shift+← / Shift+→', description: 'Jump to previous / next clip' },
      { keys: 'Shift+M', description: 'Jump to next marker' },
      { keys: 'Cmd+Shift+M', description: 'Jump to previous marker' },
    ],
  },
  {
    name: 'Selection & Editing',
    shortcuts: [
      { keys: 'Cmd+A', description: 'Select all clips' },
      { keys: 'Escape', description: 'Deselect all' },
      { keys: 'Delete / Backspace', description: 'Delete selected clips' },
      { keys: 'Cmd+D', description: 'Duplicate selected clip' },
      { keys: 'Cmd+B / Shift+S', description: 'Split clip at playhead' },
    ],
  },
  {
    name: 'Clipboard',
    shortcuts: [
      { keys: 'Cmd+C', description: 'Copy selected clips' },
      { keys: 'Cmd+X', description: 'Cut selected clips' },
      { keys: 'Cmd+V', description: 'Paste clips at playhead' },
    ],
  },
  {
    name: 'Timeline',
    shortcuts: [
      { keys: 'S', description: 'Toggle snapping' },
      { keys: 'M', description: 'Add marker at playhead' },
      { keys: 'Shift+Z', description: 'Zoom to fit' },
      { keys: 'Ctrl+Scroll', description: 'Zoom in / out' },
    ],
  },
  {
    name: 'History',
    shortcuts: [
      { keys: 'Cmd+Z', description: 'Undo' },
      { keys: 'Cmd+Shift+Z / Cmd+Y', description: 'Redo' },
    ],
  },
];

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gray-400" />
            <h2 className="text-sm font-medium text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            className="p-1 text-gray-500 hover:text-white rounded hover:bg-[#2a2a2a]"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <div className="grid grid-cols-1 gap-4">
            {SHORTCUTS.map((category) => (
              <div key={category.name}>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {category.shortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-[#2a2a2a]"
                    >
                      <span className="text-xs text-gray-300">{shortcut.description}</span>
                      <kbd className="px-2 py-0.5 bg-[#0a0a0a] text-gray-400 text-[10px] rounded border border-[#3a3a3a] font-mono">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#0a0a0a] rounded text-[10px] text-gray-500">
            <p>Tip: On Mac, use Cmd. On Windows/Linux, use Ctrl.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;
