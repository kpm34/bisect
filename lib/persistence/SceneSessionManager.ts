/**
 * SceneSessionManager
 *
 * Manages scene editing sessions with localStorage persistence.
 * Key responsibilities:
 * - File hashing (SHA-256) for scene identification
 * - Session creation, saving, loading, deletion
 * - Edit delta tracking
 * - Storage cleanup and quota management
 * - Session restoration across browser refreshes
 */

import type {
  SceneSession,
  EditDelta,
  StorageMetadata,
  PersistenceConfig,
  RestoreResult,
  StorageStats,
} from './types';
import { DEFAULT_PERSISTENCE_CONFIG } from './types';

export class SceneSessionManager {
  private config: PersistenceConfig;

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = { ...DEFAULT_PERSISTENCE_CONFIG, ...config };
  }

  /**
   * Hash a file using SHA-256 for unique identification
   * This allows us to match uploaded files with saved sessions
   * 
   * For large files (>50MB), uses a chunked approach or falls back to metadata-based hash
   */
  async hashFile(file: File): Promise<string> {
    try {
      // For very large files (>50MB), use metadata-based hash to avoid memory issues
      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
      if (file.size > LARGE_FILE_THRESHOLD) {
        console.warn(`⚠️ Large file detected (${(file.size / 1024 / 1024).toFixed(2)} MB), using metadata-based hash`);
        return this.getMetadataHash(file);
      }

      // Check if crypto.subtle is available
      if (!crypto.subtle) {
        console.warn('⚠️ crypto.subtle not available, using metadata-based hash');
        return this.getMetadataHash(file);
      }

      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      console.log(`✅ File hashed successfully: ${hash.substring(0, 16)}... (${file.name})`);
      return hash;
    } catch (error) {
      console.error('❌ Failed to hash file:', error);
      console.warn('⚠️ Falling back to metadata-based hash');
      // Fallback to metadata-based hash (more reliable than filename alone)
      return this.getMetadataHash(file);
    }
  }

  /**
   * Generate a hash based on file metadata (name, size, lastModified)
   * This is less reliable than SHA-256 but works when crypto.subtle fails
   * 
   * Note: For restored files, lastModified might differ, so we prioritize name+size+extension
   */
  private getMetadataHash(file: File): string {
    // Include file extension in hash for better matching
    const ext = this.getFileExtension(file.name);
    // Use name + size + extension (more stable than lastModified which can change)
    const hash = `${file.name}_${file.size}_${ext}`;
    console.log(`📝 Using metadata hash: ${hash.substring(0, 50)}...`);
    return hash;
  }

  /**
   * Create a new scene session
   */
  async createSession(file: File): Promise<SceneSession> {
    const fileHash = await this.hashFile(file);
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: SceneSession = {
      sessionId,
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      fileType: this.getFileExtension(file.name),
      uploadedAt: Date.now(),
      lastModified: Date.now(),
      edits: [],
      undoCount: 0,
      isActive: true,
    };

    this.saveSession(session);
    this.updateMetadata({ activeSessionId: sessionId });

    return session;
  }

  /**
   * Find an existing session by file hash
   */
  async findSessionByFile(file: File): Promise<SceneSession | null> {
    const fileHash = await this.hashFile(file);
    return this.findSessionByHash(fileHash);
  }

  /**
   * Find session by hash
   * Also tries partial matching for metadata-based hashes (name+size match)
   */
  findSessionByHash(fileHash: string): SceneSession | null {
    const sessions = this.getAllSessions();
    
    // First try exact match
    const exactMatch = sessions.find((s) => s.fileHash === fileHash);
    if (exactMatch) {
      return exactMatch;
    }
    
    // For metadata-based hashes, try partial matching (name+size)
    // This handles cases where lastModified differs between uploads
    if (fileHash.includes('_')) {
      const parts = fileHash.split('_');
      if (parts.length >= 2) {
        const fileName = parts[0];
        const fileSize = parts[1];
        
        // Try to find session with matching name and size
        const partialMatch = sessions.find((s) => {
          if (s.fileHash.includes('_')) {
            const sessionParts = s.fileHash.split('_');
            return sessionParts[0] === fileName && sessionParts[1] === fileSize;
          }
          return false;
        });
        
        if (partialMatch) {
          console.log(`✅ Found session with partial match (name+size): ${partialMatch.fileName}`);
          return partialMatch;
        }
      }
    }
    
    return null;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SceneSession | null {
    try {
      const key = this.getSessionKey(sessionId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Save session to localStorage
   */
  saveSession(session: SceneSession): boolean {
    try {
      session.lastModified = Date.now();
      const key = this.getSessionKey(session.sessionId);
      localStorage.setItem(key, JSON.stringify(session));

      // Update metadata
      this.updateMetadata();

      return true;
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, cleaning up old sessions...');
        this.cleanupOldSessions(1); // Aggressively remove old sessions
        try {
          localStorage.setItem(this.getSessionKey(session.sessionId), JSON.stringify(session));
          return true;
        } catch (retryError) {
          console.error('Failed to save session after cleanup:', retryError);
          return false;
        }
      }
      console.error('Failed to save session:', error);
      return false;
    }
  }

  /**
   * Add an edit delta to a session
   */
  addEdit(sessionId: string, delta: EditDelta): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.edits.push(delta);
    return this.saveSession(session);
  }

  /**
   * Remove the last edit from a session (for undo)
   */
  removeLastEdit(sessionId: string): EditDelta | null {
    const session = this.getSession(sessionId);
    if (!session || session.edits.length === 0) return null;

    const lastEdit = session.edits.pop()!;
    session.undoCount++;
    this.saveSession(session);

    return lastEdit;
  }

  /**
   * Get all stored sessions
   */
  getAllSessions(): SceneSession[] {
    const sessions: SceneSession[] = [];
    const prefix = this.config.storagePrefix;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix) && !key.endsWith('_metadata')) {
          const data = localStorage.getItem(key);
          if (data) {
            sessions.push(JSON.parse(data));
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all sessions:', error);
    }

    return sessions.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    try {
      const key = this.getSessionKey(sessionId);
      localStorage.removeItem(key);
      this.updateMetadata();
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Cleanup old sessions based on config
   */
  cleanupOldSessions(minToRemove: number = 0): number {
    const sessions = this.getAllSessions();
    const maxAge = this.config.maxSessionAge * 24 * 60 * 60 * 1000; // Convert days to ms
    const now = Date.now();

    let removed = 0;

    // Remove old sessions
    for (const session of sessions) {
      const age = now - session.lastModified;
      if (age > maxAge) {
        this.deleteSession(session.sessionId);
        removed++;
      }
    }

    // If we need to remove more, remove oldest inactive sessions
    if (removed < minToRemove) {
      const inactiveSessions = sessions
        .filter((s) => !s.isActive)
        .sort((a, b) => a.lastModified - b.lastModified);

      const toRemove = minToRemove - removed;
      for (let i = 0; i < toRemove && i < inactiveSessions.length; i++) {
        this.deleteSession(inactiveSessions[i].sessionId);
        removed++;
      }
    }

    // Enforce max sessions limit
    const remaining = this.getAllSessions();
    if (remaining.length > this.config.maxSessions) {
      const excess = remaining
        .filter((s) => !s.isActive)
        .sort((a, b) => a.lastModified - b.lastModified)
        .slice(0, remaining.length - this.config.maxSessions);

      for (const session of excess) {
        this.deleteSession(session.sessionId);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateMetadata({ lastCleanup: now });
    }

    return removed;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): StorageStats {
    const sessions = this.getAllSessions();
    const totalEdits = sessions.reduce((sum, s) => sum + s.edits.length, 0);

    // Estimate storage used
    let storageUsed = 0;
    try {
      const allData = Object.keys(localStorage).map((key) => localStorage.getItem(key) || '');
      storageUsed = allData.join('').length * 2; // UTF-16 encoding = 2 bytes per char
    } catch (error) {
      console.error('Failed to calculate storage:', error);
    }

    // Estimate storage limit (typically 5-10MB, we use 5MB as safe assumption)
    const storageLimit = 5 * 1024 * 1024;

    return {
      sessionCount: sessions.length,
      totalEdits,
      storageUsed,
      storageLimit,
      oldestSession: sessions.length > 0 ? Math.min(...sessions.map((s) => s.lastModified)) : 0,
      newestSession: sessions.length > 0 ? Math.max(...sessions.map((s) => s.lastModified)) : 0,
    };
  }

  /**
   * Clear all sessions (use with caution!)
   */
  clearAllSessions(): boolean {
    try {
      const prefix = this.config.storagePrefix;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      return false;
    }
  }

  /**
   * Restore a session by applying all edits
   * This is called on page reload when a matching file is detected
   */
  async restoreSession(
    sessionId: string,
    applyEdit: (delta: EditDelta) => Promise<boolean>
  ): Promise<RestoreResult> {
    const session = this.getSession(sessionId);

    if (!session) {
      return {
        success: false,
        session: null,
        editsApplied: 0,
        error: 'Session not found',
      };
    }

    let editsApplied = 0;

    try {
      // Apply edits sequentially
      for (const delta of session.edits) {
        const success = await applyEdit(delta);
        if (success) {
          editsApplied++;
        } else {
          console.warn('Failed to apply edit:', delta);
        }
      }

      return {
        success: true,
        session,
        editsApplied,
      };
    } catch (error) {
      return {
        success: false,
        session,
        editsApplied,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods

  private getSessionKey(sessionId: string): string {
    return `${this.config.storagePrefix}${sessionId}`;
  }

  private getMetadataKey(): string {
    return `${this.config.storagePrefix}_metadata`;
  }

  private getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  private getMetadata(): StorageMetadata {
    try {
      const data = localStorage.getItem(this.getMetadataKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get metadata:', error);
    }

    // Default metadata
    return {
      version: '1.0.0',
      sessionCount: 0,
      storageUsed: 0,
      lastCleanup: Date.now(),
      activeSessionId: null,
    };
  }

  private updateMetadata(updates: Partial<StorageMetadata> = {}): void {
    try {
      const metadata = this.getMetadata();
      const sessions = this.getAllSessions();

      const updated: StorageMetadata = {
        ...metadata,
        ...updates,
        sessionCount: sessions.length,
        storageUsed: this.getStorageStats().storageUsed,
      };

      localStorage.setItem(this.getMetadataKey(), JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = new SceneSessionManager();
