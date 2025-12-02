/**
 * Cloner Calculator
 *
 * Generates instance positions, rotations, and scales based on cloner configuration
 */

import type {
  ClonerConfig,
  ClonerInstance,
  LinearClonerConfig,
  RadialClonerConfig,
  GridClonerConfig,
  ScatterClonerConfig,
  SplineClonerConfig,
  ObjectClonerConfig,
  ClonerEffector,
  FalloffEffector,
  RandomEffector,
  NoiseEffector,
} from './types';

// ============== RANDOM UTILITIES ==============

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// Simple noise function (Perlin-like)
function noise3D(x: number, y: number, z: number, frequency: number): number {
  const fx = x * frequency;
  const fy = y * frequency;
  const fz = z * frequency;

  // Simple hash-based noise
  const hash = (n: number) => {
    const s = Math.sin(n) * 43758.5453123;
    return s - Math.floor(s);
  };

  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const iz = Math.floor(fz);

  const dx = fx - ix;
  const dy = fy - iy;
  const dz = fz - iz;

  // Smooth interpolation
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const n000 = hash(ix + iy * 57 + iz * 113);
  const n001 = hash(ix + iy * 57 + (iz + 1) * 113);
  const n010 = hash(ix + (iy + 1) * 57 + iz * 113);
  const n011 = hash(ix + (iy + 1) * 57 + (iz + 1) * 113);
  const n100 = hash((ix + 1) + iy * 57 + iz * 113);
  const n101 = hash((ix + 1) + iy * 57 + (iz + 1) * 113);
  const n110 = hash((ix + 1) + (iy + 1) * 57 + iz * 113);
  const n111 = hash((ix + 1) + (iy + 1) * 57 + (iz + 1) * 113);

  const sx = smooth(dx);
  const sy = smooth(dy);
  const sz = smooth(dz);

  const n00 = n000 * (1 - sx) + n100 * sx;
  const n01 = n001 * (1 - sx) + n101 * sx;
  const n10 = n010 * (1 - sx) + n110 * sx;
  const n11 = n011 * (1 - sx) + n111 * sx;

  const n0 = n00 * (1 - sy) + n10 * sy;
  const n1 = n01 * (1 - sy) + n11 * sy;

  return n0 * (1 - sz) + n1 * sz;
}

// ============== LINEAR CLONER ==============

export function calculateLinearInstances(config: LinearClonerConfig): ClonerInstance[] {
  const instances: ClonerInstance[] = [];

  // Get direction vector
  let dir: [number, number, number];
  switch (config.direction) {
    case 'x': dir = [1, 0, 0]; break;
    case 'y': dir = [0, 1, 0]; break;
    case 'z': dir = [0, 0, 1]; break;
    case 'custom': dir = config.customDirection || [1, 0, 0]; break;
  }

  // Normalize direction
  const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
  if (len > 0) {
    dir = [dir[0] / len, dir[1] / len, dir[2] / len];
  }

  for (let i = 0; i < config.count; i++) {
    const t = i / Math.max(config.count - 1, 1);

    // Calculate position
    const position: [number, number, number] = [
      dir[0] * config.spacing * i + config.offset[0],
      dir[1] * config.spacing * i + config.offset[1],
      dir[2] * config.spacing * i + config.offset[2],
    ];

    // Calculate progressive scale
    let scale: [number, number, number] = [1, 1, 1];
    if (config.scaleProgression !== undefined) {
      const s = Math.pow(config.scaleProgression, i);
      scale = [s, s, s];
    }

    // Calculate progressive rotation
    let rotation: [number, number, number] = [0, 0, 0];
    if (config.rotationProgression) {
      rotation = [
        config.rotationProgression[0] * i * (Math.PI / 180),
        config.rotationProgression[1] * i * (Math.PI / 180),
        config.rotationProgression[2] * i * (Math.PI / 180),
      ];
    }

    // Calculate color progression
    let color: string | undefined;
    if (config.colorProgression) {
      color = interpolateColor(
        config.colorProgression.startColor,
        config.colorProgression.endColor,
        t,
        config.colorProgression.mode
      );
    }

    instances.push({
      id: `linear-${i}`,
      index: i,
      position,
      rotation,
      scale,
      color,
      visible: true,
    });
  }

  return instances;
}

