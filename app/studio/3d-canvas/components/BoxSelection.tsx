'use client';

/**
 * BoxSelection - Marquee/Box selection for 3D objects
 *
 * Click and drag on empty canvas to draw selection box.
 * All objects within the box are selected on mouse up.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSelection } from '../r3f/SceneSelectionContext';

interface BoxSelectionProps {
  enabled?: boolean;
}

export function BoxSelection({ enabled = true }: BoxSelectionProps) {
  const { camera, gl, scene } = useThree();
  const {
    setSelectedObject,
    selectedObjects,
    addedObjects,
    r3fScene,
    toggleSelection,
    deselectAll
  } = useSelection();

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Get the canvas DOM element
  const canvas = gl.domElement;

  // Check if click is on an object
  const isClickOnObject = useCallback((event: MouseEvent): boolean => {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Get all meshes in scene
    const meshes: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, true);
    return intersects.length > 0;
  }, [camera, scene, canvas]);

  // Get objects within selection box
  const getObjectsInBox = useCallback((start: { x: number; y: number }, end: { x: number; y: number }): THREE.Object3D[] => {
    const rect = canvas.getBoundingClientRect();

    // Normalize box coordinates
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const selectedMeshes: THREE.Object3D[] = [];

    // Get all meshes and check if their screen position is within the box
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      // Skip grid, helpers, and other non-selectable objects
      if (child.name.includes('grid') || child.name.includes('helper')) return;
      if (child.userData?.isHelper) return;

      // Get the object's world position
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);

      // Project to screen space
      const screenPos = worldPos.clone().project(camera);

      // Convert to pixel coordinates
      const screenX = ((screenPos.x + 1) / 2) * rect.width + rect.left;
      const screenY = ((-screenPos.y + 1) / 2) * rect.height + rect.top;

      // Check if within selection box
      if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
        // Add the top-level selectable object (not child meshes)
        let selectableParent: THREE.Object3D = child;

        // Walk up to find the "root" object that should be selected
        while (selectableParent.parent) {
          // Stop at scene level or if parent is the scene itself
          if (selectableParent.parent === scene || selectableParent.parent.type === 'Scene') {
            break;
          }
          // Stop if this is a named object (likely the intended selection target)
          if (selectableParent.name && selectableParent.userData?.id) {
            break;
          }
          selectableParent = selectableParent.parent;
        }

        // Avoid duplicates
        if (!selectedMeshes.includes(selectableParent)) {
          selectedMeshes.push(selectableParent);
        }
      }
    });

    return selectedMeshes;
  }, [camera, scene, canvas]);

  // Mouse event handlers
  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (event: MouseEvent) => {
      // Only handle left mouse button
      if (event.button !== 0) return;

      // Don't start box selection if clicking on an object
      if (isClickOnObject(event)) return;

      // Don't start if user is holding space (pan mode) or alt
      if (event.altKey || event.metaKey) return;

      setStartPoint({ x: event.clientX, y: event.clientY });
      setEndPoint({ x: event.clientX, y: event.clientY });
      setIsSelecting(true);

      // Deselect all if not holding shift
      if (!event.shiftKey) {
        deselectAll();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isSelecting) return;
      setEndPoint({ x: event.clientX, y: event.clientY });
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isSelecting || !startPoint || !endPoint) {
        setIsSelecting(false);
        return;
      }

      // Check if there's meaningful drag distance
      const dragDistance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
      );

      if (dragDistance > 10) {
        // Get objects in selection box
        const objects = getObjectsInBox(startPoint, endPoint);

        console.log(`📦 Box selection: Found ${objects.length} objects`);

        // Select all objects found
        objects.forEach((obj) => {
          toggleSelection(obj);
        });

        // Set the first one as the primary selection
        if (objects.length > 0) {
          setSelectedObject(objects[0]);
        }
      }

      setIsSelecting(false);
      setStartPoint(null);
      setEndPoint(null);
    };

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, isSelecting, startPoint, endPoint, isClickOnObject, getObjectsInBox, toggleSelection, setSelectedObject, deselectAll, canvas]);

  // Render selection box overlay (outside of R3F)
  useEffect(() => {
    if (!isSelecting || !startPoint || !endPoint) {
      // Remove box if exists
      if (boxRef.current) {
        boxRef.current.remove();
        boxRef.current = null;
      }
      return;
    }

    // Create or update selection box
    if (!boxRef.current) {
      boxRef.current = document.createElement('div');
      boxRef.current.style.position = 'fixed';
      boxRef.current.style.border = '1px solid rgba(91, 164, 207, 0.8)';
      boxRef.current.style.backgroundColor = 'rgba(91, 164, 207, 0.1)';
      boxRef.current.style.pointerEvents = 'none';
      boxRef.current.style.zIndex = '1000';
      document.body.appendChild(boxRef.current);
    }

    const minX = Math.min(startPoint.x, endPoint.x);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxY = Math.max(startPoint.y, endPoint.y);

    boxRef.current.style.left = `${minX}px`;
    boxRef.current.style.top = `${minY}px`;
    boxRef.current.style.width = `${maxX - minX}px`;
    boxRef.current.style.height = `${maxY - minY}px`;

    return () => {
      if (boxRef.current && !isSelecting) {
        boxRef.current.remove();
        boxRef.current = null;
      }
    };
  }, [isSelecting, startPoint, endPoint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (boxRef.current) {
        boxRef.current.remove();
        boxRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything in the 3D scene
  return null;
}
