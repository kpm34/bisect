'use client';

import React, { useEffect, useState } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';

export default function ObjectTransformControls() {
  const { selectedObject, setPosition, setRotation, setScale } = useSelection();
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
  const [scl, setScl] = useState({ x: 1, y: 1, z: 1 });

  useEffect(() => {
    if (!selectedObject) return;
    setPos({
      x: selectedObject.position.x,
      y: selectedObject.position.y,
      z: selectedObject.position.z,
    });
    setRot({
      x: selectedObject.rotation.x,
      y: selectedObject.rotation.y,
      z: selectedObject.rotation.z,
    });
    setScl({
      x: selectedObject.scale.x,
      y: selectedObject.scale.y,
      z: selectedObject.scale.z,
    });
  }, [selectedObject]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Position</h4>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map((k) => (
            <input
              key={k}
              type="number"
              className="px-2 py-1 rounded border border-gray-300 text-sm"
              value={pos[k]}
              disabled={!selectedObject}
              onChange={(e) => setPos({ ...pos, [k]: parseFloat(e.target.value) })}
              onBlur={() => setPosition(pos.x, pos.y, pos.z)}
              placeholder={k.toUpperCase()}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Rotation (radians)</h4>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map((k) => (
            <input
              key={k}
              type="number"
              step={0.01}
              className="px-2 py-1 rounded border border-gray-300 text-sm"
              value={rot[k]}
              disabled={!selectedObject}
              onChange={(e) => setRot({ ...rot, [k]: parseFloat(e.target.value) })}
              onBlur={() => setRotation(rot.x, rot.y, rot.z)}
              placeholder={k.toUpperCase()}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Scale</h4>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map((k) => (
            <input
              key={k}
              type="number"
              step={0.01}
              className="px-2 py-1 rounded border border-gray-300 text-sm"
              value={scl[k]}
              disabled={!selectedObject}
              onChange={(e) => setScl({ ...scl, [k]: parseFloat(e.target.value) })}
              onBlur={() => setScale(scl.x, scl.y, scl.z)}
              placeholder={k.toUpperCase()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


