'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { TrackType, Clip, ClipTransform, ClipAppearance, ClipPlayback, ClipAudio, ClipCamera, CameraKeyframe } from '../types';
import {
  Move, Maximize2, Eye, Play, Volume2, RefreshCw,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Link, Unlink, RotateCcw, ChevronDown, Diamond, Settings2, Camera, ZoomIn, ZoomOut, Target, Palette
} from 'lucide-react';
import {
  DEFAULT_CLIP_TRANSFORM,
  DEFAULT_CLIP_APPEARANCE,
  DEFAULT_CLIP_PLAYBACK,
  DEFAULT_CLIP_AUDIO,
  DEFAULT_CLIP_CAMERA,
  LAYOUT_PRESETS,
  CAMERA_PRESETS
} from '../constants';
import { COLOR_PRESETS, getColorPreset } from '@/lib/video/color-presets';

type TabType = 'position' | 'layout' | 'appearance' | 'playback' | 'audio' | 'camera' | 'color';

const ClipPropertiesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('position');
  const [isScaleLocked, setIsScaleLocked] = useState(true);

  const {
    tracks,
    selectedClipIds,
    updateClipTransform,
    updateClipAppearance,
    updateClipPlayback,
    updateClipAudio,
    updateClipCamera,
    updateClipColorPreset,
    resetClipTransform,
  } = useStore();

  // Get the selected clip and its track
  const selectedClipInfo = useMemo(() => {
    if (selectedClipIds.length !== 1) return null;

    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipIds[0]);
      if (clip) {
        return { clip, track };
      }
    }
    return null;
  }, [tracks, selectedClipIds]);

  if (!selectedClipInfo) {
    return (
      <div className="p-6 text-center">
        <Settings2 className="w-12 h-12 text-[#2a2a2a] mx-auto mb-4" />
        <h3 className="text-gray-400 text-sm">No Clip Selected</h3>
        <p className="text-gray-600 text-xs mt-2">
          Select a clip on the timeline to view and edit its properties.
        </p>
      </div>
    );
  }

  const { clip, track } = selectedClipInfo;
  const transform = clip.transform || DEFAULT_CLIP_TRANSFORM;
  const appearance = clip.appearance || DEFAULT_CLIP_APPEARANCE;
  const playback = clip.playback || DEFAULT_CLIP_PLAYBACK;
  const audio = clip.audio || DEFAULT_CLIP_AUDIO;
  const camera = clip.camera || DEFAULT_CLIP_CAMERA;

  const handleTransformChange = (updates: Partial<ClipTransform>) => {
    // Handle uniform scaling
    if (isScaleLocked && ('scaleX' in updates || 'scaleY' in updates)) {
      const currentScaleX = transform.scaleX;
      const currentScaleY = transform.scaleY;

      if ('scaleX' in updates && updates.scaleX !== undefined) {
        const ratio = updates.scaleX / currentScaleX;
        updates.scaleY = currentScaleY * ratio;
      } else if ('scaleY' in updates && updates.scaleY !== undefined) {
        const ratio = updates.scaleY / currentScaleY;
        updates.scaleX = currentScaleX * ratio;
      }
    }
    updateClipTransform(track.id, clip.id, updates);
  };

  const handleAppearanceChange = (updates: Partial<ClipAppearance>) => {
    updateClipAppearance(track.id, clip.id, updates);
  };

  const handlePlaybackChange = (updates: Partial<ClipPlayback>) => {
    updateClipPlayback(track.id, clip.id, updates);
  };

  const handleAudioChange = (updates: Partial<ClipAudio>) => {
    updateClipAudio(track.id, clip.id, updates);
  };

  const handleCameraChange = (updates: Partial<ClipCamera>) => {
    updateClipCamera(track.id, clip.id, updates);
  };

  const handleReset = () => {
    resetClipTransform(track.id, clip.id);
  };

  const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: 'position', icon: <Move className="w-4 h-4" />, label: 'Position' },
    { id: 'layout', icon: <Maximize2 className="w-4 h-4" />, label: 'Layout' },
    { id: 'appearance', icon: <Eye className="w-4 h-4" />, label: 'Appearance' },
    { id: 'color', icon: <Palette className="w-4 h-4" />, label: 'Color' },
    { id: 'playback', icon: <Play className="w-4 h-4" />, label: 'Playback' },
    { id: 'audio', icon: <Volume2 className="w-4 h-4" />, label: 'Audio' },
    { id: 'camera', icon: <Camera className="w-4 h-4" />, label: 'Camera' },
  ];

  const renderPositionTab = () => (
    <div className="space-y-4">
      {/* Position Alignment Buttons */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Position</label>
        <div className="flex space-x-1">
          <div className="flex bg-[#1a1a1a] rounded p-0.5">
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
              onClick={() => handleTransformChange({ x: 0 })}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white bg-[#2a2a2a]"
              onClick={() => handleTransformChange({ x: 960 })}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
              onClick={() => handleTransformChange({ x: 1920 })}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex bg-[#1a1a1a] rounded p-0.5">
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
              onClick={() => handleTransformChange({ y: 0 })}
              title="Align Top"
            >
              <AlignStartVertical className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white bg-[#2a2a2a]"
              onClick={() => handleTransformChange({ y: 540 })}
              title="Align Middle"
            >
              <AlignCenterVertical className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
              onClick={() => handleTransformChange({ y: 1080 })}
              title="Align Bottom"
            >
              <AlignEndVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* X/Y Position Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 uppercase">X</label>
          <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
            <input
              type="number"
              value={Math.round(transform.x)}
              onChange={(e) => handleTransformChange({ x: parseFloat(e.target.value) || 0 })}
              className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
            />
            <Diamond className="w-3 h-3 text-gray-600 mr-2" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-600 uppercase">Y</label>
          <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
            <input
              type="number"
              value={Math.round(transform.y)}
              onChange={(e) => handleTransformChange({ y: parseFloat(e.target.value) || 0 })}
              className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
            />
            <Diamond className="w-3 h-3 text-gray-600 mr-2" />
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">Scale</label>
          <button
            className={`p-1 rounded ${isScaleLocked ? 'text-blue-400' : 'text-gray-600'}`}
            onClick={() => setIsScaleLocked(!isScaleLocked)}
            title={isScaleLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {isScaleLocked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
          </button>
        </div>

        {/* Scale Visual Control */}
        <div className="bg-[#1a1a1a] rounded border border-[#2a2a2a] p-3">
          <div className="relative w-full aspect-video border border-dashed border-gray-600 rounded flex items-center justify-center">
            <div
              className="bg-gray-700 rounded flex items-center justify-center text-gray-400"
              style={{
                width: `${Math.min(100, transform.scaleX)}%`,
                height: `${Math.min(100, transform.scaleY)}%`,
              }}
            >
              <span className="text-[10px]">{Math.round(transform.scaleX)}%</span>
            </div>
            {/* Center point indicator */}
            <div className="absolute w-2 h-2 bg-red-500 rounded-full" style={{
              left: `${transform.anchorX * 100}%`,
              top: `${transform.anchorY * 100}%`,
              transform: 'translate(-50%, -50%)'
            }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Scale X</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={Math.round(transform.scaleX)}
                onChange={(e) => handleTransformChange({ scaleX: parseFloat(e.target.value) || 100 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={1}
                max={200}
              />
              <span className="text-gray-600 text-xs mr-2">%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Scale Y</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={Math.round(transform.scaleY)}
                onChange={(e) => handleTransformChange({ scaleY: parseFloat(e.target.value) || 100 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={1}
                max={200}
              />
              <span className="text-gray-600 text-xs mr-2">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Rotation</label>
        <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
          <RotateCcw className="w-4 h-4 text-gray-600 ml-2" />
          <input
            type="number"
            value={transform.rotation}
            onChange={(e) => handleTransformChange({ rotation: parseFloat(e.target.value) || 0 })}
            className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
            min={-360}
            max={360}
          />
          <span className="text-gray-600 text-xs mr-2">deg</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={transform.rotation}
          onChange={(e) => handleTransformChange({ rotation: parseFloat(e.target.value) })}
          className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400"
        />
      </div>
    </div>
  );

  const renderLayoutTab = () => (
    <div className="space-y-4">
      {/* Layout Presets */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Layout Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(LAYOUT_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:border-gray-500 transition-colors"
              onClick={() => handleTransformChange({
                x: preset.x,
                y: preset.y,
                scaleX: preset.scaleX,
                scaleY: preset.scaleY,
              })}
            >
              <div className="aspect-video bg-[#0a0a0a] rounded mb-1 flex items-center justify-center">
                <div
                  className="bg-gray-600 rounded"
                  style={{
                    width: `${preset.scaleX / 2}%`,
                    height: `${preset.scaleY / 2}%`,
                    marginLeft: name.includes('Left') ? 0 : name.includes('Right') ? 'auto' : 'auto',
                    marginRight: name.includes('Left') ? 'auto' : name.includes('Right') ? 0 : 'auto',
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Size */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Canvas Size</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">W</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={1920}
                disabled
                className="w-full bg-transparent px-2 py-1.5 text-sm text-gray-500 focus:outline-none"
              />
              <Diamond className="w-3 h-3 text-gray-600 mr-2" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">H</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={1080}
                disabled
                className="w-full bg-transparent px-2 py-1.5 text-sm text-gray-500 focus:outline-none"
              />
              <Diamond className="w-3 h-3 text-gray-600 mr-2" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button className="p-1 rounded bg-[#2a2a2a] text-gray-400">
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Anchor Point */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Anchor Point</label>
        <div className="grid grid-cols-3 gap-1 w-24">
          {[0, 0.5, 1].map((y) => (
            [0, 0.5, 1].map((x) => (
              <button
                key={`${x}-${y}`}
                className={`w-6 h-6 rounded border ${
                  transform.anchorX === x && transform.anchorY === y
                    ? 'bg-gray-600 border-gray-400'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-gray-500'
                }`}
                onClick={() => handleTransformChange({ anchorX: x, anchorY: y })}
              />
            ))
          )).flat()}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Anchor X</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={transform.anchorX}
                onChange={(e) => handleTransformChange({ anchorX: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Anchor Y</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={transform.anchorY}
                onChange={(e) => handleTransformChange({ anchorY: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-4">
      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">Opacity</label>
          <span className="text-xs text-white font-mono">{appearance.opacity}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min={0}
            max={100}
            value={appearance.opacity}
            onChange={(e) => handleAppearanceChange({ opacity: parseInt(e.target.value) })}
            className="flex-1 h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400"
          />
        </div>
        {/* Opacity bar visual */}
        <div className="h-1 bg-[#2a2a2a] rounded-full">
          <div
            className="h-full bg-gray-400 rounded-full transition-all"
            style={{ width: `${appearance.opacity}%` }}
          />
        </div>
      </div>

      {/* Blend Mode */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Blend Mode</label>
        <div className="relative">
          <select
            value={appearance.blendMode}
            onChange={(e) => handleAppearanceChange({ blendMode: e.target.value as ClipAppearance['blendMode'] })}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 appearance-none cursor-pointer"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );

  const renderPlaybackTab = () => (
    <div className="space-y-4">
      {/* Playback Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">Playback Rate</label>
          <span className="text-xs text-white font-mono">{playback.playbackRate}x</span>
        </div>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={playback.playbackRate}
          onChange={(e) => handlePlaybackChange({ playbackRate: parseFloat(e.target.value) })}
          className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400"
        />
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>0.25x</span>
          <span>1x</span>
          <span>4x</span>
        </div>

        {/* Speed presets */}
        <div className="flex space-x-1">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              className={`flex-1 py-1 text-xs rounded ${
                playback.playbackRate === rate
                  ? 'bg-gray-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-500 hover:text-white'
              }`}
              onClick={() => handlePlaybackChange({ playbackRate: rate })}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Reverse */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500 uppercase font-medium">Reverse Playback</label>
        <button
          className={`w-10 h-5 rounded-full transition-colors ${
            playback.reverse ? 'bg-blue-500' : 'bg-[#2a2a2a]'
          }`}
          onClick={() => handlePlaybackChange({ reverse: !playback.reverse })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              playback.reverse ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-4">
      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">Volume</label>
          <span className="text-xs text-white font-mono">{audio.volume}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min={0}
            max={200}
            value={audio.volume}
            onChange={(e) => handleAudioChange({ volume: parseInt(e.target.value) })}
            className="flex-1 h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400"
          />
        </div>
        {/* Volume meter */}
        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              audio.volume > 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, audio.volume / 2)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Mute */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500 uppercase font-medium">Mute Audio</label>
        <button
          className={`w-10 h-5 rounded-full transition-colors ${
            audio.muted ? 'bg-red-500' : 'bg-[#2a2a2a]'
          }`}
          onClick={() => handleAudioChange({ muted: !audio.muted })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              audio.muted ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Audio Fade */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Audio Fade</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Fade In</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={audio.fadeIn}
                onChange={(e) => handleAudioChange({ fadeIn: parseFloat(e.target.value) || 0 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={0}
                max={10}
                step={0.1}
              />
              <span className="text-gray-600 text-xs mr-2">s</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Fade Out</label>
            <div className="flex items-center bg-[#1a1a1a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={audio.fadeOut}
                onChange={(e) => handleAudioChange({ fadeOut: parseFloat(e.target.value) || 0 })}
                className="w-full bg-transparent px-2 py-1.5 text-sm text-white focus:outline-none"
                min={0}
                max={10}
                step={0.1}
              />
              <span className="text-gray-600 text-xs mr-2">s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCameraTab = () => (
    <div className="space-y-4">
      {/* Enable Camera Animation Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-gray-500" />
          <label className="text-xs text-gray-500 uppercase font-medium">Ken Burns Effect</label>
        </div>
        <button
          className={`w-10 h-5 rounded-full transition-colors ${
            camera.enabled ? 'bg-blue-500' : 'bg-[#2a2a2a]'
          }`}
          onClick={() => handleCameraChange({ enabled: !camera.enabled })}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              camera.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Camera Presets */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 uppercase font-medium">Presets</label>
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className="p-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:border-gray-500 transition-colors text-center"
              onClick={() => handleCameraChange({
                enabled: key !== 'none',
                start: preset.start,
                end: preset.end,
              })}
            >
              <span className="text-lg block">{preset.icon}</span>
              <span className="text-[9px] text-gray-400">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Keyframe */}
      <div className={`space-y-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] ${!camera.enabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">Start Position</label>
          <span className="text-[10px] text-gray-600">Beginning of clip</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ZoomIn className="w-3 h-3 text-gray-600" />
              <label className="text-[10px] text-gray-600">Zoom</label>
            </div>
            <span className="text-xs text-white font-mono">{camera.start.zoom}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            value={camera.start.zoom}
            onChange={(e) => handleCameraChange({
              start: { ...camera.start, zoom: parseInt(e.target.value) }
            })}
            disabled={!camera.enabled}
            className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Pan X</label>
            <div className="flex items-center bg-[#0a0a0a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={camera.start.panX}
                onChange={(e) => handleCameraChange({
                  start: { ...camera.start, panX: parseInt(e.target.value) || 0 }
                })}
                disabled={!camera.enabled}
                className="w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-none disabled:text-gray-600"
                min={-100}
                max={100}
              />
              <span className="text-gray-600 text-[10px] mr-2">%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Pan Y</label>
            <div className="flex items-center bg-[#0a0a0a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={camera.start.panY}
                onChange={(e) => handleCameraChange({
                  start: { ...camera.start, panY: parseInt(e.target.value) || 0 }
                })}
                disabled={!camera.enabled}
                className="w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-none disabled:text-gray-600"
                min={-100}
                max={100}
              />
              <span className="text-gray-600 text-[10px] mr-2">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* End Keyframe */}
      <div className={`space-y-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] ${!camera.enabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500 uppercase font-medium">End Position</label>
          <span className="text-[10px] text-gray-600">End of clip</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ZoomOut className="w-3 h-3 text-gray-600" />
              <label className="text-[10px] text-gray-600">Zoom</label>
            </div>
            <span className="text-xs text-white font-mono">{camera.end.zoom}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            value={camera.end.zoom}
            onChange={(e) => handleCameraChange({
              end: { ...camera.end, zoom: parseInt(e.target.value) }
            })}
            disabled={!camera.enabled}
            className="w-full h-1 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Pan X</label>
            <div className="flex items-center bg-[#0a0a0a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={camera.end.panX}
                onChange={(e) => handleCameraChange({
                  end: { ...camera.end, panX: parseInt(e.target.value) || 0 }
                })}
                disabled={!camera.enabled}
                className="w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-none disabled:text-gray-600"
                min={-100}
                max={100}
              />
              <span className="text-gray-600 text-[10px] mr-2">%</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase">Pan Y</label>
            <div className="flex items-center bg-[#0a0a0a] rounded border border-[#2a2a2a]">
              <input
                type="number"
                value={camera.end.panY}
                onChange={(e) => handleCameraChange({
                  end: { ...camera.end, panY: parseInt(e.target.value) || 0 }
                })}
                disabled={!camera.enabled}
                className="w-full bg-transparent px-2 py-1 text-xs text-white focus:outline-none disabled:text-gray-600"
                min={-100}
                max={100}
              />
              <span className="text-gray-600 text-[10px] mr-2">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Easing */}
      <div className={`space-y-2 ${!camera.enabled ? 'opacity-50' : ''}`}>
        <label className="text-xs text-gray-500 uppercase font-medium">Animation Easing</label>
        <div className="relative">
          <select
            value={camera.easing}
            onChange={(e) => handleCameraChange({ easing: e.target.value as ClipCamera['easing'] })}
            disabled={!camera.enabled}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:text-gray-600"
          >
            <option value="linear">Linear</option>
            <option value="ease-in">Ease In</option>
            <option value="ease-out">Ease Out</option>
            <option value="ease-in-out">Ease In Out</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Focus Point */}
      <div className={`space-y-2 ${!camera.enabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-gray-500" />
          <label className="text-xs text-gray-500 uppercase font-medium">Focus Point</label>
        </div>
        <div className="grid grid-cols-3 gap-1 w-24">
          {[0, 0.5, 1].map((y) => (
            [0, 0.5, 1].map((x) => (
              <button
                key={`${x}-${y}`}
                disabled={!camera.enabled}
                className={`w-6 h-6 rounded border ${
                  camera.focusX === x && camera.focusY === y
                    ? 'bg-blue-600 border-blue-400'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-gray-500'
                } disabled:cursor-not-allowed`}
                onClick={() => handleCameraChange({ focusX: x, focusY: y })}
              />
            ))
          )).flat()}
        </div>
      </div>

      {/* Preview */}
      <div className={`space-y-2 ${!camera.enabled ? 'opacity-50' : ''}`}>
        <label className="text-xs text-gray-500 uppercase font-medium">Preview</label>
        <div className="relative w-full aspect-video bg-[#0a0a0a] rounded border border-[#2a2a2a] overflow-hidden">
          {/* Start position indicator */}
          <div
            className="absolute w-16 h-9 border-2 border-green-500 rounded transition-all"
            style={{
              transform: `scale(${camera.start.zoom / 100})`,
              left: `calc(50% + ${camera.start.panX}% - 32px)`,
              top: `calc(50% + ${camera.start.panY}% - 18px)`,
            }}
          >
            <span className="absolute -top-4 left-0 text-[8px] text-green-500">START</span>
          </div>
          {/* End position indicator */}
          <div
            className="absolute w-16 h-9 border-2 border-red-500 rounded transition-all"
            style={{
              transform: `scale(${camera.end.zoom / 100})`,
              left: `calc(50% + ${camera.end.panX}% - 32px)`,
              top: `calc(50% + ${camera.end.panY}% - 18px)`,
            }}
          >
            <span className="absolute -bottom-4 left-0 text-[8px] text-red-500">END</span>
          </div>
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 border border-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderColorTab = () => {
    const currentPreset = clip.colorPreset || 'none';
    const selectedPreset = getColorPreset(currentPreset);

    return (
      <div className="space-y-4">
        {/* Current Filter */}
        <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedPreset?.icon || '🎬'}</span>
              <div>
                <div className="text-sm text-white font-medium">{selectedPreset?.name || 'Original'}</div>
                <div className="text-[10px] text-gray-500">Current filter</div>
              </div>
            </div>
            {currentPreset !== 'none' && (
              <button
                className="px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-[#2a2a2a] rounded"
                onClick={() => updateClipColorPreset(track.id, clip.id, 'none')}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Color Presets Grid */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase font-medium">Color Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`p-2 bg-[#1a1a1a] border rounded-lg transition-all hover:scale-105 ${
                  currentPreset === preset.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-[#2a2a2a] hover:border-gray-500'
                }`}
                onClick={() => updateClipColorPreset(track.id, clip.id, preset.id)}
              >
                <div className="text-center">
                  <span className="text-xl block mb-1">{preset.icon}</span>
                  <span className={`text-[10px] ${currentPreset === preset.id ? 'text-white' : 'text-gray-400'}`}>
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Note */}
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-[11px] text-orange-300">
            Color presets are applied during preview and baked into the exported video.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Clip Info Header */}
      <div className="p-3 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white truncate">{clip.name}</h3>
            <p className="text-[10px] text-gray-500 uppercase">{track.type} CLIP</p>
          </div>
          <button
            className="p-1.5 bg-[#1a1a1a] rounded hover:bg-[#2a2a2a] text-gray-400 hover:text-white"
            onClick={handleReset}
            title="Reset all properties"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#2a2a2a] bg-[#0a0a0a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 py-2 flex flex-col items-center space-y-1 transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-gray-400 bg-[#141414]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className="text-[9px] uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'position' && renderPositionTab()}
        {activeTab === 'layout' && renderLayoutTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'color' && renderColorTab()}
        {activeTab === 'playback' && renderPlaybackTab()}
        {activeTab === 'audio' && renderAudioTab()}
        {activeTab === 'camera' && renderCameraTab()}
      </div>
    </div>
  );
};

export default ClipPropertiesPanel;
