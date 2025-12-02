'use client';

import { useState } from 'react';
import { Sun, Moon, Cloud, Building2, Trees, Warehouse, Sunset, Focus, ChevronDown, ChevronRight, Lightbulb, CircleDot, Cone } from 'lucide-react';
import { EnvironmentPreset } from '@/lib/core/materials/types';
import { useSelection } from '../r3f/SceneSelectionContext';

interface EnvironmentControlsProps {
  currentPreset: EnvironmentPreset;
  onPresetChange: (preset: EnvironmentPreset) => void;
  showBackground: boolean;
  onBackgroundChange: (show: boolean) => void;
  blur: number;
  onBlurChange: (blur: number) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
}

const ENVIRONMENT_PRESETS: {
  id: EnvironmentPreset;
  name: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { id: 'studio', name: 'Studio', icon: <Focus className="w-4 h-4" />, description: 'Clean studio lighting' },
  { id: 'city', name: 'City', icon: <Building2 className="w-4 h-4" />, description: 'Urban environment' },
  { id: 'sunset', name: 'Sunset', icon: <Sunset className="w-4 h-4" />, description: 'Warm golden hour' },
  { id: 'dawn', name: 'Dawn', icon: <Sun className="w-4 h-4" />, description: 'Soft morning light' },
  { id: 'night', name: 'Night', icon: <Moon className="w-4 h-4" />, description: 'Dark ambient' },
  { id: 'forest', name: 'Forest', icon: <Trees className="w-4 h-4" />, description: 'Natural greenery' },
  { id: 'warehouse', name: 'Warehouse', icon: <Warehouse className="w-4 h-4" />, description: 'Industrial setting' },
  { id: 'park', name: 'Park', icon: <Cloud className="w-4 h-4" />, description: 'Outdoor park' },
];

export default function EnvironmentControls({
  currentPreset,
  onPresetChange,
  showBackground,
  onBackgroundChange,
  blur,
  onBlurChange,
  intensity,
  onIntensityChange,
}: EnvironmentControlsProps) {
  const [showAdvancedLighting, setShowAdvancedLighting] = useState(false);
  const { lighting, updateLight } = useSelection();

  return (
    <div className="space-y-4">
      {/* Environment Presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Environment Preset</h4>
        <div className="grid grid-cols-4 gap-2">
          {ENVIRONMENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPresetChange(preset.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                currentPreset === preset.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800'
              }`}
              title={preset.description}
            >
              {preset.icon}
              <span className="text-xs mt-1">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Background Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Show Background</label>
        <button
          onClick={() => onBackgroundChange(!showBackground)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            showBackground ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              showBackground ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Background Blur Slider */}
      {showBackground && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Background Blur</label>
            <span className="text-xs text-gray-500">{blur.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={blur}
            onChange={(e) => onBlurChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Environment Intensity Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Reflection Intensity</label>
          <span className="text-xs text-gray-500">{intensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={intensity}
          onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>None</span>
          <span>Normal</span>
          <span>Intense</span>
        </div>
      </div>

      {/* Advanced Lighting - Progressive Disclosure */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowAdvancedLighting(!showAdvancedLighting)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Advanced Lighting
          </span>
          {showAdvancedLighting ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showAdvancedLighting && (
          <div className="mt-4 space-y-4">
            {/* Ambient Light */}
            <LightControl
              label="Ambient"
              icon={<Sun className="w-3.5 h-3.5" />}
              enabled={lighting.ambient.enabled}
              onToggle={(v) => updateLight('ambient', { enabled: v })}
              intensity={lighting.ambient.intensity}
              onIntensityChange={(v) => updateLight('ambient', { intensity: v })}
              maxIntensity={2}
              color={lighting.ambient.color}
              onColorChange={(v) => updateLight('ambient', { color: v })}
            />

            {/* Directional Light */}
            <LightControl
              label="Directional"
              icon={<Lightbulb className="w-3.5 h-3.5" />}
              enabled={lighting.directional.enabled}
              onToggle={(v) => updateLight('directional', { enabled: v })}
              intensity={lighting.directional.intensity}
              onIntensityChange={(v) => updateLight('directional', { intensity: v })}
              maxIntensity={3}
              color={lighting.directional.color}
              onColorChange={(v) => updateLight('directional', { color: v })}
            />

            {/* Point Light */}
            <LightControl
              label="Point"
              icon={<CircleDot className="w-3.5 h-3.5" />}
              enabled={lighting.point.enabled}
              onToggle={(v) => updateLight('point', { enabled: v })}
              intensity={lighting.point.intensity}
              onIntensityChange={(v) => updateLight('point', { intensity: v })}
              maxIntensity={5}
              color={lighting.point.color}
              onColorChange={(v) => updateLight('point', { color: v })}
            />

            {/* Spot Light */}
            <LightControl
              label="Spot"
              icon={<Cone className="w-3.5 h-3.5" />}
              enabled={lighting.spot.enabled}
              onToggle={(v) => updateLight('spot', { enabled: v })}
              intensity={lighting.spot.intensity}
              onIntensityChange={(v) => updateLight('spot', { intensity: v })}
              maxIntensity={5}
              color={lighting.spot.color}
              onColorChange={(v) => updateLight('spot', { color: v })}
            />

            {/* Quick tip for lighting */}
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
              <p>💡 Ambient + Directional is usually enough. Add Point/Spot for dramatic effects.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LightControl - Compact light control with toggle, intensity slider, and color picker
 */
function LightControl({
  label,
  icon,
  enabled,
  onToggle,
  intensity,
  onIntensityChange,
  maxIntensity,
  color,
  onColorChange,
}: {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  maxIntensity: number;
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${enabled ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className={enabled ? 'text-blue-500' : 'text-gray-400'}>{icon}</span>
          {label}
        </label>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Controls - only show when enabled */}
      {enabled && (
        <div className="space-y-2">
          {/* Intensity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">Intensity</span>
            <input
              type="range"
              min="0"
              max={maxIntensity}
              step="0.1"
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gray-600 w-8 text-right">{intensity.toFixed(1)}</span>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-xs text-gray-500 uppercase">{color}</span>
          </div>
        </div>
      )}
    </div>
  );
}
