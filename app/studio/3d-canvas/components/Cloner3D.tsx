'use client';

/**
 * Cloner3D Component
 *
 * Renders cloned/instanced objects in Three.js with GPU instancing support
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Cloner, ClonerInstance, ClonerEffector } from '@/lib/core/cloner/types';
import { calculateClonerInstances, applyEffectors } from '@/lib/core/cloner/cloner-calculator';

// ============== TYPES ==============

interface Cloner3DProps {
  cloner: Cloner;
  sourceGeometry?: THREE.BufferGeometry;
  sourceMaterial?: THREE.Material;
  children?: React.ReactNode;
  onInstanceClick?: (instance: ClonerInstance, index: number) => void;
  onInstanceHover?: (instance: ClonerInstance | null, index: number | null) => void;
}

interface InstancedMeshProps {
  instances: ClonerInstance[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  onInstanceClick?: (instance: ClonerInstance, index: number) => void;
  onInstanceHover?: (instance: ClonerInstance | null, index: number | null) => void;
}

// ============== INSTANCED MESH ==============

function InstancedMesh({
  instances,
  geometry,
  material,
  onInstanceClick,
  onInstanceHover,
}: InstancedMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Update instance matrices
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const visibleInstances = instances.filter((i) => i.visible);

    visibleInstances.forEach((instance, i) => {
      tempObject.position.set(...instance.position);
      tempObject.rotation.set(...instance.rotation);
      tempObject.scale.set(...instance.scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // Set instance color if available
      if (instance.color) {
        tempColor.set(instance.color);
        mesh.setColorAt(i, tempColor);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [instances, tempObject, tempColor]);

  const visibleCount = useMemo(
    () => instances.filter((i) => i.visible).length,
    [instances]
  );

  const handleClick = (event: any) => {
    if (onInstanceClick && event.instanceId !== undefined) {
      const visibleInstances = instances.filter((i) => i.visible);
      const instance = visibleInstances[event.instanceId];
      if (instance) {
        onInstanceClick(instance, event.instanceId);
      }
    }
  };

  const handlePointerOver = (event: any) => {
    if (onInstanceHover && event.instanceId !== undefined) {
      const visibleInstances = instances.filter((i) => i.visible);
      const instance = visibleInstances[event.instanceId];
      if (instance) {
        onInstanceHover(instance, event.instanceId);
      }
    }
  };

  const handlePointerOut = () => {
    if (onInstanceHover) {
      onInstanceHover(null, null);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, visibleCount]}
      onClick={handleClick as any}
      onPointerOver={handlePointerOver as any}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    />
  );
}

// ============== NON-INSTANCED CLONES ==============

interface ClonedObjectsProps {
  instances: ClonerInstance[];
  children: React.ReactNode;
  onInstanceClick?: (instance: ClonerInstance, index: number) => void;
  onInstanceHover?: (instance: ClonerInstance | null, index: number | null) => void;
}

function ClonedObjects({
  instances,
  children,
  onInstanceClick,
  onInstanceHover,
}: ClonedObjectsProps) {
  return (
    <group>
      {instances
        .filter((instance) => instance.visible)
        .map((instance, i) => (
          <group
            key={instance.id}
            position={instance.position}
            rotation={instance.rotation}
            scale={instance.scale}
            onClick={(e) => {
              e.stopPropagation();
              onInstanceClick?.(instance, i);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onInstanceHover?.(instance, i);
            }}
            onPointerOut={() => onInstanceHover?.(null, null)}
          >
            {children}
          </group>
        ))}
    </group>
  );
}

// ============== MAIN COMPONENT ==============

export function Cloner3D({
  cloner,
  sourceGeometry,
  sourceMaterial,
  children,
  onInstanceClick,
  onInstanceHover,
}: Cloner3DProps) {
  // Calculate instances from config
  const rawInstances = useMemo(
    () => calculateClonerInstances(cloner.config),
    [cloner.config]
  );

  // Apply effectors
  const instances = useMemo(
    () => applyEffectors(rawInstances, cloner.effectors || []),
    [rawInstances, cloner.effectors]
  );

  if (!cloner.enabled) {
    return null;
  }

  // Use GPU instancing if enabled and geometry/material provided
  if (cloner.useInstancing && sourceGeometry && sourceMaterial) {
    return (
      <InstancedMesh
        instances={instances}
        geometry={sourceGeometry}
        material={sourceMaterial}
        onInstanceClick={onInstanceClick}
        onInstanceHover={onInstanceHover}
      />
    );
  }

  // Otherwise, clone children for each instance
  if (children) {
    return (
      <ClonedObjects
        instances={instances}
        onInstanceClick={onInstanceClick}
        onInstanceHover={onInstanceHover}
      >
        {children}
      </ClonedObjects>
    );
  }

  return null;
}

// ============== CLONER MANAGER ==============

interface ClonerManagerProps {
  cloners: Cloner[];
  sourceObjects?: Record<string, {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material;
    children?: React.ReactNode;
  }>;
  onInstanceClick?: (clonerId: string, instance: ClonerInstance, index: number) => void;
  onInstanceHover?: (clonerId: string | null, instance: ClonerInstance | null, index: number | null) => void;
}

export function ClonerManager({
  cloners,
  sourceObjects = {},
  onInstanceClick,
  onInstanceHover,
}: ClonerManagerProps) {
  return (
    <group name="cloner-manager">
      {cloners.map((cloner) => {
        const source = sourceObjects[cloner.sourceObjectId];

        return (
          <Cloner3D
            key={cloner.id}
            cloner={cloner}
            sourceGeometry={source?.geometry}
            sourceMaterial={source?.material}
            onInstanceClick={(instance, index) =>
              onInstanceClick?.(cloner.id, instance, index)
            }
            onInstanceHover={(instance, index) =>
              onInstanceHover?.(cloner.id, instance, index)
            }
          >
            {source?.children}
          </Cloner3D>
        );
      })}
    </group>
  );
}

// ============== PREVIEW COMPONENTS ==============

interface ClonerPreviewProps {
  config: Cloner['config'];
  effectors?: ClonerEffector[];
  previewMaterial?: THREE.Material;
}

export function ClonerPreview({ config, effectors = [], previewMaterial }: ClonerPreviewProps) {
  const rawInstances = useMemo(() => calculateClonerInstances(config), [config]);
  const instances = useMemo(
    () => applyEffectors(rawInstances, effectors),
    [rawInstances, effectors]
  );

  const defaultMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4A90D9',
        transparent: true,
        opacity: 0.6,
        wireframe: false,
      }),
    []
  );

  const previewGeometry = useMemo(() => new THREE.BoxGeometry(0.2, 0.2, 0.2), []);

  return (
    <group name="cloner-preview">
      {instances
        .filter((i) => i.visible)
        .map((instance) => (
          <mesh
            key={instance.id}
            position={instance.position}
            rotation={instance.rotation}
            scale={instance.scale}
            geometry={previewGeometry}
            material={previewMaterial || defaultMaterial}
          />
        ))}
    </group>
  );
}

// ============== HELPER HOOKS ==============

export function useClonerInstances(cloner: Cloner): ClonerInstance[] {
  return useMemo(() => {
    const rawInstances = calculateClonerInstances(cloner.config);
    return applyEffectors(rawInstances, cloner.effectors || []);
  }, [cloner.config, cloner.effectors]);
}

export function useClonerStats(cloner: Cloner): {
  totalInstances: number;
  visibleInstances: number;
  boundingBox: { min: [number, number, number]; max: [number, number, number] };
} {
  const instances = useClonerInstances(cloner);

  return useMemo(() => {
    const visible = instances.filter((i) => i.visible);

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const instance of instances) {
      minX = Math.min(minX, instance.position[0]);
      minY = Math.min(minY, instance.position[1]);
      minZ = Math.min(minZ, instance.position[2]);
      maxX = Math.max(maxX, instance.position[0]);
      maxY = Math.max(maxY, instance.position[1]);
      maxZ = Math.max(maxZ, instance.position[2]);
    }

    return {
      totalInstances: instances.length,
      visibleInstances: visible.length,
      boundingBox: {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      },
    };
  }, [instances]);
}

export default Cloner3D;
