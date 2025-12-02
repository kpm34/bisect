'use client';

import React from 'react';
import {
  MousePointer2,
  Hand,
  ZoomIn,
  Pencil,
  PenTool,
  Circle,
  Square,
  Type,
  Image,
  Scissors,
  Move,
  RotateCw,
  Scaling,
  Maximize2,
  FlipHorizontal,
  Upload,
  Download,
  Code,
  Trash2,
  Undo,
  Redo,
  FolderPlus,
  Eraser,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeType } from './ModeBar';

export type ToolType =
  // Selection & Navigation
  | 'select'
  | 'pan'
  | 'zoom'
  // Drawing & Creation
  | 'pen'
  | 'pencil'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'image'
  | 'eraser'
  // Editing & Transform
  | 'move'
  | 'rotate'
  | 'scale'
  | 'resize'
  | 'flip'
  | 'slice'
  // Actions & Export
  | 'import'
  | 'export-svg'
  | 'export-code'
  | 'save-to-library'
  | 'undo'
  | 'redo'
  | 'clear';

interface Tool {
  id: ToolType;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  description?: string;
}

interface ToolGroup {
  mode: ModeType;
  title: string;
  tools: Tool[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    mode: 'select',
    title: 'Selection & Navigation',
    tools: [
      { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V', description: 'Select and move objects' },
      { id: 'pan', label: 'Pan', icon: Hand, shortcut: 'H', description: 'Pan around the canvas' },
      { id: 'zoom', label: 'Zoom', icon: ZoomIn, shortcut: 'Z', description: 'Zoom in and out' },
    ],
  },
  {
    mode: 'draw',
    title: 'Drawing & Creation',
    tools: [
      { id: 'pen', label: 'Pen', icon: PenTool, shortcut: 'P', description: 'Draw paths with bezier curves' },
      { id: 'pencil', label: 'Pencil', icon: Pencil, shortcut: 'B', description: 'Freehand drawing' },
      { id: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'X', description: 'Erase parts of paths' },
      { id: 'rectangle', label: 'Rectangle', icon: Square, shortcut: 'R', description: 'Draw rectangles and squares' },
      { id: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'O', description: 'Draw circles and ellipses' },
      { id: 'text', label: 'Text', icon: Type, shortcut: 'T', description: 'Add text elements' },
      { id: 'image', label: 'Image', icon: Image, shortcut: 'I', description: 'Import images' },
    ],
  },
  {
    mode: 'edit',
    title: 'Editing & Transform',
    tools: [
      { id: 'move', label: 'Move', icon: Move, shortcut: 'M', description: 'Move selected objects' },
      { id: 'rotate', label: 'Rotate', icon: RotateCw, shortcut: 'Shift+R', description: 'Rotate selected objects' },
      { id: 'scale', label: 'Scale', icon: Scaling, shortcut: 'S', description: 'Scale selected objects' },
      { id: 'resize', label: 'Resize', icon: Maximize2, description: 'Resize with precise dimensions' },
      { id: 'flip', label: 'Flip', icon: FlipHorizontal, description: 'Flip horizontally or vertically' },
      { id: 'slice', label: 'Slice', icon: Scissors, description: 'Cut paths and shapes' },
    ],
  },
  {
    mode: 'actions',
    title: 'Actions & Export',
    tools: [
      { id: 'import', label: 'Import', icon: Upload, shortcut: 'Ctrl+O', description: 'Import SVG or image' },
      { id: 'export-svg', label: 'Export SVG', icon: Download, shortcut: 'Ctrl+S', description: 'Export as SVG file' },
      { id: 'export-code', label: 'Export Code', icon: Code, shortcut: 'Ctrl+Shift+S', description: 'Export as React/HTML code' },
      { id: 'save-to-library', label: 'Add to Library', icon: FolderPlus, description: 'Save to your asset library' },
      { id: 'undo', label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', description: 'Undo last action' },
      { id: 'redo', label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', description: 'Redo last action' },
      { id: 'clear', label: 'Clear All', icon: Trash2, description: 'Clear entire canvas' },
    ],
  },
];

export function getToolsForMode(mode: ModeType): Tool[] {
  const group = TOOL_GROUPS.find((g) => g.mode === mode);
  return group?.tools ?? [];
}

interface ToolPaletteProps {
  mode: ModeType;
  activeTool: ToolType | null;
  onToolSelect: (tool: ToolType) => void;
  className?: string;
}

export function ToolPalette({ mode, activeTool, onToolSelect, className }: ToolPaletteProps) {
  const tools = getToolsForMode(mode);
  const group = TOOL_GROUPS.find((g) => g.mode === mode);

  if (!group) return null;

  return (
    <div className={cn('p-4', className)}>
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        Tools
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                'group flex flex-col items-center justify-center p-3',
                'rounded-lg transition-all duration-150',
                'hover:bg-zinc-800',
                isActive && 'bg-zinc-800 ring-1 ring-violet-500/50'
              )}
              title={tool.description}
            >
              <Icon
                className={cn(
                  'w-5 h-5 mb-1 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-400 group-hover:text-zinc-200'
                )}
              />
              <span
                className={cn(
                  'text-[10px] transition-colors truncate w-full text-center',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              >
                {tool.label}
              </span>
              {tool.shortcut && (
                <span className="text-[9px] text-zinc-600 mt-0.5">{tool.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
