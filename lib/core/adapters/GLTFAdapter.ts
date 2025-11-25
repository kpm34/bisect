/**
 * GLTFAdapter - Adapter for GLTF/GLB 3D models
 *
 * Loads GLTF and GLB files using Three.js GLTFLoader and provides
 * the unified ISceneAdapter interface for manipulation.
 *
 * Sets up a complete Three.js scene with camera, lights, and renderer.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { Object3D, Camera, Light, Scene, Material } from 'three';
import {
  ISceneAdapter,
  SceneFormat,
  SceneInfo,
  LoadOptions,
  SceneAdapterError,
} from './ISceneAdapter';

export class GLTFAdapter implements ISceneAdapter {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private transformControls: TransformControls | null = null;
  private loader = new GLTFLoader();
  private canvas: HTMLCanvasElement | null = null;
  private loaded = false;
  private animationFrameId: number | null = null;
  private gltfRoot: THREE.Group | null = null;

  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb0b0b0); // Light grey background

    // Setup camera (will be positioned based on model bounds after loading)
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(0, 2, 5);

    // Renderer will be initialized in load()
    this.renderer = null as any;
  }

  async load(
    urlOrFile: string | File,
    canvas: HTMLCanvasElement,
    options?: LoadOptions
  ): Promise<void> {
    this.canvas = canvas;

    try {
      // Initialize renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;
      // Three.js 0.150.1 uses outputEncoding instead of outputColorSpace
      (this.renderer as any).outputEncoding = 3001; // THREE.sRGBEncoding

      // Setup orbit controls
      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 0.01;  // Allow 10x closer zoom
      this.controls.maxDistance = 500;   // Allow 5x farther zoom
      
      // Lock canvas by default - only enable orbit controls with MMB or right-click
      // Configure mouse buttons: only MMB and right-click control camera
      // Left button is disabled (we handle selection/drag manually)
      this.controls.mouseButtons = {
        LEFT: null,           // Disable left button (for object selection/dragging)
        MIDDLE: THREE.MOUSE.DOLLY,  // Middle button for zooming
        RIGHT: THREE.MOUSE.PAN,     // Right button for panning
      };
      
      // Disable rotation entirely - we only want pan and zoom
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      
      // Disable by default - will be enabled when MMB or right-click is pressed
      this.controls.enabled = false;

      // Setup transform controls (3-axis gizmo)
      this.transformControls = new TransformControls(this.camera, canvas);
      this.transformControls.setMode('translate'); // Start in translate mode
      this.transformControls.setSize(0.8); // Slightly smaller gizmo

      // Make gizmo non-blocking for raycasting
      this.transformControls.traverse((child: any) => {
        child.raycast = () => {}; // Disable raycast on gizmo parts
      });

      this.scene.add(this.transformControls);

      // Disable orbit controls when using transform controls
      this.transformControls.addEventListener('dragging-changed', (event) => {
        if (this.controls) {
          this.controls.enabled = !event.value;
        }
      });

      // Render scene when gizmo is used
      this.transformControls.addEventListener('change', () => {
        this.render();
      });

      // Update camera aspect ratio
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();

      // Setup DRACO decoder for compressed GLTF files
      const dracoLoader = new DRACOLoader();
      // Use Three.js CDN for DRACO decoder (works in browser)
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      dracoLoader.setDecoderConfig({ type: 'js' }); // Use JS decoder (works everywhere)
      this.loader.setDRACOLoader(dracoLoader);

      // Convert File to URL if needed
      const url = urlOrFile instanceof File ? URL.createObjectURL(urlOrFile) : urlOrFile;

      // Load GLTF/GLB
      const gltf = await new Promise<any>((resolve, reject) => {
        this.loader.load(
          url,
          (loadedGltf) => {
            options?.onProgress?.(100);
            resolve(loadedGltf);
          },
          (progress) => {
            const percentComplete = (progress.loaded / progress.total) * 100;
            options?.onProgress?.(percentComplete);
          },
          (error) => {
            reject(error);
          }
        );
      });

      // Add model to scene
      this.gltfRoot = gltf.scene;
      if (this.gltfRoot) {
        this.scene.add(this.gltfRoot);
      }

      // Setup default lighting if no lights in scene
      if (this.getLights().length === 0) {
        this.setupDefaultLighting();
      }

      // Auto-frame camera to fit model
      this.frameCameraToModel();

      this.loaded = true;

      // Cleanup blob URL if created
      if (urlOrFile instanceof File) {
        URL.revokeObjectURL(url);
      }

      // Start render loop
      this.startRenderLoop();
    } catch (error) {
      options?.onError?.(error as Error);
      throw new SceneAdapterError(
        `Failed to load GLTF scene: ${(error as Error).message}`,
        'gltf',
        'load'
      );
    }
  }

  private setupDefaultLighting(): void {
    // Stadium-grade lighting: bright, uniform, far-away light sources
    // Positioned far from scene to ensure consistent illumination across large models

    // HemisphereLight - Strong ambient base lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3.0);
    hemisphereLight.position.set(0, 1, 0);
    hemisphereLight.name = 'DefaultHemisphereLight';
    this.scene.add(hemisphereLight);

    // DirectionalLight - Main key light from far distance
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
    directionalLight.position.set(1000, 2000, 1000);
    directionalLight.name = 'DefaultDirectionalLight';
    this.scene.add(directionalLight);

    // Fill light from opposite side - also far away
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(-1000, 1000, -1000);
    fillLight.name = 'DefaultFillLight';
    this.scene.add(fillLight);

    // Back light for depth
    const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(0, 1000, -1500);
    backLight.name = 'DefaultBackLight';
    this.scene.add(backLight);
  }

  private frameCameraToModel(): void {
    if (!this.gltfRoot) return;

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(this.gltfRoot);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Calculate optimal camera distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2; // Add some breathing room

    // Position camera
    this.camera.position.set(center.x, center.y + maxDim * 0.3, center.z + cameraZ);
    this.camera.lookAt(center);

    // Update controls target
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  dispose(): void {
    this.stopRenderLoop();

    // Dispose Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.controls?.dispose();
    this.transformControls?.dispose();
    this.renderer?.dispose();

    // Dispose DRACO loader if attached
    const dracoLoader = (this.loader as any)._dracoLoader;
    if (dracoLoader) {
      dracoLoader.dispose();
    }

    this.scene.clear();
    this.canvas = null;
    this.loaded = false;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getFormat(): SceneFormat {
    return 'gltf';
  }

  getSceneInfo(): SceneInfo {
    let objectCount = 0;
    let materialCount = 0;
    const materials = new Set<Material>();
    const lights: Light[] = [];

    this.scene.traverse((object) => {
      objectCount++;
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => materials.add(mat));
        } else {
          materials.add(object.material);
        }
      }
      if (object instanceof THREE.Light) {
        lights.push(object);
      }
    });

    // Calculate bounding box
    let boundingBox;
    if (this.gltfRoot) {
      const box = new THREE.Box3().setFromObject(this.gltfRoot);
      boundingBox = {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      };
    }

    return {
      format: 'gltf',
      objectCount,
      materialCount: materials.size,
      lightCount: lights.length,
      cameraCount: 1, // We always have at least our main camera
      boundingBox,
    };
  }

  // Scene Query Methods

  findObjectByName(name: string): Object3D | null {
    let found: Object3D | null = null;

    this.scene.traverse((object) => {
      if (object.name && object.name.toLowerCase() === name.toLowerCase()) {
        found = object;
      }
    });

    return found;
  }

  findObjectById(id: string): Object3D | null {
    // Search by UUID (not numeric ID)
    // THREE.js has two ID systems:
    //   - object.id (numeric, auto-incremented)
    //   - object.uuid (string UUID)
    // Our selection system uses UUIDs for consistency
    let found: Object3D | null = null;

    this.scene.traverse((object) => {
      if (object.uuid === id) {
        found = object;
      }
    });

    return found;
  }

  getAllObjects(): Object3D[] {
    const objects: Object3D[] = [];

    this.scene.traverse((object) => {
      if (object !== this.scene && object.name) {
        objects.push(object);
      }
    });

    return objects;
  }

  getScene(): Scene {
    return this.scene;
  }

  // Transform Methods

  setPosition(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    obj.position.set(x, y, z);
    return true;
  }

  setRotation(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    obj.rotation.set(x, y, z);
    return true;
  }

  setScale(objectName: string, x: number, y: number, z: number): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    obj.scale.set(x, y, z);
    return true;
  }

  setVisible(objectName: string, visible: boolean): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj) return false;

    obj.visible = visible;
    return true;
  }

  // Material Methods

  private applyToMeshMaterial(objectName: string, fn: (mat: THREE.Material) => void): boolean {
    const obj = this.findObjectByName(objectName);
    if (!obj || !(obj instanceof THREE.Mesh)) return false;

    try {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => fn(mat));
      } else {
        fn(obj.material);
      }
      return true;
    } catch (error) {
      console.error(`GLTFAdapter: Failed to apply material change to "${objectName}":`, error);
      return false;
    }
  }

  setColor(objectName: string, color: number): boolean {
    return this.applyToMeshMaterial(objectName, (mat) => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        mat.color.setHex(color);
        mat.needsUpdate = true;
      } else if ('color' in mat) {
        (mat as any).color.setHex(color);
        mat.needsUpdate = true;
      }
    });
  }

  setRoughness(objectName: string, value: number): boolean {
    return this.applyToMeshMaterial(objectName, (mat) => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        mat.roughness = THREE.MathUtils.clamp(value, 0, 1);
        mat.needsUpdate = true;
      }
    });
  }

  setMetalness(objectName: string, value: number): boolean {
    return this.applyToMeshMaterial(objectName, (mat) => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        mat.metalness = THREE.MathUtils.clamp(value, 0, 1);
        mat.needsUpdate = true;
      }
    });
  }

  setEmissive(objectName: string, color: number, intensity: number = 1): boolean {
    return this.applyToMeshMaterial(objectName, (mat) => {
      if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
        mat.emissive.setHex(color);
        mat.emissiveIntensity = intensity;
        mat.needsUpdate = true;
      }
    });
  }

  // Camera Methods

  getCamera(): Camera {
    return this.camera;
  }

  setCameraPosition(x: number, y: number, z: number): boolean {
    this.camera.position.set(x, y, z);
    return true;
  }

  setCameraFOV(fov: number): boolean {
    this.camera.fov = THREE.MathUtils.clamp(fov, 1, 179);
    this.camera.updateProjectionMatrix();
    return true;
  }

  setCameraZoom(zoom: number): boolean {
    this.camera.zoom = Math.max(0.1, zoom);
    this.camera.updateProjectionMatrix();
    return true;
  }

  // Light Methods

  getLights(): Light[] {
    const lights: Light[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        lights.push(object);
      }
    });
    return lights;
  }

  setLightIntensity(lightName: string, intensity: number): boolean {
    const light = this.findObjectByName(lightName);
    if (!light || !(light instanceof THREE.Light)) return false;

    light.intensity = Math.max(0, intensity);
    return true;
  }

  setLightColor(lightName: string, color: number): boolean {
    const light = this.findObjectByName(lightName);
    if (!light || !(light instanceof THREE.Light)) return false;

    light.color.setHex(color);
    return true;
  }

  // Rendering

  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    // Only update OrbitControls when enabled (not while using TransformControls)
    if (this.controls?.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  startRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.render();
    };

    animate();
  }

  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Raycasting for object selection
  raycast(x: number, y: number): Object3D | null {
    if (!this.camera || !this.scene) {
      console.warn('⚠️ GLTFAdapter.raycast: Camera or scene not initialized');
      return null;
    }

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);

    // Set raycaster from camera and mouse position
    raycaster.setFromCamera(mouse, this.camera);

    // Get all intersectable objects (exclude helpers, lights, cameras, outlines, gizmos)
    // Include both Meshes and Groups (spheres/objects might be inside groups)
    const intersectableObjects: THREE.Object3D[] = [];
    const allObjects: THREE.Object3D[] = [];
    
    this.scene.traverse((object) => {
      allObjects.push(object);
      
      // Include both Meshes and Groups (groups might contain meshes like spheres)
      const isMesh = object instanceof THREE.Mesh;
      const isGroup = object instanceof THREE.Group;
      
      if (
        (isMesh || isGroup) &&
        object.visible &&
        !object.name.startsWith('__') && // Filter out internal objects like __selection_outline__
        !(object.parent?.name.startsWith('__')) && // Filter out children of internal objects
        object.parent !== this.transformControls // Filter out transform gizmo parts
      ) {
        intersectableObjects.push(object);
      }
    });

    console.info(`🔍 Raycast: Found ${intersectableObjects.length} intersectable objects out of ${allObjects.length} total objects`);
    if (intersectableObjects.length === 0) {
      console.warn('⚠️ Raycast: No intersectable objects found! Available objects:');
      allObjects.forEach((obj) => {
        console.warn(`  - ${obj.name || 'unnamed'} (type: ${obj.type}, visible: ${obj.visible}, parent: ${obj.parent?.name || 'none'})`);
      });
    }

    // Perform raycasting (recursive: true to traverse into Groups)
    const intersects = raycaster.intersectObjects(intersectableObjects, true);

    console.info(`🎯 Raycast: ${intersects.length} intersection(s) found`);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      let hit = intersection.object;
      
      // If we hit a Group, find the actual mesh that was intersected
      // THREE.js recursive raycast returns the Group, but we want the Mesh
      if (hit instanceof THREE.Group) {
        console.info(`🔍 Raycast hit Group "${hit.name}", searching for child mesh...`);
        
        // The intersection has face info, which means it hit a mesh child
        // Find the mesh child that was actually hit
        let foundMesh: THREE.Mesh | undefined = undefined;

        hit.traverse((child) => {
          if (child instanceof THREE.Mesh && child.visible) {
            // Check if this mesh's geometry was the one hit
            // We can verify by checking if the intersection point is within bounds
            // or just take the first visible mesh (simpler approach)
            if (!foundMesh) {
              foundMesh = child;
            }
          }
        });

        if (foundMesh !== undefined) {
          const mesh = foundMesh as THREE.Mesh;
          console.info(`✅ Found child mesh: "${mesh.name}" (UUID: ${mesh.uuid})`);
          hit = mesh;
        } else {
          console.warn(`⚠️ Group "${hit.name}" has no visible mesh children`);
          // Return the group anyway - SelectionOutline will handle it
        }
      }
      
      // Only return Meshes (Groups without meshes will be filtered out)
      if (hit instanceof THREE.Mesh) {
        console.info(`✅ Raycast hit: "${hit.name}" (UUID: ${hit.uuid}, type: ${hit.type})`);
        return hit;
      } else {
        console.warn(`⚠️ Raycast: Hit object "${hit.name}" is not a Mesh (type: ${hit.type})`);
        // Try to find any mesh in the hierarchy
        let meshFound: THREE.Mesh | undefined = undefined;
        hit.traverse((child) => {
          if (child instanceof THREE.Mesh && child.visible && !meshFound) {
            meshFound = child;
          }
        });
        if (meshFound !== undefined) {
          const mesh = meshFound as THREE.Mesh;
          console.info(`✅ Using child mesh: "${mesh.name}"`);
          return mesh;
        }
      }
    }

    console.info('⚪ Raycast: No objects hit');
    return null;
  }

  // Raycasting for face selection
  raycastFace(x: number, y: number): { object: Object3D; faceIndex: number } | null {
    if (!this.camera || !this.scene) {
      console.warn('⚠️ GLTFAdapter.raycastFace: Camera or scene not initialized');
      return null;
    }

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);

    // Set raycaster from camera and mouse position
    raycaster.setFromCamera(mouse, this.camera);

    // Get all intersectable objects
    const intersectableObjects: THREE.Object3D[] = [];
    this.scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.visible &&
        !object.name.startsWith('__') &&
        !(object.parent?.name.startsWith('__')) &&
        object.parent !== this.transformControls
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
  }

  // Transform Controls (Gizmo) Management

  /**
   * Attach transform controls gizmo to an object
   * Shows the 3-axis move gizmo (red=X, green=Y, blue=Z)
   */
  attachTransformControls(object: Object3D | null): void {
    if (!this.transformControls) {
      console.warn('⚠️ Transform controls not initialized');
      return;
    }

    if (object) {
      this.transformControls.attach(object);
      console.info(`🎯 Transform gizmo attached to "${object.name}"`);
    } else {
      this.transformControls.detach();
      console.info('⚪ Transform gizmo detached');
    }
  }

  /**
   * Set transform controls mode (translate, rotate, scale)
   */
  setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  /**
   * Get the transform controls instance (for advanced usage)
   */
  getTransformControls(): TransformControls | null {
    return this.transformControls;
  }

  /**
   * Get OrbitControls instance (for enabling/disabling during drag)
   */
  getControls(): OrbitControls | null {
    return this.controls;
  }

  // Utility: Handle window resize
  handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
