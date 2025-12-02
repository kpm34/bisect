'use client';

import React, { useState } from 'react';
import { useSelection, SceneObjectType } from '../r3f/SceneSelectionContext';
import {
  Box,
  Circle,
  Triangle,
  Cylinder,
  Hexagon,
  Type,
  Square,
  Pill
} from 'lucide-react';

interface PrimitiveOption {
  type: SceneObjectType;
  icon: React.ReactNode;
  label: string;
}

const primitives: PrimitiveOption[] = [
  { type: 'box', icon: <Box size={18} />, label: 'Cube' },
  { type: 'sphere', icon: <Circle size={18} />, label: 'Sphere' },
  { type: 'cylinder', icon: <Cylinder size={18} />, label: 'Cylinder' },
  { type: 'cone', icon: <Triangle size={18} />, label: 'Cone' },
  { type: 'torus', icon: <Hexagon size={18} />, label: 'Torus' },
  { type: 'capsule', icon: <Pill size={18} />, label: 'Capsule' },
  { type: 'plane', icon: <Square size={18} />, label: 'Plane' },
  { type: 'text3d', icon: <Type size={18} />, label: '3D Text' },
];

export default function PrimitiveCreator() {
  const { addObject } = useSelection();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState('Hello');

  const handleAddPrimitive = (type: SceneObjectType) => {
    if (type === 'text3d') {
      setShowTextInput(true);
    } else {
      addObject(type);
    }
  };

  const handleAddText = () => {
    addObject('text3d', undefined, undefined, textValue);
    setShowTextInput(false);
    setTextValue('Hello');
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Add Primitive
      </h4>

      {/* Primitive Grid */}
      <div className="grid grid-cols-4 gap-2">
        {primitives.map((prim) => (
          <button
            key={prim.type}
            onClick={() => handleAddPrimitive(prim.type)}
            className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            title={prim.label}
          >
            <span className="text-gray-500 group-hover:text-blue-600 transition-colors">
              {prim.icon}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-600">
              {prim.label}
            </span>
          </button>
        ))}
      </div>

      {/* 3D Text Input Modal */}
      {showTextInput && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="text-xs text-gray-600 block mb-1">Enter text:</label>
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Your text here..."
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddText();
              if (e.key === 'Escape') setShowTextInput(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddText}
              className="flex-1 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Add Text
            </button>
            <button
              onClick={() => setShowTextInput(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
