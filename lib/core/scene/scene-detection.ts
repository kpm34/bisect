/**
 * Scene Detection Service
 *
 * Detects and tracks Spline scene state including:
 * - Selected objects
 * - Scene hierarchy
 * - Object properties
 * - Camera state
 * - Lighting information
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ObjectProperties {
  uuid: string;
  name: string;
  type: string;
  visible: boolean;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  material?: MaterialProperties;
  parent?: string; // Parent UUID
  children?: string[]; // Child UUIDs
}

export interface MaterialProperties {
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transmission?: number;
  ior?: number;
}

export interface CameraState {
  position: Vector3;
  rotation: Vector3;
  fov?: number;
  type: 'PerspectiveCamera' | 'OrthographicCamera';
}

export interface LightInfo {
  uuid: string;
  name: string;
  type: string;
  color?: string;
  intensity?: number;
  position?: Vector3;
}

export interface SceneContext {
  // Selection state
  selectedObjects: ObjectProperties[];
  selectionCount: number;

  // Scene state
  allObjects: ObjectProperties[];
  objectCount: number;
  visibleObjectCount: number;

  // Scene hierarchy
  rootObjects: string[]; // UUIDs of top-level objects

  // Camera
  camera?: CameraState;

  // Lighting
  lights: LightInfo[];

  // Metadata
  timestamp: number;
  sceneUrl?: string;
}

export interface SelectionChangeEvent {
  selected: ObjectProperties[];
  deselected: ObjectProperties[];
  timestamp: number;
}

/**
 * Scene Detection Class
 * Extracts scene data from Spline runtime
 */
export class SceneDetector {
  private lastSelection: Set<string> = new Set();
  private selectionListeners: Array<(event: SelectionChangeEvent) => void> = [];

