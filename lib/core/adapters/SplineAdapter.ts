/**
 * SplineAdapter - Adapter for Spline Runtime scenes
 *
 * Wraps the @splinetool/runtime Application API to conform to ISceneAdapter interface.
 * Handles Spline's NodeMaterial uniforms (nodeU0-nodeU8) for material manipulation.
 */

import type { Application } from '@splinetool/runtime';
import type { Object3D, Camera, Light, Scene, Material } from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
  ISceneAdapter,
  SceneFormat,
  SceneInfo,
  LoadOptions,
  SceneAdapterError,
} from './ISceneAdapter';

export class SplineAdapter implements ISceneAdapter {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private loaded = false;
  private transformControls: TransformControls | null = null;
  private splineControls: any = null; // Spline's internal camera controls

  async load(
    urlOrFile: string | File,
    canvas: HTMLCanvasElement,
    options?: LoadOptions
  ): Promise<void> {
    this.canvas = canvas;

    try {
      // Dynamic import to avoid SSR issues
      const { Application } = await import('@splinetool/runtime');
      this.app = new Application(canvas);

      // Convert File to URL if needed
      const url = urlOrFile instanceof File ? URL.createObjectURL(urlOrFile) : urlOrFile;

      // Load scene
      await this.app.load(url);

      // Setup transform controls (3-axis gizmo) for object manipulation
      const scene = this.getScene();
      const camera = this.getCamera();
      if (scene && camera && canvas) {
        this.transformControls = new TransformControls(camera, canvas);
        this.transformControls.setMode('translate'); // Start in translate mode
        this.transformControls.setSize(0.8); // Slightly smaller gizmo

        // Make gizmo non-blocking for raycasting
        this.transformControls.traverse((child: any) => {
          child.raycast = () => {}; // Disable raycast on gizmo parts
        });

        scene.add(this.transformControls);

        // Disable Spline's camera controls when using transform controls
        this.transformControls.addEventListener('dragging-changed', (event) => {
          // Use Spline's public API to pause/resume game controls
          if (this.app) {
            if (event.value) {
              // Dragging started - pause Spline's camera controls
              (this.app as any).pauseGameControls?.();
            } else {
              // Dragging ended - resume Spline's camera controls
              (this.app as any).resumeGameControls?.();
            }
          }
        });

        // Render scene when gizmo is used (Spline auto-renders, but we can trigger update)
        this.transformControls.addEventListener('change', () => {
          // Spline auto-renders, but we can force an update if needed
          if (this.app && (this.app as any).update) {
            (this.app as any).update();
          }
        });
      }

      this.loaded = true;

      // Cleanup blob URL if created
      if (urlOrFile instanceof File) {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      options?.onError?.(error as Error);
      throw new SceneAdapterError(
        `Failed to load Spline scene: ${(error as Error).message}`,
        'spline',
        'load'
      );
    }
  }

  dispose(): void {
    // Cleanup transform controls
    if (this.transformControls) {
      this.transformControls.dispose();
      this.transformControls = null;
    }
    // Spline doesn't expose disposal API, but we can cleanup references
    this.app = null;
    this.canvas = null;
    this.loaded = false;
  }

  isLoaded(): boolean {
    return this.loaded && this.app !== null;
  }

  getFormat(): SceneFormat {
    return 'spline';
  }

  getSceneInfo(): SceneInfo {
    if (!this.app) {
      return {
        format: 'spline',
        objectCount: 0,
        materialCount: 0,
        lightCount: 0,
        cameraCount: 0,
      };
    }

    const scene = (this.app as any)._scene;
    let objectCount = 0;
    let materialCount = 0;
    let lightCount = 0;
    let cameraCount = 0;

    if (scene) {
      const traverse = (node: any) => {
        objectCount++;
        if (node.material) materialCount++;
        if (node.type?.includes('Light')) lightCount++;
        if (node.type?.includes('Camera')) cameraCount++;
        if (node.children) {
          node.children.forEach(traverse);
        }
      };
      traverse(scene);
    }

    return {
      format: 'spline',
      objectCount,
      materialCount,
      lightCount,
      cameraCount,
    };
  }

  // Scene Query Methods

  findObjectByName(name: string): Object3D | null {
    if (!this.app) return null;

    try {
      // Try exact match first
      let obj = this.app.findObjectByName(name);

      // If not found, try case-insensitive search
      if (!obj) {
        const scene = (this.app as any)._scene;
        if (scene) {
          const traverse = (node: any): any => {
            if (node.name && node.name.toLowerCase() === name.toLowerCase()) {
              return node;
            }
            if (node.children) {
              for (const child of node.children) {
                const found = traverse(child);
                if (found) return found;
              }
            }
            return null;
          };
          obj = traverse(scene);
        }
      }

      return obj as unknown as Object3D;
    } catch (error) {
      console.error(`SplineAdapter: Failed to find object "${name}":`, error);
      return null;
    }
  }

  findObjectById(id: string): Object3D | null {
    if (!this.app) return null;

    try {
      const obj = this.app.findObjectById(id);
      return obj as unknown as Object3D;
    } catch (error) {
      console.error(`SplineAdapter: Failed to find object with ID "${id}":`, error);
      return null;
    }
  }

  getAllObjects(): Object3D[] {
    if (!this.app) return [];

    const objects: Object3D[] = [];
    const scene = (this.app as any)._scene;

    if (scene) {
      const traverse = (node: any) => {
        if (node.name && node.name !== 'Scene') {
          objects.push(node as Object3D);
        }
        if (node.children) {
          node.children.forEach(traverse);
        }
      };
      traverse(scene);
    }

    return objects;
  }

  getScene(): any {
    return this.app ? (this.app as any)._scene : null;
  }

  // Transform Methods

  setPosition(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    try {
      obj.position.set(x, y, z);
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set position for "${objectName}":`, error);
      return false;
    }
  }

  setRotation(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    try {
      obj.rotation.set(x, y, z);
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set rotation for "${objectName}":`, error);
      return false;
    }
  }

