'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Object3D, WebGLRenderer } from 'three';
import type { UniversalEditor } from '@/lib/core/adapters';

// Face selection: object UUID + face index
export interface FaceSelection {
  objectUuid: string;
  faceIndex: number;
}

export type SceneObjectType =
  | 'box'
  | 'sphere'
  | 'plane'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'capsule'
  | 'text3d'
  | 'external'
  | 'parametric';

// ============== SCENE VARIABLES ==============
export type SceneVariableType = 'boolean' | 'number' | 'string';

export interface SceneVariable {
  id: string;
  name: string;
  type: SceneVariableType;
  value: boolean | number | string;
  defaultValue: boolean | number | string;
}

// ============== OBJECT STATES ==============
export interface ObjectState {
  id: string;
  name: string;
  isDefault?: boolean;
  properties: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: string;
    opacity?: number;
    visible?: boolean;
  };
}

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  url?: string; // For external assets
  formula?: { x: string; y: string; z: string; uRange: [number, number]; vRange: [number, number] }; // For parametric objects
  text?: string; // For 3D text objects
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  physics: {
    enabled: boolean;
    type: 'dynamic' | 'fixed' | 'kinematic';
    mass: number;
    restitution: number;
    friction: number;
  };
  events: {
    id: string;
    trigger: 'start' | 'click' | 'hover' | 'collision';
    action: 'move' | 'scale' | 'color' | 'destroy';
    parameters: any;
  }[];
  animation?: {
    current: string | null;
    playing: boolean;
    speed: number;
  };
  lod?: {
    enabled: boolean;
    levels: { distance: number; url: string }[];
  };
  // NEW: Object states for state-based animation
  states?: ObjectState[];
  currentState?: string;
}

