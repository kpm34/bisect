/**
 * SplineRuntime - Real Spline API Integration
 *
 * Uses @splinetool/runtime for actual scene manipulation
 * Provides TypeScript-safe wrapper around Spline Application API
 */

import { Application, SPEObject, SplineEvent, SplineEventName } from '@splinetool/runtime';
import { promises as fs } from 'fs';
import * as fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

/**
 * Vector3 coordinate
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Result of loading a scene
 */
export interface LoadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Result of setting a property
 */
export interface SetPropertyResult {
  success: boolean;
  object: string;
  property: string;
  value: Vector3 | number | boolean | string;
}

/**
 * Result of setting a variable
 */
export interface SetVariableResult {
  success: boolean;
  variable: string;
  value: number | boolean | string;
}

/**
 * Result of emitting an event
 */
export interface EmitEventResult {
  success: boolean;
  event: string;
  data?: Record<string, unknown>;
}

/**
 * Result of adding event listener
 */
export interface AddEventListenerResult {
  success: boolean;
  event: string;
}

/**
 * Scene state for presets
 */
export interface SceneState {
  url: string | null;
  timestamp: string;
  objects: Record<string, ObjectState>;
  variables: Record<string, number | boolean | string>;
}

/**
 * Object state
 */
export interface ObjectState {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  visible: boolean;
}

/**
 * Result of applying state
 */
export interface ApplyStateResult {
  success: boolean;
  applied: string[];
  failed: Array<{ object?: string; variable?: string; error: string }>;
}

/**
 * Result of saving preset
 */
export interface SavePresetResult {
  success: boolean;
  preset: string;
  path: string;
  objects: number;
}

/**
 * Result of loading preset
 */
export interface LoadPresetResult extends ApplyStateResult {
  preset: string;
}

/**
 * Preset metadata
 */
export interface PresetInfo {
  name: string;
  objects: number;
  variables: number;
  timestamp: string;
}

/**
 * Result of deleting preset
 */
export interface DeletePresetResult {
  success: boolean;
  preset: string;
}

/**
 * Runtime information
 */
export interface RuntimeInfo {
  initialized: boolean;
  loaded: boolean;
  sceneUrl: string | null;
  hasCanvas: boolean;
}

/**
 * SplineRuntime class
 */
export class SplineRuntime {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private loaded = false;
  private currentSceneUrl: string | null = null;
  private presetPath: string;

  constructor() {
    this.presetPath = path.join(os.homedir(), '.spline-cli', 'presets');

    // Ensure preset directory exists
    fsExtra.ensureDirSync(this.presetPath);
  }

  /**
   * Initialize the Spline application with a canvas element
   * This is required before loading scenes
   */
  async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    if (this.app) {
      console.warn('⚠️ Runtime already initialized');
      return;
    }

