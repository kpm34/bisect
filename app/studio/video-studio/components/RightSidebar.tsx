'use client';

import React, { useState } from 'react';
import AIChat from './AIChat';
import ClipPropertiesPanel from './ClipPropertiesPanel';

const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'properties'>('chat');

  return (
    <div className="flex flex-col h-full bg-[#141414]">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-gray-400 text-white'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <span>AI Assistant</span>
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'properties'
              ? 'border-gray-400 text-white'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <span>Properties</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <AIChat />
        ) : (
          <ClipPropertiesPanel />
        )}
      </div>
    </div>
  );
};

export default RightSidebar;