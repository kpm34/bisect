'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { Box, Move, Maximize, Scissors, PenTool, ChevronDown, Check } from 'lucide-react';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg';

/**
 * ObjectEditor - Full object editing controls
 *
 * 5-tab interface:
 * - Transform: Position, Rotation, Scale
 * - Geometry: Scale operations (uniform/non-uniform)
 * - Physics: Enable/disable, type, mass, restitution (all objects)
 * - Boolean: Union, Subtract, Intersect with object picker
 * - Path: Vertex editing (coming soon)
 */

type EditorTab = 'transform' | 'geometry' | 'physics' | 'boolean' | 'path';

interface SceneMesh {
    uuid: string;
    name: string;
    object: THREE.Mesh;
}

export default function ObjectEditor() {
    const { selectedObject, setPosition, setRotation, setScale, r3fScene, addedObjects, updateObject } = useSelection();
    const [activeTab, setActiveTab] = useState<EditorTab>('transform');

    // Transform State
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
    const [scl, setScl] = useState({ x: 1, y: 1, z: 1 });

    // Geometry State
    const [uniformScale, setUniformScale] = useState(1);
    const [scaleAxis, setScaleAxis] = useState<'uniform' | 'x' | 'y' | 'z'>('uniform');

    // Boolean State
    const [targetObjectId, setTargetObjectId] = useState<string>('');
    const [booleanOp, setBooleanOp] = useState<'union' | 'subtract' | 'intersect'>('subtract');
    const [showObjectPicker, setShowObjectPicker] = useState(false);
    const [booleanStatus, setBooleanStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [booleanMessage, setBooleanMessage] = useState('');

    // Physics State for imported objects
    const [importedPhysics, setImportedPhysics] = useState({
        enabled: false,
        type: 'fixed' as 'dynamic' | 'fixed' | 'kinematic',
        mass: 1,
        restitution: 0.5
    });

    // Get all meshes in scene for object picker
    const sceneMeshes = useMemo((): SceneMesh[] => {
        if (!r3fScene) return [];
        const meshes: SceneMesh[] = [];
        r3fScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && child.uuid !== selectedObject?.uuid) {
                // Filter out system objects (gizmos, helpers, etc)
                if (!child.name.includes('Gizmo') &&
                    !child.name.includes('Helper') &&
                    !child.name.includes('Grid') &&
                    child.visible) {
                    meshes.push({
                        uuid: child.uuid,
                        name: child.name || `Mesh ${meshes.length + 1}`,
                        object: child as THREE.Mesh
                    });
                }
            }
        });
        return meshes;
    }, [r3fScene, selectedObject?.uuid]);

    // Get target object name for display
    const targetObjectName = useMemo(() => {
        const target = sceneMeshes.find(m => m.uuid === targetObjectId);
        return target?.name || 'Select target...';
    }, [sceneMeshes, targetObjectId]);

    // Sync transform state with selection
    useEffect(() => {
        if (!selectedObject) return;
        setPos({ x: selectedObject.position.x, y: selectedObject.position.y, z: selectedObject.position.z });
        setRot({ x: selectedObject.rotation.x, y: selectedObject.rotation.y, z: selectedObject.rotation.z });
        setScl({ x: selectedObject.scale.x, y: selectedObject.scale.y, z: selectedObject.scale.z });
        setUniformScale(selectedObject.scale.x);

        // Load physics from userData for imported objects
        if (selectedObject.userData?.physics) {
            setImportedPhysics(selectedObject.userData.physics);
        } else {
            setImportedPhysics({ enabled: false, type: 'fixed', mass: 1, restitution: 0.5 });
        }
    }, [selectedObject]);

    // --- Handlers ---

    const handleTransformChange = (type: 'pos' | 'rot' | 'scl', axis: 'x' | 'y' | 'z', value: number) => {
        if (!selectedObject) return;

        if (type === 'pos') {
            const newPos = { ...pos, [axis]: value };
            setPos(newPos);
            selectedObject.position.set(newPos.x, newPos.y, newPos.z);
        } else if (type === 'rot') {
            const newRot = { ...rot, [axis]: value };
            setRot(newRot);
            selectedObject.rotation.set(newRot.x, newRot.y, newRot.z);
        } else if (type === 'scl') {
            const newScl = { ...scl, [axis]: value };
            setScl(newScl);
            selectedObject.scale.set(newScl.x, newScl.y, newScl.z);
        }
    };

    const handleUniformScale = (value: number) => {
        if (!selectedObject) return;
        setUniformScale(value);
        selectedObject.scale.set(value, value, value);
        setScl({ x: value, y: value, z: value });
    };

    const handleAxisScale = (axis: 'x' | 'y' | 'z', value: number) => {
        if (!selectedObject) return;
        const newScl = { ...scl, [axis]: value };
        setScl(newScl);
        selectedObject.scale.set(newScl.x, newScl.y, newScl.z);
    };

    const handleBoolean = () => {
        if (!selectedObject || !targetObjectId || !r3fScene) {
            setBooleanStatus('error');
            setBooleanMessage('Select a target object first');
            return;
        }

        const targetObj = r3fScene.getObjectByProperty('uuid', targetObjectId) as THREE.Mesh;
        const sourceObj = selectedObject as THREE.Mesh;

        if (!targetObj || !targetObj.isMesh) {
            setBooleanStatus('error');
            setBooleanMessage('Target is not a valid mesh');
            return;
        }

        if (!sourceObj.isMesh) {
            setBooleanStatus('error');
            setBooleanMessage('Selected object is not a mesh');
            return;
        }

        try {
            sourceObj.updateMatrixWorld();
            targetObj.updateMatrixWorld();

            const brushA = new Brush(sourceObj.geometry.clone(), sourceObj.material);
            brushA.position.copy(sourceObj.position);
            brushA.rotation.copy(sourceObj.rotation);
            brushA.scale.copy(sourceObj.scale);
            brushA.updateMatrixWorld();

            const brushB = new Brush(targetObj.geometry.clone(), targetObj.material);
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
                resultMesh.name = `${sourceObj.name || 'Object'}-${booleanOp}-${targetObj.name || 'Target'}`;
                resultMesh.position.set(0, 0, 0);

                sourceObj.parent?.add(resultMesh);
                sourceObj.visible = false;
                targetObj.visible = false;

                setBooleanStatus('success');
                setBooleanMessage(`Created: ${resultMesh.name}`);
                setTargetObjectId('');
            }
        } catch (error) {
            console.error('Boolean operation failed:', error);
            setBooleanStatus('error');
            setBooleanMessage('Operation failed - meshes may be incompatible');
        }
    };

    // Handle physics for imported objects
    const handleImportedPhysicsChange = (updates: Partial<typeof importedPhysics>) => {
        if (!selectedObject) return;
        const newPhysics = { ...importedPhysics, ...updates };
        setImportedPhysics(newPhysics);
        // Store in userData for the physics system to read
        selectedObject.userData.physics = newPhysics;
    };

    // Check if object is an added primitive
    const isAddedObject = selectedObject && (selectedObject.userData as any)?.isAddedObject;
    const addedObjectId = isAddedObject ? (selectedObject.userData as any).id : null;
    const addedObjectData = addedObjectId ? addedObjects.find(o => o.id === addedObjectId) : null;

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
                    title="Scale & Geometry"
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
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Scale Mode</h4>

                        <div className="flex gap-2">
                            {(['uniform', 'x', 'y', 'z'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setScaleAxis(mode)}
                                    className={`flex-1 py-1.5 text-xs border rounded capitalize ${
                                        scaleAxis === mode
                                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {mode === 'uniform' ? 'All' : mode.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {scaleAxis === 'uniform' ? (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 block">Uniform Scale</label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={uniformScale}
                                    onChange={(e) => handleUniformScale(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>0.1x</span>
                                    <span className="font-medium text-gray-700">{uniformScale.toFixed(1)}x</span>
                                    <span>5x</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 block">Scale {scaleAxis.toUpperCase()} Axis</label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={scl[scaleAxis]}
                                    onChange={(e) => handleAxisScale(scaleAxis, parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>0.1x</span>
                                    <span className="font-medium text-gray-700">{scl[scaleAxis].toFixed(1)}x</span>
                                    <span>5x</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    if (!selectedObject) return;
                                    selectedObject.scale.set(1, 1, 1);
                                    setScl({ x: 1, y: 1, z: 1 });
                                    setUniformScale(1);
                                }}
                                className="w-full py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Reset Scale
                            </button>
                        </div>
                    </div>
                )}

                {/* PHYSICS TAB */}
                {activeTab === 'physics' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Physics Properties</h4>

                        {isAddedObject && addedObjectData ? (
                            // Added object physics (existing implementation)
                            <>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={addedObjectData.physics.enabled}
                                        onChange={(e) => {
                                            updateObject(addedObjectId, {
                                                physics: { ...addedObjectData.physics, enabled: e.target.checked }
                                            });
                                        }}
                                        id="physics-check"
                                        className="rounded"
                                    />
                                    <label htmlFor="physics-check" className="text-sm text-gray-600">Enable Physics</label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 block">Type</label>
                                    <select
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        value={addedObjectData.physics.type}
                                        onChange={(e) => {
                                            updateObject(addedObjectId, {
                                                physics: { ...addedObjectData.physics, type: e.target.value as any }
                                            });
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
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        value={addedObjectData.physics.mass}
                                        onChange={(e) => {
                                            updateObject(addedObjectId, {
                                                physics: { ...addedObjectData.physics, mass: parseFloat(e.target.value) }
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 block">Bounciness</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        className="w-full"
                                        value={addedObjectData.physics.restitution}
                                        onChange={(e) => {
                                            updateObject(addedObjectId, {
                                                physics: { ...addedObjectData.physics, restitution: parseFloat(e.target.value) }
                                            });
                                        }}
                                    />
                                    <div className="text-xs text-gray-400 text-right">{addedObjectData.physics.restitution}</div>
                                </div>
                            </>
                        ) : (
                            // Imported object physics
                            <>
                                <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded mb-3">
                                    Physics for imported models. Enable to make this object interact with the physics world.
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={importedPhysics.enabled}
                                        onChange={(e) => handleImportedPhysicsChange({ enabled: e.target.checked })}
                                        id="imported-physics-check"
                                        className="rounded"
                                    />
                                    <label htmlFor="imported-physics-check" className="text-sm text-gray-600">Enable Physics</label>
                                </div>

                                {importedPhysics.enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 block">Type</label>
                                            <select
                                                className="w-full px-2 py-1.5 text-sm border rounded"
                                                value={importedPhysics.type}
                                                onChange={(e) => handleImportedPhysicsChange({ type: e.target.value as any })}
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
                                                className="w-full px-2 py-1.5 text-sm border rounded"
                                                value={importedPhysics.mass}
                                                onChange={(e) => handleImportedPhysicsChange({ mass: parseFloat(e.target.value) })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-500 block">Bounciness</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                className="w-full"
                                                value={importedPhysics.restitution}
                                                onChange={(e) => handleImportedPhysicsChange({ restitution: parseFloat(e.target.value) })}
                                            />
                                            <div className="text-xs text-gray-400 text-right">{importedPhysics.restitution}</div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* BOOLEAN TAB */}
                {activeTab === 'boolean' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Boolean Operation</h4>
                        <p className="text-xs text-gray-500">
                            Combine <strong className="text-gray-700">{selectedObject.name || 'Selected'}</strong> with another mesh
                        </p>

                        {/* Object Picker Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 block">Target Object</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowObjectPicker(!showObjectPicker)}
                                    className="w-full px-3 py-2 text-sm border rounded bg-white text-left flex items-center justify-between hover:border-blue-400 transition-colors"
                                >
                                    <span className={targetObjectId ? 'text-gray-800' : 'text-gray-400'}>
                                        {targetObjectName}
                                    </span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showObjectPicker ? 'rotate-180' : ''}`} />
                                </button>

                                {showObjectPicker && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {sceneMeshes.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-gray-400">No other meshes in scene</div>
                                        ) : (
                                            sceneMeshes.map((mesh) => (
                                                <button
                                                    key={mesh.uuid}
                                                    onClick={() => {
                                                        setTargetObjectId(mesh.uuid);
                                                        setShowObjectPicker(false);
                                                        setBooleanStatus('idle');
                                                    }}
                                                    className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 flex items-center justify-between"
                                                >
                                                    <span>{mesh.name}</span>
                                                    {mesh.uuid === targetObjectId && <Check size={14} className="text-blue-500" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Operation Buttons */}
                        <div className="flex gap-2">
                            {(['union', 'subtract', 'intersect'] as const).map(op => (
                                <button
                                    key={op}
                                    onClick={() => setBooleanOp(op)}
                                    className={`flex-1 py-1.5 text-xs border rounded capitalize transition-colors ${
                                        booleanOp === op
                                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {op}
                                </button>
                            ))}
                        </div>

                        {/* Status Message */}
                        {booleanStatus !== 'idle' && (
                            <div className={`p-2 rounded text-xs ${
                                booleanStatus === 'success'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {booleanMessage}
                            </div>
                        )}

                        <button
                            onClick={handleBoolean}
                            disabled={!targetObjectId}
                            className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                                targetObjectId
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Execute {booleanOp}
                        </button>
                    </div>
                )}

                {/* PATH TAB */}
                {activeTab === 'path' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Path Editing</h4>
                        <div className="p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                            <PenTool className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 block">Vertex editing mode</span>
                            <span className="text-xs text-blue-500">Coming soon</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Direct vertex manipulation will allow you to reshape meshes by moving individual vertices.
                        </p>
                    </div>
                )}

            </div>
        </div>
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
                            value={values[axis].toFixed(2)}
                            onChange={(e) => onChange(axis, parseFloat(e.target.value) || 0)}
                            className="w-full pl-5 pr-1 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
