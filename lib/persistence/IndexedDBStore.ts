/**
 * IndexedDBStore
 *
 * Manages undo/redo history using IndexedDB for larger storage capacity.
 * IndexedDB provides ~50MB+ storage vs localStorage's ~5MB limit.
 *
 * Key features:
 * - Async operations (non-blocking)
 * - Larger storage capacity
 * - Better for storing edit history
 * - Automatic database versioning
 */

import type { HistoryEntry, EditDelta, HistoryState } from './types';

const DB_NAME = 'prism_scene_history';
const DB_VERSION = 1;
const STORE_NAME = 'history_entries';

export class IndexedDBStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, undo/redo will be limited');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes for efficient querying
          objectStore.createIndex('sessionId', 'sessionId', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('position', 'position', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
  }

  /**
   * Add a history entry
   */
  async addEntry(sessionId: string, delta: EditDelta, position: number): Promise<HistoryEntry> {
    await this.ensureInitialized();

    const entry: HistoryEntry = {
      id: `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      delta,
      position,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);

      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all history entries for a session
   */
  async getSessionHistory(sessionId: string): Promise<HistoryEntry[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        const entries = request.result;
        // Sort by position
        entries.sort((a, b) => a.position - b.position);
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get history state for a session
   */
  async getHistoryState(sessionId: string, maxSize: number): Promise<HistoryState> {
    const entries = await this.getSessionHistory(sessionId);

    return {
      entries,
      currentIndex: entries.length - 1,
      maxSize,
    };
  }

  /**
   * Remove entries after a certain position (for redo stack clearing)
   */
  async removeEntriesAfter(sessionId: string, position: number): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.openCursor(sessionId);

      let removed = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          const entry: HistoryEntry = cursor.value;
          if (entry.position > position) {
            cursor.delete();
            removed++;
          }
          cursor.continue();
        } else {
          resolve(removed);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all history for a session
   */
  async deleteSessionHistory(sessionId: string): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.openKeyCursor(sessionId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursor | null;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup old sessions beyond max size
   */
  async cleanupSessionHistory(sessionId: string, maxSize: number): Promise<number> {
    const entries = await this.getSessionHistory(sessionId);

    if (entries.length <= maxSize) {
      return 0;
    }

    // Keep only the most recent maxSize entries
    const toRemove = entries.slice(0, entries.length - maxSize);

    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let removed = 0;
      let pending = toRemove.length;

      if (pending === 0) {
        resolve(0);
        return;
      }

      for (const entry of toRemove) {
        const request = store.delete(entry.id);
        request.onsuccess = () => {
          removed++;
          pending--;
          if (pending === 0) {
            resolve(removed);
          }
        };
        request.onerror = () => {
          pending--;
          if (pending === 0) {
            resolve(removed);
          }
        };
      }
    });
  }

  /**
   * Get total size of all stored entries (approximate)
   */
  async getStorageSize(): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        // Approximate size by JSON stringifying all entries
        const size = JSON.stringify(entries).length * 2; // UTF-16 = 2 bytes per char
        resolve(size);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all history data (use with caution!)
   */
  async clearAll(): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.indexedDB;
  }
}

// Export singleton instance
export const historyStore = new IndexedDBStore();
