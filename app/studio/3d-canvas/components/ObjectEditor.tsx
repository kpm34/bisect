'use client';

import React, { useState, useEffect } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { Box, Move, Maximize, Scissors, PenTool } from 'lucide-react';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg';

/**
 * ObjectEditor - Full object editing controls
 *
 * 5-tab interface:
 * - Transform: Position, Rotation, Scale
 * - Geometry: Extrusion & Bevel
 * - Physics: Enable/disable, type, mass, restitution
 * - Boolean: Union, Subtract, Intersect operations
 * - Path: Vertex editing (coming soon)
 */

type EditorTab = 'transform' | 'geometry' | 'physics' | 'boolean' | 'path';

export default function ObjectEditor() {
    const { selectedObject, setPosition, setRotation, setScale, r3fScene, addedObjects, updateObject } = useSelection();
    const [activeTab, setActiveTab] = useState<EditorTab>('transform');

    // Transform State
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
    const [scl, setScl] = useState({ x: 1, y: 1, z: 1 });

    // Extrusion State
    const [extrudeDepth, setExtrudeDepth] = useState(1);
    const [bevelEnabled, setBevelEnabled] = useState(false);
    const [bevelThickness, setBevelThickness] = useState(0.1);

    // Boolean State
    const [targetObjectId, setTargetObjectId] = useState<string>('');
    const [booleanOp, setBooleanOp] = useState<'union' | 'subtract' | 'intersect'>('subtract');

    // Sync transform state with selection
    useEffect(() => {
        if (!selectedObject) return;
        setPos({ x: selectedObject.position.x, y: selectedObject.position.y, z: selectedObject.position.z });
        setRot({ x: selectedObject.rotation.x, y: selectedObject.rotation.y, z: selectedObject.rotation.z });
        setScl({ x: selectedObject.scale.x, y: selectedObject.scale.y, z: selectedObject.scale.z });
    }, [selectedObject]);

    // --- Handlers ---

    const handleTransformChange = (type: 'pos' | 'rot' | 'scl', axis: 'x' | 'y' | 'z', value: number) => {
        if (!selectedObject) return;

        if (type === 'pos') {
            const newPos = { ...pos, [axis]: value };
            setPos(newPos);
            setPosition(newPos.x, newPos.y, newPos.z);
        } else if (type === 'rot') {
            const newRot = { ...rot, [axis]: value };
            setRot(newRot);
            setRotation(newRot.x, newRot.y, newRot.z);
        } else if (type === 'scl') {
            const newScl = { ...scl, [axis]: value };
            setScl(newScl);
            setScale(newScl.x, newScl.y, newScl.z);
        }
    };

    const handleExtrude = () => {
        if (!selectedObject) return;

        if ((selectedObject as any).geometry) {
            console.log(`Extruding ${selectedObject.name} by ${extrudeDepth}`);
            const mesh = selectedObject as THREE.Mesh;
            if (mesh.geometry.type === 'ShapeGeometry') {
                console.warn('Extrusion requires original Shape data');
            }
        }
    };

    const handleBoolean = () => {
        if (!selectedObject || !targetObjectId || !r3fScene) return;

        const targetObj = r3fScene.getObjectByProperty('uuid', targetObjectId) as THREE.Mesh;
        const sourceObj = selectedObject as THREE.Mesh;

        if (!targetObj || !targetObj.isMesh || !sourceObj.isMesh) {
            console.error('Boolean operation requires two meshes');
            return;
        }

        sourceObj.updateMatrixWorld();
        targetObj.updateMatrixWorld();

        const brushA = new Brush(sourceObj.geometry, sourceObj.material);
        brushA.position.copy(sourceObj.position);
        brushA.rotation.copy(sourceObj.rotation);
        brushA.scale.copy(sourceObj.scale);
        brushA.updateMatrixWorld();

        const brushB = new Brush(targetObj.geometry, targetObj.material);
        brushB.position.copy(targetObj.position);
        brushB.rotation.copy(targetObj.rotation);
        brushB.scale.copy(targetObj.scale);
        brushB.updateMatrixWorld();

        const evaluator = new Evaluator();
        let resultBrush;

        if (booleanOp === 'subtract') resultBrush = evaluator.evaluate(brushA, brushB, SUBTRACTION);
        else if (booleanOp === 'union') resultBrush = evaluator.evaluate(brushA, brushB, ADDITION);
        else if (booleanOp === 'intersect') resultBrush = evaluator.evaluate(brushA, brushB, INTERSECTION);

        if (resultBrush) {
            const resultMesh = new THREE.Mesh(resultBrush.geometry, sourceObj.material);
            resultMesh.name = `${sourceObj.name}-${booleanOp}-${targetObj.name}`;
            sourceObj.parent?.add(resultMesh);
            sourceObj.visible = false;
            targetObj.visible = false;
            console.log('Boolean operation complete');
        }
    };

    if (!selectedObject) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Box className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Select an object to edit</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tab Navigation - 5 sub-tabs */}
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    onClick={() => setActiveTab('transform')}
                    className={`p-2 flex-1 flex justify-center ${activeTab === 'transform' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    title="Transform"
                >
                    <Move size={16} />
                </button>
                <button
                    onClick={() => setActiveTab('geometry')}
                    className={`p-2 flex-1 flex justify-center ${activeTab === 'geometry' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    title="Geometry & Extrusion"
                >
                    <Maximize size={16} />
                </button>
                <button
                    onClick={() => setActiveTab('physics')}
                    className={`p-2 flex-1 flex justify-center ${activeTab === 'physics' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    title="Physics"
                >
                    <Box size={16} />
                </button>
                <button
                    onClick={() => setActiveTab('boolean')}
                    className={`p-2 flex-1 flex justify-center ${activeTab === 'boolean' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    title="Boolean Operations"
                >
                    <Scissors size={16} />
                </button>
                <button
                    onClick={() => setActiveTab('path')}
                    className={`p-2 flex-1 flex justify-center ${activeTab === 'path' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                    title="Path Editing"
                >
                    <PenTool size={16} />
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1">

                {/* TRANSFORM TAB */}
                {activeTab === 'transform' && (
                    <div className="space-y-4">
                        <TransformGroup label="Position" values={pos} onChange={(a, v) => handleTransformChange('pos', a, v)} step={0.1} />
                        <TransformGroup label="Rotation" values={rot} onChange={(a, v) => handleTransformChange('rot', a, v)} step={0.1} />
                        <TransformGroup label="Scale" values={scl} onChange={(a, v) => handleTransformChange('scl', a, v)} step={0.1} />
                    </div>
                )}

                {/* GEOMETRY TAB */}
                {activeTab === 'geometry' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Extrusion</h4>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 block">Depth</label>
                            <input
                                type="number"
                                value={extrudeDepth}
                                onChange={(e) => setExtrudeDepth(parseFloat(e.target.value))}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={bevelEnabled}
                                onChange={(e) => setBevelEnabled(e.target.checked)}
                                id="bevel-check"
                            />
                            <label htmlFor="bevel-check" className="text-sm text-gray-600">Enable Bevel</label>
                        </div>
                        {bevelEnabled && (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 block">Bevel Thickness</label>
                                <input
                                    type="number"
                                    value={bevelThickness}
                                    onChange={(e) => setBevelThickness(parseFloat(e.target.value))}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    step={0.01}
                                />
                            </div>
                        )}
                        <button
                            onClick={handleExtrude}
                            className="w-full py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            Apply Extrusion
                        </button>
                    </div>
                )}

                {/* PHYSICS TAB */}
                {activeTab === 'physics' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Physics Properties</h4>

                        {/* Check if it's an added object */}
                        {selectedObject && (selectedObject.userData as any).isAddedObject ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={addedObjects.find(o => o.id === (selectedObject.userData as any).id)?.physics.enabled ?? true}
                                        onChange={(e) => {
                                            const id = (selectedObject.userData as any).id;
                                            const obj = addedObjects.find(o => o.id === id);
                                            if (obj) {
                                                updateObject(id, { physics: { ...obj.physics, enabled: e.target.checked } });
                                            }
                                        }}
                                        id="physics-check"
                                    />
                                    <label htmlFor="physics-check" className="text-sm text-gray-600">Enable Physics</label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 block">Type</label>
                                    <select
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        value={addedObjects.find(o => o.id === (selectedObject.userData as any).id)?.physics.type ?? 'dynamic'}
                                        onChange={(e) => {
                                            const id = (selectedObject.userData as any).id;
                                            const obj = addedObjects.find(o => o.id === id);
                                            if (obj) {
                                                updateObject(id, { physics: { ...obj.physics, type: e.target.value as any } });
                                            }
                                        }}
                                    >
                                        <option value="dynamic">Dynamic (Falls)</option>
                                        <option value="fixed">Fixed (Static)</option>
                                        <option value="kinematic">Kinematic (Animated)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 block">Mass</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        value={addedObjects.find(o => o.id === (selectedObject.userData as any).id)?.physics.mass ?? 1}
                                        onChange={(e) => {
                                            const id = (selectedObject.userData as any).id;
                                            const obj = addedObjects.find(o => o.id === id);
                                            if (obj) {
                                                updateObject(id, { physics: { ...obj.physics, mass: parseFloat(e.target.value) } });
                                            }
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 block">Bounciness (Restitution)</label>
                                    <input
                                        type="number"
                                        step={0.1}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        value={addedObjects.find(o => o.id === (selectedObject.userData as any).id)?.physics.restitution ?? 0.5}
                                        onChange={(e) => {
                                            const id = (selectedObject.userData as any).id;
                                            const obj = addedObjects.find(o => o.id === id);
                                            if (obj) {
                                                updateObject(id, { physics: { ...obj.physics, restitution: parseFloat(e.target.value) } });
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded">
                                Physics editing is currently only supported for added shapes (Box, Sphere, Plane).
                            </div>
                        )}
                    </div>
                )}

                {/* BOOLEAN TAB */}
                {activeTab === 'boolean' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Boolean Operation</h4>
                        <p className="text-xs text-gray-500 mb-2">
                            Apply operation between <strong>{selectedObject.name}</strong> and:
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 block">Target Object (UUID)</label>
                            <input
                                type="text"
                                value={targetObjectId}
                                onChange={(e) => setTargetObjectId(e.target.value)}
                                placeholder="Paste UUID here"
                                className="w-full px-2 py-1 text-sm border rounded font-mono"
                            />
                            <p className="text-[10px] text-gray-400">
                                Tip: Select another object to copy its UUID from the console or inspector.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {(['union', 'subtract', 'intersect'] as const).map(op => (
                                <button
                                    key={op}
                                    onClick={() => setBooleanOp(op)}
                                    className={`flex-1 py-1 text-xs border rounded capitalize ${booleanOp === op ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}
                                >
                                    {op}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleBoolean}
                            className="w-full py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                            Execute {booleanOp}
                        </button>
                    </div>
                )}

                {/* PATH TAB */}
                {activeTab === 'path' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Path Editing</h4>
                        <p className="text-xs text-gray-500">
                            Select vertices to edit position.
                        </p>
                        <div className="p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                            <PenTool className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Vertex editing mode coming soon</span>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}

// Helper Component for Transform Inputs
function TransformGroup({ label, values, onChange, step }: {
    label: string,
    values: { x: number, y: number, z: number },
    onChange: (axis: 'x' | 'y' | 'z', val: number) => void,
    step: number
}) {
    return (
        <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-1">{label}</h4>
            <div className="grid grid-cols-3 gap-2">
                {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis} className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">
                            {axis}
                        </span>
                        <input
                            type="number"
                            step={step}
                            value={values[axis]}
                            onChange={(e) => onChange(axis, parseFloat(e.target.value))}
                            className="w-full pl-5 pr-1 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