// ============== RADIAL CLONER ==============

export function calculateRadialInstances(config: RadialClonerConfig): ClonerInstance[] {
  const instances: ClonerInstance[] = [];

  const startRad = config.startAngle * (Math.PI / 180);
  const endRad = config.endAngle * (Math.PI / 180);
  const angleRange = endRad - startRad;

  for (let i = 0; i < config.count; i++) {
    const t = config.count > 1 ? i / (config.count - 1) : 0;
    const angle = startRad + angleRange * (i / config.count);

    // Calculate spiral offset if enabled
    let heightOffset = 0;
    let radiusOffset = 0;
    if (config.spiral?.enabled) {
      const revolutions = angleRange / (2 * Math.PI);
      heightOffset = config.spiral.heightPerRevolution * revolutions * t;
      radiusOffset = config.spiral.radiusGrowth * revolutions * t;
    }

    const radius = config.radius + radiusOffset;

    // Calculate position based on plane
    let position: [number, number, number];
    switch (config.plane) {
      case 'xy':
        position = [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          heightOffset,
        ];
        break;
      case 'xz':
        position = [
          Math.cos(angle) * radius,
          heightOffset,
          Math.sin(angle) * radius,
        ];
        break;
      case 'yz':
        position = [
          heightOffset,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
        ];
        break;
    }

    // Calculate rotation (align to radius if enabled)
    let rotation: [number, number, number] = [0, 0, 0];
    if (config.alignToRadius) {
      switch (config.plane) {
        case 'xy': rotation = [0, 0, angle]; break;
        case 'xz': rotation = [0, angle, 0]; break;
        case 'yz': rotation = [angle, 0, 0]; break;
      }
    }

    // Add progressive rotation
    if (config.rotationProgression) {
      rotation = [
        rotation[0] + config.rotationProgression[0] * i * (Math.PI / 180),
        rotation[1] + config.rotationProgression[1] * i * (Math.PI / 180),
        rotation[2] + config.rotationProgression[2] * i * (Math.PI / 180),
      ];
    }

    // Calculate progressive scale
    let scale: [number, number, number] = [1, 1, 1];
    if (config.scaleProgression !== undefined) {
      const s = Math.pow(config.scaleProgression, i);
      scale = [s, s, s];
    }

    instances.push({
      id: `radial-${i}`,
      index: i,
      position,
      rotation,
      scale,
      visible: true,
    });
  }

  return instances;
}

// ============== GRID CLONER ==============

export function calculateGridInstances(config: GridClonerConfig): ClonerInstance[] {
  const instances: ClonerInstance[] = [];
  const rng = new SeededRandom(12345);

  // Calculate center offset if centered
  const centerOffset: [number, number, number] = config.centered
    ? [
        -((config.countX - 1) * config.spacingX) / 2,
        -((config.countY - 1) * config.spacingY) / 2,
        -((config.countZ - 1) * config.spacingZ) / 2,
      ]
    : [0, 0, 0];

  let index = 0;
  for (let x = 0; x < config.countX; x++) {
    for (let y = 0; y < config.countY; y++) {
      for (let z = 0; z < config.countZ; z++) {
        const position: [number, number, number] = [
          x * config.spacingX + centerOffset[0],
          y * config.spacingY + centerOffset[1],
          z * config.spacingZ + centerOffset[2],
        ];

        // Check shape mask
        if (config.shape && config.shape !== 'box') {
          const normalizedPos = [
            position[0] / (config.countX * config.spacingX / 2),
            position[1] / (config.countY * config.spacingY / 2),
            position[2] / (config.countZ * config.spacingZ / 2),
          ];

          const dist = Math.sqrt(
            normalizedPos[0] ** 2 + normalizedPos[1] ** 2 + normalizedPos[2] ** 2
          );

          if (config.shape === 'sphere' && dist > 1) continue;
          if (config.shape === 'cylinder') {
            const radialDist = Math.sqrt(normalizedPos[0] ** 2 + normalizedPos[2] ** 2);
            if (radialDist > 1) continue;
          }
        }

        // Custom mask function
        if (config.customMask && !config.customMask(x, y, z)) {
          continue;
        }

        // Calculate scale with variation
        let scale: [number, number, number] = [1, 1, 1];
        if (config.scaleVariation) {
          const sv = 1 + (rng.next() - 0.5) * 2 * config.scaleVariation;
          scale = [sv, sv, sv];
        }

        // Calculate rotation with variation
        let rotation: [number, number, number] = [0, 0, 0];
        if (config.rotationVariation) {
          rotation = [
            (rng.next() - 0.5) * 2 * config.rotationVariation[0] * (Math.PI / 180),
            (rng.next() - 0.5) * 2 * config.rotationVariation[1] * (Math.PI / 180),
            (rng.next() - 0.5) * 2 * config.rotationVariation[2] * (Math.PI / 180),
          ];
        }

        instances.push({
          id: `grid-${index}`,
          index,
          position,
          rotation,
          scale,
          visible: true,
        });

        index++;
      }
    }
  }

  return instances;
}

