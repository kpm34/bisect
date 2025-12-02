'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion-3d';
import { useSelection, SceneObject } from '../r3f/SceneSelectionContext';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Gltf, Detailed } from '@react-three/drei';
import { RiggedAsset } from './RiggedAsset';
import { ParametricObject } from './ParametricObject';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============== EVENT TYPES ==============

interface EventTrigger {
  type: string;
  key?: string;
  delay?: number;
}

interface EventAction {
  type: string;
  value?: any;
  duration?: number;
  easing?: string;
  relative?: boolean;
  // For conditional actions
  condition?: {
    variable: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'isTrue' | 'isFalse';
    compareValue?: any;
  };
  // For sound actions
  soundUrl?: string;
  volume?: number;
  // For lookAt/follow actions
  targetId?: string;
  smooth?: number;
}

interface SceneEvent {
  id: string;
  name: string;
  enabled: boolean;
  trigger: EventTrigger;
  actions: EventAction[];
}

// ============== EASING FUNCTIONS ==============

const easingFunctions: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// ============== ANIMATION STATE ==============

interface AnimatingValue {
  startValue: THREE.Vector3 | THREE.Color | number;
  endValue: THREE.Vector3 | THREE.Color | number;
  startTime: number;
  duration: number;
  easing: string;
  property: 'position' | 'rotation' | 'scale' | 'color';
}

// ============== COMPONENT ==============

interface InteractiveObjectProps {
  obj: SceneObject;
  children: React.ReactNode;
}

