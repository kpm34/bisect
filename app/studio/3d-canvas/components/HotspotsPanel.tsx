'use client';

/**
 * HotspotsPanel - UI for managing 3D hotspots
 *
 * Allows creating, editing, and deleting hotspots with
 * annotations, tooltips, and links to variants.
 */

import React, { useState, useMemo } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import type { Hotspot, HotspotContent, HotspotStyle } from '@/lib/core/configurator/types';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  ShoppingCart,
  ZoomIn,
  MapPin,
  Edit3,
  Link,
  Image,
  Video,
  Target,
} from 'lucide-react';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// ============== HOTSPOT EDITOR ==============

interface HotspotEditorProps {
  hotspot: Hotspot;
  onUpdate: (updated: Hotspot) => void;
  onRemove: () => void;
  sceneObjects: { id: string; name: string }[];
}

function HotspotEditor({ hotspot, onUpdate, onRemove, sceneObjects }: HotspotEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const iconOptions = [
    { value: 'info', label: 'Info', icon: Info },
    { value: 'plus', label: 'Plus', icon: Plus },
    { value: 'cart', label: 'Cart', icon: ShoppingCart },
    { value: 'zoom', label: 'Zoom', icon: ZoomIn },
  ];

  return (
    <div className="bg-[#222] rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
        <MapPin size={14} className="text-cyan-400" />
        <span className="flex-1 text-sm font-medium text-gray-200 truncate">
          {hotspot.content.title || 'Untitled Hotspot'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ ...hotspot, visible: !hotspot.visible });
          }}
          className={`p-1 rounded transition-colors ${
            hotspot.visible ? 'text-green-400' : 'text-gray-600'
          }`}
        >
          {hotspot.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-4 border-t border-gray-800">
          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input
              type="text"
              value={hotspot.content.title}
              onChange={(e) =>
                onUpdate({
                  ...hotspot,
                  content: { ...hotspot.content, title: e.target.value },
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="Hotspot title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              value={hotspot.content.description || ''}
              onChange={(e) =>
                onUpdate({
                  ...hotspot,
                  content: { ...hotspot.content, description: e.target.value },
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 resize-none"
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          {/* Attached Object */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <Target size={12} />
              Attach to Object
            </label>
            <select
              value={hotspot.objectId || ''}
              onChange={(e) =>
                onUpdate({ ...hotspot, objectId: e.target.value })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              <option value="">None (World Position)</option>
              {sceneObjects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Position (X, Y, Z)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <input
                  key={axis}
                  type="number"
                  value={hotspot.position[axis]}
                  onChange={(e) =>
                    onUpdate({
                      ...hotspot,
                      position: {
                        ...hotspot.position,
                        [axis]: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200"
                  step={0.1}
                />
              ))}
            </div>
          </div>

          {/* Position Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Position Type</label>
            <div className="flex gap-2">
              {(['local', 'world'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ ...hotspot, positionType: type })}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    hotspot.positionType === type
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {type === 'local' ? 'Relative to Object' : 'World Space'}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block">Style</label>

            {/* Color */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">Color</span>
              <input
                type="color"
                value={hotspot.style.color || '#3b82f6'}
                onChange={(e) =>
                  onUpdate({
                    ...hotspot,
                    style: { ...hotspot.style, color: e.target.value },
                  })
                }
                className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={hotspot.style.color || '#3b82f6'}
                onChange={(e) =>
                  onUpdate({
                    ...hotspot,
                    style: { ...hotspot.style, color: e.target.value },
                  })
                }
                className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              />
            </div>

            {/* Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">Size</span>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={hotspot.style.size || 0.15}
                onChange={(e) =>
                  onUpdate({
                    ...hotspot,
                    style: { ...hotspot.style, size: parseFloat(e.target.value) },
                  })
                }
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-8">
                {hotspot.style.size || 0.15}
              </span>
            </div>

            {/* Icon */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12">Icon</span>
              <div className="flex gap-1">
                {iconOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() =>
                        onUpdate({
                          ...hotspot,
                          style: { ...hotspot.style, icon: opt.value as any },
                        })
                      }
                      className={`p-2 rounded border transition-colors ${
                        hotspot.style.icon === opt.value
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                      title={opt.label}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pulse Animation */}
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={hotspot.style.pulseAnimation !== false}
                onChange={(e) =>
                  onUpdate({
                    ...hotspot,
                    style: { ...hotspot.style, pulseAnimation: e.target.checked },
                  })
                }
                className="rounded bg-[#111] border-gray-700"
              />
              Pulse animation
            </label>
          </div>

          {/* Trigger Mode */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Show Tooltip On</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ ...hotspot, triggerOnHover: false })}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  !hotspot.triggerOnHover
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Click
              </button>
              <button
                onClick={() => onUpdate({ ...hotspot, triggerOnHover: true })}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  hotspot.triggerOnHover
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Hover
              </button>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block flex items-center gap-1">
              <Image size={12} />
              Media (optional)
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() =>
                  onUpdate({
                    ...hotspot,
                    content: { ...hotspot.content, mediaType: 'image' },
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  hotspot.content.mediaType === 'image' || !hotspot.content.mediaType
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Image size={12} />
                Image
              </button>
              <button
                onClick={() =>
                  onUpdate({
                    ...hotspot,
                    content: { ...hotspot.content, mediaType: 'video' },
                  })
                }
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  hotspot.content.mediaType === 'video'
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Video size={12} />
                Video
              </button>
            </div>
            <input
              type="text"
              value={hotspot.content.mediaUrl || ''}
              onChange={(e) =>
                onUpdate({
                  ...hotspot,
                  content: { ...hotspot.content, mediaUrl: e.target.value },
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="Media URL..."
            />
          </div>

          {/* CTA Button */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block flex items-center gap-1">
              <Link size={12} />
              Call-to-Action (optional)
            </label>
            <input
              type="text"
              value={hotspot.content.ctaText || ''}
              onChange={(e) =>
                onUpdate({
                  ...hotspot,
                  content: { ...hotspot.content, ctaText: e.target.value },
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="Button text..."
            />
            <input
              type="text"
              value={hotspot.content.ctaUrl || ''}
              onChange={(e) =>
                onUpdate({
                  ...hotspot,
                  content: { ...hotspot.content, ctaUrl: e.target.value },
                })
              }
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="Button URL..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============== MAIN PANEL ==============

interface HotspotsPanelProps {
  hotspots: Hotspot[];
  onHotspotsChange: (hotspots: Hotspot[]) => void;
}

export default function HotspotsPanel({ hotspots, onHotspotsChange }: HotspotsPanelProps) {
  const { selectedObject, addedObjects } = useSelection();

  // Build scene objects list
  const sceneObjects = useMemo(() => {
    return addedObjects.map((obj) => ({ id: obj.id, name: obj.name }));
  }, [addedObjects]);

  const addHotspot = () => {
    const newHotspot: Hotspot = {
      id: generateId(),
      objectId: selectedObject?.uuid || '',
      position: { x: 0, y: 1, z: 0 },
      positionType: selectedObject ? 'local' : 'world',
      content: {
        title: 'New Hotspot',
        description: '',
      },
      style: {
        color: '#3b82f6',
        size: 0.15,
        pulseAnimation: true,
        icon: 'info',
      },
      visible: true,
      triggerOnHover: false,
    };

    onHotspotsChange([...hotspots, newHotspot]);
  };

  const updateHotspot = (id: string, updated: Hotspot) => {
    onHotspotsChange(hotspots.map((h) => (h.id === id ? updated : h)));
  };

  const removeHotspot = (id: string) => {
    onHotspotsChange(hotspots.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-300">
          Hotspots
          <span className="ml-2 text-xs text-gray-500">
            {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={addHotspot}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Hotspots List */}
      <div className="space-y-2">
        {hotspots.length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
            <MapPin className="mx-auto mb-2 text-gray-600" size={24} />
            <p className="text-sm text-gray-500 mb-2">No hotspots yet</p>
            <p className="text-xs text-gray-600">
              Add hotspots to create interactive annotations
            </p>
          </div>
        )}

        {hotspots.map((hotspot) => (
          <HotspotEditor
            key={hotspot.id}
            hotspot={hotspot}
            onUpdate={(updated) => updateHotspot(hotspot.id, updated)}
            onRemove={() => removeHotspot(hotspot.id)}
            sceneObjects={sceneObjects}
          />
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Tip:</strong> Attach hotspots to objects
          for positions that follow the object, or use world space for fixed positions.
        </p>
      </div>
    </div>
  );
}
