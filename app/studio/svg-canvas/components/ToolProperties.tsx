'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ToolType } from './ToolPalette';

// Reusable input components
interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

function SliderInput({ label, value, min, max, step = 1, unit = '', onChange }: SliderInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{label}</label>
        <span className="text-xs text-zinc-500">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-violet-500
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110"
      />
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border border-zinc-700"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
        />
      </div>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (value: number) => void;
}

function NumberInput({ label, value, min, max, unit = '', onChange }: NumberInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-right"
        />
        {unit && <span className="text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Tool-specific property panels
interface ToolPropertiesProps {
  tool: ToolType | null;
  // Shape properties
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  opacity?: number;
  cornerRadius?: number;
  // Transform properties
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  // Handlers
  onStrokeWidthChange?: (value: number) => void;
  onStrokeColorChange?: (value: string) => void;
  onFillColorChange?: (value: string) => void;
  onOpacityChange?: (value: number) => void;
  onCornerRadiusChange?: (value: number) => void;
  onRotationChange?: (value: number) => void;
  onScaleChange?: (x: number, y: number) => void;
}

export function ToolProperties({
  tool,
  strokeWidth = 2,
  strokeColor = '#ffffff',
  fillColor = '#3b82f6',
  opacity = 100,
  cornerRadius = 0,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  onStrokeWidthChange,
  onStrokeColorChange,
  onFillColorChange,
  onOpacityChange,
  onCornerRadiusChange,
  onRotationChange,
  onScaleChange,
}: ToolPropertiesProps) {
  if (!tool) {
    return (
      <div className="text-xs text-zinc-500 text-center py-4">
        Select a tool to see its properties
      </div>
    );
  }

  // Render different properties based on tool
  switch (tool) {
    case 'pen':
    case 'pencil':
      return (
        <div className="space-y-4">
          <SliderInput
            label="Stroke Width"
            value={strokeWidth}
            min={1}
            max={20}
            unit="px"
            onChange={onStrokeWidthChange || (() => {})}
          />
          <ColorInput
            label="Stroke Color"
            value={strokeColor}
            onChange={onStrokeColorChange || (() => {})}
          />
          <SliderInput
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            unit="%"
            onChange={onOpacityChange || (() => {})}
          />
        </div>
      );

    case 'rectangle':
      return (
        <div className="space-y-4">
          <ColorInput
            label="Fill"
            value={fillColor}
            onChange={onFillColorChange || (() => {})}
          />
          <ColorInput
            label="Stroke"
            value={strokeColor}
            onChange={onStrokeColorChange || (() => {})}
          />
          <SliderInput
            label="Stroke Width"
            value={strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={onStrokeWidthChange || (() => {})}
          />
          <SliderInput
            label="Corner Radius"
            value={cornerRadius}
            min={0}
            max={50}
            unit="px"
            onChange={onCornerRadiusChange || (() => {})}
          />
          <SliderInput
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            unit="%"
            onChange={onOpacityChange || (() => {})}
          />
        </div>
      );

    case 'ellipse':
      return (
        <div className="space-y-4">
          <ColorInput
            label="Fill"
            value={fillColor}
            onChange={onFillColorChange || (() => {})}
          />
          <ColorInput
            label="Stroke"
            value={strokeColor}
            onChange={onStrokeColorChange || (() => {})}
          />
          <SliderInput
            label="Stroke Width"
            value={strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={onStrokeWidthChange || (() => {})}
          />
          <SliderInput
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            unit="%"
            onChange={onOpacityChange || (() => {})}
          />
        </div>
      );

    case 'rotate':
      return (
        <div className="space-y-4">
          <NumberInput
            label="Rotation"
            value={rotation}
            min={-360}
            max={360}
            unit="°"
            onChange={onRotationChange || (() => {})}
          />
          <div className="flex gap-2">
            {[0, 45, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => onRotationChange?.(deg)}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded',
                  'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
                  'transition-colors'
                )}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      );

    case 'scale':
      return (
        <div className="space-y-4">
          <NumberInput
            label="Scale X"
            value={scaleX}
            min={0.1}
            max={10}
            onChange={(x) => onScaleChange?.(x, scaleY)}
          />
          <NumberInput
            label="Scale Y"
            value={scaleY}
            min={0.1}
            max={10}
            onChange={(y) => onScaleChange?.(scaleX, y)}
          />
          <div className="flex gap-2">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => onScaleChange?.(s, s)}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded',
                  'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
                  'transition-colors'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      );

    case 'flip':
      return (
        <div className="space-y-3">
          <button
            onClick={() => onScaleChange?.(-1, 1)}
            className="w-full py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
          >
            Flip Horizontal
          </button>
          <button
            onClick={() => onScaleChange?.(1, -1)}
            className="w-full py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
          >
            Flip Vertical
          </button>
        </div>
      );

    case 'select':
    case 'pan':
    case 'zoom':
      return (
        <div className="text-xs text-zinc-500 text-center py-4">
          Click and drag on the canvas to use this tool
        </div>
      );

    case 'import':
    case 'export-svg':
    case 'export-code':
    case 'undo':
    case 'redo':
    case 'clear':
      return (
        <div className="text-xs text-zinc-500 text-center py-4">
          Click the tool button to perform this action
        </div>
      );

    default:
      return (
        <div className="text-xs text-zinc-500 text-center py-4">
          Properties for this tool coming soon
        </div>
      );
  }
}
