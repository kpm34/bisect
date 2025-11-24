/**
 * @/lib/core/adapters - Universal 3D Scene Adapters
 *
 * Provides a unified interface for working with multiple 3D file formats:
 * - Spline (.splinecode)
 * - GLTF/GLB (.gltf, .glb)
 * - FBX, OBJ (coming soon)
 *
 * @example
 * ```typescript
 * import { UniversalEditor } from '@/lib/core/adapters';
 *
 * const editor = new UniversalEditor();
 * await editor.load('model.glb', canvas);
 *
 * // Works with any format!
 * editor.setColor('Cube', 0xff0000);
 * editor.setPosition('Sphere', 0, 5, 0);
 * ```
 */

export * from './ISceneAdapter';
export * from './SplineAdapter';
export * from './GLTFAdapter';
export * from './UniversalEditor';