  /**
   * Get scene context from page-context-bridge
   * Communicates via custom events since content scripts run in isolated world
   */
  private async getSceneContextFromBridge(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set up listener for response
      const responseHandler = (event: Event) => {
        const customEvent = event as CustomEvent;
        console.log('🌉 [Scene Detection] Received bridge response:', customEvent.detail);
        window.removeEventListener('SPLINE_CONTEXT_RESPONSE', responseHandler);
        resolve(customEvent.detail);
      };

      // Listen for response
      window.addEventListener('SPLINE_CONTEXT_RESPONSE', responseHandler);

      // Request context from page-context-bridge
      console.log('🌉 [Scene Detection] Dispatching SPLINE_GET_CONTEXT event');
      window.dispatchEvent(new CustomEvent('SPLINE_GET_CONTEXT'));

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('SPLINE_CONTEXT_RESPONSE', responseHandler);
        reject(new Error('Bridge response timeout - page-context-bridge may not be injected'));
      }, 5000);
    });
  }

  /**
   * Extract full scene context from Spline
   */
  async detectScene(): Promise<SceneContext | null> {
    try {
      console.log('🎬 [Scene Detection] Starting scene detection...');

      // Call page-context-bridge to get scene data
      // The bridge runs in page context and can access Spline Application
      const context = await this.getSceneContextFromBridge();

      if (!context || context.error) {
        console.warn('⚠️ [Scene Detection] Failed to get context from bridge:', context?.error);
        return null;
      }

      console.log('✅ [Scene Detection] Got context from bridge:', {
        objectCount: context.objectCount,
        selectionSource: context.selectionSource,
        selectedCount: context.selectedObjects?.length || 0
      });

      // Convert bridge data to our SceneContext format
      const allObjects: ObjectProperties[] = (context.allObjects || []).map((obj: any) => ({
        uuid: obj.uuid,
        name: obj.name || 'Unnamed',
        type: obj.type || 'Object3D',
        visible: obj.visible !== false,
        position: obj.position || { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }, // Not provided by bridge yet
        scale: { x: 1, y: 1, z: 1 }, // Not provided by bridge yet
      }));

      // Get selected objects from bridge (click tracking or fallback)
      const selectedObjects: ObjectProperties[] = (context.selectedObjects || []).map((obj: any) => ({
        uuid: obj.uuid,
        name: obj.name || 'Unnamed',
        type: obj.type || 'Object3D',
        visible: obj.visible !== false,
        position: obj.position || { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      }));

      console.log(`✅ [Scene Detection] Context assembled:`, {
        totalObjects: allObjects.length,
        selectedObjects: selectedObjects.length,
        selectionSource: context.selectionSource
      });

      const sceneContext: SceneContext = {
        selectedObjects,
        selectionCount: selectedObjects.length,
        allObjects,
        objectCount: allObjects.length,
        visibleObjectCount: allObjects.filter(obj => obj.visible).length,
        rootObjects: [], // Not tracked yet
        lights: [], // Not tracked yet
        timestamp: Date.now(),
        sceneUrl: window.location.href,
      };

      console.log('✅ [Scene Detection] Scene context complete:', {
        objectCount: sceneContext.objectCount,
        visibleObjectCount: sceneContext.visibleObjectCount,
        selectionCount: sceneContext.selectionCount,
        selectedObjects: sceneContext.selectedObjects.map(obj => obj.name),
        selectionSource: context.selectionSource || 'none'
      });

      return sceneContext;
    } catch (error) {
      console.error('❌ [Scene Detection] Scene detection failed:', error);
      return null;
    }
  }

  /**
   * Get currently selected objects in Spline
   * NOTE: Currently unused - selection comes from page-context-bridge
   * Kept for reference/debugging
   */
  private async _getSelectedObjects(allObjects: ObjectProperties[]): Promise<ObjectProperties[]> {
    try {
      const spline = (window as any).__SPLINE__ || (window as any).spline;

      console.log('🔍 [Scene Detection] Starting selection detection...');
      console.log('🔍 [Scene Detection] Spline object available:', !!spline);
      console.log('🔍 [Scene Detection] Total objects in scene:', allObjects.length);

      // Try to access selection from Spline's internal state
      // Note: This is reverse-engineered and may need updates
      const selectedUuids = new Set<string>();

      // Method 1: Check for selected property on scene objects
      if (spline.scene) {
        const method1Uuids: string[] = [];
        const checkSelected = (node: any) => {
          if (node.selected === true || node.userData?.selected === true) {
            selectedUuids.add(node.uuid);
            method1Uuids.push(node.uuid);
            console.log(`🔍 [Method 1] Found selected node: ${node.name || node.uuid}`, {
              uuid: node.uuid,
              name: node.name,
              type: node.type,
              selected: node.selected,
              userDataSelected: node.userData?.selected
            });
          }
          if (node.children) {
            node.children.forEach(checkSelected);
          }
        };
        checkSelected(spline.scene);
        console.log(`🔍 [Method 1] Scene traversal complete. Found ${method1Uuids.length} selected objects`);
      } else {
        console.log('🔍 [Method 1] spline.scene not available');
      }

      // Method 2: Check Spline's selection manager (if available)
      if (spline.selection) {
        console.log('🔍 [Method 2] spline.selection found:', typeof spline.selection);
        const selection = spline.selection;
        if (Array.isArray(selection)) {
          console.log(`🔍 [Method 2] Selection is array with ${selection.length} items`);
          selection.forEach((obj: any, index: number) => {
            console.log(`🔍 [Method 2] Selection[${index}]:`, {
              uuid: obj.uuid,
              name: obj.name,
              type: obj.type
            });
            if (obj.uuid) selectedUuids.add(obj.uuid);
          });
        } else if (selection.uuid) {
          console.log('🔍 [Method 2] Selection is single object:', {
            uuid: selection.uuid,
            name: selection.name,
            type: selection.type
          });
          selectedUuids.add(selection.uuid);
        } else {
          console.log('🔍 [Method 2] Selection structure unknown:', selection);
        }
      } else {
        console.log('🔍 [Method 2] spline.selection not available');
      }

      // Method 3: Check editor state (for Spline editor integration)
      if (spline.editor?.selection) {
        console.log('🔍 [Method 3] spline.editor.selection found:', typeof spline.editor.selection);
        const editorSelection = spline.editor.selection;
        if (Array.isArray(editorSelection)) {
          console.log(`🔍 [Method 3] Editor selection is array with ${editorSelection.length} items`);
          editorSelection.forEach((obj: any, index: number) => {
            console.log(`🔍 [Method 3] EditorSelection[${index}]:`, {
              uuid: obj.uuid,
              name: obj.name,
              type: obj.type
            });
            if (obj.uuid) selectedUuids.add(obj.uuid);
          });
        } else {
          console.log('🔍 [Method 3] Editor selection structure unknown:', editorSelection);
        }
      } else {
        console.log('🔍 [Method 3] spline.editor.selection not available');
        console.log('🔍 [Method 3] spline.editor exists:', !!spline.editor);
      }

      console.log(`🔍 [Selection Detection] Total unique selected UUIDs: ${selectedUuids.size}`);
      console.log('🔍 [Selection Detection] Selected UUIDs:', Array.from(selectedUuids));

      // Filter objects by selected UUIDs
      const selectedObjects = allObjects.filter(obj => selectedUuids.has(obj.uuid));

      console.log(`🔍 [Selection Detection] Matched ${selectedObjects.length} objects from scene`);
      selectedObjects.forEach(obj => {
        console.log(`🔍 [Selected Object]:`, {
          uuid: obj.uuid,
          name: obj.name,
          type: obj.type,
          position: obj.position,
          visible: obj.visible
        });
      });

      return selectedObjects;
    } catch (error) {
      console.error('❌ [Selection Detection] Failed to get selected objects:', error);
      return [];
    }
  }

  /**
   * Monitor selection changes
   */
  startSelectionMonitoring(intervalMs: number = 500): void {
    setInterval(async () => {
      try {
        const context = await this.detectScene();
        if (!context) return;

        const currentSelection = new Set(context.selectedObjects.map(obj => obj.uuid));

        // Check if selection changed
        if (!this.setsEqual(currentSelection, this.lastSelection)) {
          const event: SelectionChangeEvent = {
            selected: context.selectedObjects.filter(obj => !this.lastSelection.has(obj.uuid)),
            deselected: Array.from(this.lastSelection)
              .filter(uuid => !currentSelection.has(uuid))
              .map(uuid => context.allObjects.find(obj => obj.uuid === uuid))
              .filter(Boolean) as ObjectProperties[],
            timestamp: Date.now(),
          };

          // Notify listeners
          this.selectionListeners.forEach(listener => {
            try {
              listener(event);
            } catch (error) {
              console.error('Selection listener error:', error);
            }
          });

          this.lastSelection = currentSelection;
        }
      } catch (error) {
        console.error('Selection monitoring error:', error);
      }
    }, intervalMs);
  }

  /**
   * Add selection change listener
   */
  onSelectionChange(callback: (event: SelectionChangeEvent) => void): () => void {
    this.selectionListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.selectionListeners.indexOf(callback);
      if (index > -1) {
        this.selectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Extract Vector3 from Three.js object
   */
  private extractVector3(vec: any, isRotation: boolean = false): Vector3 {
    if (!vec) return { x: 0, y: 0, z: 0 };

    return {
      x: typeof vec.x === 'number' ? (isRotation ? this.radToDeg(vec.x) : vec.x) : 0,
      y: typeof vec.y === 'number' ? (isRotation ? this.radToDeg(vec.y) : vec.y) : 0,
      z: typeof vec.z === 'number' ? (isRotation ? this.radToDeg(vec.z) : vec.z) : 0,
    };
  }

  /**
   * Extract material properties
   * NOTE: Currently unused - kept for reference/debugging
   */
  private _extractMaterial(material: any): MaterialProperties {
    const props: MaterialProperties = {};

    try {
      if (material.color) {
        props.color = `#${material.color.getHexString()}`;
      }
      if (typeof material.roughness === 'number') {
        props.roughness = material.roughness;
      }
      if (typeof material.metalness === 'number') {
        props.metalness = material.metalness;
      }
      if (typeof material.opacity === 'number') {
        props.opacity = material.opacity;
      }
      if (material.emissive) {
        props.emissive = `#${material.emissive.getHexString()}`;
      }
      if (typeof material.emissiveIntensity === 'number') {
        props.emissiveIntensity = material.emissiveIntensity;
      }
      if (typeof material.transmission === 'number') {
        props.transmission = material.transmission;
      }
      if (typeof material.ior === 'number') {
        props.ior = material.ior;
      }
    } catch (error) {
      console.error('Material extraction error:', error);
    }

    return props;
  }

  /**
   * Extract camera state
   * NOTE: Currently unused - kept for reference/debugging
   */
  private _extractCamera(camera: any): CameraState | undefined {
    if (!camera) return undefined;

    try {
      return {
        position: this.extractVector3(camera.position),
        rotation: this.extractVector3(camera.rotation, true),
        fov: camera.fov,
        type: camera.isPerspectiveCamera ? 'PerspectiveCamera' : 'OrthographicCamera',
      };
    } catch (error) {
      console.error('Camera extraction error:', error);
      return undefined;
    }
  }

  /**
   * Convert radians to degrees
   */
  private radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  /**
   * Check if two sets are equal
   */
  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
}

// Singleton instance
let detectorInstance: SceneDetector | null = null;

export function getSceneDetector(): SceneDetector {
  if (!detectorInstance) {
    detectorInstance = new SceneDetector();
  }
  return detectorInstance;
}
