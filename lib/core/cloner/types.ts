/**
 * Cloner/Instancing Types
 *
 * Types for creating arrays, patterns, and distributions of 3D objects
 */

// ============== CLONER MODES ==============

export type ClonerMode = 'linear' | 'radial' | 'grid' | 'scatter' | 'spline' | 'object';

// ============== LINEAR CLONER ==============

export interface LinearClonerConfig {
  mode: 'linear';
  count: number;
  direction: 'x' | 'y' | 'z' | 'custom';
  customDirection?: [number, number, number];
  spacing: number;
  offset: [number, number, number];
  // Progressive transforms
  scaleProgression?: number; // Scale change per instance (e.g., 0.9 = 90% of previous)
  rotationProgression?: [number, number, number]; // Rotation added per instance (degrees)
  colorProgression?: {
    startColor: string;
    endColor: string;
    mode: 'linear' | 'hsv';
  };
}

// ============== RADIAL CLONER ==============

export interface RadialClonerConfig {
  mode: 'radial';
  count: number;
  radius: number;
  startAngle: number; // In degrees
  endAngle: number; // In degrees (360 = full circle)
  plane: 'xy' | 'xz' | 'yz';
  alignToRadius: boolean; // Rotate instances to face outward
  // Spiral options
  spiral?: {
    enabled: boolean;
    heightPerRevolution: number;
    radiusGrowth: number; // Radius change per revolution
  };
  // Progressive transforms
  scaleProgression?: number;
  rotationProgression?: [number, number, number];
}

// ============== GRID CLONER ==============

export interface GridClonerConfig {
  mode: 'grid';
  countX: number;
  countY: number;
  countZ: number;
  spacingX: number;
  spacingY: number;
  spacingZ: number;
  // Center the grid at origin
  centered: boolean;
  // Shape masks
  shape?: 'box' | 'sphere' | 'cylinder' | 'custom';
  customMask?: (x: number, y: number, z: number) => boolean;
  // Progressive transforms
  scaleVariation?: number; // Random scale variation (0-1)
  rotationVariation?: [number, number, number]; // Max random rotation (degrees)
}

// ============== SCATTER CLONER ==============

export interface ScatterClonerConfig {
  mode: 'scatter';
  count: number;
  // Distribution area
  distribution: 'box' | 'sphere' | 'surface';
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  boundingSphere?: {
    center: [number, number, number];
    radius: number;
  };
  surfaceObjectId?: string; // Scatter on another object's surface
  // Randomization
  seed: number;
  minScale: number;
  maxScale: number;
  uniformScale: boolean; // Use same scale for all axes
  randomRotation: boolean;
  alignToSurface?: boolean; // Align normals to surface (for surface scatter)
  // Collision avoidance
  avoidOverlap?: boolean;
  minDistance?: number;
}

// ============== SPLINE CLONER ==============

export interface SplineClonerConfig {
  mode: 'spline';
  count: number;
  splinePoints: Array<[number, number, number]>;
  splineType: 'catmullrom' | 'bezier' | 'linear';
  tension?: number; // For catmull-rom
  alignToSpline: boolean; // Orient instances along spline
  distributeEvenly: boolean; // Even spacing vs parametric
  // Progressive transforms
  scaleProgression?: number;
}

// ============== OBJECT CLONER ==============

export interface ObjectClonerConfig {
  mode: 'object';
  sourceObjectId: string; // Clone to vertices/faces/edges of another object
  target: 'vertices' | 'faces' | 'edges';
  alignToNormal: boolean;
  scale: number;
  // Filtering
  useSelection?: boolean; // Only use selected vertices/faces
  skipEvery?: number; // Skip every N elements
  randomSkip?: number; // Probability to skip (0-1)
}

// ============== UNION TYPE ==============

export type ClonerConfig =
  | LinearClonerConfig
  | RadialClonerConfig
  | GridClonerConfig
  | ScatterClonerConfig
  | SplineClonerConfig
  | ObjectClonerConfig;

// ============== CLONER INSTANCE ==============

export interface ClonerInstance {
  id: string;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  visible: boolean;
}

// ============== CLONER OBJECT ==============

export interface Cloner {
  id: string;
  name: string;
  sourceObjectId: string; // The object being cloned
  config: ClonerConfig;
  instances: ClonerInstance[];
  enabled: boolean;
  useInstancing: boolean; // GPU instancing for performance
  // Effector options
  effectors?: ClonerEffector[];
}

// ============== EFFECTORS ==============

export type EffectorType = 'falloff' | 'random' | 'step' | 'noise' | 'target';

export interface BaseEffector {
  id: string;
  name: string;
  enabled: boolean;
  strength: number; // 0-1
  affects: {
    position: boolean;
    rotation: boolean;
    scale: boolean;
    color: boolean;
    visibility: boolean;
  };
}

export interface FalloffEffector extends BaseEffector {
  type: 'falloff';
  shape: 'linear' | 'spherical' | 'box' | 'cylindrical';
  center: [number, number, number];
  radius: number;
  falloffCurve: 'linear' | 'smooth' | 'sharp';
  invert: boolean;
}

export interface RandomEffector extends BaseEffector {
  type: 'random';
  seed: number;
  positionRange: [number, number, number];
  rotationRange: [number, number, number];
  scaleRange: [number, number];
  uniformScale: boolean;
}

export interface StepEffector extends BaseEffector {
  type: 'step';
  stepSize: number;
  offset: number;
  spline?: Array<[number, number]>; // Custom falloff curve
}

export interface NoiseEffector extends BaseEffector {
  type: 'noise';
  noiseType: 'perlin' | 'simplex' | 'worley';
  frequency: number;
  octaves: number;
  amplitude: number;
  animationSpeed?: number;
}

export interface TargetEffector extends BaseEffector {
  type: 'target';
  targetPosition: [number, number, number];
  influenceRadius: number;
  attractionStrength: number; // Positive = attract, negative = repel
}

export type ClonerEffector =
  | FalloffEffector
  | RandomEffector
  | StepEffector
  | NoiseEffector
  | TargetEffector;
