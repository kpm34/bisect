'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion-3d';
import { useSelection, SceneObject } from '../r3f/SceneSelectionContext';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Gltf, Detailed } from '@react-three/drei';
import { RiggedAsset } from './RiggedAsset';
import { ParametricObject } from './ParametricObject';
import { useFrame } from '@react-three/fiber';
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
  const { setSelectedObject, updateObject, removeObject } = useSelection();
  const [isHovered, setIsHovered] = useState(false);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Animation state
  const [animations, setAnimations] = useState<AnimatingValue[]>([]);
  const [localPosition, setLocalPosition] = useState(new THREE.Vector3(...obj.position));
  const [localRotation, setLocalRotation] = useState(new THREE.Euler(...obj.rotation));
  const [localScale, setLocalScale] = useState(new THREE.Vector3(...obj.scale));
  const [localColor, setLocalColor] = useState(new THREE.Color(obj.color));
  const [visible, setVisible] = useState(true);

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

      default:
        console.log(`Action "${action.type}" not implemented yet`);
    }
  }, [localPosition, localRotation, localScale, localColor, obj, updateObject, removeObject]);

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
      }

      if (matches) {
        // Execute all actions with optional delay
        const delay = event.trigger.delay || 0;

        setTimeout(() => {
          event.actions.forEach(action => {
            executeAction(action);
          });
        }, delay);
      }
    });
  }, [getEvents, executeAction]);

  // Animation frame - interpolate values
  useFrame(() => {
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

  // Pointer handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
    executeTrigger('mouseHover');
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    executeTrigger('mouseDown');
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    executeTrigger('mouseUp');
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedObject(e.object);
    executeTrigger('mouseClick');
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
        onClick={handleClick}
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
