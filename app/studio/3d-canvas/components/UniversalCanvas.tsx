'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { UniversalEditor } from '@/lib/core/adapters';
import { useSelection } from '../r3f/SceneSelectionContext';
import { useSceneSession } from '@/hooks/useSceneSession';
import { useSceneHistory } from '@/hooks/useSceneHistory';
import SelectionOutline from '../r3f/SceneSelectionOutline';
import GlitchLoader from './GlitchLoader';

interface UniversalCanvasProps {
  sceneFile: File | null;
  onFileUpload: (file: File) => void;
  onUnloadScene?: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setIsSceneReady: (ready: boolean) => void;
}

function SceneRenderer({ file, onSceneReady }: { file: File; onSceneReady: (ready: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<UniversalEditor | null>(null);
  const { setUniversalEditor, setSelectedObject, selectedObject } = useSelection();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; objectPos: { x: number; y: number; z: number } } | null>(null);
  const isMountedRef = useRef(true);

  // Persistence hooks
  const { session, isRestoring, recordEdit } = useSceneSession(file, editorRef.current, {
    onRestore: (result) => {
      if (result.success) {
        console.info(`✅ Session restored: ${result.editsApplied} edits applied`);
      } else {
        console.warn(`⚠️ Failed to restore session: ${result.error}`);
      }
    },
  });

  const { canUndo, canRedo, undo, redo } = useSceneHistory(session, editorRef.current, {
    onUndo: (delta) => {
      console.info(`↩️ Undo: ${delta.property} on ${delta.objectName}`);
    },
    onRedo: (delta) => {
      console.info(`↪️ Redo: ${delta.property} on ${delta.objectName}`);
    },
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!canvasRef.current) return;

    // If no file, clear the editor and selection
    if (!file) {
      console.log('🧹 Clearing scene (no file provided)');
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      if (isMountedRef.current) {
        setUniversalEditor(null);
        setSelectedObject(null);
        onSceneReady(false);
      }
      return;
    }

    const loadScene = async () => {
      try {
        if (!isMountedRef.current) return;
        setLoadError(null);

        // Dispose of previous editor before loading new scene
        if (editorRef.current) {
          console.log('🧹 Disposing previous editor before loading new scene');
          editorRef.current.dispose();
          editorRef.current = null;
          if (isMountedRef.current) {
            setUniversalEditor(null);
            setSelectedObject(null);
          }
        }

        if (!isMountedRef.current || !canvasRef.current) return;

        // Create new editor
        const editor = new UniversalEditor();
        editorRef.current = editor;

        console.log(`🎯 Loading ${file.name}...`);

        // Load scene with progress tracking
        setIsLoading(true);
        setLoadingProgress(0);

        await editor.load(file, canvasRef.current, {
          onProgress: (progress) => {
            if (isMountedRef.current) {
              const roundedProgress = Math.round(progress);
              console.log(`📦 Loading: ${roundedProgress}%`);
              setLoadingProgress(roundedProgress);
            }
          },
          onError: (error) => {
            if (isMountedRef.current) {
              console.error('❌ Load error:', error);
              setLoadError(error.message);
              setIsLoading(false);
            }
          },
        });

        // Check if still mounted before setting state
        if (!isMountedRef.current) {
          editor.dispose();
          return;
        }

        // Expose editor to SelectionContext
        setUniversalEditor(editor);

        console.log('✅ Scene loaded successfully!');

        // Try to get scene info (may not be available for all scene types)
        try {
          const sceneInfo = editor.getSceneInfo?.();
          if (sceneInfo) {
            console.log('📊 Scene Info:', sceneInfo);
          }
        } catch (error) {
          console.warn('⚠️ Could not get scene info:', error);
        }

        // Disable default camera controls (left-click drag) - lock canvas
        const adapter = editor.getAdapter();
        if (adapter) {
          const format = adapter.getFormat();
          if (format === 'spline') {
            const app = (adapter as any).app;
            if (app && (app as any).pauseGameControls) {
              (app as any).pauseGameControls();
              console.log('🔒 Canvas locked: Left-click camera controls disabled (use right-click to move camera)');
            }
          } else if (format === 'gltf' || format === 'glb') {
            // Disable OrbitControls for GLB/GLTF
            const gltfAdapter = adapter as any;
            const controls = gltfAdapter.getControls?.() || gltfAdapter.controls;
            if (controls) {
              controls.enabled = false;
              console.log('🔒 Canvas locked: Left-click camera controls disabled (use right-click to move camera)');
            }
          }
        }

        // Notify parent that scene is ready
        if (isMountedRef.current) {
          setIsLoading(false);
          setLoadingProgress(100);
          onSceneReady(true);
        }

        // Auto-discover all objects
        const objects = editor.getAllObjects();
        if (objects.length > 0 && isMountedRef.current) {
          console.log('📦 Scene Objects Available:');
          objects.forEach((obj) => {
            console.log(`  ├─ ${obj.name} (ID: ${obj.uuid || (obj as any).id})`);
          });

          console.log('\n💡 Try these commands:');
          const firstObj = objects[0].name;
          if (firstObj) {
            console.log(`  • select ${firstObj.toLowerCase()}`);
            console.log(`  • make it red`);
            console.log(`  • roughness 0.8`);
            console.log(`  • move to 0 5 0`);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('❌ Failed to load scene:', error);
          setLoadError((error as Error).message);
        }
      }
    };

    loadScene();

    // Cleanup when component unmounts or file changes
    return () => {
      isMountedRef.current = false;
      if (editorRef.current) {
        console.log('🧹 Cleaning up editor on unmount/file change');
        editorRef.current.dispose();
        editorRef.current = null;
        // Don't set state in cleanup - component might be unmounting
      }
    };
  }, [file, setUniversalEditor, setSelectedObject]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && editorRef.current) {
        const adapter = editorRef.current.getAdapter();
        if (adapter && 'handleResize' in adapter && typeof adapter.handleResize === 'function') {
          adapter.handleResize(
            canvasRef.current.clientWidth,
            canvasRef.current.clientHeight
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click selection with raycasting
  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorRef.current || !canvasRef.current) {
      console.warn('⚠️ Canvas click: Editor or canvas not available');
      return;
    }

    // Don't select if we just finished dragging (prevent accidental selection after drag)
    if (isDragging) {
      console.log('⏭️ Canvas click: Skipping selection (drag in progress)');
      return;
    }

    // Check if this was a drag (mouse moved significantly)
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      const dragThreshold = 5; // pixels
      
      if (dx > dragThreshold || dy > dragThreshold) {
        console.log('⏭️ Canvas click: Skipping selection (was a drag)');
        dragStartRef.current = null;
        return;
      }
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('🖱️ Canvas click: Performing raycast...', { x, y });

    try {
      // Perform raycasting (now async)
      const intersected = await editorRef.current.raycast(x, y);

      if (intersected) {
        console.log('✅ Canvas: Selected', intersected.name, 'UUID:', (intersected as any).uuid);
        setSelectedObject(intersected);
      } else {
        console.log('⚪ Canvas: Deselected (clicked background or no intersection)');
        setSelectedObject(null);
      }
    } catch (error) {
      console.error('❌ Canvas click: Raycast failed', error);
      // Still allow deselection on error
      setSelectedObject(null);
    }

    // Clear drag start ref after handling click
    dragStartRef.current = null;
  };

  // Handle mouse down - start drag OR allow selection
  const handleMouseDown = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorRef.current || !canvasRef.current) {
      console.log('❌ Cannot handle mouse down: missing editor/canvas');
      return;
    }
    if (e.button !== 0) return; // Only left mouse button
    
    // CRITICAL: Prevent OrbitControls from handling left-click
    // Stop propagation to ensure camera controls don't interfere
    e.stopPropagation();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Check what we clicked on
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const intersected = await editorRef.current.raycast(x, y);

    // If we have a selected object and clicked on it, start dragging
    if (selectedObject && intersected) {
      const isClickingSelectedObject = (intersected as any).uuid === (selectedObject as any).uuid;
      
      if (isClickingSelectedObject) {
        console.log('✅ Starting drag on', selectedObject.name);
        e.preventDefault(); // Prevent text selection
        e.stopPropagation(); // Prevent click event
        
        // Get current position from the object - refresh from editor to ensure we have latest
        const currentObj = editorRef.current.findObjectById((selectedObject as any).uuid);
        const pos = currentObj?.position || selectedObject.position;
        
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          objectPos: {
            x: pos.x,
            y: pos.y,
            z: pos.z,
          },
        };
        canvas.style.cursor = 'grabbing';
        return; // Don't proceed to selection
      }
    }

    // If clicking on a different object (or no object selected), let click handler select it
    // Don't prevent default/stop propagation here - let onClick handle selection
    console.log('🎯 MouseDown: Will allow click selection', {
      intersected: intersected?.name,
      selected: selectedObject?.name,
    });
  };

  // Handle mouse move - drag object (use global mouse move for better tracking)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!editorRef.current || !canvasRef.current || !isDragging || !dragStartRef.current || !selectedObject) {
        return;
      }

      // Get adapter once at the top
      const adapter = editorRef.current.getAdapter();

      // Disable camera controls during drag (works for both GLB and Spline)
      if (adapter) {
        const format = adapter.getFormat();

        if (format === 'spline') {
          // Spline: Use public API to pause game controls
          const app = (adapter as any).app;
          if (app && (app as any).pauseGameControls) {
            (app as any).pauseGameControls();
          }
        } else if (format === 'gltf' || format === 'glb') {
          // GLB/GLTF: Disable OrbitControls
          const gltfAdapter = adapter as any;
          const controls = gltfAdapter.getControls?.() || gltfAdapter.controls;
          if (controls) {
            controls.enabled = false;
          }
        }
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate mouse delta in screen space
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Skip if movement is too small (prevents jitter)
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      // Convert screen delta to world space movement using camera plane
      if (adapter && 'camera' in adapter && adapter.camera) {
        const camera = adapter.camera as THREE.Camera;
        
        // Create a plane perpendicular to camera view direction at object's depth
        const objectWorldPos = new THREE.Vector3(
          dragStartRef.current.objectPos.x,
          dragStartRef.current.objectPos.y,
          dragStartRef.current.objectPos.z
        );

        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Create plane normal (camera forward)
        const planeNormal = cameraDirection.clone();
        const plane = new THREE.Plane(planeNormal, -planeNormal.dot(objectWorldPos));

        // Convert screen coordinates to world coordinates
        const mouse = new THREE.Vector2();
        const startMouse = new THREE.Vector2();
        
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        startMouse.x = ((dragStartRef.current.x - rect.left) / rect.width) * 2 - 1;
        startMouse.y = -((dragStartRef.current.y - rect.top) / rect.height) * 2 + 1;

        // Raycast from camera through mouse positions
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        const startRaycaster = new THREE.Raycaster();
        startRaycaster.setFromCamera(startMouse, camera);

        // Intersect with plane
        const intersection = new THREE.Vector3();
        const startIntersection = new THREE.Vector3();
        
        const hit1 = raycaster.ray.intersectPlane(plane, intersection);
        const hit2 = startRaycaster.ray.intersectPlane(plane, startIntersection);

        if (hit1 && hit2) {
          // Calculate movement delta
          const delta = new THREE.Vector3().subVectors(intersection, startIntersection);
          
          // Apply movement
          const newX = dragStartRef.current.objectPos.x + delta.x;
          const newY = dragStartRef.current.objectPos.y + delta.y;
          const newZ = dragStartRef.current.objectPos.z + delta.z;

          editorRef.current.setPosition(selectedObject.name, newX, newY, newZ);
        }
      } else {
        // Fallback: simple XY movement
        const moveSpeed = 0.01;
        const newX = dragStartRef.current.objectPos.x - deltaX * moveSpeed;
        const newY = dragStartRef.current.objectPos.y + deltaY * moveSpeed;
        const newZ = dragStartRef.current.objectPos.z;

        editorRef.current.setPosition(selectedObject.name, newX, newY, newZ);
      }
    };

    const handleGlobalMouseUp = () => {
      // DON'T re-enable camera controls here - canvas should stay locked
      // Camera controls are only enabled during right-click drag (handled separately)
      // This ensures canvas stays locked for left-click object dragging

      if (isDragging && canvasRef.current) {
        canvasRef.current.style.cursor = selectedObject ? 'grab' : 'pointer';
      }
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, selectedObject, editorRef, canvasRef]);

  // Handle mouse up - end drag
  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    const wasDragging = isDragging;
    
    if (wasDragging && canvasRef.current) {
      canvasRef.current.style.cursor = selectedObject ? 'grab' : 'pointer';
      // Prevent click event from firing after drag
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Small delay to prevent accidental selection after drag
      setTimeout(() => {
        setIsDragging(false);
      }, 50);
    } else {
      setIsDragging(false);
    }
    
    // Don't clear dragStartRef here - let click handler check it
    // dragStartRef.current = null;
  };

  // Keyboard controls for moving selected object
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current) return;

      const selectedObj = editorRef.current.getAllObjects().find(obj =>
        obj.uuid === (selectedObject as any)?.uuid
      );

      if (!selectedObj) return;

      // Don't move if typing in input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const moveSpeed = e.shiftKey ? 1.0 : 0.1; // Faster with Shift
      const currentPos = selectedObj.position;
      let moved = false;

      // Note: Gizmo removed - using drag-drop instead

      switch (e.key) {
        case 'ArrowUp':
          // Up arrow: Move up (+Y)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y + moveSpeed, currentPos.z);
          moved = true;
          break;
        case 'ArrowDown':
          // Down arrow: Move down (-Y)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y - moveSpeed, currentPos.z);
          moved = true;
          break;
        case 'ArrowLeft':
          // Left arrow: Move left (-X)
          editorRef.current.setPosition(selectedObj.name, currentPos.x - moveSpeed, currentPos.y, currentPos.z);
          moved = true;
          break;
        case 'ArrowRight':
          // Right arrow: Move right (+X)
          editorRef.current.setPosition(selectedObj.name, currentPos.x + moveSpeed, currentPos.y, currentPos.z);
          moved = true;
          break;
        case 'w':
        case 'W':
          // W: Move forward (+Z)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y, currentPos.z + moveSpeed);
          moved = true;
          break;
        case 's':
        case 'S':
          // S: Move back (-Z)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y, currentPos.z - moveSpeed);
          moved = true;
          break;
        case 'a':
        case 'A':
          // A: Move left (-X)
          editorRef.current.setPosition(selectedObj.name, currentPos.x - moveSpeed, currentPos.y, currentPos.z);
          moved = true;
          break;
        case 'd':
        case 'D':
          // D: Move right (+X)
          editorRef.current.setPosition(selectedObj.name, currentPos.x + moveSpeed, currentPos.y, currentPos.z);
          moved = true;
          break;
        case 'q':
        case 'Q':
          // Q: Move up (+Y)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y + moveSpeed, currentPos.z);
          moved = true;
          break;
        case 'e':
        case 'E':
          // E: Move down (-Y)
          editorRef.current.setPosition(selectedObj.name, currentPos.x, currentPos.y - moveSpeed, currentPos.z);
          moved = true;
          break;
      }

      if (moved) {
        e.preventDefault();
        console.log(`🎮 Moved ${selectedObj.name} to (${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)})`);
        // Force re-render of selection outline
        setSelectedObject({ ...selectedObject } as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  // Attach transform controls (3D gizmo) when object is selected
  useEffect(() => {
    if (!editorRef.current) return;

    if (selectedObject) {
      // Verify the object still exists in the scene before attaching
      const adapter = editorRef.current.getAdapter();
      if (adapter) {
        // Try to find the object by UUID to ensure it's still valid
        const objInScene = editorRef.current.findObjectById((selectedObject as any).uuid);
        if (objInScene) {
          // Attach transform controls to selected object
          editorRef.current.attachTransformControls(objInScene);
          console.info(`🎯 Transform controls attached to "${objInScene.name}" (format: ${adapter.getFormat()})`);
        } else {
          console.warn(`⚠️ Selected object "${selectedObject.name}" not found in scene, detaching transform controls`);
          editorRef.current.attachTransformControls(null);
        }
      } else {
        console.warn('⚠️ No adapter available, cannot attach transform controls');
      }
    } else {
      // Detach when nothing is selected
      editorRef.current.attachTransformControls(null);
      console.info('⚪ Transform controls detached');
    }
  }, [selectedObject]);

  // Track if camera controls are active (for cleanup on mouse release outside canvas)
  const cameraControlsActiveRef = useRef(false);

  // Handle mouse buttons for camera controls (right-click only)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right mouse button (button 2) only - for camera movement
    if (e.button === 2) {
      e.preventDefault(); // Prevent context menu and default behavior
      cameraControlsActiveRef.current = true;
      
      const adapter = editorRef.current?.getAdapter();
      if (adapter) {
        const format = adapter.getFormat();
        
        if (format === 'gltf' || format === 'glb') {
          // Enable OrbitControls for GLB
          const gltfAdapter = adapter as any;
          const controls = gltfAdapter.getControls?.() || gltfAdapter.controls;
          if (controls) {
            // CRITICAL: Re-apply mouseButtons and disable rotation to ensure LEFT stays disabled
            controls.mouseButtons = {
              LEFT: null,           // Keep left button disabled
              MIDDLE: THREE.MOUSE.DOLLY,  // Middle button for zooming
              RIGHT: THREE.MOUSE.PAN,     // Right button for panning
            };
            // Ensure rotation is disabled (left-click should never rotate)
            controls.enableRotate = false;
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.enabled = true;
            console.log('🎥 Camera controls enabled (Right-click) - LEFT button disabled, rotation disabled');
          }
        } else if (format === 'spline') {
          // Resume Spline game controls
          const app = (adapter as any).app;
          if (app && (app as any).resumeGameControls) {
            (app as any).resumeGameControls();
            console.log('🎥 Spline camera controls enabled (Right-click)');
          }
        }
      }
    } else if (e.button === 0) {
      // Left click - handle selection/drag only (no camera movement)
      handleMouseDown(e);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right mouse button (button 2) only
    if (e.button === 2) {
      disableCameraControls();
    } else if (e.button === 0) {
      // Left click - handle selection/drag
      handleMouseUp(e);
    }
  };

  // Function to disable camera controls (reusable)
  const disableCameraControls = useCallback(() => {
    if (!cameraControlsActiveRef.current) return;
    
    cameraControlsActiveRef.current = false;
    const adapter = editorRef.current?.getAdapter();
    if (adapter) {
      const format = adapter.getFormat();
      
      if (format === 'gltf' || format === 'glb') {
        // Disable OrbitControls for GLB
        const gltfAdapter = adapter as any;
        const controls = gltfAdapter.getControls?.() || gltfAdapter.controls;
        if (controls) {
          controls.enabled = false;
          console.log('🔒 Camera controls disabled (Right-click released)');
        }
      } else if (format === 'spline') {
        // Pause Spline game controls
        const app = (adapter as any).app;
        if (app && (app as any).pauseGameControls) {
          (app as any).pauseGameControls();
          console.log('🔒 Spline camera controls disabled (Right-click released)');
        }
      }
    }
  }, []);

  // Global mouse up handler to disable controls if mouse released outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Only handle right-click (button 2)
      if (e.button === 2) {
        disableCameraControls();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [disableCameraControls]);

  // Prevent context menu on right-click (we use it for camera control)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Right-click is handled by mouseDown/mouseUp handlers
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onContextMenu={handleContextMenu}
        className="w-full h-full cursor-pointer"
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : selectedObject ? 'grab' : 'pointer' }}
      />

      {/* Glitch Loading Animation */}
      {isLoading && (
        <GlitchLoader
          progress={loadingProgress}
          fileName={file.name}
          fileSize={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
        />
      )}

      {/* Selection Outline */}
      <SelectionOutline />

      {/* Transform Controls Hint */}
      {selectedObject && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-xs z-40 max-w-xs">
          <div className="font-semibold mb-2">🎯 Transform Object</div>
          <div className="space-y-1.5 text-gray-300">
            <div className="border-b border-gray-700 pb-1.5 mb-1.5">
              <div className="text-cyan-400 font-medium mb-1">Drag & Drop</div>
              <div>Click and drag the selected object to move it</div>
            </div>
            <div className="border-t border-gray-700 pt-1.5 mt-1.5">
              <div className="text-gray-400 font-medium mb-1">Keyboard Nudge</div>
              <div><kbd className="px-1 py-0.5 bg-gray-700 rounded">↑↓←→</kbd> or <kbd className="px-1 py-0.5 bg-gray-700 rounded">WASD</kbd> Move</div>
              <div><kbd className="px-1 py-0.5 bg-gray-700 rounded">Q/E</kbd> Up/Down</div>
              <div><kbd className="px-1 py-0.5 bg-gray-700 rounded">Shift</kbd> + keys = 10x speed</div>
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg z-50">
          <p className="font-semibold">Failed to load scene</p>
          <p className="text-sm mt-1">{loadError}</p>
        </div>
      )}

      {/* Restoring Session Indicator */}
      {isRestoring && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-gray-800/90 px-6 py-4 rounded-lg text-center">
            <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Restoring previous session...</p>
            <p className="text-gray-400 text-sm mt-1">
              {session?.edits.length || 0} edits found
            </p>
          </div>
        </div>
      )}

      {/* Undo/Redo Indicators - Hidden to reduce visual clutter */}
      {/* {session && (
        <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs z-40">
          <div className="flex items-center gap-3">
            <span className={canUndo ? 'text-cyan-400' : 'text-gray-600'}>
              Undo: Ctrl+Z
            </span>
            <span className="text-gray-600">|</span>
            <span className={canRedo ? 'text-cyan-400' : 'text-gray-600'}>
              Redo: Ctrl+Shift+Z
            </span>
          </div>
        </div>
      )} */}
    </div>
  );
}

