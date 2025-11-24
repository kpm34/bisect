/**
 * Scene Extractor
 *
 * Extracts comprehensive scene data from Spline 3D scenes including:
 * - Objects (meshes, lights, cameras)
 * - Materials and textures
 * - Transformations (position, rotation, scale)
 * - Scene hierarchy
 * - Metadata
 */

/**
 * Vector3 represents a 3D position, rotation, or scale
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Object transformation data
 */
export interface ObjectTransform {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

/**
 * Material properties
 */
export interface MaterialData {
    color?: string;
    opacity?: number;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    transparent?: boolean;
}

/**
 * Spline object data
 */
export interface SplineObject {
    uuid: string;
    name: string;
    type: string;
    visible: boolean;
    transform: ObjectTransform;
    material?: MaterialData;
    children?: string[]; // UUIDs of child objects
    parent?: string; // UUID of parent object
}

/**
 * Camera data
 */
export interface CameraData {
    uuid: string;
    name: string;
    type: string;
    position: Vector3;
    rotation: Vector3;
    fov?: number;
    near?: number;
    far?: number;
}

/**
 * Light data
 */
export interface LightData {
    uuid: string;
    name: string;
    type: string;
    position: Vector3;
    color?: string;
    intensity?: number;
    castShadow?: boolean;
}

/**
 * Complete scene data
 */
export interface SceneData {
    objects: SplineObject[];
    cameras: CameraData[];
    lights: LightData[];
    metadata: {
        objectCount: number;
        visibleObjectCount: number;
        timestamp: number;
        sceneUrl?: string;
    };
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Scene Extractor Class
 */
export class SceneExtractor {
    /**
     * Extract scene data from Spline
     */
    static extractScene(splineInstance: any): SceneData {
        if (!splineInstance) {
            throw new Error('Spline instance is null or undefined');
        }

        if (!splineInstance.scene) {
            throw new Error('Spline scene not found');
        }

        const scene = splineInstance.scene;
        const objects: SplineObject[] = [];
        const cameras: CameraData[] = [];
        const lights: LightData[] = [];

        // Traverse scene hierarchy
        this.traverseScene(scene, objects, cameras, lights);

        const visibleCount = objects.filter(obj => obj.visible).length;

        return {
            objects,
            cameras,
            lights,
            metadata: {
                objectCount: objects.length,
                visibleObjectCount: visibleCount,
                timestamp: Date.now(),
            },
        };
    }

    /**
     * Traverse scene hierarchy and extract objects
     */
    private static traverseScene(
        node: any,
        objects: SplineObject[],
        cameras: CameraData[],
        lights: LightData[],
        parentUuid?: string
    ): void {
        if (!node) return;

        // Extract based on type
        if (node.isCamera) {
            cameras.push(this.extractCamera(node));
        } else if (node.isLight) {
            lights.push(this.extractLight(node));
        } else if (node.isMesh || node.isGroup || node.isObject3D) {
            objects.push(this.extractObject(node, parentUuid));
        }

        // Traverse children
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                this.traverseScene(child, objects, cameras, lights, node.uuid);
            }
        }
    }

    /**
     * Extract object data
     */
    private static extractObject(node: any, parentUuid?: string): SplineObject {
        const transform = this.extractTransform(node);
        const material = node.material ? this.extractMaterial(node.material) : undefined;

        const children: string[] = [];
        if (node.children && Array.isArray(node.children)) {
            children.push(...node.children.map((child: any) => child.uuid));
        }

        return {
            uuid: node.uuid || `object_${Date.now()}_${Math.random()}`,
            name: node.name || 'Unnamed',
            type: this.getObjectType(node),
            visible: node.visible !== false,
            transform,
            material,
            children: children.length > 0 ? children : undefined,
            parent: parentUuid,
        };
    }

    /**
     * Extract camera data
     */
    private static extractCamera(node: any): CameraData {
        return {
            uuid: node.uuid || `camera_${Date.now()}`,
            name: node.name || 'Camera',
            type: node.type || 'PerspectiveCamera',
            position: this.extractVector3(node.position),
            rotation: this.extractVector3(node.rotation),
            fov: node.fov,
            near: node.near,
            far: node.far,
        };
    }

    /**
     * Extract light data
     */
    private static extractLight(node: any): LightData {
        return {
            uuid: node.uuid || `light_${Date.now()}`,
            name: node.name || 'Light',
            type: node.type || 'Light',
            position: this.extractVector3(node.position),
            color: node.color ? this.colorToHex(node.color) : undefined,
            intensity: node.intensity,
            castShadow: node.castShadow,
        };
    }

    /**
     * Extract transformation data
     */
    private static extractTransform(node: any): ObjectTransform {
        return {
            position: this.extractVector3(node.position),
            rotation: this.extractVector3(node.rotation),
            scale: this.extractVector3(node.scale),
        };
    }

