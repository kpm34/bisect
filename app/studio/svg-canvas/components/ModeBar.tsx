'use client';

import React from 'react';
import {
  MousePointer2,
  Pencil,
  Move,
  Download,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModeType = 'select' | 'draw' | 'edit' | 'actions';

interface Mode {
  id: ModeType;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

export const MODES: Mode[] = [
  {
    id: 'select',
    label: 'Selection & Navigation',
    icon: MousePointer2,
    shortcut: 'V',
  },
  {
    id: 'draw',
    label: 'Drawing & Creation',
    icon: Pencil,
    shortcut: 'P',
  },
  {
    id: 'edit',
    label: 'Editing & Transform',
    icon: Move,
    shortcut: 'E',
  },
  {
    id: 'actions',
    label: 'Actions & Export',
    icon: Download,
    shortcut: 'A',
  },
];

interface ModeBarProps {
  activeMode: ModeType | null;
  onModeClick: (mode: ModeType) => void;
  className?: string;
}

export function ModeBar({ activeMode, onModeClick, className }: ModeBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center py-4 gap-2',
        'w-[72px] bg-zinc-900/95 backdrop-blur-sm',
        'border-r border-zinc-800',
        className
      )}
    >
      {/* Logo/Home */}
      <div className="w-10 h-10 mb-4 flex items-center justify-center">
        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-md" />
      </div>

      {/* Mode Buttons */}
      <div className="flex flex-col gap-1">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeClick(mode.id)}
              className={cn(
                'group relative w-14 h-14 flex flex-col items-center justify-center',
                'rounded-xl transition-all duration-200',
                'hover:bg-zinc-800',
                isActive && 'bg-zinc-800 ring-1 ring-violet-500/50'
              )}
              title={`${mode.label} (${mode.shortcut})`}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-400 group-hover:text-zinc-200'
                )}
              />
              <span
                className={cn(
                  'text-[10px] mt-1 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              >
                {mode.shortcut}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-500 rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions - could add settings, help, etc. */}
    </div>
  );
}
