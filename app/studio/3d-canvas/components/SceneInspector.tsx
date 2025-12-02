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

  // Environment setter helpers
  const setPreset = (preset: EnvironmentPreset) =>
    onEnvironmentChange({ ...environment, preset, hdriUrl: undefined });
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
      {/* Tab Bar - Layer 3: Tab switching logic */}
      <div className="px-3 pt-4 pb-2">
        <nav className="flex gap-0.5 px-1.5 py-1.5 bg-[#f5f3ed] rounded-full shadow-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-[#5ba4cf] text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Layer 3: Single container for content */}
      <div className="flex-1 mx-4 mb-4 bg-[#f5f3ed] rounded-2xl shadow-inner overflow-y-auto px-4 pt-5 pb-8">
        {activeTab === 'material' && <MaterialSelector />}

        {activeTab === 'object' && (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Object Editor</h3>
            <ObjectEditor />
          </>
        )}

        {activeTab === 'animation' && (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Animation</h3>
            <p className="text-sm text-gray-600">
              Animation timeline and controls will appear here.
            </p>
          </>
        )}

        {activeTab === 'scene' && (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Environment & Lighting</h3>
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
          </>
        )}

        {activeTab === 'events' && (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Events & Effects</h3>
            <EventsPanel />
          </>
        )}
      </div>
    </>
  );
}
