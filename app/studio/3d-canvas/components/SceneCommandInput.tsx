'use client';

import { useState } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { parseCommand } from '../utils/commandParser';
import { useAIMaterialEditor } from '../hooks/useAIMaterialEditor';

interface SceneCommandInputProps {
  sceneLoaded: boolean;
  activeTab: string;
}

/**
 * SceneCommandInput - AI command input for natural language scene editing
 */
export default function SceneCommandInput({ sceneLoaded, activeTab }: SceneCommandInputProps) {
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

  // AI Material Editor hook
  const { executeMaterialCommand, isProcessing: aiProcessing } = useAIMaterialEditor();

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !sceneLoaded) return;

    setIsProcessing(true);
    setFeedback('');

    try {
      const parsed = parseCommand(command);

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
              setFeedback(`✅ Changed color to ${parsed.params.color}`);
              break;
            case 'setRoughness':
              setRoughness(parsed.params.value);
              setFeedback(`✅ Set roughness to ${parsed.params.value}`);
              break;
            case 'setMetalness':
              setMetalness(parsed.params.value);
              setFeedback(`✅ Set metalness to ${parsed.params.value}`);
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
              const [px, py, pz] = parsed.params.position;
              setPosition(px, py, pz);
              setFeedback(`✅ Moved to (${px}, ${py}, ${pz})`);
              break;
            case 'setRotation':
              const [rx, ry, rz] = parsed.params.rotation;
              setRotation(rx, ry, rz);
              setFeedback(`✅ Rotated to (${rx}, ${ry}, ${rz})`);
              break;
            case 'setScale':
              const [sx, sy, sz] = parsed.params.scale;
              setScale(sx, sy, sz);
              setFeedback(`✅ Scaled to (${sx}, ${sy}, ${sz})`);
              break;
          }
          break;

        default:
          // AI fallback for material tab when rule-based parsing fails
          if (activeTab === 'material' && selectedObject) {
            setFeedback('🤖 Thinking...');
            const result = await executeMaterialCommand(command);

            if (result.success) {
              setFeedback(`✅ ${result.reasoning || 'Material updated'}`);
            } else {
              setFeedback(`❌ ${result.error || 'Could not process. Try being more specific.'}`);
            }
          } else if (!selectedObject) {
            setFeedback('❌ Select an object first, then try material commands like "make it more brushed"');
          } else {
            setFeedback('❌ Command not recognized. Try "select cube" or "make it red"');
          }
      }

      setCommand('');
    } catch (error) {
      setFeedback(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(''), 5000);
    }
  };

  const getPlaceholder = () => {
    if (!universalEditor) return 'Load a scene first...';
    if (!selectedObject) return 'Try: "select cube" or click an object...';

    switch (activeTab) {
      case 'material':
        return 'Try: "more brushed", "golden tint", "polished chrome"';
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
    <div className="p-4">
      {/* Feedback Display */}
      {feedback && (
        <div className="mb-2 px-4 py-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 text-sm text-white whitespace-pre-line">
          {feedback}
        </div>
      )}

      <form onSubmit={handleCommand}>
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
            disabled={!command.trim() || !sceneLoaded || isProcessing || aiProcessing}
            className="absolute bottom-4 right-4 w-10 h-10 bg-cta-orange hover:bg-cta-orange-hover disabled:bg-gray-600 disabled:opacity-50 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            {isProcessing || aiProcessing ? (
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
  );
}