// File type detector and icon component
function getFileInfo(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const formatMap: Record<string, { name: string; color: string; icon: string }> = {
    splinecode: { name: 'Spline Scene', color: 'bg-purple-600', icon: '🎨' },
    gltf: { name: 'GLTF Model', color: 'bg-green-600', icon: '📦' },
    glb: { name: 'GLB Model', color: 'bg-blue-600', icon: '🎁' },
  };
  return formatMap[ext] || { name: 'Unknown', color: 'bg-gray-600', icon: '📄' };
}

export default function UniversalCanvas({
  sceneFile,
  onFileUpload,
  onUnloadScene,
  isLoading,
  setIsLoading,
  setIsSceneReady,
}: UniversalCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [isValidFile, setIsValidFile] = useState(true);
  const [urlInput, setUrlInput] = useState('');

  const validateFile = (file: File): boolean => {
    const ext = file.name.toLowerCase().split('.').pop();
    return ext === 'splinecode' || ext === 'gltf' || ext === 'glb';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      onFileUpload(file);
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = urlInput.split('/').pop() || 'scene.splinecode';
      const file = new File([blob], filename, { type: blob.type });

      if (validateFile(file)) {
        onFileUpload(file);
        setUrlInput(''); // Clear input after successful load
      } else {
        alert(`Unsupported file type: ${filename}\n\nSupported formats:\n• Spline (.splinecode)\n• GLTF (.gltf, .glb)`);
      }
    } catch (error) {
      console.error('Failed to load from URL:', error);
      alert(`Failed to load file from URL:\n${(error as Error).message}`);
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  // Drag and Drop Handlers (component-level)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (Array.from(e.dataTransfer.types || []).includes('Files')) {
      const item = e.dataTransfer.items?.[0];
      const file = item?.kind === 'file' ? item.getAsFile() : null;
      if (file) {
        setDraggedFile(file);
        setIsValidFile(validateFile(file));
      }
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
      setDraggedFile(null);
      setIsValidFile(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setIsLoading(true);
      onFileUpload(file);
      setTimeout(() => setIsLoading(false), 2000);
    } else if (file) {
      alert(`Unsupported file type: ${file.name}\n\nSupported formats:\n• Spline (.splinecode)\n• GLTF (.gltf, .glb)`);
    }

    setDraggedFile(null);
    setIsValidFile(true);
  };

  // Global drag blockers (ensure the browser allows drop on our page)
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDragging(true);
      }
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    window.addEventListener('dragenter', handleWindowDragEnter);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
      window.removeEventListener('dragenter', handleWindowDragEnter);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Scene Canvas */}
      {sceneFile && <SceneRenderer file={sceneFile} onSceneReady={setIsSceneReady} />}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`relative flex flex-col items-center justify-center p-12 rounded-3xl border-4 border-dashed transition-all duration-300 ${
              isValidFile
                ? 'border-cyan-400 bg-cyan-900/30 scale-100'
                : 'border-red-400 bg-red-900/30 scale-95'
            }`}
          >
            {draggedFile && (
              <>
                <div className="text-8xl mb-6 animate-bounce">
                  {getFileInfo(draggedFile.name).icon}
                </div>
                <div
                  className={`px-6 py-2 rounded-full text-sm font-semibold mb-4 ${
                    getFileInfo(draggedFile.name).color
                  } text-white`}
                >
                  {getFileInfo(draggedFile.name).name}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{draggedFile.name}</h2>
                <p className="text-gray-300 text-lg mb-4">
                  {(draggedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {isValidFile ? (
                  <div className="flex items-center gap-2 text-cyan-400 text-lg font-medium">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Drop to load
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 text-lg font-medium">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Unsupported format
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Prompt (shown when no scene loaded) */}
      {!sceneFile && !isLoading && !isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0f1419] to-[#1a1d29]">
          <div className="text-center p-8 max-w-lg w-full">
            <div className="mb-6">
              <svg
                className="w-12 h-12 mx-auto text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <p className="text-gray-400 mb-6">
              Upload or Drag and Drop your file
            </p>

            <button
              onClick={triggerFileUpload}
              className="px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg font-medium transition-colors mb-6"
            >
              Choose File
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {/* URL Input */}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlLoad();
                }}
                placeholder="Paste URL to .splinecode, .gltf, or .glb file"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors"
              />
              <button
                onClick={handleUrlLoad}
                disabled={!urlInput.trim()}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Load from URL
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".splinecode,.gltf,.glb"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Loading scene...</p>
          </div>
        </div>
      )}

      {/* File Upload Button (top bar) - positioned to not overlap with hierarchy button */}
      {sceneFile && !isDragging && (
        <div className="absolute top-4 left-44 flex items-center gap-2 z-40">
          <button
            onClick={triggerFileUpload}
            className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm text-white rounded-lg text-sm font-medium transition-colors"
          >
            Load New Scene
          </button>
          {onUnloadScene && (
            <button
              onClick={onUnloadScene}
              className="px-4 py-2 bg-red-800/80 hover:bg-red-700/80 backdrop-blur-sm text-white rounded-lg text-sm font-medium transition-colors"
              title="Unload current scene"
            >
              Unload Scene
            </button>
          )}
          <span className="text-sm text-white/70 bg-gray-800/60 px-3 py-2 rounded-lg flex items-center gap-2">
            <span>{getFileInfo(sceneFile.name).icon}</span>
            {sceneFile.name}
          </span>
          <span className="text-xs text-gray-400 bg-gray-800/40 px-2 py-1 rounded">
            Saved
          </span>
        </div>
      )}
    </div>
  );
}
