/**
 * useVariableAnimations Hook
 *
 * Maps scene variables to object properties for creating data-driven animations.
 * Supports both real-time (immediate) and triggered (animated) updates.
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Object3D, Color, Euler, Vector3 } from 'three';
import { SceneVariable } from '../r3f/SceneSelectionContext';

// ============== ANIMATION TYPES ==============

export type AnimatableProperty =
  | 'position.x' | 'position.y' | 'position.z'
  | 'rotation.x' | 'rotation.y' | 'rotation.z'
  | 'scale.x' | 'scale.y' | 'scale.z'
  | 'scale.uniform'  // Uniform scaling (x=y=z)
  | 'opacity'
  | 'color.r' | 'color.g' | 'color.b'
  | 'color.hue' | 'color.saturation' | 'color.lightness'
  | 'visible';

export type EasingType =
  | 'linear'
  | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
  | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  | 'easeInElastic' | 'easeOutElastic' | 'easeInOutElastic'
  | 'easeInBounce' | 'easeOutBounce' | 'easeInOutBounce';

export type AnimationMode = 'realtime' | 'onTrigger';

export interface VariableAnimation {
  id: string;
  variableId: string;
  objectId: string;           // UUID or name of the target object
  property: AnimatableProperty;

  // Value mapping
  inputRange: [number, number];    // Variable value range
  outputRange: [number, number];   // Property value range

  // Animation behavior
  mode: AnimationMode;
  easing: EasingType;
  duration: number;            // ms, only used for onTrigger mode
  clamp: boolean;              // Clamp output to outputRange
}

// ============== EASING FUNCTIONS ==============

const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeInOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    t *= 2;
    if (t < 1) return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  },

  easeInBounce: (t) => 1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  easeInOutBounce: (t) =>
    t < 0.5
      ? easingFunctions.easeInBounce(t * 2) * 0.5
      : easingFunctions.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
};

// ============== UTILITY FUNCTIONS ==============

/**
 * Map a value from one range to another
 */
function mapRange(
  value: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  clamp: boolean = false
): number {
  const normalized = (value - inputMin) / (inputMax - inputMin);
  const mapped = normalized * (outputMax - outputMin) + outputMin;

  if (clamp) {
    return Math.min(Math.max(mapped, Math.min(outputMin, outputMax)), Math.max(outputMin, outputMax));
  }
  return mapped;
}

/**
 * Get the current value of a property from an object
 */
