/**
 * UniversalEditor - Unified 3D Scene Editor for Multiple Formats
 *
 * Automatically detects file format and routes to the appropriate adapter.
 * Provides a single consistent API for working with Spline, GLTF, FBX, OBJ, etc.
 *
 * Usage:
 *   const editor = new UniversalEditor();
 *   await editor.load('scene.glb', canvas);
 *   editor.setColor('Cube', 0xff0000);
 */

import type { Object3D, Camera, Light, Scene } from 'three';
import {
  ISceneAdapter,
  SceneFormat,
  SceneInfo,
  LoadOptions,
  SceneAdapterError,
} from './ISceneAdapter';
import { SplineAdapter } from './SplineAdapter';
import { GLTFAdapter } from './GLTFAdapter';

export class UniversalEditor implements ISceneAdapter {
  private adapter: ISceneAdapter | null = null;
  private detectedFormat: SceneFormat = 'unknown';

  /**
   * Detect 3D file format from file extension or MIME type
   */
  private detectFormat(urlOrFile: string | File): SceneFormat {
    let filename: string;

    if (urlOrFile instanceof File) {
      filename = urlOrFile.name.toLowerCase();

      // Check MIME type as fallback
      if (urlOrFile.type === 'model/gltf-binary') return 'glb';
      if (urlOrFile.type === 'model/gltf+json') return 'gltf';
    } else {
      filename = urlOrFile.toLowerCase();
    }

    // Extract extension
    const ext = filename.split('.').pop() || '';

    // Map extensions to formats
    const formatMap: Record<string, SceneFormat> = {
      splinecode: 'spline',
      gltf: 'gltf',
      glb: 'glb',
      fbx: 'fbx',
      obj: 'obj',
    };

    return formatMap[ext] || 'unknown';
  }

  /**
   * Create appropriate adapter for the detected format
   */
  private createAdapter(format: SceneFormat): ISceneAdapter {
    switch (format) {
      case 'spline':
        return new SplineAdapter();

      case 'gltf':
      case 'glb':
        return new GLTFAdapter();

      case 'fbx':
      case 'obj':
        // TODO: Implement FBX/OBJ adapters if needed
        throw new SceneAdapterError(
          `Format "${format}" is not yet supported. Currently supported: Spline (.splinecode), GLTF (.gltf, .glb)`,
          format,
          'load'
        );

      default:
        throw new SceneAdapterError(
          `Unknown file format. Supported formats: .splinecode, .gltf, .glb`,
          'unknown',
          'load'
        );
    }
  }

