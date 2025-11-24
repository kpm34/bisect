/**
 * ISceneAdapter - Unified interface for different 3D scene formats
 *
 * This interface allows Prism and Spline Copilot to work with multiple
 * 3D file formats (Spline, GLTF, FBX, etc.) through a consistent API.
 *
 * Each format gets its own adapter implementation (SplineAdapter, GLTFAdapter, etc.)
 * that translates the unified API calls into format-specific operations.
 */

import type { Object3D, Camera, Light, Scene, Material } from 'three';
import { MaterialPreset } from '../materials/types';

export type SceneFormat = 'spline' | 'gltf' | 'glb' | 'fbx' | 'obj' | 'unknown';

export interface LoadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface SceneInfo {
  format: SceneFormat;
  objectCount: number;
  materialCount: number;
  lightCount: number;
  cameraCount: number;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

/**
 * Unified Scene Adapter Interface
 *
 * All scene format adapters must implement this interface to ensure
 * consistent behavior across different 3D formats.
 */
export interface ISceneAdapter {
  // Lifecycle
  load(urlOrFile: string | File, canvas: HTMLCanvasElement, options?: LoadOptions): Promise<void>;
  dispose(): void;
  isLoaded(): boolean;
  getFormat(): SceneFormat;
  getSceneInfo(): SceneInfo;

  // Scene Query
  findObjectByName(name: string): Object3D | null;
  findObjectById(id: string): Object3D | null;
  getAllObjects(): Object3D[];
  getScene(): Scene | any; // any for non-Three.js scenes like Spline

  // Object Transform
  setPosition(objectName: string, x: number, y: number, z: number): boolean;
  setRotation(objectName: string, x: number, y: number, z: number): boolean;
  setScale(objectName: string, x: number, y: number, z: number): boolean;
  setVisible(objectName: string, visible: boolean): boolean;

  // Material Properties
  setColor(objectName: string, color: number): boolean;
  setRoughness(objectName: string, value: number): boolean;
  setMetalness(objectName: string, value: number): boolean;
  setEmissive(objectName: string, color: number, intensity?: number): boolean;

  // Camera
  getCamera(): Camera | null;
  setCameraPosition(x: number, y: number, z: number): boolean;
  setCameraFOV(fov: number): boolean;
  setCameraZoom(zoom: number): boolean;

  // Lights
  getLights(): Light[];
  setLightIntensity(lightName: string, intensity: number): boolean;
  setLightColor(lightName: string, color: number): boolean;

  // Rendering (if applicable)
  render?(): void;
  startRenderLoop?(): void;
  stopRenderLoop?(): void;

  // Raycasting for object selection
  raycast?(x: number, y: number): Object3D | null | Promise<Object3D | null>;

  // Raycasting for face selection (returns intersection with faceIndex)
  raycastFace?(x: number, y: number): { object: Object3D; faceIndex: number } | null | Promise<{ object: Object3D; faceIndex: number } | null>;
}

/**
 * Base error class for adapter operations
 */
export class SceneAdapterError extends Error {
  constructor(
    message: string,
    public readonly format: SceneFormat,
    public readonly operation: string
  ) {
    super(message);
    this.name = 'SceneAdapterError';
  }
}
