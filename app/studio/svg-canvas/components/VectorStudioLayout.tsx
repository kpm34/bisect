'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModeBar, ModeType, MODES } from './ModeBar';
import { ToolOptionsPanel } from './ToolOptionsPanel';
import { ToolType, TOOL_GROUPS } from './ToolPalette';
import { ToolProperties } from './ToolProperties';
import { Tool } from '../lib/types/types';

interface VectorStudioLayoutProps {
  children: React.ReactNode;
  // Current tool state (from VectorEditor)
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  // Style properties
  strokeWidth: number;
  strokeColor: string;
  fillColor: string;
  opacity?: number;
  onStrokeWidthChange: (value: number) => void;
  onStrokeColorChange: (value: string) => void;
  onFillColorChange: (value: string) => void;
  onOpacityChange?: (value: number) => void;
  // Action handlers
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onImport: () => void;
  onExportSvg: () => void;
  onExportCode: () => void;
  onSaveToLibrary: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Map from new ToolType to old Tool enum
const toolTypeToTool: Record<ToolType, Tool | null> = {
  select: Tool.SELECT,
  pan: Tool.HAND,
  zoom: null, // Zoom handled differently
  pen: Tool.PEN,
  pencil: Tool.PENCIL,
  rectangle: Tool.SHAPE,
  ellipse: Tool.SHAPE,
  text: Tool.TEXT,
  image: null, // Handled as action
  move: Tool.SELECT,
  rotate: Tool.SELECT,
  scale: Tool.SELECT,
  resize: Tool.SELECT,
  flip: null, // Handled as action
  slice: null, // Not implemented
  import: null, // Action
  'export-svg': null, // Action
  'export-code': null, // Action
  'save-to-library': null, // Action
  undo: null, // Action
  redo: null, // Action
  clear: null, // Action
};

// Map from old Tool to new ToolType
const toolToToolType: Partial<Record<Tool, ToolType>> = {
  [Tool.SELECT]: 'select',
  [Tool.HAND]: 'pan',
  [Tool.PEN]: 'pen',
  [Tool.PENCIL]: 'pencil',
  [Tool.SHAPE]: 'rectangle',
  [Tool.TEXT]: 'text',
};

// Map ToolType to ModeType
const toolTypeToMode: Record<ToolType, ModeType> = {
  select: 'select',
  pan: 'select',
  zoom: 'select',
  pen: 'draw',
  pencil: 'draw',
  rectangle: 'draw',
  ellipse: 'draw',
  text: 'draw',
  image: 'draw',
  move: 'edit',
  rotate: 'edit',
  scale: 'edit',
  resize: 'edit',
  flip: 'edit',
  slice: 'edit',
  import: 'actions',
  'export-svg': 'actions',
  'export-code': 'actions',
  'save-to-library': 'actions',
  undo: 'actions',
  redo: 'actions',
  clear: 'actions',
};

export function VectorStudioLayout({
  children,
  currentTool,
  onToolChange,
  strokeWidth,
  strokeColor,
  fillColor,
  opacity = 100,
  onStrokeWidthChange,
  onStrokeColorChange,
  onFillColorChange,
  onOpacityChange,
  onUndo,
  onRedo,
  onClear,
  onImport,
  onExportSvg,
  onExportCode,
  onSaveToLibrary,
  canUndo,
  canRedo,
}: VectorStudioLayoutProps) {
  const [activeMode, setActiveMode] = useState<ModeType | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Sync activeTool with currentTool from parent
  useEffect(() => {
    const newToolType = toolToToolType[currentTool];
    if (newToolType && newToolType !== activeTool) {
      setActiveTool(newToolType);
      // Also update the mode
      setActiveMode(toolTypeToMode[newToolType]);
    }
  }, [currentTool]);

  const handleModeClick = useCallback((mode: ModeType) => {
    if (activeMode === mode && isPanelOpen) {
      // Clicking same mode closes panel
      setIsPanelOpen(false);
      setActiveMode(null);
    } else {
      setActiveMode(mode);
      setIsPanelOpen(true);
    }
  }, [activeMode, isPanelOpen]);

  const handleToolSelect = useCallback((toolType: ToolType) => {
    setActiveTool(toolType);

    // Handle actions immediately
    switch (toolType) {
      case 'undo':
        onUndo();
        return;
      case 'redo':
        onRedo();
        return;
      case 'clear':
        onClear();
        return;
      case 'import':
        onImport();
        return;
      case 'export-svg':
        onExportSvg();
        return;
      case 'export-code':
        onExportCode();
        return;
      case 'save-to-library':
        onSaveToLibrary();
        return;
    }

    // Map to old tool system
    const tool = toolTypeToTool[toolType];
    if (tool) {
      onToolChange(tool);
    }
  }, [onToolChange, onUndo, onRedo, onClear, onImport, onExportSvg, onExportCode, onSaveToLibrary]);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    // Keep mode highlighted but close panel
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape closes panel
      if (e.key === 'Escape') {
        setIsPanelOpen(false);
        return;
      }

      // Mode shortcuts
      if (!e.metaKey && !e.ctrlKey) {
        switch (e.key.toUpperCase()) {
          case 'V':
            if (!isPanelOpen || activeMode !== 'select') {
              handleModeClick('select');
            }
            handleToolSelect('select');
            break;
          case 'P':
            if (!isPanelOpen || activeMode !== 'draw') {
              handleModeClick('draw');
            }
            handleToolSelect('pen');
            break;
          case 'B':
            handleToolSelect('pencil');
            break;
          case 'R':
            handleToolSelect('rectangle');
            break;
          case 'O':
            handleToolSelect('ellipse');
            break;
          case 'T':
            handleToolSelect('text');
            break;
          case 'H':
            handleToolSelect('pan');
            break;
          case 'E':
            if (!isPanelOpen || activeMode !== 'edit') {
              handleModeClick('edit');
            }
            break;
          case 'A':
            if (!isPanelOpen || activeMode !== 'actions') {
              handleModeClick('actions');
            }
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              onRedo();
            } else {
              onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            onRedo();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              onExportCode();
            } else {
              onExportSvg();
            }
            break;
          case 'o':
            e.preventDefault();
            onImport();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, isPanelOpen, handleModeClick, handleToolSelect, onUndo, onRedo, onExportSvg, onExportCode, onImport]);

  return (
    <div className="flex h-screen w-screen bg-zinc-950 overflow-hidden">
      {/* Mode Bar (Left) */}
      <ModeBar
        activeMode={activeMode}
        onModeClick={handleModeClick}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {children}
      </div>

      {/* Tool Options Panel (Right - Slides in/out) */}
      <ToolOptionsPanel
        isOpen={isPanelOpen}
        mode={activeMode}
        activeTool={activeTool}
        onClose={handlePanelClose}
        onToolSelect={handleToolSelect}
      >
        <ToolProperties
          tool={activeTool}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          fillColor={fillColor}
          opacity={opacity}
          onStrokeWidthChange={onStrokeWidthChange}
          onStrokeColorChange={onStrokeColorChange}
          onFillColorChange={onFillColorChange}
          onOpacityChange={onOpacityChange}
        />
      </ToolOptionsPanel>
    </div>
  );
}