    /**
     * Extract Vector3 data
     */
    private static extractVector3(vector: any): Vector3 {
        if (!vector) {
            return { x: 0, y: 0, z: 0 };
        }

        return {
            x: vector.x ?? 0,
            y: vector.y ?? 0,
            z: vector.z ?? 0,
        };
    }

    /**
     * Extract material data
     */
    private static extractMaterial(material: any): MaterialData {
        if (!material) {
            return {};
        }

        return {
            color: material.color ? this.colorToHex(material.color) : undefined,
            opacity: material.opacity,
            metalness: material.metalness,
            roughness: material.roughness,
            emissive: material.emissive ? this.colorToHex(material.emissive) : undefined,
            emissiveIntensity: material.emissiveIntensity,
            transparent: material.transparent,
        };
    }

    /**
     * Convert Three.js color to hex string
     */
    private static colorToHex(color: any): string {
        if (!color) return '#000000';

        // If color has getHexString method (Three.js Color)
        if (typeof color.getHexString === 'function') {
            return `#${color.getHexString()}`;
        }

        // If color is a number
        if (typeof color === 'number') {
            return `#${color.toString(16).padStart(6, '0')}`;
        }

        // If color is already a string
        if (typeof color === 'string') {
            return color.startsWith('#') ? color : `#${color}`;
        }

        return '#000000';
    }

    /**
     * Get object type from node
     */
    private static getObjectType(node: any): string {
        if (node.type) return node.type;
        if (node.isMesh) return 'Mesh';
        if (node.isGroup) return 'Group';
        if (node.isObject3D) return 'Object3D';
        return 'Unknown';
    }

    /**
     * Validate scene data
     */
    static validateScene(sceneData: SceneData): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if scene data exists
        if (!sceneData) {
            errors.push('Scene data is null or undefined');
            return { valid: false, errors, warnings };
        }

        // Check objects array
        if (!Array.isArray(sceneData.objects)) {
            errors.push('Objects array is missing or invalid');
        } else {
            // Validate each object
            sceneData.objects.forEach((obj, index) => {
                if (!obj.uuid) {
                    errors.push(`Object at index ${index} missing UUID`);
                }
                if (!obj.name) {
                    warnings.push(`Object at index ${index} missing name`);
                }
                if (!obj.transform) {
                    errors.push(`Object ${obj.uuid} missing transform data`);
                } else {
                    this.validateTransform(obj.transform, `Object ${obj.uuid}`, errors);
                }
            });
        }

        // Check cameras array
        if (!Array.isArray(sceneData.cameras)) {
            warnings.push('Cameras array is missing or invalid');
        }

        // Check lights array
        if (!Array.isArray(sceneData.lights)) {
            warnings.push('Lights array is missing or invalid');
        }

        // Check metadata
        if (!sceneData.metadata) {
            errors.push('Metadata is missing');
        } else {
            if (typeof sceneData.metadata.objectCount !== 'number') {
                errors.push('Metadata objectCount is invalid');
            }
            if (typeof sceneData.metadata.timestamp !== 'number') {
                errors.push('Metadata timestamp is invalid');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Validate transform data
     */
    private static validateTransform(
        transform: ObjectTransform,
        context: string,
        errors: string[]
    ): void {
        if (!transform.position) {
            errors.push(`${context}: position is missing`);
        } else {
            this.validateVector3(transform.position, `${context} position`, errors);
        }

        if (!transform.rotation) {
            errors.push(`${context}: rotation is missing`);
        } else {
            this.validateVector3(transform.rotation, `${context} rotation`, errors);
        }

        if (!transform.scale) {
            errors.push(`${context}: scale is missing`);
        } else {
            this.validateVector3(transform.scale, `${context} scale`, errors);
        }
    }

    /**
     * Validate Vector3 data
     */
    private static validateVector3(
        vector: Vector3,
        context: string,
        errors: string[]
    ): void {
        if (typeof vector.x !== 'number' || isNaN(vector.x)) {
            errors.push(`${context}: x is not a valid number`);
        }
        if (typeof vector.y !== 'number' || isNaN(vector.y)) {
            errors.push(`${context}: y is not a valid number`);
        }
        if (typeof vector.z !== 'number' || isNaN(vector.z)) {
            errors.push(`${context}: z is not a valid number`);
        }
    }

    /**
     * Get object by UUID
     */
    static getObjectByUuid(sceneData: SceneData, uuid: string): SplineObject | undefined {
        return sceneData.objects.find(obj => obj.uuid === uuid);
    }

    /**
     * Get object by name
     */
    static getObjectByName(sceneData: SceneData, name: string): SplineObject | undefined {
        return sceneData.objects.find(obj => obj.name === name);
    }

    /**
     * Get visible objects
     */
    static getVisibleObjects(sceneData: SceneData): SplineObject[] {
        return sceneData.objects.filter(obj => obj.visible);
    }

    /**
     * Get objects by type
     */
    static getObjectsByType(sceneData: SceneData, type: string): SplineObject[] {
        return sceneData.objects.filter(obj => obj.type === type);
    }
}

export default SceneExtractor;