function getPropertyValue(object: Object3D, property: AnimatableProperty): number {
  const [prop, axis] = property.split('.') as [string, string | undefined];

  switch (prop) {
    case 'position':
      return axis ? object.position[axis as 'x' | 'y' | 'z'] : 0;
    case 'rotation':
      return axis ? object.rotation[axis as 'x' | 'y' | 'z'] : 0;
    case 'scale':
      if (axis === 'uniform') return object.scale.x;
      return axis ? object.scale[axis as 'x' | 'y' | 'z'] : 1;
    case 'visible':
      return object.visible ? 1 : 0;
    case 'opacity':
      // Try to get opacity from the first material
      const mesh = object as any;
      if (mesh.material?.opacity !== undefined) {
        return mesh.material.opacity;
      }
      return 1;
    case 'color':
      const colorMesh = object as any;
      if (colorMesh.material?.color) {
        const color = colorMesh.material.color as Color;
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        switch (axis) {
          case 'r': return color.r;
          case 'g': return color.g;
          case 'b': return color.b;
          case 'hue': return hsl.h;
          case 'saturation': return hsl.s;
          case 'lightness': return hsl.l;
        }
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Set a property value on an object
 */
function setPropertyValue(object: Object3D, property: AnimatableProperty, value: number): void {
  const [prop, axis] = property.split('.') as [string, string | undefined];

  switch (prop) {
    case 'position':
      if (axis) object.position[axis as 'x' | 'y' | 'z'] = value;
      break;
    case 'rotation':
      if (axis) object.rotation[axis as 'x' | 'y' | 'z'] = value;
      break;
    case 'scale':
      if (axis === 'uniform') {
        object.scale.set(value, value, value);
      } else if (axis) {
        object.scale[axis as 'x' | 'y' | 'z'] = value;
      }
      break;
    case 'visible':
      object.visible = value > 0.5;
      break;
    case 'opacity':
      const mesh = object as any;
      if (mesh.material) {
        mesh.material.opacity = value;
        mesh.material.transparent = value < 1;
      }
      break;
    case 'color':
      const colorMesh = object as any;
      if (colorMesh.material?.color) {
        const color = colorMesh.material.color as Color;
        if (axis === 'r' || axis === 'g' || axis === 'b') {
          color[axis] = value;
        } else if (axis === 'hue' || axis === 'saturation' || axis === 'lightness') {
          const hsl = { h: 0, s: 0, l: 0 };
          color.getHSL(hsl);
          hsl[axis === 'hue' ? 'h' : axis === 'saturation' ? 's' : 'l'] = value;
          color.setHSL(hsl.h, hsl.s, hsl.l);
        }
      }
      break;
  }
}

// ============== ANIMATION STATE ==============

interface AnimationState {
  startValue: number;
  targetValue: number;
  startTime: number;
  duration: number;
  easing: EasingType;
}

// ============== HOOK OPTIONS ==============

interface UseVariableAnimationsOptions {
  variables: SceneVariable[];
  animations: VariableAnimation[];
  findObject: (id: string) => Object3D | null;
  onAnimationComplete?: (animationId: string) => void;
}

// ============== MAIN HOOK ==============

export function useVariableAnimations({
  variables,
  animations,
  findObject,
  onAnimationComplete,
}: UseVariableAnimationsOptions) {
  // Track active triggered animations
  const activeAnimationsRef = useRef<Map<string, AnimationState>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Memoize variable values for change detection
  const variableValues = useMemo(() => {
    const map = new Map<string, boolean | number | string>();
    variables.forEach(v => map.set(v.id, v.value));
    return map;
  }, [variables]);

  // Previous values for detecting changes
  const prevValuesRef = useRef<Map<string, boolean | number | string>>(new Map());

  /**
   * Apply real-time animations immediately
   */
  const applyRealtimeAnimations = useCallback(() => {
    for (const animation of animations) {
      if (animation.mode !== 'realtime') continue;

      const variable = variables.find(v => v.id === animation.variableId);
      if (!variable || typeof variable.value !== 'number') continue;

      const object = findObject(animation.objectId);
      if (!object) continue;

      const mappedValue = mapRange(
        variable.value,
        animation.inputRange[0],
        animation.inputRange[1],
        animation.outputRange[0],
        animation.outputRange[1],
        animation.clamp
      );

      setPropertyValue(object, animation.property, mappedValue);
    }
  }, [animations, variables, findObject]);

  /**
   * Trigger an animated transition for onTrigger animations
   */
  const triggerAnimation = useCallback((animationId: string) => {
    const animation = animations.find(a => a.id === animationId);
    if (!animation || animation.mode !== 'onTrigger') return;

    const variable = variables.find(v => v.id === animation.variableId);
    if (!variable || typeof variable.value !== 'number') return;

    const object = findObject(animation.objectId);
    if (!object) return;

    const currentValue = getPropertyValue(object, animation.property);
    const targetValue = mapRange(
      variable.value,
      animation.inputRange[0],
      animation.inputRange[1],
      animation.outputRange[0],
      animation.outputRange[1],
      animation.clamp
    );

    activeAnimationsRef.current.set(animationId, {
      startValue: currentValue,
      targetValue,
      startTime: performance.now(),
      duration: animation.duration,
      easing: animation.easing,
    });
  }, [animations, variables, findObject]);

  /**
   * Animation loop for triggered animations
   */
  const updateTriggeredAnimations = useCallback(() => {
    const now = performance.now();
    const completedAnimations: string[] = [];

    activeAnimationsRef.current.forEach((state, animationId) => {
      const animation = animations.find(a => a.id === animationId);
      if (!animation) {
        completedAnimations.push(animationId);
        return;
      }

      const object = findObject(animation.objectId);
      if (!object) {
        completedAnimations.push(animationId);
        return;
      }

      const elapsed = now - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);
      const easedProgress = easingFunctions[state.easing](progress);

      const currentValue = state.startValue + (state.targetValue - state.startValue) * easedProgress;
      setPropertyValue(object, animation.property, currentValue);

      if (progress >= 1) {
        completedAnimations.push(animationId);
      }
    });

    // Clean up completed animations
    completedAnimations.forEach(id => {
      activeAnimationsRef.current.delete(id);
      onAnimationComplete?.(id);
    });

    // Continue animation loop if there are active animations
    if (activeAnimationsRef.current.size > 0) {
      animationFrameRef.current = requestAnimationFrame(updateTriggeredAnimations);
    }
  }, [animations, findObject, onAnimationComplete]);

  /**
   * Detect variable changes and trigger animations
   */
  useEffect(() => {
    // Check for changed variables
    variables.forEach(variable => {
      const prevValue = prevValuesRef.current.get(variable.id);
      const currentValue = variable.value;

      if (prevValue !== currentValue) {
        // Trigger onTrigger animations for this variable
        animations
          .filter(a => a.variableId === variable.id && a.mode === 'onTrigger')
          .forEach(a => triggerAnimation(a.id));
      }
    });

    // Update previous values
    prevValuesRef.current = new Map(variableValues);

    // Apply real-time animations
    applyRealtimeAnimations();

    // Start animation loop if needed
    if (activeAnimationsRef.current.size > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateTriggeredAnimations);
    }
  }, [variableValues, animations, triggerAnimation, applyRealtimeAnimations, updateTriggeredAnimations]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    triggerAnimation,
    activeAnimations: activeAnimationsRef.current.size,
  };
}

// ============== HELPER EXPORTS ==============

export { mapRange, easingFunctions };
export default useVariableAnimations;
