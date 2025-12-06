'use client';

import { useState } from 'react';
import { MaterialSelector } from './MaterialSelector';
import ObjectEditor from './ObjectEditor';
import EnvironmentControls from './EnvironmentControls';
import EventsPanel from './EventsPanel';
import { SceneEnvironment, EnvironmentPreset } from '@/lib/core/materials/types';

/**
 * SceneInspector - 3D Canvas Control Panel
 *
 * Tabbed interface for Material, Object, Animation, Scene, and Events controls
 * 5 solid, focused panels for professional 3D editing
 */

type TabId = 'material' | 'object' | 'animation' | 'scene' | 'events';

interface TabConfig {
  id: TabId;
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'material', label: 'Material' },
  { id: 'object', label: 'Object' },
  { id: 'animation', label: 'Animate' },
  { id: 'scene', label: 'Scene' },
  { id: 'events', label: 'Events' },
];

interface SceneInspectorProps {
  onTabChange?: (tab: TabId) => void;
  environment: SceneEnvironment;
  onEnvironmentChange: (env: SceneEnvironment) => void;
}

export default function SceneInspector({ onTabChange, environment, onEnvironmentChange }: SceneInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabId>('material');

  // Preset-specific blur values (studio needs less blur for clean product shots)
  const PRESET_BLUR: Record<EnvironmentPreset, number> = {
    studio: 0.5,
    city: 0.8,
    sunset: 0.7,
    dawn: 0.7,
    night: 0.6,
    forest: 0.8,
    warehouse: 0.6,
    park: 0.8,
    apartment: 0.7,
    lobby: 0.6,
  };

  // Environment setter helpers
  const setPreset = (preset: EnvironmentPreset) =>
    onEnvironmentChange({
      ...environment,
      preset,
      blur: PRESET_BLUR[preset] ?? 0.8,
      hdriUrl: undefined
    });
  const setBackground = (background: boolean) =>
    onEnvironmentChange({ ...environment, background });
  const setBlur = (blur: number) =>
    onEnvironmentChange({ ...environment, blur });
  const setIntensity = (intensity: number) =>
    onEnvironmentChange({ ...environment, intensity });

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <>
      {/* Unified Tab Container - tabs and content connected */}
      <div className="flex-1 mx-3 mb-3 mt-3 bg-[#1a1a1a] rounded-2xl shadow-lg overflow-hidden flex flex-col">
        {/* Tab Bar - integrated with content */}
        <nav className="flex gap-0.5 px-2 py-2 bg-[#262626] border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-[#5ba4cf] text-white shadow-sm'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content - flows from tabs */}
        <div className="flex-1 overflow-y-auto">
        {activeTab === 'material' && <MaterialSelector />}

        {activeTab === 'object' && (
          <div className="p-4">
            <ObjectEditor />
          </div>
        )}

        {activeTab === 'animation' && (
          <div className="p-4">
            <p className="text-sm text-gray-400">
              Animation timeline and controls will appear here.
            </p>
          </div>
        )}

        {activeTab === 'scene' && (
          <div className="p-4">
            <EnvironmentControls
              currentPreset={environment.preset || 'city'}
              onPresetChange={setPreset}
              showBackground={environment.background ?? true}
              onBackgroundChange={setBackground}
              blur={environment.blur ?? 0.8}
              onBlurChange={setBlur}
              intensity={environment.intensity ?? 1.0}
              onIntensityChange={setIntensity}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-4">
            <EventsPanel />
          </div>
        )}
        </div>
      </div>
    </>
  );
}
