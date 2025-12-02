'use client';

import { useState } from 'react';
import { Sun, Moon, Cloud, Building2, Trees, Warehouse, Sunset, Focus } from 'lucide-react';
import { EnvironmentPreset } from '@/lib/core/materials/types';

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
  const [isExpanded, setIsExpanded] = useState(true);

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

      {/* Quick Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Studio is best for product shots</li>
          <li>Higher intensity = stronger reflections</li>
          <li>Blur softens the background</li>
        </ul>
      </div>
    </div>
  );
}
