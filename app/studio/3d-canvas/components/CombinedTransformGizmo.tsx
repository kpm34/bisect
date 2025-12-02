'use client';

/**
 * CombinedTransformGizmo - Blender-style combined transform gizmo
 *
 * Shows both translate arrows AND rotation rings simultaneously
 * - RGB colored axes (X=Red, Y=Green, Z=Blue)
 * - Arrows for translation
 * - Rings/arcs for rotation
 * - Click and drag to transform
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSelection } from '../r3f/SceneSelectionContext';

// Constants - Subtle, professional gizmo styling
const AXIS_COLORS = {
  x: 0xe53935, // Softer Red
  y: 0x43a047, // Softer Green
  z: 0x1e88e5, // Softer Blue
};

const GIZMO_SCALE = 1.0; // Reduced from 1.5
const ARROW_LENGTH = 0.8; // Reduced from 1.0
const ARROW_HEAD_LENGTH = 0.15; // Reduced from 0.2
const ARROW_HEAD_RADIUS = 0.05; // Reduced from 0.08
const ARROW_SHAFT_RADIUS = 0.015; // Reduced from 0.025
const RING_RADIUS = 0.65; // Reduced from 0.85
const RING_TUBE = 0.012; // Reduced from 0.02
const DEFAULT_OPACITY = 0.5; // More transparent by default
const HOVER_OPACITY = 0.85;

interface DragState {
  active: boolean;
  axis: 'x' | 'y' | 'z' | null;
  mode: 'translate' | 'rotate' | null;
  startPosition: THREE.Vector3;
  startRotation: THREE.Euler;
  startMouse: THREE.Vector2;
  plane: THREE.Plane;
}

export function CombinedTransformGizmo() {
  const { selectedObject, setPosition, setRotation, selectionVersion } = useSelection();
  const { camera, gl, raycaster, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    active: false,
    axis: null,
    mode: null,
    startPosition: new THREE.Vector3(),
    startRotation: new THREE.Euler(),
    startMouse: new THREE.Vector2(),
    plane: new THREE.Plane(),
  });

  // Track object position to update gizmo
  const [gizmoPosition, setGizmoPosition] = useState(new THREE.Vector3());

  // Update gizmo position when selected object moves
  useFrame(() => {
    if (selectedObject && groupRef.current) {
      // Get world position of selected object
      const worldPos = new THREE.Vector3();
      selectedObject.getWorldPosition(worldPos);
      groupRef.current.position.copy(worldPos);

      // Scale gizmo based on camera distance for consistent screen size
      const distance = camera.position.distanceTo(worldPos);
      const scale = distance * 0.15 * GIZMO_SCALE;
      groupRef.current.scale.setScalar(Math.max(scale, 0.5));
    }
  });

  // Create arrow geometry for translation axes
  const arrowGeometry = useMemo(() => {
    const group = new THREE.Group();

    // Shaft (cylinder)
    const shaftGeo = new THREE.CylinderGeometry(
      ARROW_SHAFT_RADIUS,
      ARROW_SHAFT_RADIUS,
      ARROW_LENGTH - ARROW_HEAD_LENGTH,
      8
    );
    shaftGeo.translate(0, (ARROW_LENGTH - ARROW_HEAD_LENGTH) / 2, 0);

    // Head (cone)
    const headGeo = new THREE.ConeGeometry(
      ARROW_HEAD_RADIUS,
      ARROW_HEAD_LENGTH,
      12
    );
    headGeo.translate(0, ARROW_LENGTH - ARROW_HEAD_LENGTH / 2, 0);

    return { shaft: shaftGeo, head: headGeo };
  }, []);

  // Create ring geometry for rotation
  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 8, 64);
  }, []);

  // Handle pointer events
  useEffect(() => {
    const canvas = gl.domElement;

    const getMousePosition = (event: PointerEvent): THREE.Vector2 => {
      const rect = canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!groupRef.current || !selectedObject) return;

      const mouse = getMousePosition(event);

      if (dragState.active && dragState.axis && dragState.mode) {
        // Calculate drag delta
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);

        const planeIntersect = new THREE.Vector3();
        ray.ray.intersectPlane(dragState.plane, planeIntersect);

        if (dragState.mode === 'translate') {
          // Translation
          const startIntersect = new THREE.Vector3();
          const startRay = new THREE.Raycaster();
          startRay.setFromCamera(dragState.startMouse, camera);
          startRay.ray.intersectPlane(dragState.plane, startIntersect);

          const delta = planeIntersect.clone().sub(startIntersect);

          // Project delta onto the axis
          const axisVector = new THREE.Vector3(
            dragState.axis === 'x' ? 1 : 0,
            dragState.axis === 'y' ? 1 : 0,
            dragState.axis === 'z' ? 1 : 0
          );

          const projectedDelta = axisVector.multiplyScalar(delta.dot(axisVector));
          const newPos = dragState.startPosition.clone().add(projectedDelta);

          selectedObject.position.copy(newPos);
          setPosition(newPos.x, newPos.y, newPos.z);
        } else if (dragState.mode === 'rotate') {
          // Rotation
          const objectPos = new THREE.Vector3();
          selectedObject.getWorldPosition(objectPos);

          // Calculate angle based on mouse movement around the ring
          const startVec = new THREE.Vector2(
            dragState.startMouse.x,
            dragState.startMouse.y
          );
          const currentVec = new THREE.Vector2(mouse.x, mouse.y);

          // Calculate rotation angle
          const angle = (currentVec.x - startVec.x) * Math.PI * 2;

          const newRotation = dragState.startRotation.clone();
          if (dragState.axis === 'x') newRotation.x += angle;
          if (dragState.axis === 'y') newRotation.y += angle;
          if (dragState.axis === 'z') newRotation.z += angle;

          selectedObject.rotation.copy(newRotation);
          setRotation(newRotation.x, newRotation.y, newRotation.z);
        }
      } else {
        // Hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(groupRef.current, true);

        if (intersects.length > 0) {
          const name = intersects[0].object.name;
          setHovered(name);
          canvas.style.cursor = 'pointer';
        } else {
          setHovered(null);
          canvas.style.cursor = 'auto';
        }
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!groupRef.current || !selectedObject || !hovered) return;
      if (event.button !== 0) return; // Only left click

      const mouse = getMousePosition(event);

      // Parse hovered name to get axis and mode
      const [mode, axis] = hovered.split('-') as ['translate' | 'rotate', 'x' | 'y' | 'z'];

      if (!mode || !axis) return;

      // Get object position
      const objectPos = new THREE.Vector3();
      selectedObject.getWorldPosition(objectPos);

      // Create drag plane based on axis and camera position
      let planeNormal: THREE.Vector3;

      if (mode === 'translate') {
        // For translation, use a plane perpendicular to the camera but containing the axis
        const cameraDir = camera.position.clone().sub(objectPos).normalize();
        const axisVec = new THREE.Vector3(
          axis === 'x' ? 1 : 0,
          axis === 'y' ? 1 : 0,
          axis === 'z' ? 1 : 0
        );
        planeNormal = cameraDir.clone().cross(axisVec).cross(axisVec).normalize();
      } else {
        // For rotation, use the axis as the plane normal
        planeNormal = new THREE.Vector3(
          axis === 'x' ? 1 : 0,
          axis === 'y' ? 1 : 0,
          axis === 'z' ? 1 : 0
        );
      }

      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, objectPos);

      setDragState({
        active: true,
        axis,
        mode,
        startPosition: selectedObject.position.clone(),
        startRotation: selectedObject.rotation.clone(),
        startMouse: mouse,
        plane,
      });

      canvas.style.cursor = 'grabbing';
      event.stopPropagation();
    };

    const handlePointerUp = () => {
      if (dragState.active) {
        setDragState(prev => ({ ...prev, active: false, axis: null, mode: null }));
        canvas.style.cursor = 'auto';
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [camera, gl, raycaster, selectedObject, hovered, dragState, setPosition, setRotation]);

  // Don't render if nothing selected
  if (!selectedObject) return null;

  const getAxisColor = (axis: 'x' | 'y' | 'z', name: string) => {
    const baseColor = AXIS_COLORS[axis];
    const isHovered = hovered === name;
    const isDragging = dragState.active && dragState.axis === axis;

    if (isDragging || isHovered) {
      return 0xffff00; // Yellow when active/hovered
    }
    return baseColor;
  };

  return (
    <group ref={groupRef}>
      {/* TRANSLATION ARROWS */}
      {(['x', 'y', 'z'] as const).map((axis) => {
        const rotation = new THREE.Euler(
          axis === 'z' ? Math.PI / 2 : 0,
          0,
          axis === 'x' ? -Math.PI / 2 : 0
        );
        const name = `translate-${axis}`;
        const color = getAxisColor(axis, name);
        const isActive = hovered === name || (dragState.active && dragState.axis === axis);

        return (
          <group key={`arrow-${axis}`} rotation={rotation}>
            {/* Shaft */}
            <mesh name={name} geometry={arrowGeometry.shaft}>
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isActive ? HOVER_OPACITY : DEFAULT_OPACITY}
              />
            </mesh>
            {/* Head */}
            <mesh name={name} geometry={arrowGeometry.head}>
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isActive ? HOVER_OPACITY : DEFAULT_OPACITY}
              />
            </mesh>
          </group>
        );
      })}

      {/* ROTATION RINGS - Each ring is perpendicular to its axis */}
      {/* Torus is created in XY plane by default (flat when looking down Z) */}
      {/* X ring (red): ring in YZ plane → rotate 90° around Y */}
      {/* Y ring (green): ring in XZ plane (horizontal) → rotate 90° around X */}
      {/* Z ring (blue): ring in XY plane (default) → no rotation */}
      {(['x', 'y', 'z'] as const).map((axis) => {
        let rotation: THREE.Euler;
        if (axis === 'x') {
          // YZ plane: rotate 90° around Y axis
          rotation = new THREE.Euler(0, Math.PI / 2, 0);
        } else if (axis === 'y') {
          // XZ plane (horizontal): rotate 90° around X axis
          rotation = new THREE.Euler(Math.PI / 2, 0, 0);
        } else {
          // XY plane (default): no rotation
          rotation = new THREE.Euler(0, 0, 0);
        }

        const name = `rotate-${axis}`;
        const color = getAxisColor(axis, name);
        const isActive = hovered === name || (dragState.active && dragState.axis === axis);

        return (
          <mesh
            key={`ring-${axis}`}
            name={name}
            rotation={rotation}
            geometry={ringGeometry}
          >
            <meshBasicMaterial
              color={color}
              transparent
              opacity={isActive ? HOVER_OPACITY : DEFAULT_OPACITY}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Center sphere - smaller and more subtle */}
      <mesh>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default CombinedTransformGizmo;