  /**
   * Load a 3D scene from URL or File
   *
   * Automatically detects format and uses the appropriate adapter
   */
  async load(
    urlOrFile: string | File,
    canvas: HTMLCanvasElement,
    options?: LoadOptions
  ): Promise<void> {
    try {
      // Detect format
      this.detectedFormat = this.detectFormat(urlOrFile);
      console.log(`🎯 Detected format: ${this.detectedFormat}`);

      // Create adapter
      this.adapter = this.createAdapter(this.detectedFormat);

      // Load scene
      await this.adapter.load(urlOrFile, canvas, options);

      // Log scene info (with null check)
      if (this.adapter) {
        try {
          const info = this.adapter.getSceneInfo();
          console.log(`✅ Loaded ${this.detectedFormat} scene:`, {
            objects: info.objectCount,
            materials: info.materialCount,
            lights: info.lightCount,
            cameras: info.cameraCount,
          });
        } catch (error) {
          console.warn('⚠️ Could not get scene info:', error);
        }
      }
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  }

  dispose(): void {
    this.adapter?.dispose();
    this.adapter = null;
    this.detectedFormat = 'unknown';
  }

  isLoaded(): boolean {
    return this.adapter?.isLoaded() || false;
  }

  getFormat(): SceneFormat {
    return this.detectedFormat;
  }

  getSceneInfo(): SceneInfo {
    if (!this.adapter) {
      return {
        format: 'unknown',
        objectCount: 0,
        materialCount: 0,
        lightCount: 0,
        cameraCount: 0,
      };
    }
    return this.adapter.getSceneInfo();
  }

  // Delegate all methods to active adapter

  findObjectByName(name: string): Object3D | null {
    return this.adapter?.findObjectByName(name) || null;
  }

  findObjectById(id: string): Object3D | null {
    return this.adapter?.findObjectById(id) || null;
  }

  getAllObjects(): Object3D[] {
    return this.adapter?.getAllObjects() || [];
  }

  getScene(): Scene | any {
    return this.adapter?.getScene() || null;
  }

  // Transform Methods

  setPosition(objectName: string, x: number, y: number, z: number): boolean {
    return this.adapter?.setPosition(objectName, x, y, z) || false;
  }

  setRotation(objectName: string, x: number, y: number, z: number): boolean {
    return this.adapter?.setRotation(objectName, x, y, z) || false;
  }

  setScale(objectName: string, x: number, y: number, z: number): boolean {
    return this.adapter?.setScale(objectName, x, y, z) || false;
  }

  setVisible(objectName: string, visible: boolean): boolean {
    return this.adapter?.setVisible(objectName, visible) || false;
  }

  // Material Methods

  setColor(objectName: string, color: number): boolean {
    return this.adapter?.setColor(objectName, color) || false;
  }

  setRoughness(objectName: string, value: number): boolean {
    return this.adapter?.setRoughness(objectName, value) || false;
  }

  setMetalness(objectName: string, value: number): boolean {
    return this.adapter?.setMetalness(objectName, value) || false;
  }

  setEmissive(objectName: string, color: number, intensity?: number): boolean {
    return this.adapter?.setEmissive(objectName, color, intensity) || false;
  }

  // Camera Methods

  getCamera(): Camera | null {
    return this.adapter?.getCamera() || null;
  }

  setCameraPosition(x: number, y: number, z: number): boolean {
    return this.adapter?.setCameraPosition(x, y, z) || false;
  }

  setCameraFOV(fov: number): boolean {
    return this.adapter?.setCameraFOV(fov) || false;
  }

  setCameraZoom(zoom: number): boolean {
    return this.adapter?.setCameraZoom(zoom) || false;
  }

  // Light Methods

  getLights(): Light[] {
    return this.adapter?.getLights() || [];
  }

  setLightIntensity(lightName: string, intensity: number): boolean {
    return this.adapter?.setLightIntensity(lightName, intensity) || false;
  }

  setLightColor(lightName: string, color: number): boolean {
    return this.adapter?.setLightColor(lightName, color) || false;
  }

  // Rendering

  render(): void {
    this.adapter?.render?.();
  }

  startRenderLoop(): void {
    this.adapter?.startRenderLoop?.();
  }

  stopRenderLoop(): void {
    this.adapter?.stopRenderLoop?.();
  }

  // Raycasting

  async raycast(x: number, y: number): Promise<Object3D | null> {
    if (!this.adapter?.raycast) {
      console.warn('⚠️ UniversalEditor.raycast: Adapter does not support raycasting');
      return null;
    }

    const result = this.adapter.raycast(x, y);

    // Handle both sync and async results
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }

  // Raycasting for face selection
  async raycastFace(x: number, y: number): Promise<{ object: Object3D; faceIndex: number } | null> {
    if (!this.adapter?.raycastFace) {
      console.warn('⚠️ UniversalEditor.raycastFace: Adapter does not support face raycasting');
      return null;
    }

    const result = this.adapter.raycastFace(x, y);

    // Handle both sync and async results
    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }

  // Transform Controls (3-axis gizmo)

  attachTransformControls(object: Object3D | null): void {
    const adapter = this.adapter as any;
    if (adapter?.attachTransformControls) {
      adapter.attachTransformControls(object);
    }
  }

  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    const adapter = this.adapter as any;
    if (adapter?.setTransformMode) {
      adapter.setTransformMode(mode);
    }
  }

  /**
   * Get the underlying adapter instance
   * Useful for format-specific operations
   */
  getAdapter(): ISceneAdapter | null {
    return this.adapter;
  }

  /**
   * Check if a file format is supported
   */
  static isFormatSupported(urlOrFile: string | File): boolean {
    const editor = new UniversalEditor();
    try {
      const format = editor['detectFormat'](urlOrFile);
      return format === 'spline' || format === 'gltf' || format === 'glb';
    } catch {
      return false;
    }
  }

  /**
   * Get list of supported file extensions
   */
  static getSupportedFormats(): string[] {
    return ['.splinecode', '.gltf', '.glb'];
  }
}
