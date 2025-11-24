'use client';

import { useState } from 'react';
import { MaterialSelector } from './MaterialSelector';
import ObjectTransformControls from './ObjectTransformControls';

/**
 * PrismCopilot - Layer 2 Character
 *
 * Tabbed interface for Material, Object, Animation, and Scene controls
 * Simplified structure: only functional containers
 */

type TabId = 'material' | 'object' | 'animation' | 'scene';

interface TabConfig {
  id: TabId;
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'material', label: 'Material' },
  { id: 'object', label: 'Object' },
  { id: 'animation', label: 'Animation' },
  { id: 'scene', label: 'Scene' },
];

interface PrismCopilotProps {
  onTabChange?: (tab: TabId) => void;
}

export default function PrismCopilot({ onTabChange }: PrismCopilotProps) {
  const [activeTab, setActiveTab] = useState<TabId>('material');

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <>
      {/* Prism Copilot Title - No container, just text */}
      <h1 className="px-4 py-4 text-xl font-semibold bg-gradient-to-r from-[#87CEEB] to-[#4A90E2] bg-clip-text text-transparent border-b border-gray-700 bg-[#1a2332] truncate">
        Prism Copilot
      </h1>

      {/* Tab Bar - Layer 3: Tab switching logic */}
      <div className="px-4 pt-3 pb-2">
        <nav className="flex gap-1 px-4 py-3 bg-[#f5f3ed] rounded-[50px] shadow-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-shrink-0 min-w-[80px] px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
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
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Object Transform</h3>
            <ObjectTransformControls />
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
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Scene Settings</h3>
            <p className="text-sm text-gray-600">
              Scene settings (lighting, camera, environment) will appear here.
            </p>
          </>
        )}
      </div>
    </>
  );
}