// ============== SCATTER CLONER ==============

export function calculateScatterInstances(config: ScatterClonerConfig): ClonerInstance[] {
  const instances: ClonerInstance[] = [];
  const rng = new SeededRandom(config.seed);

  const placedPositions: Array<[number, number, number]> = [];

  let attempts = 0;
  const maxAttempts = config.count * 10;

  while (instances.length < config.count && attempts < maxAttempts) {
    attempts++;

    let position: [number, number, number];

    if (config.distribution === 'box' && config.boundingBox) {
      const bb = config.boundingBox;
      position = [
        rng.range(bb.min[0], bb.max[0]),
        rng.range(bb.min[1], bb.max[1]),
        rng.range(bb.min[2], bb.max[2]),
      ];
    } else if (config.distribution === 'sphere' && config.boundingSphere) {
      const bs = config.boundingSphere;
      // Random point in sphere using rejection sampling
      let x, y, z;
      do {
        x = rng.range(-1, 1);
        y = rng.range(-1, 1);
        z = rng.range(-1, 1);
      } while (x * x + y * y + z * z > 1);

      position = [
        bs.center[0] + x * bs.radius,
        bs.center[1] + y * bs.radius,
        bs.center[2] + z * bs.radius,
      ];
    } else {
      // Default box distribution
      position = [
        rng.range(-5, 5),
        rng.range(-5, 5),
        rng.range(-5, 5),
      ];
    }

    // Check collision avoidance
    if (config.avoidOverlap && config.minDistance) {
      const tooClose = placedPositions.some((p) => {
        const dx = position[0] - p[0];
        const dy = position[1] - p[1];
        const dz = position[2] - p[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < config.minDistance!;
      });

      if (tooClose) continue;
    }

    placedPositions.push(position);

    // Calculate scale
    let scale: [number, number, number];
    if (config.uniformScale) {
      const s = rng.range(config.minScale, config.maxScale);
      scale = [s, s, s];
    } else {
      scale = [
        rng.range(config.minScale, config.maxScale),
        rng.range(config.minScale, config.maxScale),
        rng.range(config.minScale, config.maxScale),
      ];
    }

    // Calculate rotation
    let rotation: [number, number, number] = [0, 0, 0];
    if (config.randomRotation) {
      rotation = [
        rng.range(0, Math.PI * 2),
        rng.range(0, Math.PI * 2),
        rng.range(0, Math.PI * 2),
      ];
    }

    instances.push({
      id: `scatter-${instances.length}`,
      index: instances.length,
      position,
      rotation,
      scale,
      visible: true,
    });
  }

  return instances;
}

// ============== SPLINE CLONER ==============

export function calculateSplineInstances(config: SplineClonerConfig): ClonerInstance[] {
  const instances: ClonerInstance[] = [];
  const points = config.splinePoints;

  if (points.length < 2) return instances;

  // Generate points along spline
  for (let i = 0; i < config.count; i++) {
    const t = config.count > 1 ? i / (config.count - 1) : 0;

    let position: [number, number, number];
    let tangent: [number, number, number] | null = null;

    if (config.splineType === 'linear') {
      position = interpolateLinearSpline(points, t);
      if (config.alignToSpline) {
        tangent = getLinearTangent(points, t);
      }
    } else if (config.splineType === 'catmullrom') {
      position = interpolateCatmullRom(points, t, config.tension || 0.5);
      if (config.alignToSpline) {
        tangent = getCatmullRomTangent(points, t, config.tension || 0.5);
      }
    } else {
      // Bezier - simplified linear for now
      position = interpolateLinearSpline(points, t);
      if (config.alignToSpline) {
        tangent = getLinearTangent(points, t);
      }
    }

    // Calculate rotation from tangent
    let rotation: [number, number, number] = [0, 0, 0];
    if (tangent && config.alignToSpline) {
      rotation = tangentToRotation(tangent);
    }

    // Calculate progressive scale
    let scale: [number, number, number] = [1, 1, 1];
    if (config.scaleProgression !== undefined) {
      const s = Math.pow(config.scaleProgression, i);
      scale = [s, s, s];
    }

    instances.push({
      id: `spline-${i}`,
      index: i,
      position,
      rotation,
      scale,
      visible: true,
    });
  }

  return instances;
}

// ============== SPLINE HELPERS ==============

function interpolateLinearSpline(
  points: Array<[number, number, number]>,
  t: number
): [number, number, number] {
  const n = points.length - 1;
  const segment = Math.min(Math.floor(t * n), n - 1);
  const localT = t * n - segment;

  const p0 = points[segment];
  const p1 = points[segment + 1];

  return [
    p0[0] + (p1[0] - p0[0]) * localT,
    p0[1] + (p1[1] - p0[1]) * localT,
    p0[2] + (p1[2] - p0[2]) * localT,
  ];
}

function getLinearTangent(
  points: Array<[number, number, number]>,
  t: number
): [number, number, number] {
  const n = points.length - 1;
  const segment = Math.min(Math.floor(t * n), n - 1);

  const p0 = points[segment];
  const p1 = points[segment + 1];

  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const dz = p1[2] - p0[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return len > 0 ? [dx / len, dy / len, dz / len] : [1, 0, 0];
}

function interpolateCatmullRom(
  points: Array<[number, number, number]>,
  t: number,
  tension: number
): [number, number, number] {
  const n = points.length - 1;
  const segment = Math.min(Math.floor(t * n), n - 1);
  const localT = t * n - segment;

  // Get 4 control points
  const p0 = points[Math.max(0, segment - 1)];
  const p1 = points[segment];
  const p2 = points[Math.min(n, segment + 1)];
  const p3 = points[Math.min(n, segment + 2)];

  const t2 = localT * localT;
  const t3 = t2 * localT;

  const c = (1 - tension) / 2;

  return [
    catmullRom1D(p0[0], p1[0], p2[0], p3[0], localT, t2, t3, c),
    catmullRom1D(p0[1], p1[1], p2[1], p3[1], localT, t2, t3, c),
    catmullRom1D(p0[2], p1[2], p2[2], p3[2], localT, t2, t3, c),
  ];
}

function catmullRom1D(
  p0: number, p1: number, p2: number, p3: number,
  t: number, t2: number, t3: number, c: number
): number {
  return (
    (-c * p0 + (2 - c) * p1 + (c - 2) * p2 + c * p3) * t3 +
    (2 * c * p0 + (c - 3) * p1 + (3 - 2 * c) * p2 - c * p3) * t2 +
    (-c * p0 + c * p2) * t +
    p1
  );
}

function getCatmullRomTangent(
  points: Array<[number, number, number]>,
  t: number,
  tension: number
): [number, number, number] {
  const epsilon = 0.001;
  const t0 = Math.max(0, t - epsilon);
  const t1 = Math.min(1, t + epsilon);

  const p0 = interpolateCatmullRom(points, t0, tension);
  const p1 = interpolateCatmullRom(points, t1, tension);

  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const dz = p1[2] - p0[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return len > 0 ? [dx / len, dy / len, dz / len] : [1, 0, 0];
}

function tangentToRotation(tangent: [number, number, number]): [number, number, number] {
  const [tx, ty, tz] = tangent;

  // Calculate yaw (rotation around Y)
  const yaw = Math.atan2(tx, tz);

  // Calculate pitch (rotation around X)
  const pitch = Math.atan2(-ty, Math.sqrt(tx * tx + tz * tz));

  return [pitch, yaw, 0];
}

// ============== COLOR UTILITIES ==============

function interpolateColor(
  startColor: string,
  endColor: string,
  t: number,
  mode: 'linear' | 'hsv'
): string {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  if (!start || !end) return startColor;

  if (mode === 'linear') {
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    return rgbToHex(r, g, b);
  }

  // HSV interpolation
  const startHsv = rgbToHsv(start.r, start.g, start.b);
  const endHsv = rgbToHsv(end.r, end.g, end.b);

  // Handle hue wraparound
  let hDiff = endHsv.h - startHsv.h;
  if (Math.abs(hDiff) > 0.5) {
    if (hDiff > 0) {
      hDiff -= 1;
    } else {
      hDiff += 1;
    }
  }

  let h = startHsv.h + hDiff * t;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;

  const s = startHsv.s + (endHsv.s - startHsv.s) * t;
  const v = startHsv.v + (endHsv.v - startHsv.v) * t;

  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ============== EFFECTOR APPLICATION ==============

export function applyEffectors(
  instances: ClonerInstance[],
  effectors: ClonerEffector[]
): ClonerInstance[] {
  if (!effectors || effectors.length === 0) return instances;

  return instances.map((instance) => {
    let modifiedInstance = { ...instance };

    for (const effector of effectors) {
      if (!effector.enabled) continue;

      modifiedInstance = applyEffector(modifiedInstance, effector);
    }

    return modifiedInstance;
  });
}

function applyEffector(instance: ClonerInstance, effector: ClonerEffector): ClonerInstance {
  const result = { ...instance };

  switch (effector.type) {
    case 'falloff':
      return applyFalloffEffector(result, effector);
    case 'random':
      return applyRandomEffector(result, effector);
    case 'noise':
      return applyNoiseEffector(result, effector);
    case 'step':
      return applyStepEffector(result, effector);
    case 'target':
      return applyTargetEffector(result, effector);
    default:
      return result;
  }
}

function applyFalloffEffector(instance: ClonerInstance, effector: FalloffEffector): ClonerInstance {
  const result = { ...instance };

  // Calculate distance from effector center
  const dx = instance.position[0] - effector.center[0];
  const dy = instance.position[1] - effector.center[1];
  const dz = instance.position[2] - effector.center[2];

  let distance: number;
  switch (effector.shape) {
    case 'spherical':
      distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      break;
    case 'cylindrical':
      distance = Math.sqrt(dx * dx + dz * dz);
      break;
    case 'box':
      distance = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
      break;
    default:
      distance = Math.abs(dx);
  }

  // Calculate falloff factor (0-1)
  let factor = 1 - Math.min(distance / effector.radius, 1);

  // Apply falloff curve
  switch (effector.falloffCurve) {
    case 'smooth':
      factor = factor * factor * (3 - 2 * factor);
      break;
    case 'sharp':
      factor = factor * factor;
      break;
  }

  if (effector.invert) {
    factor = 1 - factor;
  }

  factor *= effector.strength;

  // Apply to affected properties
  if (effector.affects.scale) {
    result.scale = [
      result.scale[0] * (1 - factor * 0.5),
      result.scale[1] * (1 - factor * 0.5),
      result.scale[2] * (1 - factor * 0.5),
    ];
  }

  if (effector.affects.visibility) {
    result.visible = factor < 0.9;
  }

  return result;
}

function applyRandomEffector(instance: ClonerInstance, effector: RandomEffector): ClonerInstance {
  const result = { ...instance };
  const rng = new SeededRandom(effector.seed + instance.index);

  if (effector.affects.position) {
    result.position = [
      result.position[0] + (rng.next() - 0.5) * 2 * effector.positionRange[0] * effector.strength,
      result.position[1] + (rng.next() - 0.5) * 2 * effector.positionRange[1] * effector.strength,
      result.position[2] + (rng.next() - 0.5) * 2 * effector.positionRange[2] * effector.strength,
    ];
  }

  if (effector.affects.rotation) {
    const rx = (rng.next() - 0.5) * 2 * effector.rotationRange[0] * (Math.PI / 180) * effector.strength;
    const ry = (rng.next() - 0.5) * 2 * effector.rotationRange[1] * (Math.PI / 180) * effector.strength;
    const rz = (rng.next() - 0.5) * 2 * effector.rotationRange[2] * (Math.PI / 180) * effector.strength;
    result.rotation = [
      result.rotation[0] + rx,
      result.rotation[1] + ry,
      result.rotation[2] + rz,
    ];
  }

  if (effector.affects.scale) {
    const scaleVar = rng.range(effector.scaleRange[0], effector.scaleRange[1]);
    if (effector.uniformScale) {
      result.scale = [
        result.scale[0] * scaleVar,
        result.scale[1] * scaleVar,
        result.scale[2] * scaleVar,
      ];
    } else {
      result.scale = [
        result.scale[0] * rng.range(effector.scaleRange[0], effector.scaleRange[1]),
        result.scale[1] * rng.range(effector.scaleRange[0], effector.scaleRange[1]),
        result.scale[2] * rng.range(effector.scaleRange[0], effector.scaleRange[1]),
      ];
    }
  }

  return result;
}

function applyNoiseEffector(instance: ClonerInstance, effector: NoiseEffector): ClonerInstance {
  const result = { ...instance };
  const [x, y, z] = instance.position;

  const noiseValue = noise3D(x, y, z, effector.frequency) * effector.amplitude * effector.strength;

  if (effector.affects.position) {
    result.position = [
      result.position[0] + noiseValue,
      result.position[1] + noise3D(x + 100, y, z, effector.frequency) * effector.amplitude * effector.strength,
      result.position[2] + noise3D(x, y + 100, z, effector.frequency) * effector.amplitude * effector.strength,
    ];
  }

  if (effector.affects.scale) {
    const scaleFactor = 1 + noiseValue * 0.5;
    result.scale = [
      result.scale[0] * scaleFactor,
      result.scale[1] * scaleFactor,
      result.scale[2] * scaleFactor,
    ];
  }

  return result;
}

function applyStepEffector(instance: ClonerInstance, effector: import('./types').StepEffector): ClonerInstance {
  const result = { ...instance };

  const stepIndex = Math.floor((instance.index + effector.offset) / effector.stepSize);
  const factor = (stepIndex % 2 === 0 ? 1 : 0) * effector.strength;

  if (effector.affects.scale) {
    result.scale = [
      result.scale[0] * (1 - factor * 0.5),
      result.scale[1] * (1 - factor * 0.5),
      result.scale[2] * (1 - factor * 0.5),
    ];
  }

  if (effector.affects.visibility) {
    result.visible = factor < 0.5;
  }

  return result;
}

function applyTargetEffector(instance: ClonerInstance, effector: import('./types').TargetEffector): ClonerInstance {
  const result = { ...instance };

  const dx = effector.targetPosition[0] - instance.position[0];
  const dy = effector.targetPosition[1] - instance.position[1];
  const dz = effector.targetPosition[2] - instance.position[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist < effector.influenceRadius && dist > 0) {
    const influence = (1 - dist / effector.influenceRadius) * effector.strength;
    const attraction = effector.attractionStrength * influence;

    if (effector.affects.position) {
      result.position = [
        result.position[0] + (dx / dist) * attraction,
        result.position[1] + (dy / dist) * attraction,
        result.position[2] + (dz / dist) * attraction,
      ];
    }
  }

  return result;
}

// ============== MAIN CALCULATOR ==============

export function calculateClonerInstances(config: ClonerConfig): ClonerInstance[] {
  switch (config.mode) {
    case 'linear':
      return calculateLinearInstances(config);
    case 'radial':
      return calculateRadialInstances(config);
    case 'grid':
      return calculateGridInstances(config);
    case 'scatter':
      return calculateScatterInstances(config);
    case 'spline':
      return calculateSplineInstances(config);
    case 'object':
      // Object cloner requires external mesh data, return empty for now
      return [];
    default:
      return [];
  }
}
