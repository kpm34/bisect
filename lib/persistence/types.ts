/**
 * Type definitions for the scene persistence system
 *
 * This module defines the data structures for:
 * - Scene editing sessions
 * - Edit deltas (individual changes)
 * - Undo/redo history
 * - Storage metadata
 */

/**
 * Supported object properties that can be edited
 */
export type EditableProperty =
  | 'position'
  | 'rotation'
  | 'scale'
  | 'color'
  | 'roughness'
  | 'metalness'
  | 'emissive'
  | 'opacity'
  | 'visible';

/**
 * Represents a single change to an object property
 * Used for undo/redo and session restoration
 */
export interface EditDelta {
  /** Unique identifier for the THREE.js object */
  objectId: string;

  /** Human-readable name of the object (may not be unique) */
  objectName: string;

  /** Type of THREE.js object (Mesh, Light, Camera, etc.) */
  objectType: string;

  /** Property that was changed */
  property: EditableProperty;

  /** Value before the change (for undo) */
  oldValue: any;

  /** Value after the change (for redo) */
  newValue: any;

  /** Timestamp when edit was made */
  timestamp: number;

  /** Optional user-friendly description */
  description?: string;
}

/**
 * Represents a complete editing session for a scene file
 * Stored in localStorage for quick restoration
 */
export interface SceneSession {
  /** Unique identifier for this session */
  sessionId: string;

  /** SHA-256 hash of the original file (for matching on reload) */
  fileHash: string;

  /** Original filename */
  fileName: string;

  /** File size in bytes */
  fileSize: number;

  /** File type (.splinecode, .gltf, .glb) */
  fileType: string;

  /** When the file was first uploaded */
  uploadedAt: number;

  /** When the session was last modified */
  lastModified: number;

  /** All edits made in this session (chronological order) */
  edits: EditDelta[];

  /** Number of times undo was performed */
  undoCount: number;

  /** Whether this session is active */
  isActive: boolean;
}

/**
 * History entry for undo/redo functionality
 * Stored in IndexedDB for larger history
 */
export interface HistoryEntry {
  /** Unique identifier for this history entry */
  id: string;

  /** Session this entry belongs to */
  sessionId: string;

  /** The edit delta */
  delta: EditDelta;

  /** Stack position (0 = oldest) */
  position: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * History state for undo/redo management
 */
export interface HistoryState {
  /** All history entries */
  entries: HistoryEntry[];

  /** Current position in history (-1 = no history) */
  currentIndex: number;

  /** Maximum history size (default: 100) */
  maxSize: number;
}

/**
 * Storage metadata for managing multiple sessions
 */
export interface StorageMetadata {
  /** Version of the storage schema */
  version: string;

  /** Total number of sessions stored */
  sessionCount: number;

  /** Total storage used (bytes) */
  storageUsed: number;

  /** When storage was last cleaned up */
  lastCleanup: number;

  /** Active session ID */
  activeSessionId: string | null;
}

/**
 * Configuration for the persistence system
 */
export interface PersistenceConfig {
  /** Key prefix for localStorage */
  storagePrefix: string;

  /** Maximum age for sessions (days) */
  maxSessionAge: number;

  /** Maximum number of sessions to keep */
  maxSessions: number;

  /** Maximum undo history size */
  maxHistorySize: number;

  /** Enable auto-save */
  autoSave: boolean;

  /** Auto-save interval (ms) */
  autoSaveInterval: number;

  /** Enable IndexedDB for history */
  useIndexedDB: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  storagePrefix: 'prism_scene_',
  maxSessionAge: 7, // 7 days
  maxSessions: 10,
  maxHistorySize: 100,
  autoSave: true,
  autoSaveInterval: 2000, // 2 seconds
  useIndexedDB: true,
};

/**
 * Result of a restore operation
 */
export interface RestoreResult {
  success: boolean;
  session: SceneSession | null;
  editsApplied: number;
  error?: string;
}

/**
 * Statistics about current storage usage
 */
export interface StorageStats {
  sessionCount: number;
  totalEdits: number;
  storageUsed: number;
  storageLimit: number;
  oldestSession: number;
  newestSession: number;
}
