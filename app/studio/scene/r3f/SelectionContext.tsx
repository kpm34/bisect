'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Object3D } from 'three';
import type { UniversalEditor } from '@/lib/core/adapters';

// Face selection: object UUID + face index
export interface FaceSelection {
  objectUuid: string;
  faceIndex: number;
}

type SelectionContextValue = {
  // Universal Editor (works with Spline and GLTF)
  universalEditor: UniversalEditor | null;
  setUniversalEditor: (editor: UniversalEditor | null) => void;

  // R3F Scene (for React Three Fiber)
  r3fScene: Object3D | null;
  setR3FScene: (scene: Object3D | null) => void;

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
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [universalEditor, setUniversalEditor] = useState<UniversalEditor | null>(null);
  const [r3fScene, setR3FScene] = useState<Object3D | null>(null);

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

  const value = useMemo<SelectionContextValue>(
    () => ({
      universalEditor,
      setUniversalEditor,
      r3fScene,
      setR3FScene,
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
    }),
    [
      universalEditor,
      r3fScene,
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
    ]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (ctx) return ctx;

  // Safe no-op fallback to avoid client crashes if provider hasn't mounted yet
  const noop = () => {};
  const noopBool = () => false;
  const noopObj = () => null;

  return {
    universalEditor: null,
    setUniversalEditor: noop,
    r3fScene: null,
    setR3FScene: noop,
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
  };
}
