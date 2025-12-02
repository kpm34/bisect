/**
 * Scene Persistence Utility
 *
 * Stores and restores scene files using IndexedDB for persistence across page refreshes.
 * Uses IndexedDB instead of localStorage to handle larger files (50MB+ vs 5MB limit).
 *
 * Now supports multiple projects with unique IDs.
 */

const DB_NAME = 'prism_scene_storage';
const DB_VERSION = 2; // Incremented for schema change
const STORE_NAME = 'projects';

export interface StoredProject {
  id: string; // Unique project ID
  name: string; // Project name
  fileData: ArrayBuffer; // Store as ArrayBuffer for IndexedDB compatibility
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnail?: string; // Base64 thumbnail (optional)
  createdAt: number;
  updatedAt: number;
}

class ScenePersistence {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB database
   */
  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not available, scene persistence disabled');
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
        const oldVersion = event.oldVersion;

        // Handle migration from v1 (scenes) to v2 (projects)
        if (oldVersion < 2) {
          // Delete old store if it exists
          if (db.objectStoreNames.contains('scenes')) {
            db.deleteObjectStore('scenes');
          }

          // Create new projects store
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
            objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            objectStore.createIndex('name', 'name', { unique: false });
          }
        }
      };
    });
  }

  /**
   * Ensure database is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    // Lazy initialization - only create initPromise when first needed
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    if (!this.db) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
  }

  /**
   * Generate unique project ID
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save project to IndexedDB
   */
  async saveProject(file: File, projectName?: string, projectId?: string): Promise<string> {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      throw error;
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check file size - warn if very large
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 100) {
      console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)} MB. IndexedDB quota may be limited.`);
    }

    // Convert File to ArrayBuffer for IndexedDB storage
    let fileData: ArrayBuffer;
    try {
      fileData = await file.arrayBuffer();
      console.log(`📦 Converted file to ArrayBuffer: ${(fileData.byteLength / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error('❌ Failed to convert file to ArrayBuffer:', error);
      // Check if it's a quota error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('❌ IndexedDB quota exceeded. File too large to save.');
        throw new Error(`File too large (${fileSizeMB.toFixed(2)} MB). IndexedDB quota exceeded.`);
      }
      throw error;
    }

    // Generate or use provided project ID
    const id = projectId || this.generateProjectId();
    const name = projectName || file.name.replace(/\.[^/.]+$/, ''); // Remove extension from filename
    const now = Date.now();

    // Check if updating existing project
    const existingProject = projectId ? await this.loadProject(projectId) : null;

    const project: StoredProject = {
      id,
      name,
      fileData: fileData,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || this.getFileExtension(file.name),
      createdAt: existingProject?.createdAt || now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(project);

        request.onsuccess = () => {
          const action = existingProject ? 'updated' : 'created';
          console.log(`✅ Project ${action}: ${name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          console.log(`📊 ID: ${id}, File: ${file.name}`);
          resolve(id);
        };

        request.onerror = () => {
          const error = request.error;
          console.error('❌ Failed to save scene:', error);
          
          // Check for quota errors
          if (error && (error as any).name === 'QuotaExceededError') {
            console.error('❌ IndexedDB quota exceeded. File may be too large.');
            reject(new Error(`IndexedDB quota exceeded. File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`));
          } else {
            reject(error);
          }
        };

        transaction.onerror = () => {
          const error = transaction.error;
          console.error('❌ Transaction error while saving scene:', error);
          
          // Check for quota errors
          if (error && (error as any).name === 'QuotaExceededError') {
            console.error('❌ IndexedDB quota exceeded during transaction.');
            reject(new Error(`IndexedDB quota exceeded. File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`));
          } else {
            reject(error);
          }
        };
      } catch (error) {
        console.error('❌ Exception while saving scene:', error);
        reject(error);
      }
    });
  }

  /**
   * Load project from IndexedDB
   */
  async loadProject(projectId: string): Promise<StoredProject | null> {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      return null; // Return null instead of throwing to allow app to continue
    }

    if (!this.db) {
      console.error('❌ Database not initialized');
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(projectId);

        request.onsuccess = () => {
          const project = request.result as StoredProject | undefined;
          if (project) {
            console.log(`✅ Project loaded: ${project.name} (${(project.fileSize / 1024 / 1024).toFixed(2)} MB)`);
            resolve(project);
          } else {
            console.log(`ℹ️ Project not found: ${projectId}`);
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('❌ Failed to load scene from IndexedDB:', request.error);
          resolve(null); // Return null instead of rejecting to allow app to continue
        };

        transaction.onerror = () => {
          console.error('❌ Transaction error while loading scene:', transaction.error);
          resolve(null);
        };
      } catch (error) {
        console.error('❌ Exception while loading scene:', error);
        resolve(null);
      }
    });
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(projectId);

      request.onsuccess = () => {
        console.log(`✅ Project deleted: ${projectId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<Array<Omit<StoredProject, 'fileData'>>> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result as StoredProject[];
        // Remove fileData for performance (don't load all file contents)
        const projectList = projects.map(({ fileData, ...project }) => project);
        // Sort by most recently updated
        projectList.sort((a, b) => b.updatedAt - a.updatedAt);
        console.log(`✅ Found ${projectList.length} projects`);
        resolve(projectList);
      };

      request.onerror = () => {
        console.error('Failed to list projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Convert StoredProject to File object
   */
  projectToFile(project: StoredProject): File {
    const blob = new Blob([project.fileData], { type: project.fileType });
    return new File([blob], project.fileName, {
      type: project.fileType,
      lastModified: project.updatedAt,
    });
  }

  // ====================================================================
  // Backward compatibility methods (for existing code)
  // ====================================================================

  /**
   * @deprecated Use saveProject() instead
   */
  async saveScene(file: File): Promise<void> {
    await this.saveProject(file, undefined, 'default_project');
  }

  /**
   * @deprecated Use loadProject() instead
   */
  async loadScene(): Promise<File | null> {
    const project = await this.loadProject('default_project');
    return project ? this.projectToFile(project) : null;
  }

  /**
   * @deprecated Use deleteProject() instead
   */
  async clearScene(): Promise<void> {
    await this.deleteProject('default_project');
  }

  /**
   * @deprecated Use loadProject() instead
   */
  async hasSavedScene(): Promise<boolean> {
    const project = await this.loadProject('default_project');
    return project !== null;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }
}

// Export singleton instance
export const scenePersistence = new ScenePersistence();

