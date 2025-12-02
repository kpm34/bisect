'use client';

/**
 * KeyframeEditor Component
 *
 * Allows users to create and edit keyframe animations for clip properties.
 * Supports position, scale, rotation, opacity, and volume animations.
 */

import React, { useMemo } from 'react';
import { useStore } from '../store';
import { KeyframeProperty, Keyframe, Clip, Track } from '../types';
import { Plus, Trash2, Diamond, Circle } from 'lucide-react';

const PROPERTY_LABELS: Record<KeyframeProperty, string> = {
  positionX: 'Position X',
  positionY: 'Position Y',
  scaleX: 'Scale X',
  scaleY: 'Scale Y',
  rotation: 'Rotation',
  opacity: 'Opacity',
  volume: 'Volume',
};

const PROPERTY_DEFAULTS: Record<KeyframeProperty, number> = {
  positionX: 960,
  positionY: 540,
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  opacity: 100,
  volume: 100,
};

const PROPERTY_RANGES: Record<KeyframeProperty, [number, number]> = {
  positionX: [0, 1920],
  positionY: [0, 1080],
  scaleX: [0, 400],
  scaleY: [0, 400],
  rotation: [-360, 360],
  opacity: [0, 100],
  volume: [0, 200],
};

interface KeyframeEditorProps {
  clipId: string;
  clipDuration: number;
}

