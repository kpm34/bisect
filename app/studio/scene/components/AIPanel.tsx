'use client';

import { useState } from 'react';
import { MaterialSelector } from './MaterialSelector';
import { useSelection } from '../r3f/SelectionContext';
import ObjectTransformControls from './ObjectTransformControls';
import { parseCommand } from '../utils/commandParser';

interface AIPanelProps {
  sceneLoaded: boolean;
}

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

export default function AIPanel({ sceneLoaded }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('material');
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const {
    universalEditor,
    selectedObject,
    selectObjectByName,
    setColor,
    setRoughness,
    setMetalness,
    setPosition,
    setRotation,
    setScale,
  } = useSelection();

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !sceneLoaded) return;

    setIsProcessing(true);
    setFeedback('');
    console.log('🤖 Processing command:', command);

    try {
      // Parse the command
      const parsed = parseCommand(command);
      console.log('📋 Parsed command:', parsed);

      // Execute based on command type
      switch (parsed.type) {
        case 'select':
          if (parsed.target && universalEditor) {
            const success = selectObjectByName(parsed.target);
            setFeedback(
              success
                ? `✅ Selected "${parsed.target}"`
                : `❌ Object "${parsed.target}" not found. Try clicking it first.`
            );
          } else {
            setFeedback('❌ No scene loaded or object name not specified');
          }
          break;

        case 'material':
          if (!selectedObject) {
            setFeedback('❌ No object selected. Select an object first.');
            break;
          }

          switch (parsed.action) {
            case 'setColor':
              setColor(parsed.params.color);
              setFeedback(`✅ Color updated`);
              break;
            case 'setRoughness':
              setRoughness(parsed.params.value);
              setFeedback(`✅ Roughness set to ${parsed.params.value}`);
              break;
            case 'setMetalness':
              setMetalness(parsed.params.value);
              setFeedback(`✅ Metalness set to ${parsed.params.value}`);
              break;
          }
          break;

        case 'transform':
          if (!selectedObject) {
            setFeedback('❌ No object selected. Select an object first.');
            break;
          }

          switch (parsed.action) {
            case 'setPosition':
              setPosition(parsed.params.x, parsed.params.y, parsed.params.z);
              setFeedback(`✅ Position set to (${parsed.params.x}, ${parsed.params.y}, ${parsed.params.z})`);
              break;
            case 'setRotation':
              setRotation(parsed.params.x, parsed.params.y, parsed.params.z);
              setFeedback(`✅ Rotation updated`);
              break;
            case 'setScale':
              setScale(parsed.params.x, parsed.params.y, parsed.params.z);
              setFeedback(`✅ Scale set to (${parsed.params.x}, ${parsed.params.y}, ${parsed.params.z})`);
              break;
          }
          break;

        case 'unknown':
          setFeedback(
            '❓ Command not recognized. Try:\n- "select cube"\n- "make it red"\n- "move to 0 5 0"\n- "rotate 45 0 0 degrees"'
          );
          break;
      }
    } catch (error) {
      console.error('❌ Command execution failed:', error);
      setFeedback(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setCommand('');

      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(''), 5000);
    }
  };

  const getPlaceholder = () => {
    if (!universalEditor) {
      return 'Load a scene first...';
    }

    if (!selectedObject) {
      return 'Try: "select cube" or click an object...';
    }

    switch (activeTab) {
      case 'material':
        return 'Try: "make it red" or "roughness 0.5"';
      case 'object':
        return 'Try: "move to 0 5 0" or "rotate 45 0 0 degrees"';
      case 'animation':
        return 'rotate continuously, hover scale 1.2x...';
      case 'scene':
        return 'studio lighting, camera FOV 60, add fog...';
      default:
        return 'Enter a command...';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Header - Dark navy matching extension */}
      <header className="px-4 py-4 border-b border-gray-700 bg-[#1a2332]">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-[#87CEEB] to-[#4A90E2] bg-clip-text text-transparent">
          Prism Copilot
        </h1>
      </header>

      {/* Tab Bar - Light beige pill container matching extension */}
      <div className="px-4 pt-3 pb-2">
        <nav className="flex gap-1 px-4 py-3 bg-[#f5f3ed] rounded-[50px] shadow-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
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

      {/* Tab Content Container - Separate beige background container */}
      <div className="flex-1 mx-4 mb-4 bg-[#f5f3ed] rounded-2xl shadow-inner overflow-hidden">
        <main className="h-full overflow-y-auto px-4 pt-5 pb-32">
        {/* Material Tab - Always visible */}
        {activeTab === 'material' && <MaterialSelector />}

        {/* Object Tab */}
        {activeTab === 'object' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Object Transform</h3>
            <ObjectTransformControls />
          </div>
        )}

        {/* Animation Tab */}
        {activeTab === 'animation' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Animation</h3>
            <p className="text-sm text-gray-600">
              Animation timeline and controls will appear here.
            </p>
            {/* TODO: Add animation controls */}
          </div>
        )}

        {/* Scene Tab */}
        {activeTab === 'scene' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Scene Settings</h3>
            <p className="text-sm text-gray-600">
              Scene settings (lighting, camera, environment) will appear here.
            </p>
            {/* TODO: Add scene controls */}
          </div>
        )}
      </main>
      </div>

      {/* Command Input (Fixed at bottom) - Keep original dark theme */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Feedback Display */}
        {feedback && (
          <div className="max-w-[55%] ml-[15%] mb-2 px-4 py-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 text-sm text-white whitespace-pre-line">
            {feedback}
          </div>
        )}

        <form onSubmit={handleCommand} className="relative max-w-[55%] ml-[15%]">
          {/* Liquid Glass Container */}
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={!sceneLoaded || isProcessing}
              rows={3}
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommand(e);
                }
              }}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!command.trim() || !sceneLoaded || isProcessing}
              className="absolute bottom-4 right-4 w-10 h-10 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-600 disabled:opacity-50 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5 text-[#001f3f]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
