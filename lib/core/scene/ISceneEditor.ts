/**
 * ISceneEditor Interface
 *
 * Universal interface for scene manipulation across different platforms:
 * - Chrome Extension: Uses @splinetool/runtime
 * - Web App: Uses THREE.js DevTools (window.__THREE_DEVTOOLS__)
 *
 * This interface allows different implementations to share the same API surface
 * while using platform-specific underlying technologies.
 */

/**
 * 3D Vector (position, rotation, scale)
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * RGB Color (0-1 range)
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Operation result with success/error handling
 */
export interface OperationResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

/**
 * Universal Scene Editor Interface
 *
 * Implementations:
 * - SceneEditor: Extension implementation using @splinetool/runtime
 * - ThreeJSSceneEditor: Web app implementation using THREE.js DevTools
 */
export interface ISceneEditor {
  // ============================================================================
  // TRANSFORMATION METHODS
  // ============================================================================

  /**
   * Set absolute position of an object
   */
  setPosition(objectName: string, position: Vector3): Promise<OperationResult>;

  /**
   * Set absolute rotation of an object (in degrees)
   */
  setRotation(objectName: string, rotation: Vector3): Promise<OperationResult>;

  /**
   * Set absolute scale of an object
   */
  setScale(objectName: string, scale: Vector3): Promise<OperationResult>;

  /**
   * Move object by relative offset
   */
  move(objectName: string, offset: Vector3): Promise<OperationResult>;

  /**
   * Rotate object by relative angles (in degrees)
   */
  rotate(objectName: string, angles: Vector3): Promise<OperationResult>;

  // ============================================================================
  // MATERIAL METHODS
  // ============================================================================

  /**
   * Set color of an object
   */
  setColor(objectName: string, color: string | RGB): Promise<OperationResult>;

  /**
   * Set metalness (0-1, where 1 is fully metallic)
   */
  setMetalness(objectName: string, value: number): Promise<OperationResult>;

  /**
   * Set roughness (0-1, where 0 is glossy and 1 is matte)
   */
  setRoughness(objectName: string, value: number): Promise<OperationResult>;

  /**
   * Set emissive color (glow effect)
   */
  setEmissive(objectName: string, color: string | RGB, intensity?: number): Promise<OperationResult>;

  // ============================================================================
  // VISIBILITY METHODS
  // ============================================================================

  /**
   * Set visibility state
   */
  setVisible(objectName: string, visible: boolean): Promise<OperationResult>;

  /**
   * Hide object (convenience method)
   */
  hide(objectName: string): Promise<OperationResult>;

  /**
   * Show object (convenience method)
   */
  show(objectName: string): Promise<OperationResult>;

  /**
   * Toggle visibility
   */
  toggleVisibility(objectName: string): Promise<OperationResult>;

  // ============================================================================
  // CAMERA METHODS
  // ============================================================================

  /**
   * Set camera zoom level
   */
  setCameraZoom(zoom: number): Promise<OperationResult>;

  /**
   * Set camera field of view (in degrees)
   */
  setCameraFOV(fov: number): Promise<OperationResult>;

  // ============================================================================
  // LIGHTING METHODS
  // ============================================================================

  /**
   * Set light intensity
   */
  setLightIntensity(lightName: string, intensity: number): Promise<OperationResult>;

  /**
   * Set light color
   */
  setLightColor(lightName: string, color: string | RGB): Promise<OperationResult>;

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get object by name
   */
  getObject(objectName: string): Promise<any>;

  /**
   * Get all objects in the scene
   */
  getAllObjects(): Promise<any[]>;

  // ============================================================================
  // ADVANCED METHODS (Phase 2)
  // ============================================================================

  /**
   * Duplicate object with optional pattern (grid, circle, scatter)
   */
  duplicateObject(
    sourceName: string,
    options: {
      count?: number;
      pattern?: 'linear' | 'grid' | 'circle' | 'scatter';
      spacing?: number;
      offset?: Vector3;
    }
  ): Promise<OperationResult>;

  /**
   * Apply primitive operation (batch operations)
   */
  applyPrimitive(
    operation: string,
    targets: string[],
    params: Record<string, any>
  ): Promise<OperationResult>;
}

/**
 * Factory function type for creating scene editors
 */
export type SceneEditorFactory = () => Promise<ISceneEditor>;