const PropertyRow: React.FC<{
  clipId: string;
  property: KeyframeProperty;
  keyframes: Keyframe[];
  clipDuration: number;
  currentTime: number;
  onAddKeyframe: (property: KeyframeProperty, time: number, value: number) => void;
  onRemoveKeyframe: (keyframeId: string) => void;
  onUpdateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void;
  onSelectKeyframe: (keyframeId: string) => void;
  selectedKeyframeIds: string[];
}> = ({
  clipId,
  property,
  keyframes,
  clipDuration,
  currentTime,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframe,
  onSelectKeyframe,
  selectedKeyframeIds,
}) => {
  const [min, max] = PROPERTY_RANGES[property];
  const defaultValue = PROPERTY_DEFAULTS[property];

  // Calculate interpolated value at current time
  const { getInterpolatedValue } = useStore();
  const currentValue = getInterpolatedValue(clipId, property, currentTime) ?? defaultValue;

  return (
    <div className="flex items-center gap-2 py-1 border-b border-[#2a2a2a] hover:bg-[#1a1a1a]">
      {/* Property Label */}
      <span className="text-[10px] text-gray-400 w-20 truncate">{PROPERTY_LABELS[property]}</span>

      {/* Current Value */}
      <span className="text-[10px] text-gray-300 w-12 text-right font-mono">
        {currentValue.toFixed(1)}
      </span>

      {/* Keyframe Timeline Mini */}
      <div className="flex-1 h-4 bg-[#0a0a0a] rounded relative">
        {/* Time indicator */}
        <div
          className="absolute top-0 bottom-0 w-px bg-yellow-500/50"
          style={{ left: `${(currentTime / clipDuration) * 100}%` }}
        />

        {/* Keyframe dots */}
        {keyframes.map((kf) => {
          const isSelected = selectedKeyframeIds.includes(kf.id);
          const leftPercent = (kf.time / clipDuration) * 100;

          return (
            <button
              key={kf.id}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                isSelected ? 'text-yellow-400' : 'text-blue-400 hover:text-blue-300'
              }`}
              style={{ left: `${leftPercent}%` }}
              onClick={() => onSelectKeyframe(kf.id)}
              title={`t=${kf.time.toFixed(2)}s, value=${kf.value.toFixed(1)}`}
            >
              <Diamond className="w-2 h-2 fill-current" />
            </button>
          );
        })}
      </div>

      {/* Add Keyframe at Current Time */}
      <button
        className="p-1 text-gray-500 hover:text-white"
        onClick={() => onAddKeyframe(property, currentTime, currentValue)}
        title="Add keyframe at current time"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Keyframe Count */}
      <span className="text-[9px] text-gray-600 w-6 text-center">
        {keyframes.length}
      </span>
    </div>
  );
};

export const KeyframeEditor: React.FC<KeyframeEditorProps> = ({ clipId, clipDuration }) => {
  const {
    clipKeyframes,
    currentTime,
    selectedKeyframeIds,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    selectKeyframe,
    clearKeyframeSelection,
    tracks,
  } = useStore();

  // Get clip info
  const clip = useMemo(() => {
    for (const track of tracks) {
      const found = track.clips.find((c) => c.id === clipId);
      if (found) return found;
    }
    return null;
  }, [tracks, clipId]);

  // Calculate time relative to clip start
  const relativeTime = useMemo(() => {
    if (!clip) return 0;
    return Math.max(0, Math.min(currentTime - clip.start, clipDuration));
  }, [currentTime, clip, clipDuration]);

  // Get keyframes for this clip
  const keyframesForClip = clipKeyframes[clipId] || {};

  // All animatable properties
  const properties: KeyframeProperty[] = [
    'positionX', 'positionY',
    'scaleX', 'scaleY',
    'rotation',
    'opacity',
    'volume',
  ];

  // Get selected keyframe details
  const selectedKeyframe = useMemo(() => {
    if (selectedKeyframeIds.length !== 1) return null;
    const id = selectedKeyframeIds[0];
    for (const [prop, kfs] of Object.entries(keyframesForClip)) {
      const kf = kfs.find((k) => k.id === id);
      if (kf) return { ...kf, property: prop as KeyframeProperty };
    }
    return null;
  }, [selectedKeyframeIds, keyframesForClip]);

  if (!clip) {
    return (
      <div className="p-4 text-center text-gray-500 text-xs">
        Select a clip to edit keyframes
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-[#2a2a2a]">
        <h3 className="text-xs font-medium text-gray-300">Keyframe Animation</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">
            t={relativeTime.toFixed(2)}s / {clipDuration.toFixed(2)}s
          </span>
          {selectedKeyframeIds.length > 0 && (
            <button
              className="p-1 text-red-400 hover:text-red-300"
              onClick={() => {
                selectedKeyframeIds.forEach((id) => removeKeyframe(clipId, id));
                clearKeyframeSelection();
              }}
              title="Delete selected keyframes"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Properties List */}
      <div className="p-2 max-h-[300px] overflow-y-auto">
        {properties.map((property) => (
          <PropertyRow
            key={property}
            clipId={clipId}
            property={property}
            keyframes={keyframesForClip[property] || []}
            clipDuration={clipDuration}
            currentTime={relativeTime}
            onAddKeyframe={(prop, time, value) => addKeyframe(clipId, prop, time, value)}
            onRemoveKeyframe={(id) => removeKeyframe(clipId, id)}
            onUpdateKeyframe={(id, updates) => updateKeyframe(clipId, id, updates)}
            onSelectKeyframe={selectKeyframe}
            selectedKeyframeIds={selectedKeyframeIds}
          />
        ))}
      </div>

      {/* Selected Keyframe Editor */}
      {selectedKeyframe && (
        <div className="p-2 border-t border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="text-[10px] text-gray-400 mb-2">
            Edit: {PROPERTY_LABELS[selectedKeyframe.property]} @ {selectedKeyframe.time.toFixed(2)}s
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-gray-500">Value</label>
              <input
                type="number"
                value={selectedKeyframe.value}
                onChange={(e) =>
                  updateKeyframe(clipId, selectedKeyframe.id, { value: Number(e.target.value) })
                }
                className="w-full bg-[#0a0a0a] text-white text-xs px-2 py-1 rounded border border-[#2a2a2a]"
                step={0.1}
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-gray-500">Time</label>
              <input
                type="number"
                value={selectedKeyframe.time}
                onChange={(e) =>
                  updateKeyframe(clipId, selectedKeyframe.id, {
                    time: Math.max(0, Math.min(Number(e.target.value), clipDuration)),
                  })
                }
                className="w-full bg-[#0a0a0a] text-white text-xs px-2 py-1 rounded border border-[#2a2a2a]"
                step={0.01}
                min={0}
                max={clipDuration}
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-gray-500">Easing</label>
              <select
                value={selectedKeyframe.easing}
                onChange={(e) =>
                  updateKeyframe(clipId, selectedKeyframe.id, {
                    easing: e.target.value as Keyframe['easing'],
                  })
                }
                className="w-full bg-[#0a0a0a] text-white text-xs px-2 py-1 rounded border border-[#2a2a2a]"
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In-Out</option>
                <option value="bezier">Bezier</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-2 border-t border-[#2a2a2a] flex gap-2">
        <button
          className="flex-1 px-2 py-1 text-[10px] bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#3a3a3a]"
          onClick={() => {
            // Add keyframes for all properties at current time
            properties.forEach((prop) => {
              addKeyframe(clipId, prop, relativeTime, PROPERTY_DEFAULTS[prop]);
            });
          }}
        >
          + All at Playhead
        </button>
        <button
          className="flex-1 px-2 py-1 text-[10px] bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#3a3a3a]"
          onClick={() => {
            // Clear all keyframes for this clip
            Object.entries(keyframesForClip).forEach(([prop, kfs]) => {
              kfs.forEach((kf) => removeKeyframe(clipId, kf.id));
            });
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default KeyframeEditor;
