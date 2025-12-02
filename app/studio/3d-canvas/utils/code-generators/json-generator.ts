/**
 * JSON Scene Generator
 * Exports scene configuration as JSON
 */

import { SceneObject } from '../../r3f/SceneSelectionContext';

interface LightingState {
  ambient: { enabled: boolean; intensity: number; color: string };
  directional: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; castShadow: boolean };
  point: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; distance: number };
  spot: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; angle: number; penumbra: number };
  hemisphere: { enabled: boolean; intensity: number; skyColor: string; groundColor: string };
}

interface EnvironmentState {
  preset: string;
  background: boolean;
  blur: number;
  intensity: number;
}

interface GeneratorOptions {
  objects: SceneObject[];
  lighting: LightingState;
  environment: EnvironmentState;
  projectName?: string;
}

export interface SceneJSON {
  version: string;
  generator: string;
  timestamp: string;
  projectName: string;
  scene: {
    environment: EnvironmentState;
    lighting: LightingState;
    objects: SceneObjectJSON[];
  };
}

interface SceneObjectJSON {
  id: string;
  name: string;
  type: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  material: {
    color: string;
  };
  text?: string;
  physics?: {
    enabled: boolean;
    type: string;
    mass: number;
    restitution: number;
    friction: number;
  };
}

/**
 * Generate scene JSON configuration
 */
export function generateSceneJSON(options: GeneratorOptions): SceneJSON {
  const { objects, lighting, environment, projectName = 'Untitled Scene' } = options;

  return {
    version: '1.0.0',
    generator: 'Bisect',
    timestamp: new Date().toISOString(),
    projectName,
    scene: {
      environment,
      lighting,
      objects: objects.map(obj => ({
        id: obj.id,
        name: obj.name,
        type: obj.type,
        transform: {
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
        },
        material: {
          color: obj.color,
        },
        ...(obj.text && { text: obj.text }),
        ...(obj.physics && {
          physics: {
            enabled: obj.physics.enabled,
            type: obj.physics.type,
            mass: obj.physics.mass,
            restitution: obj.physics.restitution,
            friction: obj.physics.friction,
          }
        }),
      })),
    },
  };
}

/**
 * Generate formatted JSON string
 */
export function generateSceneJSONString(options: GeneratorOptions): string {
  const json = generateSceneJSON(options);
  return JSON.stringify(json, null, 2);
}

/**
 * Generate minified JSON string
 */
export function generateSceneJSONMinified(options: GeneratorOptions): string {
  const json = generateSceneJSON(options);
  return JSON.stringify(json);
}