export function InteractiveObject({ obj, children }: InteractiveObjectProps) {
  const { setSelectedObject, updateObject, removeObject, playSound, getVariable, addedObjects } = useSelection();
  const { camera, gl } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // LookAt / Follow state
  const [lookAtTarget, setLookAtTarget] = useState<THREE.Vector3 | null>(null);
  const [followTarget, setFollowTarget] = useState<{ id: string; smooth: number } | null>(null);

  // Animation state
  const [animations, setAnimations] = useState<AnimatingValue[]>([]);
  const [localPosition, setLocalPosition] = useState(new THREE.Vector3(...obj.position));
  const [localRotation, setLocalRotation] = useState(new THREE.Euler(...obj.rotation));
  const [localScale, setLocalScale] = useState(new THREE.Vector3(...obj.scale));
  const [localColor, setLocalColor] = useState(new THREE.Color(obj.color));
  const [visible, setVisible] = useState(true);

  // Check if condition is met for conditional actions
  const checkCondition = useCallback((condition: EventAction['condition']): boolean => {
    if (!condition) return true; // No condition means always execute

    const variable = getVariable(condition.variable);
    if (!variable) {
      console.warn(`Variable "${condition.variable}" not found`);
      return false;
    }

    const value = variable.value;
    const compareValue = condition.compareValue;

    switch (condition.operator) {
      case 'equals':
        return value === compareValue;
      case 'notEquals':
        return value !== compareValue;
      case 'greaterThan':
        return typeof value === 'number' && value > compareValue;
      case 'lessThan':
        return typeof value === 'number' && value < compareValue;
      case 'isTrue':
        return value === true;
      case 'isFalse':
        return value === false;
      default:
        return true;
    }
  }, [getVariable]);

  // Get events - support both old and new format
  const getEvents = useCallback((): SceneEvent[] => {
    // New format (sceneEvents)
    if ((obj as any).sceneEvents) {
      return (obj as any).sceneEvents;
    }
    // Old format - convert to new
    if (obj.events && obj.events.length > 0) {
      return obj.events.map(e => ({
        id: e.id,
        name: `${e.trigger} → ${e.action}`,
        enabled: true,
        trigger: { type: e.trigger === 'click' ? 'mouseClick' : e.trigger === 'hover' ? 'mouseHover' : e.trigger },
        actions: [{
          type: e.action,
          value: e.parameters,
          duration: 300,
          easing: 'easeOut',
          relative: true,
        }]
      }));
    }
    return [];
  }, [obj]);

  // Execute a single action
  const executeAction = useCallback((action: EventAction) => {
    const duration = action.duration || 300;
    const easing = action.easing || 'easeOut';
    const startTime = performance.now();

    switch (action.type) {
      case 'move': {
        const delta = action.value || { x: 0, y: 0, z: 0 };
        const endPos = action.relative
          ? new THREE.Vector3(
              localPosition.x + (delta.x || 0),
              localPosition.y + (delta.y || 0),
              localPosition.z + (delta.z || 0)
            )
          : new THREE.Vector3(delta.x || 0, delta.y || 0, delta.z || 0);

        setAnimations(prev => [...prev, {
          startValue: localPosition.clone(),
          endValue: endPos,
          startTime,
          duration,
          easing,
          property: 'position',
        }]);
        break;
      }

      case 'rotate': {
        const delta = action.value || { x: 0, y: 0, z: 0 };
        const degToRad = Math.PI / 180;
        const endRot = action.relative
          ? new THREE.Vector3(
              localRotation.x + (delta.x || 0) * degToRad,
              localRotation.y + (delta.y || 0) * degToRad,
              localRotation.z + (delta.z || 0) * degToRad
            )
          : new THREE.Vector3(
              (delta.x || 0) * degToRad,
              (delta.y || 0) * degToRad,
              (delta.z || 0) * degToRad
            );

        setAnimations(prev => [...prev, {
          startValue: new THREE.Vector3(localRotation.x, localRotation.y, localRotation.z),
          endValue: endRot,
          startTime,
          duration,
          easing,
          property: 'rotation',
        }]);
        break;
      }

      case 'scale': {
        const delta = action.value || { x: 1, y: 1, z: 1 };
        const endScale = action.relative
          ? new THREE.Vector3(
              localScale.x * (delta.x || 1),
              localScale.y * (delta.y || 1),
              localScale.z * (delta.z || 1)
            )
          : new THREE.Vector3(delta.x || 1, delta.y || 1, delta.z || 1);

        setAnimations(prev => [...prev, {
          startValue: localScale.clone(),
          endValue: endScale,
          startTime,
          duration,
          easing,
          property: 'scale',
        }]);
        break;
      }

      case 'setColor': {
        const newColor = new THREE.Color(action.value || '#ffffff');
        setAnimations(prev => [...prev, {
          startValue: localColor.clone(),
          endValue: newColor,
          startTime,
          duration,
          easing,
          property: 'color',
        }]);
        break;
      }

      case 'randomColor': {
        const newColor = new THREE.Color(Math.random() * 0xffffff);
        setLocalColor(newColor);
        updateObject(obj.id, { color: '#' + newColor.getHexString() });
        break;
      }

      case 'show':
        setVisible(true);
        break;

      case 'hide':
        setVisible(false);
        break;

      case 'toggle':
        setVisible(prev => !prev);
        break;

      case 'destroy':
        removeObject(obj.id);
        break;

      case 'applyForce': {
        if (rigidBodyRef.current) {
          const force = action.value || { x: 0, y: 5, z: 0 };
          rigidBodyRef.current.applyImpulse(
            { x: force.x || 0, y: force.y || 0, z: force.z || 0 },
            true
          );
        }
        break;
      }

      case 'resetTransform':
        setLocalPosition(new THREE.Vector3(...obj.position));
        setLocalRotation(new THREE.Euler(...obj.rotation));
        setLocalScale(new THREE.Vector3(...obj.scale));
        break;

      // ============== NEW ACTIONS ==============

      case 'playSound': {
        const url = action.soundUrl || action.value;
        const volume = action.volume ?? 1;
        if (url) {
          playSound(url, volume);
        } else {
          console.warn('No sound URL provided for playSound action');
        }
        break;
      }

      case 'lookAt': {
        // Look at a target object or the camera
        const targetId = action.targetId || action.value;
        if (targetId === 'camera') {
          // Look at camera (continuously updated in useFrame)
          setLookAtTarget(null); // Will use camera position in useFrame
        } else if (targetId) {
          // Look at specific object
          const targetObj = addedObjects.find(o => o.id === targetId);
          if (targetObj) {
            setLookAtTarget(new THREE.Vector3(...targetObj.position));
          }
        }
        break;
      }

      case 'follow': {
        // Follow a target object or cursor
        const targetId = action.targetId || action.value;
        const smooth = action.smooth ?? 0.1;
        if (targetId === 'cursor') {
          setFollowTarget({ id: 'cursor', smooth });
        } else if (targetId) {
          setFollowTarget({ id: targetId, smooth });
        }
        break;
      }

      case 'setState': {
        // Change to a different state (for state-based animation)
        const stateName = action.value as string;
        if (stateName && obj.states) {
          const targetState = obj.states.find(s => s.name === stateName);
          if (targetState) {
            // Animate to new state properties
            if (targetState.properties.position) {
              const endPos = new THREE.Vector3(...targetState.properties.position);
              setAnimations(prev => [...prev, {
                startValue: localPosition.clone(),
                endValue: endPos,
                startTime: performance.now(),
                duration,
                easing,
                property: 'position',
              }]);
            }
            if (targetState.properties.rotation) {
              const endRot = new THREE.Vector3(...targetState.properties.rotation);
              setAnimations(prev => [...prev, {
                startValue: new THREE.Vector3(localRotation.x, localRotation.y, localRotation.z),
                endValue: endRot,
                startTime: performance.now(),
                duration,
                easing,
                property: 'rotation',
              }]);
            }
            if (targetState.properties.scale) {
              const endScale = new THREE.Vector3(...targetState.properties.scale);
              setAnimations(prev => [...prev, {
                startValue: localScale.clone(),
                endValue: endScale,
                startTime: performance.now(),
                duration,
                easing,
                property: 'scale',
              }]);
            }
            if (targetState.properties.color) {
              const newColor = new THREE.Color(targetState.properties.color);
              setAnimations(prev => [...prev, {
                startValue: localColor.clone(),
                endValue: newColor,
                startTime: performance.now(),
                duration,
                easing,
                property: 'color',
              }]);
            }
            if (targetState.properties.visible !== undefined) {
              setVisible(targetState.properties.visible);
            }
            // Update currentState
            updateObject(obj.id, { currentState: stateName });
          }
        }
        break;
      }

      case 'stopFollow':
        setFollowTarget(null);
        break;

      case 'stopLookAt':
        setLookAtTarget(null);
        break;

      default:
        console.log(`Action "${action.type}" not implemented yet`);
    }
  }, [localPosition, localRotation, localScale, localColor, obj, updateObject, removeObject, playSound, addedObjects]);

  // Execute all actions for enabled events with matching trigger
  const executeTrigger = useCallback((triggerType: string, extraData?: any) => {
    const events = getEvents();

    events.forEach(event => {
      if (!event.enabled) return;

      let matches = false;

      // Check if trigger matches
      if (event.trigger.type === triggerType) {
        matches = true;

        // Special handling for keyboard events
        if ((triggerType === 'keyDown' || triggerType === 'keyUp') && event.trigger.key) {
          matches = extraData?.key?.toUpperCase() === event.trigger.key.toUpperCase();
        }

        // Special handling for scroll events
        if (triggerType === 'scroll' && extraData?.scrollDelta !== undefined) {
          // Pass scroll delta to actions that might need it
        }
      }

      if (matches) {
        // Execute all actions with optional delay
        const delay = event.trigger.delay || 0;

        setTimeout(() => {
          event.actions.forEach(action => {
            // Check condition before executing
            if (checkCondition(action.condition)) {
              executeAction(action);
            }
          });
        }, delay);
      }
    });
  }, [getEvents, executeAction, checkCondition]);

  // Animation frame - interpolate values + handle lookAt/follow
  useFrame((state) => {
    // Handle lookAt
    if (lookAtTarget && groupRef.current) {
      groupRef.current.lookAt(lookAtTarget);
    }

    // Handle follow
    if (followTarget && groupRef.current) {
      let targetPosition: THREE.Vector3 | null = null;

      if (followTarget.id === 'cursor') {
        // Follow cursor in 3D space (project to plane at object's Z)
        const mouse = state.pointer;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, state.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -localPosition.z);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        if (intersection) {
          targetPosition = intersection;
        }
      } else {
        // Follow another object
        const targetObj = addedObjects.find(o => o.id === followTarget.id);
        if (targetObj) {
          targetPosition = new THREE.Vector3(...targetObj.position);
        }
      }

      if (targetPosition) {
        // Smooth follow
        const newPos = localPosition.clone().lerp(targetPosition, followTarget.smooth);
        setLocalPosition(newPos);
      }
    }

    if (animations.length === 0) return;

    const now = performance.now();
    const completedIndices: number[] = [];

    animations.forEach((anim, index) => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = easingFunctions[anim.easing]?.(progress) || progress;

      if (anim.property === 'position' && anim.startValue instanceof THREE.Vector3 && anim.endValue instanceof THREE.Vector3) {
        const newPos = new THREE.Vector3().lerpVectors(anim.startValue, anim.endValue, easedProgress);
        setLocalPosition(newPos);
        if (progress >= 1) {
          updateObject(obj.id, { position: [newPos.x, newPos.y, newPos.z] });
        }
      } else if (anim.property === 'rotation' && anim.startValue instanceof THREE.Vector3 && anim.endValue instanceof THREE.Vector3) {
        const newRot = new THREE.Vector3().lerpVectors(anim.startValue, anim.endValue, easedProgress);
        setLocalRotation(new THREE.Euler(newRot.x, newRot.y, newRot.z));
        if (progress >= 1) {
          updateObject(obj.id, { rotation: [newRot.x, newRot.y, newRot.z] });
        }
      } else if (anim.property === 'scale' && anim.startValue instanceof THREE.Vector3 && anim.endValue instanceof THREE.Vector3) {
        const newScale = new THREE.Vector3().lerpVectors(anim.startValue, anim.endValue, easedProgress);
        setLocalScale(newScale);
        if (progress >= 1) {
          updateObject(obj.id, { scale: [newScale.x, newScale.y, newScale.z] });
        }
      } else if (anim.property === 'color' && anim.startValue instanceof THREE.Color && anim.endValue instanceof THREE.Color) {
        const newColor = new THREE.Color().lerpColors(anim.startValue, anim.endValue, easedProgress);
        setLocalColor(newColor);
        if (progress >= 1) {
          updateObject(obj.id, { color: '#' + newColor.getHexString() });
        }
      }

      if (progress >= 1) {
        completedIndices.push(index);
      }
    });

    // Remove completed animations
    if (completedIndices.length > 0) {
      setAnimations(prev => prev.filter((_, i) => !completedIndices.includes(i)));
    }
  });

  // Start event - execute on mount
  useEffect(() => {
    executeTrigger('start');
  }, []);

  // Timer complete events
  useEffect(() => {
    const events = getEvents();
    const timerEvents = events.filter(e => e.enabled && e.trigger.type === 'timerComplete');

    const timers = timerEvents.map(event => {
      const delay = event.trigger.delay || 1000;
      return setTimeout(() => {
        event.actions.forEach(action => executeAction(action));
      }, delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [getEvents, executeAction]);

  // Keyboard events
  useEffect(() => {
    const events = getEvents();
    const hasKeyEvents = events.some(e =>
      e.enabled && (e.trigger.type === 'keyDown' || e.trigger.type === 'keyUp')
    );

    if (!hasKeyEvents) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      executeTrigger('keyDown', { key: e.key });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      executeTrigger('keyUp', { key: e.key });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [getEvents, executeTrigger]);

  // Scroll events
  useEffect(() => {
    const events = getEvents();
    const hasScrollEvents = events.some(e => e.enabled && e.trigger.type === 'scroll');

    if (!hasScrollEvents) return;

    const handleScroll = (e: WheelEvent) => {
      executeTrigger('scroll', {
        scrollDelta: e.deltaY,
        scrollDirection: e.deltaY > 0 ? 'down' : 'up',
      });
    };

    // Listen on the canvas element
    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      canvas.removeEventListener('wheel', handleScroll);
    };
  }, [getEvents, executeTrigger, gl]);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<THREE.Vector3 | null>(null);
  const lastClickTime = useRef<number>(0);
  const DOUBLE_CLICK_THRESHOLD = 300; // ms

  // Pointer handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (!isHovered) {
      setIsHovered(true);
      document.body.style.cursor = 'pointer';
      executeTrigger('mouseHover');
      executeTrigger('mouseEnter'); // New event
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    if (isHovered) {
      setIsHovered(false);
      document.body.style.cursor = 'auto';
      executeTrigger('mouseLeave'); // New event
    }
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    executeTrigger('mouseDown');

    // Start drag tracking
    dragStartPos.current = localPosition.clone();

    // Check for right-click
    if (e.button === 2) {
      executeTrigger('rightClick');
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    executeTrigger('mouseUp');

    // End drag if was dragging
    if (isDragging) {
      setIsDragging(false);
      executeTrigger('dragEnd', {
        startPosition: dragStartPos.current,
        endPosition: localPosition.clone(),
        delta: dragStartPos.current ? localPosition.clone().sub(dragStartPos.current) : new THREE.Vector3(),
      });
      dragStartPos.current = null;
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();

    // Start drag if pointer is down and moved enough
    if (dragStartPos.current && !isDragging) {
      const currentPos = localPosition.clone();
      const distance = currentPos.distanceTo(dragStartPos.current);
      if (distance > 0.01) {
        setIsDragging(true);
        executeTrigger('dragStart', {
          startPosition: dragStartPos.current,
        });
      }
    }

    // Fire drag event while dragging
    if (isDragging) {
      executeTrigger('drag', {
        startPosition: dragStartPos.current,
        currentPosition: localPosition.clone(),
        delta: dragStartPos.current ? localPosition.clone().sub(dragStartPos.current) : new THREE.Vector3(),
      });
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();

    // Don't trigger click if we were dragging
    if (isDragging) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Check for double-click
    if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
      executeTrigger('doubleClick');
      lastClickTime.current = 0; // Reset to prevent triple-click registering
    } else {
      setSelectedObject(e.object);
      executeTrigger('mouseClick');
      lastClickTime.current = now;
    }
  };

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    executeTrigger('contextMenu');
    executeTrigger('rightClick'); // Also trigger rightClick on context menu
  };

  // Calculate Framer Motion variants for hover/click visual feedback
  const events = getEvents();
  const hoverScaleEvent = events.find(e => e.enabled && e.trigger.type === 'mouseHover' && e.actions.some(a => a.type === 'scale'));
  const clickScaleEvent = events.find(e => e.enabled && e.trigger.type === 'mouseClick' && e.actions.some(a => a.type === 'scale'));

  const variants = {
    initial: { scale: 1 },
    hover: hoverScaleEvent ? { scale: 1.05 } : {},
    click: clickScaleEvent ? { scale: 0.95 } : {},
  };

  if (!visible) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      key={obj.id}
      type={obj.physics.enabled ? (obj.physics.type as any) : 'fixed'}
      colliders={obj.type === 'plane' ? 'hull' : 'cuboid'}
      position={[localPosition.x, localPosition.y, localPosition.z]}
      rotation={[localRotation.x, localRotation.y, localRotation.z]}
      scale={[localScale.x, localScale.y, localScale.z]}
      mass={obj.physics.mass}
      restitution={obj.physics.restitution}
      friction={obj.physics.friction}
      onCollisionEnter={() => executeTrigger('collision')}
    >
      <motion.group
        initial="initial"
        animate={isHovered ? 'hover' : 'initial'}
        whileTap={clickScaleEvent ? 'click' : undefined}
        variants={variants}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {obj.type === 'external' && obj.url ? (
          obj.lod?.enabled && obj.lod.levels.length > 0 ? (
            <Detailed distances={obj.lod.levels.map((l: any) => l.distance)}>
              {obj.lod.levels.map((level: any, index: number) => (
                <RiggedAsset key={index} url={level.url} animation={obj.animation} />
              ))}
            </Detailed>
          ) : (
            <RiggedAsset url={obj.url} animation={obj.animation} />
          )
        ) : obj.type === 'parametric' && obj.formula ? (
          <ParametricObject
            formula={obj.formula}
            uRange={obj.formula.uRange}
            vRange={obj.formula.vRange}
          />
        ) : (
          // Clone children to inject color
          React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === 'mesh') {
              return React.cloneElement(child as React.ReactElement<any>, {
                ref: meshRef,
                children: React.Children.map((child as React.ReactElement<any>).props.children, grandchild => {
                  if (React.isValidElement(grandchild) &&
                      (grandchild.type === 'meshStandardMaterial' || grandchild.type === 'meshPhysicalMaterial')) {
                    return React.cloneElement(grandchild as React.ReactElement<any>, {
                      color: '#' + localColor.getHexString(),
                    });
                  }
                  return grandchild;
                }),
              });
            }
            return child;
          })
        )}
      </motion.group>
    </RigidBody>
  );
}