type SelectionContextValue = {
  // Universal Editor (works with Spline and GLTF)
  universalEditor: UniversalEditor | null;
  setUniversalEditor: (editor: UniversalEditor | null) => void;

  // R3F Scene (for React Three Fiber)
  r3fScene: Object3D | null;
  setR3FScene: (scene: Object3D | null) => void;

  // R3F Renderer (for screenshots, MCP bridge)
  r3fRenderer: WebGLRenderer | null;
  setR3FRenderer: (renderer: WebGLRenderer | null) => void;

  // DEPRECATED: Single selection (for backwards compatibility)
  selectedObject: Object3D | null;
  setSelectedObject: (obj: Object3D | null) => void;

  // Multi-selection (new)
  selectedObjects: Set<string>; // Set of object UUIDs
  lockedObjects: Set<string>; // Set of locked object UUIDs
  selectionVersion: number; // Counter to force re-renders

  // Face-level selection (for face editing mode)
  selectedFaces: Set<string>; // Set of "uuid:faceIndex" strings
  toggleFaceSelection: (objectUuid: string, faceIndex: number) => void;
  clearFaceSelection: () => void;
  isFaceSelected: (objectUuid: string, faceIndex: number) => boolean;

  // Selection methods
  toggleSelection: (obj: Object3D) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (obj: Object3D) => boolean;

  // Lock methods
  toggleLock: (obj: Object3D) => void;
  lockObject: (obj: Object3D) => void;
  unlockObject: (obj: Object3D) => void;
  isLocked: (obj: Object3D) => boolean;

  // Scene query helpers
  findObjectByName: (name: string) => Object3D | null;
  findObjectById: (id: string) => Object3D | null;
  selectObjectByName: (name: string) => boolean;

  // Material helpers
  setColor: (hex: number) => void;
  setRoughness: (value: number) => void;
  setMetalness: (value: number) => void;

  // Transform helpers (absolute)
  setPosition: (x: number, y: number, z: number) => void;
  setRotation: (x: number, y: number, z: number) => void;
  setScale: (x: number, y: number, z: number) => void;

  // Effects
  effects: {
    bloom: boolean;
    glitch: boolean;
    noise: boolean;
    vignette: boolean;
  };
  setEffects: (effects: { bloom: boolean; glitch: boolean; noise: boolean; vignette: boolean }) => void;

  // Lighting
  lighting: {
    ambient: { enabled: boolean; intensity: number; color: string };
    directional: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; castShadow: boolean };
    point: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; distance: number };
    spot: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; angle: number; penumbra: number };
    hemisphere: { enabled: boolean; intensity: number; skyColor: string; groundColor: string };
  };
  setLighting: (lighting: SelectionContextValue['lighting']) => void;
  updateLight: (type: keyof SelectionContextValue['lighting'], updates: Partial<any>) => void;

  // Scene Objects
  addedObjects: SceneObject[];
  addObject: (type: SceneObjectType, url?: string, formula?: any, text?: string) => string; // Returns the new object ID
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  setAddedObjects: (objects: SceneObject[]) => void; // For state restoration
  pendingSelectionId: string | null; // ID of newly added object to auto-select
  clearPendingSelection: () => void;

  // Delete selected object (handles both added objects and scene objects)
  deleteSelectedObject: () => void;

  // ============== DELETED OBJECTS FROM LOADED FILES ==============
  deletedObjectNames: string[];
  setDeletedObjectNames: (names: string[]) => void;

  // ============== SCENE VARIABLES ==============
  sceneVariables: SceneVariable[];
  addVariable: (name: string, type: SceneVariableType, defaultValue: boolean | number | string) => void;
  updateVariable: (id: string, value: boolean | number | string) => void;
  removeVariable: (id: string) => void;
  getVariable: (name: string) => SceneVariable | undefined;
  setSceneVariables: (variables: SceneVariable[]) => void;

  // ============== AUDIO SYSTEM ==============
  audioContext: AudioContext | null;
  playSound: (url: string, volume?: number) => void;
  stopAllSounds: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [universalEditor, setUniversalEditor] = useState<UniversalEditor | null>(null);
  const [r3fScene, setR3FScene] = useState<Object3D | null>(null);
  const [r3fRenderer, setR3FRenderer] = useState<WebGLRenderer | null>(null);

  // DEPRECATED: Single selection (kept for backwards compatibility)
  const [selectedObject, setSelectedObject] = useState<Object3D | null>(null);

  // Multi-selection state
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [lockedObjects, setLockedObjects] = useState<Set<string>>(new Set());
  const [selectionVersion, setSelectionVersion] = useState(0); // Force re-renders

  // Face-level selection state (for face editing mode)
  const [selectedFaces, setSelectedFaces] = useState<Set<string>>(new Set()); // "uuid:faceIndex" format

  // Clear selection when editor changes (scene loaded/unloaded)
  useEffect(() => {
    if (!universalEditor) {
      // Editor was unloaded - clear all selections
      console.log('🧹 Clearing selection: editor unloaded');
      setSelectedObject(null);
      setSelectedObjects(new Set());
      setSelectedFaces(new Set());
      setSelectionVersion((v) => v + 1);
    }
  }, [universalEditor]);

  // Sync single selection with multi-selection for backwards compatibility
  const setSelectedObjectWrapper = useCallback((obj: Object3D | null) => {
    setSelectedObject(obj);
    if (obj) {
      setSelectedObjects(new Set([obj.uuid]));
    } else {
      setSelectedObjects(new Set());
    }
    setSelectionVersion((v) => v + 1); // Increment to force re-renders
  }, []);

  // Toggle object selection
  const toggleSelection = useCallback((obj: Object3D) => {
    if (!obj) return;

    setSelectedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(obj.uuid)) {
        next.delete(obj.uuid);
        console.info(`🔵 Selection: Deselected "${obj.name}"`);
        // Update single selection if this was the only selected object
        if (next.size === 0) {
          setSelectedObject(null);
        }
      } else {
        next.add(obj.uuid);
        console.info(`🔵 Selection: Selected "${obj.name}" (UUID: ${obj.uuid})`);
        // Update single selection to this object
        setSelectedObject(obj);
      }
      console.info(`🔵 Selection: Total selected: ${next.size}`);
      setSelectionVersion((v) => v + 1); // Increment to force re-renders
      return next;
    });
  }, []);

  // Select all objects
  const selectAll = useCallback(() => {
    if (!universalEditor) return;

    const allObjects = universalEditor.getAllObjects();
    const unlocked = allObjects.filter((obj) => !lockedObjects.has(obj.uuid));

    setSelectedObjects(new Set(unlocked.map((obj) => obj.uuid)));

    if (unlocked.length > 0) {
      setSelectedObject(unlocked[0]);
    }
    setSelectionVersion((v) => v + 1); // Increment to force re-renders
  }, [universalEditor, lockedObjects]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedObjects(new Set());
    setSelectedObject(null);
    setSelectionVersion((v) => v + 1); // Increment to force re-renders
  }, []);

  // Check if object is selected
  const isSelected = useCallback(
    (obj: Object3D): boolean => {
      return selectedObjects.has(obj.uuid);
    },
    [selectedObjects]
  );

  // Toggle object lock
  const toggleLock = useCallback((obj: Object3D) => {
    if (!obj) return;

    setLockedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(obj.uuid)) {
        next.delete(obj.uuid);
      } else {
        next.add(obj.uuid);
        // Deselect if locking
        setSelectedObjects((sel) => {
          const nextSel = new Set(sel);
          nextSel.delete(obj.uuid);
          return nextSel;
        });
      }
      return next;
    });
  }, []);

  // Lock object
  const lockObject = useCallback((obj: Object3D) => {
    if (!obj) return;

    setLockedObjects((prev) => new Set(prev).add(obj.uuid));

    // Deselect if locking
    setSelectedObjects((sel) => {
      const next = new Set(sel);
      next.delete(obj.uuid);
      return next;
    });

    if (selectedObject?.uuid === obj.uuid) {
      setSelectedObject(null);
    }
  }, [selectedObject]);

  // Unlock object
  const unlockObject = useCallback((obj: Object3D) => {
    if (!obj) return;

    setLockedObjects((prev) => {
      const next = new Set(prev);
      next.delete(obj.uuid);
      return next;
    });
  }, []);

  // Check if object is locked
  const isLocked = useCallback(
    (obj: Object3D): boolean => {
      return lockedObjects.has(obj.uuid);
    },
    [lockedObjects]
  );

  // Find object by name (case-insensitive) - works with both R3F and UniversalEditor
  const findObjectByName = useCallback(
    (name: string): Object3D | null => {
      // Try R3F scene first
      if (r3fScene) {
        let found: Object3D | null = null;
        r3fScene.traverse((child) => {
          if (child.name.toLowerCase() === name.toLowerCase()) {
            found = child;
          }
        });
        if (found) return found;
      }

      // Fallback to UniversalEditor
      if (universalEditor) {
        try {
          return universalEditor.findObjectByName(name);
        } catch (error) {
          console.error(`Failed to find object "${name}":`, error);
        }
      }

      return null;
    },
    [r3fScene, universalEditor]
  );

  // Find object by ID - works with both R3F and UniversalEditor
  const findObjectById = useCallback(
    (id: string): Object3D | null => {
      // Try R3F scene first
      if (r3fScene) {
        let found: Object3D | null = null;
        r3fScene.traverse((child) => {
          if (child.uuid === id) {
            found = child;
          }
        });
        if (found) return found;
      }

      // Fallback to UniversalEditor
      if (universalEditor) {
        try {
          return universalEditor.findObjectById(id);
        } catch (error) {
          console.error(`Failed to find object with ID "${id}":`, error);
        }
      }

      return null;
    },
    [r3fScene, universalEditor]
  );

  // Find and select object by name
  const selectObjectByName = useCallback(
    (name: string): boolean => {
      console.info(`🔵 Selection: Attempting to select "${name}" by name...`);
      const obj = findObjectByName(name);
      if (obj) {
        if (lockedObjects.has(obj.uuid)) {
          console.warn(`❌ Selection: Object "${name}" is locked`);
          return false;
        }

        setSelectedObject(obj);
        setSelectedObjects(new Set([obj.uuid])); // Single select
        setSelectionVersion((v) => v + 1); // Increment to force re-renders
        console.info(`✅ Selection: Successfully selected "${name}" (UUID: ${obj.uuid})`);
        return true;
      }
      console.warn(`❌ Selection: Object "${name}" not found in scene`);
      return false;
    },
    [findObjectByName, lockedObjects]
  );

  // Material operations (works with both UniversalEditor and direct THREE.js)
  const setColor = useCallback(
    (hex: number) => {
      if (!selectedObject) return;

      // Try UniversalEditor first (for Spline scenes)
      if (universalEditor) {
        const success = universalEditor.setColor(selectedObject.name, hex);
        if (success) {
          console.log(`✅ Set color to 0x${hex.toString(16).padStart(6, '0')}`);
          return;
        }
      }

      // Fallback: Direct THREE.js material manipulation (for R3F/GLTF scenes)
      selectedObject.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const material = Array.isArray(child.material) ? child.material : [child.material];
          material.forEach((mat: any) => {
            if (mat.color) {
              mat.color.setHex(hex);
              mat.needsUpdate = true;
            }
          });
        }
      });
      console.log(`✅ Set color to 0x${hex.toString(16).padStart(6, '0')} (direct THREE.js)`);
    },
    [selectedObject, universalEditor]
  );

  const setRoughness = useCallback(
    (value: number) => {
      if (!selectedObject) return;

      // Try UniversalEditor first (for Spline scenes)
      if (universalEditor) {
        const success = universalEditor.setRoughness(selectedObject.name, value);
        if (success) {
          console.log(`✅ Set roughness to ${value}`);
          return;
        }
      }

      // Fallback: Direct THREE.js material manipulation (for R3F/GLTF scenes)
      selectedObject.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const material = Array.isArray(child.material) ? child.material : [child.material];
          material.forEach((mat: any) => {
            if ('roughness' in mat) {
              mat.roughness = value;
              mat.needsUpdate = true;
            }
          });
        }
      });
      console.log(`✅ Set roughness to ${value} (direct THREE.js)`);
    },
    [selectedObject, universalEditor]
  );

  const setMetalness = useCallback(
    (value: number) => {
      if (!selectedObject) return;

      // Try UniversalEditor first (for Spline scenes)
      if (universalEditor) {
        const success = universalEditor.setMetalness(selectedObject.name, value);
        if (success) {
          console.log(`✅ Set metalness to ${value}`);
          return;
        }
      }

      // Fallback: Direct THREE.js material manipulation (for R3F/GLTF scenes)
      selectedObject.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const material = Array.isArray(child.material) ? child.material : [child.material];
          material.forEach((mat: any) => {
            if ('metalness' in mat) {
              mat.metalness = value;
              mat.needsUpdate = true;
            }
          });
        }
      });
      console.log(`✅ Set metalness to ${value} (direct THREE.js)`);
    },
    [selectedObject, universalEditor]
  );

  // Transform operations (delegate to UniversalEditor)
  const setPosition = useCallback(
    (x: number, y: number, z: number) => {
      if (!selectedObject || !universalEditor) return;
      const success = universalEditor.setPosition(selectedObject.name, x, y, z);
      if (success) {
        console.log(`✅ Set position to (${x}, ${y}, ${z})`);
      } else {
        console.warn(`❌ Failed to set position for "${selectedObject.name}"`);
      }
    },
    [selectedObject, universalEditor]
  );

  const setRotation = useCallback(
    (x: number, y: number, z: number) => {
      if (!selectedObject || !universalEditor) return;
      const success = universalEditor.setRotation(selectedObject.name, x, y, z);
      if (success) {
        console.log(`✅ Set rotation to (${x}, ${y}, ${z})`);
      } else {
        console.warn(`❌ Failed to set rotation for "${selectedObject.name}"`);
      }
    },
    [selectedObject, universalEditor]
  );

  const setScale = useCallback(
    (x: number, y: number, z: number) => {
      if (!selectedObject || !universalEditor) return;
      const success = universalEditor.setScale(selectedObject.name, x, y, z);
      if (success) {
        console.log(`✅ Set scale to (${x}, ${y}, ${z})`);
      } else {
        console.warn(`❌ Failed to set scale for "${selectedObject.name}"`);
      }
    },
    [selectedObject, universalEditor]
  );

  // Face selection methods
  const toggleFaceSelection = useCallback((objectUuid: string, faceIndex: number) => {
    const faceKey = `${objectUuid}:${faceIndex}`;
    setSelectedFaces((prev) => {
      const next = new Set(prev);
      if (next.has(faceKey)) {
        next.delete(faceKey);
        console.info(`🔵 Face Selection: Deselected face ${faceIndex} on object ${objectUuid}`);
      } else {
        next.add(faceKey);
        console.info(`🔵 Face Selection: Selected face ${faceIndex} on object ${objectUuid}`);
      }
      setSelectionVersion((v) => v + 1); // Force re-render
      return next;
    });
  }, []);

  const clearFaceSelection = useCallback(() => {
    setSelectedFaces(new Set());
    setSelectionVersion((v) => v + 1);
  }, []);

  const isFaceSelected = useCallback(
    (objectUuid: string, faceIndex: number): boolean => {
      const faceKey = `${objectUuid}:${faceIndex}`;
      return selectedFaces.has(faceKey);
    },
    [selectedFaces]
  );
  const [effects, setEffects] = useState({
    bloom: false,
    glitch: false,
    noise: false,
    vignette: false,
  });

  // Lighting State
  const [lighting, setLighting] = useState({
    ambient: { enabled: true, intensity: 0.4, color: '#ffffff' },
    directional: { enabled: true, intensity: 0.8, color: '#ffffff', position: [10, 10, 5] as [number, number, number], castShadow: true },
    point: { enabled: false, intensity: 1, color: '#ffffff', position: [0, 5, 0] as [number, number, number], distance: 10 },
    spot: { enabled: false, intensity: 1, color: '#ffffff', position: [0, 10, 0] as [number, number, number], angle: 0.5, penumbra: 0.5 },
    hemisphere: { enabled: true, intensity: 0.2, skyColor: '#ffffff', groundColor: '#444444' },
  });

  const updateLight = useCallback((type: keyof typeof lighting, updates: Partial<any>) => {
    setLighting(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }));
  }, []);

  // Scene Objects State (for added shapes)
  const [addedObjects, setAddedObjects] = useState<SceneObject[]>([]);

  // Pending selection - ID of newly added object to select once rendered
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);

  // ============== DELETED OBJECTS FROM LOADED FILES ==============
  const [deletedObjectNames, setDeletedObjectNames] = useState<string[]>([]);

  // ============== SCENE VARIABLES STATE ==============
  const [sceneVariables, setSceneVariables] = useState<SceneVariable[]>([]);

  const addVariable = useCallback((name: string, type: SceneVariableType, defaultValue: boolean | number | string) => {
    const newVar: SceneVariable = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      value: defaultValue,
      defaultValue,
    };
    setSceneVariables(prev => [...prev, newVar]);
    console.log(`📦 Variable added: ${name} (${type}) = ${defaultValue}`);
  }, []);

  const updateVariable = useCallback((id: string, value: boolean | number | string) => {
    setSceneVariables(prev => prev.map(v =>
      v.id === id ? { ...v, value } : v
    ));
  }, []);

  const removeVariable = useCallback((id: string) => {
    setSceneVariables(prev => prev.filter(v => v.id !== id));
  }, []);

  const getVariable = useCallback((name: string): SceneVariable | undefined => {
    return sceneVariables.find(v => v.name === name);
  }, [sceneVariables]);

  // ============== AUDIO SYSTEM ==============
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioBufferCache = useRef<Map<string, AudioBuffer>>(new Map());
  const activeAudioSources = useRef<AudioBufferSourceNode[]>([]);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        console.log('🔊 AudioContext initialized');
      }
    };

    // Initialize on first click/keypress
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [audioContext]);

  const playSound = useCallback(async (url: string, volume: number = 1) => {
    if (!audioContext) {
      console.warn('🔇 AudioContext not initialized');
      return;
    }

    try {
      let buffer = audioBufferCache.current.get(url);

      if (!buffer) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferCache.current.set(url, buffer);
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.start(0);
      activeAudioSources.current.push(source);

      // Remove from active sources when finished
      source.onended = () => {
        const index = activeAudioSources.current.indexOf(source);
        if (index > -1) activeAudioSources.current.splice(index, 1);
      };

      console.log(`🔊 Playing sound: ${url}`);
    } catch (error) {
      console.error('🔇 Error playing sound:', error);
    }
  }, [audioContext]);

  const stopAllSounds = useCallback(() => {
    activeAudioSources.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    activeAudioSources.current = [];
    console.log('🔇 Stopped all sounds');
  }, []);

  const addObject = (type: SceneObjectType, url?: string, formula?: any, text?: string): string => {
    console.log('🏗️ [Context] addObject called:', { type, url, formula, text });

    // Generate friendly name based on type
    const typeNames: Record<SceneObjectType, string> = {
      box: 'Cube',
      sphere: 'Sphere',
      plane: 'Plane',
      cylinder: 'Cylinder',
      cone: 'Cone',
      torus: 'Torus',
      capsule: 'Capsule',
      text3d: 'Text',
      external: 'Model',
      parametric: 'Parametric',
    };

    const newId = Math.random().toString(36).substr(2, 9);
    const newObj: SceneObject = {
      id: newId,
      type,
      url,
      formula,
      text: text || (type === 'text3d' ? 'Hello' : undefined),
      name: `${typeNames[type] || type} ${addedObjects.length + 1}`,
      position: [0, 2, 0], // Start slightly above ground
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff',
      physics: {
        enabled: false, // Start with physics disabled for easier positioning
        type: 'dynamic',
        mass: 1,
        restitution: 0.5,
        friction: 0.5,
      },
      events: [],
      animation: {
        current: null,
        playing: true,
        speed: 1,
      },
      lod: {
        enabled: false,
        levels: [],
      }
    };
    setAddedObjects(prev => [...prev, newObj]);

    // Set pending selection - will be selected once the mesh is created
    setPendingSelectionId(newId);

    return newId;
  };

  const clearPendingSelection = useCallback(() => {
    setPendingSelectionId(null);
  }, []);

  const removeObject = useCallback((id: string) => {
    setAddedObjects(prev => prev.filter(o => o.id !== id));
    if (selectedObject?.uuid === id) setSelectedObject(null);
  }, [selectedObject]);

  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setAddedObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  // Delete the currently selected object
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected to delete');
      return;
    }

    const objectName = selectedObject.name || 'Unnamed Object';
    const objectUuid = selectedObject.uuid;

    // Check if it's an added object (from addObject)
    const addedObj = addedObjects.find(o => o.id === objectUuid);
    if (addedObj) {
      setAddedObjects(prev => prev.filter(o => o.id !== objectUuid));
      console.log(`🗑️ Deleted added object: "${objectName}"`);
    } else if (r3fScene) {
      // Remove from R3F scene directly (this is an object from a loaded GLB/GLTF)
      const objToRemove = r3fScene.getObjectByProperty('uuid', objectUuid);
      if (objToRemove && objToRemove.parent) {
        // Track the deleted object name for persistence
        if (objectName && objectName !== 'Unnamed Object') {
          setDeletedObjectNames(prev => {
            if (!prev.includes(objectName)) {
              console.log(`📝 Tracking deleted object: "${objectName}"`);
              return [...prev, objectName];
            }
            return prev;
          });
        }

        objToRemove.parent.remove(objToRemove);
        // Dispose of geometry and materials to free memory
        objToRemove.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        console.log(`🗑️ Deleted scene object: "${objectName}"`);
      }
    }

    // Clear selection
    setSelectedObject(null);
    setSelectedObjects(prev => {
      const next = new Set(prev);
      next.delete(objectUuid);
      return next;
    });
    setSelectionVersion(v => v + 1);
  }, [selectedObject, addedObjects, r3fScene]);

  // Keyboard shortcut for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
        e.preventDefault();
        deleteSelectedObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, deleteSelectedObject]);

  const value = useMemo<SelectionContextValue>(
    () => ({
      universalEditor,
      setUniversalEditor,
      r3fScene,
      setR3FScene,
      r3fRenderer,
      setR3FRenderer,
      selectedObject,
      setSelectedObject: setSelectedObjectWrapper,
      selectedObjects,
      lockedObjects,
      selectionVersion,
      toggleSelection,
      selectAll,
      deselectAll,
      isSelected,
      toggleLock,
      lockObject,
      unlockObject,
      isLocked,
      findObjectByName,
      findObjectById,
      selectObjectByName,
      setColor,
      setRoughness,
      setMetalness,
      setPosition,
      setRotation,
      setScale,
      selectedFaces,
      toggleFaceSelection,
      clearFaceSelection,
      isFaceSelected,
      effects,
      setEffects,
      lighting,
      setLighting,
      updateLight,
      addedObjects,
      addObject,
      removeObject,
      updateObject,
      setAddedObjects,
      pendingSelectionId,
      clearPendingSelection,
      deleteSelectedObject,
      // Deleted Objects from loaded files
      deletedObjectNames,
      setDeletedObjectNames,
      // Scene Variables
      sceneVariables,
      addVariable,
      updateVariable,
      removeVariable,
      getVariable,
      setSceneVariables,
      // Audio System
      audioContext,
      playSound,
      stopAllSounds,
    }),
    [
      universalEditor,
      r3fScene,
      r3fRenderer,
      selectedObject,
      setSelectedObjectWrapper,
      selectedObjects,
      lockedObjects,
      selectionVersion,
      toggleSelection,
      selectAll,
      deselectAll,
      isSelected,
      toggleLock,
      lockObject,
      unlockObject,
      isLocked,
      findObjectByName,
      findObjectById,
      selectObjectByName,
      setColor,
      setRoughness,
      setMetalness,
      setPosition,
      setRotation,
      setScale,
      selectedFaces,
      toggleFaceSelection,
      clearFaceSelection,
      isFaceSelected,
      effects,
      setEffects,
      lighting,
      updateLight,
      addedObjects,
      addObject,
      removeObject,
      updateObject,
      setAddedObjects,
      pendingSelectionId,
      clearPendingSelection,
      deleteSelectedObject,
      // Deleted Objects
      deletedObjectNames,
      // Scene Variables
      sceneVariables,
      addVariable,
      updateVariable,
      removeVariable,
      getVariable,
      setSceneVariables,
      // Audio System
      audioContext,
      playSound,
      stopAllSounds,
    ]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (ctx) return ctx;

  // Safe no-op fallback
  const noop = () => { };
  const noopBool = () => false;
  const noopObj = () => null;

  return {
    universalEditor: null,
    setUniversalEditor: noop,
    r3fScene: null,
    setR3FScene: noop,
    r3fRenderer: null,
    setR3FRenderer: noop,
    selectedObject: null,
    setSelectedObject: noop,
    selectedObjects: new Set<string>(),
    lockedObjects: new Set<string>(),
    selectionVersion: 0,
    toggleSelection: noop,
    selectAll: noop,
    deselectAll: noop,
    isSelected: noopBool,
    toggleLock: noop,
    lockObject: noop,
    unlockObject: noop,
    isLocked: noopBool,
    findObjectByName: noopObj,
    findObjectById: noopObj,
    selectObjectByName: noopBool,
    setColor: noop,
    setRoughness: noop,
    setMetalness: noop,
    setPosition: noop,
    setRotation: noop,
    setScale: noop,
    selectedFaces: new Set<string>(),
    toggleFaceSelection: noop,
    clearFaceSelection: noop,
    isFaceSelected: noopBool,
    effects: { bloom: false, glitch: false, noise: false, vignette: false },
    setEffects: noop,
    lighting: {
      ambient: { enabled: true, intensity: 0.4, color: '#ffffff' },
      directional: { enabled: true, intensity: 0.8, color: '#ffffff', position: [10, 10, 5] as [number, number, number], castShadow: true },
      point: { enabled: false, intensity: 1, color: '#ffffff', position: [0, 5, 0] as [number, number, number], distance: 10 },
      spot: { enabled: false, intensity: 1, color: '#ffffff', position: [0, 10, 0] as [number, number, number], angle: 0.5, penumbra: 0.5 },
      hemisphere: { enabled: true, intensity: 0.2, skyColor: '#ffffff', groundColor: '#444444' },
    },
    setLighting: noop,
    updateLight: noop,
    addedObjects: [],
    addObject: () => '',
    removeObject: noop,
    updateObject: noop,
    setAddedObjects: noop,
    pendingSelectionId: null,
    clearPendingSelection: noop,
    deleteSelectedObject: noop,
    // Deleted Objects from loaded files
    deletedObjectNames: [],
    setDeletedObjectNames: noop,
    // Scene Variables
    sceneVariables: [],
    addVariable: noop,
    updateVariable: noop,
    removeVariable: noop,
    getVariable: () => undefined,
    setSceneVariables: noop,
    // Audio System
    audioContext: null,
    playSound: noop,
    stopAllSounds: noop,
  };
}