  setScale(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    try {
      obj.scale.set(x, y, z);
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set scale for "${objectName}":`, error);
      return false;
    }
  }

  setVisible(objectName: string, visible: boolean): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    try {
      obj.visible = visible;
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set visibility for "${objectName}":`, error);
      return false;
    }
  }

  // Material Methods (Handle Spline's NodeMaterial uniforms)

  private applyToMaterial(obj: any, fn: (m: any) => void): boolean {
    try {
      const mats: Material[] = Array.isArray(obj.material)
        ? obj.material
        : [obj.material].filter(Boolean);

      for (const mat of mats) {
        // Apply to standard Three.js material properties
        fn(mat as any);

        // Apply to NodeMaterial uniforms if they exist
        const anyMat = mat as any;
        if (anyMat.uniforms) {
          const keys = Object.keys(anyMat.uniforms).filter(
            (k) => k.startsWith('nodeU') && anyMat.uniforms[k]?.value
          );
          for (const k of keys) {
            fn(anyMat.uniforms[k].value);
          }
          anyMat.needsUpdate = true;
        }
      }
      return true;
    } catch (error) {
      console.error('SplineAdapter: Failed to apply material change:', error);
      return false;
    }
  }

  setColor(objectName: string, color: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    return this.applyToMaterial(obj, (mat: any) => {
      if (mat?.setHex) {
        mat.setHex(color);
      } else if (typeof mat === 'object' && 'color' in mat && mat.color?.setHex) {
        mat.color.setHex(color);
      }
      if ('needsUpdate' in mat) {
        mat.needsUpdate = true;
      }
    });
  }

  setRoughness(objectName: string, value: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    return this.applyToMaterial(obj, (mat: any) => {
      if ('roughness' in mat) {
        mat.roughness = value;
        mat.needsUpdate = true;
      }
      // Handle Spline NodeMaterial (nodeU5 typically = roughness)
      if (mat.uniforms?.nodeU5) {
        mat.uniforms.nodeU5.value = value;
        mat.needsUpdate = true;
      }
    });
  }

  setMetalness(objectName: string, value: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    return this.applyToMaterial(obj, (mat: any) => {
      if ('metalness' in mat) {
        mat.metalness = value;
        mat.needsUpdate = true;
      }
      // Handle Spline NodeMaterial (nodeU6 typically = metalness)
      if (mat.uniforms?.nodeU6) {
        mat.uniforms.nodeU6.value = value;
        mat.needsUpdate = true;
      }
    });
  }

  setEmissive(objectName: string, color: number, intensity: number = 1): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    return this.applyToMaterial(obj, (mat: any) => {
      if ('emissive' in mat && mat.emissive?.setHex) {
        mat.emissive.setHex(color);
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = intensity;
        }
        mat.needsUpdate = true;
      }
      // Handle Spline NodeMaterial emissive (nodeU0 for emissive materials)
      if (mat.uniforms?.nodeU0?.value?.setHex) {
        mat.uniforms.nodeU0.value.setHex(color);
        mat.needsUpdate = true;
      }
      if (mat.uniforms?.nodeU6) {
        mat.uniforms.nodeU6.value = intensity;
        mat.needsUpdate = true;
      }
    });
  }

  // Camera Methods

  getCamera(): Camera | null {
    // Spline doesn't expose camera directly through public API
    const scene = this.getScene();
    if (!scene) return null;

    let camera: Camera | null = null;
    const traverse = (node: any) => {
      if (node.type?.includes('Camera')) {
        camera = node as Camera;
        return;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(scene);

    return camera;
  }

  setCameraPosition(x: number, y: number, z: number): boolean {
    const camera = this.getCamera();
    if (!camera) return false;

    try {
      camera.position.set(x, y, z);
      return true;
    } catch (error) {
      console.error('SplineAdapter: Failed to set camera position:', error);
      return false;
    }
  }

  setCameraFOV(fov: number): boolean {
    const camera = this.getCamera();
    if (!camera || !('fov' in camera)) return false;

    try {
      (camera as any).fov = fov;
      (camera as any).updateProjectionMatrix?.();
      return true;
    } catch (error) {
      console.error('SplineAdapter: Failed to set camera FOV:', error);
      return false;
    }
  }

  setCameraZoom(zoom: number): boolean {
    const camera = this.getCamera();
    if (!camera) return false;

    try {
      (camera as any).zoom = zoom;
      (camera as any).updateProjectionMatrix?.();
      return true;
    } catch (error) {
      console.error('SplineAdapter: Failed to set camera zoom:', error);
      return false;
    }
  }

  // Light Methods

  getLights(): Light[] {
    const lights: Light[] = [];
    const scene = this.getScene();
    if (!scene) return lights;

    const traverse = (node: any) => {
      if (node.type?.includes('Light')) {
        lights.push(node as Light);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(scene);

    return lights;
  }

  setLightIntensity(lightName: string, intensity: number): boolean {
    const light = this.findObjectByName(lightName);
    if (!light || !('intensity' in light)) return false;

    try {
      (light as any).intensity = intensity;
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set light intensity for "${lightName}":`, error);
      return false;
    }
  }

  setLightColor(lightName: string, color: number): boolean {
    const light = this.findObjectByName(lightName);
    if (!light || !('color' in light)) return false;

    try {
      (light as any).color.setHex(color);
      return true;
    } catch (error) {
      console.error(`SplineAdapter: Failed to set light color for "${lightName}":`, error);
      return false;
    }
  }

  // Spline handles its own rendering
  render(): void {
    // No-op: Spline renders automatically
  }

  // Transform Controls (3-axis gizmo) Management
  attachTransformControls(object: Object3D | null): void {
    if (!this.transformControls) {
      console.warn('⚠️ Transform controls not initialized');
      return;
    }

    if (object) {
      this.transformControls.attach(object);
    } else {
      this.transformControls.detach();
    }
  }

  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  getTransformControls(): TransformControls | null {
    return this.transformControls;
  }

  // Raycasting for object selection
  async raycast(x: number, y: number): Promise<Object3D | null> {
    const camera = this.getCamera();
    const scene = this.getScene();

    if (!camera || !scene) {
      console.warn('⚠️ SplineAdapter.raycast: Camera or scene not initialized');
      return null;
    }

    try {
      // Spline uses THREE.js under the hood, so we can use THREE.Raycaster
      const THREE = await import('three');
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(x, y);

      // Set raycaster from camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Get all intersectable objects (include Groups for nested meshes, but exclude Scene objects)
      const intersectableObjects: any[] = [];
      const traverse = (node: any) => {
        // Include both Meshes and Groups (spheres/objects might be inside groups)
        const isMesh = node.type?.includes('Mesh');
        const isGroup = node.type === 'Group' || node.isGroup;
        const isScene = node.type === 'Scene' || node.isScene || node.name === 'Scene' || node.name === 'Scene 1';
        
        if (
          (isMesh || (isGroup && !isScene)) && // Include meshes and groups, but exclude Scene objects
          node.visible &&
          !node.name.startsWith('__') && // Filter out internal objects like __selection_outline__
          !(node.parent?.name?.startsWith('__')) // Filter out children of internal objects
        ) {
          intersectableObjects.push(node);
        }
        if (node.children) {
          node.children.forEach(traverse);
        }
      };
      traverse(scene);

      console.info(`🔍 SplineAdapter Raycast: Found ${intersectableObjects.length} intersectable objects`);

      // Perform raycasting (recursive: true to traverse into Groups)
      const intersects = raycaster.intersectObjects(intersectableObjects, true);

      if (intersects.length > 0) {
        // Process intersections to find the actual mesh (not Scene objects)
        for (const intersection of intersects) {
          let hit = intersection.object;
          
          // Skip Scene objects - they're containers, not selectable objects
          const isScene = hit.type === 'Scene' || (hit as any).isScene || hit.name === 'Scene' || hit.name === 'Scene 1';
          if (isScene) {
            console.info(`🔍 SplineAdapter: Skipping Scene object "${hit.name}", checking next intersection...`);
            continue; // Try next intersection
          }
          
          // If we hit a Group, find the actual mesh that was intersected
          if (hit.type === 'Group' || (hit as any).isGroup) {
            console.info(`🔍 SplineAdapter: Raycast hit Group "${hit.name}", searching for child mesh...`);
            
            let foundMesh: any = null;
            const findMesh = (node: any) => {
              // Skip Scene objects when searching
              const nodeIsScene = node.type === 'Scene' || (node as any).isScene || node.name === 'Scene' || node.name === 'Scene 1';
              if (nodeIsScene) return;
              
              if (node.type?.includes('Mesh') && node.visible && !foundMesh) {
                foundMesh = node;
              }
              if (node.children) {
                node.children.forEach(findMesh);
              }
            };
            findMesh(hit);
            
            if (foundMesh) {
              console.info(`✅ SplineAdapter: Found child mesh: "${foundMesh.name}"`);
              hit = foundMesh;
            }
          }
          
          // Only return Meshes (not Groups or Scenes)
          if (hit.type?.includes('Mesh')) {
            console.info(`✅ SplineAdapter Raycast hit: "${hit.name}" (UUID: ${hit.uuid})`);
            return hit as unknown as Object3D;
          } else {
            // Try to find any mesh in the hierarchy (excluding Scenes)
            let meshFound: any = null;
            const findMesh = (node: any) => {
              // Skip Scene objects
              const nodeIsScene = node.type === 'Scene' || (node as any).isScene || node.name === 'Scene' || node.name === 'Scene 1';
              if (nodeIsScene) return;
              
              if (node.type?.includes('Mesh') && node.visible && !meshFound) {
                meshFound = node;
              }
              if (node.children) {
                node.children.forEach(findMesh);
              }
            };
            findMesh(hit);
            if (meshFound) {
              console.info(`✅ SplineAdapter: Using child mesh: "${meshFound.name}"`);
              return meshFound as unknown as Object3D;
            }
          }
        }
        
        // If we got here, all intersections were Scenes or Groups without meshes
        console.warn(`⚠️ SplineAdapter: All raycast intersections were Scenes or Groups without meshes`);
      }

      console.info('⚪ Raycast: No objects hit');
      return null;
    } catch (error) {
      console.error('SplineAdapter: Failed to perform raycast:', error);
      return null;
    }
  }

  // Raycasting for face selection
  async raycastFace(x: number, y: number): Promise<{ object: Object3D; faceIndex: number } | null> {
    const camera = this.getCamera();
    const scene = this.getScene();

    try {
      if (!camera || !scene) {
        console.warn('⚠️ SplineAdapter.raycastFace: Camera or scene not initialized');
        return null;
      }

      // Spline uses THREE.js under the hood, so we can use THREE.Raycaster
      const THREE = (window as any).__THREE_DEVTOOLS__?.THREE;
      if (!THREE) {
        console.warn('⚠️ SplineAdapter.raycastFace: THREE.js not available');
        return null;
      }

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(x, y);

      // Set raycaster from camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Get all intersectable objects
      const intersectableObjects: Object3D[] = [];
      scene.traverse((object: any) => {
        if (
          object instanceof THREE.Mesh &&
          object.visible &&
          !object.name.startsWith('__') &&
          !(object.parent?.name.startsWith('__'))
        ) {
          intersectableObjects.push(object);
        }
      });

      // Perform raycasting
      const intersects = raycaster.intersectObjects(intersectableObjects, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        // THREE.js Intersection has 'face' and 'faceIndex' properties
        if (hit.faceIndex !== undefined) {
          console.info(`✅ RaycastFace hit: "${hit.object.name}" face ${hit.faceIndex}`);
          return {
            object: hit.object,
            faceIndex: hit.faceIndex,
          };
        } else {
          console.warn('⚠️ RaycastFace: Intersection has no faceIndex');
          return null;
        }
      }

      console.info('⚪ RaycastFace: No faces hit');
      return null;
    } catch (error) {
      console.error('SplineAdapter: Failed to perform face raycast:', error);
      return null;
    }
  }
}
