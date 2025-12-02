'use client';

import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeType, MODES } from './ModeBar';
import { ToolPalette, ToolType } from './ToolPalette';

interface ToolOptionsPanelProps {
  isOpen: boolean;
  mode: ModeType | null;
  activeTool: ToolType | null;
  onClose: () => void;
  onToolSelect: (tool: ToolType) => void;
  children?: React.ReactNode; // For contextual properties
  className?: string;
}

export function ToolOptionsPanel({
  isOpen,
  mode,
  activeTool,
  onClose,
  onToolSelect,
  children,
  className,
}: ToolOptionsPanelProps) {
  const modeInfo = mode ? MODES.find((m) => m.id === mode) : null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-50',
          'w-[320px] bg-zinc-900/98 backdrop-blur-md',
          'border-l border-zinc-800',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {modeInfo && (
              <>
                <modeInfo.icon className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-zinc-200">
                  {modeInfo.label}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {mode && (
            <ToolPalette
              mode={mode}
              activeTool={activeTool}
              onToolSelect={onToolSelect}
            />
          )}

          {/* Divider */}
          {activeTool && children && (
            <div className="h-px bg-zinc-800 mx-4" />
          )}

          {/* Contextual Properties */}
          {children && (
            <div className="p-4">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                Properties
              </h3>
              {children}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 text-center">
            Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd> to close
          </p>
        </div>
      </div>
    </>
  );
}
