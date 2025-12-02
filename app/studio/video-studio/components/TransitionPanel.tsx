'use client';

import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSITION_CATEGORIES } from '../constants';
import { TransitionType, TrackType } from '../types';
import { ChevronDown, ChevronRight, Clock, Layers, X } from 'lucide-react';

interface TransitionPanelProps {
  onTransitionSelect?: (transitionType: TransitionType) => void;
}

const TransitionPanel: React.FC<TransitionPanelProps> = ({ onTransitionSelect }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    basic: true,
    motion: false,
    wipe: false,
    stylized: true,
  });
  const [selectedDuration, setSelectedDuration] = useState(0.5);

  const { tracks, selectedClipIds, addTransitionToClip } = useStore();

  // Find selected clip and its track
  const selectedClipInfo = React.useMemo(() => {
    if (selectedClipIds.length !== 1) return null;

    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipIds[0]);
      if (clip) {
        return { clip, track };
      }
    }
    return null;
  }, [tracks, selectedClipIds]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const handleTransitionClick = (transitionType: TransitionType) => {
    if (onTransitionSelect) {
      onTransitionSelect(transitionType);
      return;
    }

    // Apply to selected clip if one is selected
    if (selectedClipInfo) {
      // Default to applying as out transition
      addTransitionToClip(
        selectedClipInfo.track.id,
        selectedClipInfo.clip.id,
        transitionType,
        'out'
      );
    }
  };

  const getTransitionPreviewStyle = (type: TransitionType): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
    };

    switch (type) {
      case TransitionType.BLUR:
        return { ...baseStyle, filter: 'blur(2px)' };
      case TransitionType.GLITCH:
        return {
          ...baseStyle,
          background: 'repeating-linear-gradient(0deg, #4a4a4a 0px, #4a4a4a 2px, #ef4444 2px, #ef4444 4px)',
        };
      case TransitionType.FADE:
        return {
          ...baseStyle,
          background: 'linear-gradient(90deg, #4a4a4a 0%, transparent 100%)',
        };
      case TransitionType.CROSSFADE:
        return {
          ...baseStyle,
          background: 'linear-gradient(90deg, #4a4a4a 0%, #2a2a2a 50%, #4a4a4a 100%)',
        };
      case TransitionType.FLASH:
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #ffffff 0%, #4a4a4a 100%)',
        };
      case TransitionType.PIXELATE:
        return {
          ...baseStyle,
          background: 'repeating-conic-gradient(#4a4a4a 0% 25%, #2a2a2a 0% 50%) 50% / 8px 8px',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Transitions</h3>
        </div>
        {selectedClipInfo && (
          <span className="text-[10px] bg-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded">
            Applying to: {selectedClipInfo.clip.name}
          </span>
        )}
      </div>

      {/* Duration Setting */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">Duration</span>
          </div>
          <span className="text-xs text-white font-mono">{selectedDuration}s</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(parseFloat(e.target.value))}
          className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>0.1s</span>
          <span>2.0s</span>
        </div>
      </div>

      {/* No clip selected hint */}
      {!selectedClipInfo && (
        <div className="bg-[#1a1a1a]/50 border border-[#2a2a2a] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Select a clip in the timeline to apply transitions
          </p>
        </div>
      )}

      {/* Transition Categories */}
      <div className="space-y-2">
        {Object.entries(TRANSITION_CATEGORIES).map(([key, category]) => (
          <div key={key} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1a1a1a] transition-colors"
              onClick={() => toggleCategory(key)}
            >
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {category.name}
              </span>
              {expandedCategories[key] ? (
                <ChevronDown className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-600" />
              )}
            </button>

            {/* Transitions Grid */}
            {expandedCategories[key] && (
              <div className="grid grid-cols-2 gap-2 p-2 border-t border-[#2a2a2a]">
                {category.transitions.map((transition) => (
                  <button
                    key={transition.type}
                    className="group relative aspect-video bg-[#1a1a1a] rounded-md overflow-hidden border border-[#2a2a2a] hover:border-gray-500 transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing"
                    onClick={() => handleTransitionClick(transition.type)}
                    title={`${transition.description} - Click to apply or drag to clip edges`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        transitionType: transition.type,
                        transitionName: transition.name,
                      }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                  >
                    {/* Preview Animation */}
                    <div
                      className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                      style={getTransitionPreviewStyle(transition.type)}
                    />

                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl drop-shadow-lg">{transition.icon}</span>
                    </div>

                    {/* Label */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <span className="text-[10px] font-medium text-white">
                        {transition.name}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white bg-[#3a3a3a] px-2 py-1 rounded-full shadow-lg">
                        + Apply / Drag
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Applied Transitions on Selected Clip */}
      {selectedClipInfo && (selectedClipInfo.clip.transitionIn || selectedClipInfo.clip.transitionOut) && (
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Applied Transitions
          </h4>

          {selectedClipInfo.clip.transitionIn && (
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded px-2 py-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-600">IN:</span>
                <span className="text-xs text-white">{selectedClipInfo.clip.transitionIn.name}</span>
              </div>
              <button
                className="text-gray-600 hover:text-red-400 transition-colors"
                onClick={() => {
                  useStore.getState().removeTransition(
                    selectedClipInfo.track.id,
                    selectedClipInfo.clip.id,
                    'in'
                  );
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedClipInfo.clip.transitionOut && (
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded px-2 py-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-600">OUT:</span>
                <span className="text-xs text-white">{selectedClipInfo.clip.transitionOut.name}</span>
              </div>
              <button
                className="text-gray-600 hover:text-red-400 transition-colors"
                onClick={() => {
                  useStore.getState().removeTransition(
                    selectedClipInfo.track.id,
                    selectedClipInfo.clip.id,
                    'out'
                  );
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransitionPanel;
