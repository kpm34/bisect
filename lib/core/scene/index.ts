// Export universal scene editor interface
export type {
  ISceneEditor,
  Vector3,
  RGB,
  OperationResult,
  SceneEditorFactory,
} from './ISceneEditor';

// Note: Removed for browser compatibility:
// - spline-editing (Chrome extension code injection)
// - spline-runtime (Node.js fs module)
// - scene-extractor (Node.js dependencies)
// - scene-detection (Chrome extension specific)