    this.canvas = canvasElement;
    this.app = new Application(this.canvas);
    console.log('✅ Spline runtime initialized');
  }

  /**
   * Load a Spline scene from a .splinecode URL
   */
  async load(sceneUrl: string): Promise<LoadResult> {
    if (!this.app) {
      throw new Error('Runtime not initialized. Call initialize() first.');
    }

    try {
      console.log(`📥 Loading scene: ${sceneUrl}`);
      await this.app.load(sceneUrl);
      this.loaded = true;
      this.currentSceneUrl = sceneUrl;
      console.log('✅ Scene loaded successfully');
      return { success: true, url: sceneUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to load scene:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Find an object in the scene by name
   */
  findObject(name: string): SPEObject {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    const object = this.app.findObjectByName(name);
    if (!object) {
      throw new Error(`Object "${name}" not found in scene`);
    }

    return object;
  }

  /**
   * Get object property value
   */
  getObjectProperty(objectName: string, property: string): Vector3 | boolean {
    const obj = this.findObject(objectName);

    switch (property.toLowerCase()) {
      case 'position':
        return {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
        };
      case 'rotation':
        return {
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z,
        };
      case 'scale':
        return {
          x: obj.scale.x,
          y: obj.scale.y,
          z: obj.scale.z,
        };
      case 'visible':
        return obj.visible;
      default:
        throw new Error(`Unknown property: ${property}`);
    }
  }

  /**
   * Set object property value
   */
  setObjectProperty(
    objectName: string,
    property: string,
    value: Vector3 | string | number | boolean
  ): SetPropertyResult {
    const obj = this.findObject(objectName);

    switch (property.toLowerCase()) {
      case 'position':
        if (typeof value === 'object' && 'x' in value) {
          obj.position.x = value.x ?? 0;
          obj.position.y = value.y ?? 0;
          obj.position.z = value.z ?? 0;
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.position.x = x || 0;
          obj.position.y = y || 0;
          obj.position.z = z || 0;
        }
        break;

      case 'rotation':
        if (typeof value === 'object' && 'x' in value) {
          obj.rotation.x = value.x ?? 0;
          obj.rotation.y = value.y ?? 0;
          obj.rotation.z = value.z ?? 0;
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.rotation.x = x || 0;
          obj.rotation.y = y || 0;
          obj.rotation.z = z || 0;
        }
        break;

      case 'scale':
        if (typeof value === 'object' && 'x' in value) {
          obj.scale.x = value.x ?? 1;
          obj.scale.y = value.y ?? 1;
          obj.scale.z = value.z ?? 1;
        } else if (typeof value === 'string') {
          const [x, y, z] = value.split(',').map(parseFloat);
          obj.scale.x = x || 1;
          obj.scale.y = y || 1;
          obj.scale.z = z || 1;
        } else if (typeof value === 'number') {
          obj.scale.x = value;
          obj.scale.y = value;
          obj.scale.z = value;
        }
        break;

      case 'visible':
        obj.visible = Boolean(value);
        break;

      default:
        throw new Error(`Cannot set property: ${property}`);
    }

    return { success: true, object: objectName, property, value };
  }

  /**
   * Get Spline variable value
   */
  getVariable(name: string): number | boolean | string {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    return this.app.getVariable(name);
  }

  /**
   * Set Spline variable value
   */
  setVariable(name: string, value: number | boolean | string): SetVariableResult {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    this.app.setVariable(name, value);
    return { success: true, variable: name, value };
  }

  /**
   * Emit a Spline event
   */
  emitEvent(eventName: string, nameOrUuid: string, data: Record<string, unknown> = {}): EmitEventResult {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    this.app.emitEvent(eventName as SplineEventName, nameOrUuid);
    return { success: true, event: eventName, data };
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventName: SplineEventName,
    callback: (e: SplineEvent) => void
  ): AddEventListenerResult {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    this.app.addEventListener(eventName, callback);
    return { success: true, event: eventName };
  }

  /**
   * Get all objects in the scene
   */
  getAllObjects(): SPEObject[] {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    return this.app.getAllObjects();
  }

  /**
   * Capture current scene state (for presets)
   */
  captureState(objectNames: string[] = []): SceneState {
    if (!this.loaded) {
      throw new Error('No scene loaded');
    }

    const state: SceneState = {
      url: this.currentSceneUrl,
      timestamp: new Date().toISOString(),
      objects: {},
      variables: {},
    };

    // Capture specified objects
    for (const name of objectNames) {
      try {
        const obj = this.findObject(name);
        state.objects[name] = {
          position: { ...obj.position },
          rotation: { ...obj.rotation },
          scale: { ...obj.scale },
          visible: obj.visible,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ Could not capture object "${name}": ${errorMessage}`);
      }
    }

    return state;
  }

  /**
   * Apply a preset state to the scene
   */
  applyState(state: SceneState): ApplyStateResult {
    if (!this.loaded || !this.app) {
      throw new Error('No scene loaded');
    }

    const results: ApplyStateResult = {
      success: true,
      applied: [],
      failed: [],
    };

    // Apply object states
    for (const [name, props] of Object.entries(state.objects || {})) {
      try {
        const obj = this.findObject(name);
        if (props.position) {
          obj.position.x = props.position.x;
          obj.position.y = props.position.y;
          obj.position.z = props.position.z;
        }
        if (props.rotation) {
          obj.rotation.x = props.rotation.x;
          obj.rotation.y = props.rotation.y;
          obj.rotation.z = props.rotation.z;
        }
        if (props.scale) {
          obj.scale.x = props.scale.x;
          obj.scale.y = props.scale.y;
          obj.scale.z = props.scale.z;
        }
        if (typeof props.visible !== 'undefined') {
          obj.visible = props.visible;
        }
        results.applied.push(name);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ object: name, error: errorMessage });
      }
    }

    // Apply variables
    for (const [name, value] of Object.entries(state.variables || {})) {
      try {
        this.app.setVariable(name, value);
        results.applied.push(`var:${name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.failed.push({ variable: name, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Save a preset
   */
  async savePreset(name: string, objectNames: string[] = []): Promise<SavePresetResult> {
    const state = this.captureState(objectNames);
    const filePath = path.join(this.presetPath, `${name}.json`);

    await fsExtra.writeJson(filePath, state, { spaces: 2 });

    return {
      success: true,
      preset: name,
      path: filePath,
      objects: Object.keys(state.objects).length,
    };
  }

  /**
   * Load a preset
   */
  async loadPreset(name: string): Promise<LoadPresetResult> {
    const filePath = path.join(this.presetPath, `${name}.json`);

    const exists = await fsExtra.pathExists(filePath);
    if (!exists) {
      throw new Error(`Preset "${name}" not found`);
    }

    const state = (await fsExtra.readJson(filePath)) as SceneState;
    const results = this.applyState(state);

    return {
      preset: name,
      ...results,
    };
  }

  /**
   * List all presets
   */
  async listPresets(): Promise<PresetInfo[]> {
    const files = await fs.readdir(this.presetPath);
    const presets = files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

    const details = await Promise.all(
      presets.map(async (name) => {
        const filePath = path.join(this.presetPath, `${name}.json`);
        const state = (await fsExtra.readJson(filePath)) as SceneState;
        return {
          name,
          objects: Object.keys(state.objects || {}).length,
          variables: Object.keys(state.variables || {}).length,
          timestamp: state.timestamp,
        };
      })
    );

    return details;
  }

  /**
   * Delete a preset
   */
  async deletePreset(name: string): Promise<DeletePresetResult> {
    const filePath = path.join(this.presetPath, `${name}.json`);
    await fsExtra.remove(filePath);
    return { success: true, preset: name };
  }

  /**
   * Get runtime info
   */
  getInfo(): RuntimeInfo {
    return {
      initialized: this.app !== null,
      loaded: this.loaded,
      sceneUrl: this.currentSceneUrl,
      hasCanvas: this.canvas !== null,
    };
  }
}

export default SplineRuntime;
