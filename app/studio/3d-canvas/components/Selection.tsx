'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Object3D } from 'three';

/**
 * Selection Context - Simple selection management for r3f
 *
 * Provides:
 * - selectedObject: Currently selected THREE.Object3D
 * - selectObject: Function to select an object
 * - clearSelection: Function to clear selection
 */

interface SelectionContextValue {
  selectedObject: Object3D | null;
  selectedMaterial: any | null;
  selectObject: (obj: Object3D) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedObject, setSelectedObject] = useState<Object3D | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  const selectObject = (obj: Object3D) => {
    console.log('✅ Object selected:', obj.name || obj.type, obj);
    setSelectedObject(obj);

    // Extract material if it's a mesh
    if ('material' in obj && obj.material) {
      setSelectedMaterial(obj.material);
      console.log('📦 Material:', obj.material);
    } else {
      setSelectedMaterial(null);
    }
  };

  const clearSelection = () => {
    console.log('❌ Selection cleared');
    setSelectedObject(null);
    setSelectedMaterial(null);
  };

  return (
    <SelectionContext.Provider
      value={{
        selectedObject,
        selectedMaterial,
        selectObject,
        clearSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
}
