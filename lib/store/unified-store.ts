/**
 * Unified State Management with Zustand
 *
 * Manages shared state across all 3 studios:
 * - Vector Studio (SVG Editor)
 * - Texture Studio (MatCap & PBR Generator)
 * - 3D Studio (Scene Editor)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Asset Types
 */
export interface Asset {
  id: string;
  name: string;
  type: 'svg' | 'texture' | 'material' | 'model' | 'decal';
  source: 'vector' | 'texture' | 'scene';
  data: {
    url?: string;
    svg?: string;
    properties?: any;
  };
  thumbnail?: string;
  createdAt: number;
  modifiedAt: number;
}

/**
 * Project Interface
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  assets: Asset[];
  vectorState?: any; // SVG editor state
  textureState?: any; // Texture generator state
  sceneState?: any; // 3D scene state
  createdAt: number;
  modifiedAt: number;
}

/**
 * Drag & Drop State
 */
export interface DragState {
  isDragging: boolean;
  draggedAsset: Asset | null;
  sourceStudio: 'vector' | 'texture' | 'scene' | null;
  targetStudio: 'vector' | 'texture' | 'scene' | null;
}

/**
 * AI State
 */
export interface AIState {
  isProcessing: boolean;
  currentTask: string | null;
  history: Array<{
    studio: string;
    prompt: string;
    result: any;
    timestamp: number;
  }>;
}

/**
 * Main Store Interface
 */
interface UnifiedStore {
  // Current Project
  currentProject: Project | null;
  projects: Project[];

  // Asset Library
  assets: Asset[];

  // Drag & Drop
  dragState: DragState;

  // AI State
  aiState: AIState;

  // Project Actions
  createProject: (name: string, description?: string) => void;
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  deleteProject: (projectId: string) => void;

  // Asset Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'modifiedAt'>) => Asset;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  getAssetsByType: (type: Asset['type']) => Asset[];
  getAssetsBySource: (source: Asset['source']) => Asset[];

  // Drag & Drop Actions
  startDrag: (asset: Asset, source: 'vector' | 'texture' | 'scene') => void;
  updateDragTarget: (target: 'vector' | 'texture' | 'scene' | null) => void;
  endDrag: () => void;

  // AI Actions
  startAITask: (task: string) => void;
  completeAITask: (result: any, studio: string, prompt: string) => void;
  clearAIHistory: () => void;

  // State Persistence Actions
  saveVectorState: (state: any) => void;
  saveTextureState: (state: any) => void;
  saveSceneState: (state: any) => void;
}

/**
 * Create Unified Store
 */
export const useUnifiedStore = create<UnifiedStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentProject: null,
      projects: [],
      assets: [],
      dragState: {
        isDragging: false,
        draggedAsset: null,
        sourceStudio: null,
        targetStudio: null
      },
      aiState: {
        isProcessing: false,
        currentTask: null,
        history: []
      },

      // Project Actions
      createProject: (name: string, description?: string) => {
        const newProject: Project = {
          id: `project_${Date.now()}`,
          name,
          description,
          assets: [],
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };

        set(state => ({
          projects: [...state.projects, newProject],
          currentProject: newProject
        }));
      },

      loadProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        }
      },

      saveProject: () => {
        const { currentProject } = get();
        if (!currentProject) return;

        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProject.id
              ? { ...currentProject, modifiedAt: Date.now() }
              : p
          ),
          currentProject: { ...currentProject, modifiedAt: Date.now() }
        }));
      },

      deleteProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject
        }));
      },

      // Asset Actions
      addAsset: (assetData) => {
        const newAsset: Asset = {
          ...assetData,
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          modifiedAt: Date.now()
        };

        set(state => ({
          assets: [...state.assets, newAsset]
        }));

        // Add to current project if exists
        const { currentProject } = get();
        if (currentProject) {
          set(state => ({
            currentProject: {
              ...currentProject,
              assets: [...currentProject.assets, newAsset]
            }
          }));
        }

        return newAsset;
      },

      removeAsset: (assetId: string) => {
        set(state => ({
          assets: state.assets.filter(a => a.id !== assetId)
        }));

        // Remove from current project
        const { currentProject } = get();
        if (currentProject) {
          set(state => ({
            currentProject: {
              ...currentProject,
              assets: currentProject.assets.filter(a => a.id !== assetId)
            }
          }));
        }
      },

      updateAsset: (assetId: string, updates: Partial<Asset>) => {
        set(state => ({
          assets: state.assets.map(a =>
            a.id === assetId
              ? { ...a, ...updates, modifiedAt: Date.now() }
              : a
          )
        }));

        // Update in current project
        const { currentProject } = get();
        if (currentProject) {
          set(state => ({
            currentProject: {
              ...currentProject,
              assets: currentProject.assets.map(a =>
                a.id === assetId
                  ? { ...a, ...updates, modifiedAt: Date.now() }
                  : a
              )
            }
          }));
        }
      },

      getAssetsByType: (type: Asset['type']) => {
        return get().assets.filter(a => a.type === type);
      },

      getAssetsBySource: (source: Asset['source']) => {
        return get().assets.filter(a => a.source === source);
      },

      // Drag & Drop Actions
      startDrag: (asset: Asset, source: 'vector' | 'texture' | 'scene') => {
        set({
          dragState: {
            isDragging: true,
            draggedAsset: asset,
            sourceStudio: source,
            targetStudio: null
          }
        });
      },

      updateDragTarget: (target: 'vector' | 'texture' | 'scene' | null) => {
        set(state => ({
          dragState: {
            ...state.dragState,
            targetStudio: target
          }
        }));
      },

      endDrag: () => {
        set({
          dragState: {
            isDragging: false,
            draggedAsset: null,
            sourceStudio: null,
            targetStudio: null
          }
        });
      },

      // AI Actions
      startAITask: (task: string) => {
        set(state => ({
          aiState: {
            ...state.aiState,
            isProcessing: true,
            currentTask: task
          }
        }));
      },

      completeAITask: (result: any, studio: string, prompt: string) => {
        set(state => ({
          aiState: {
            isProcessing: false,
            currentTask: null,
            history: [
              ...state.aiState.history,
              {
                studio,
                prompt,
                result,
                timestamp: Date.now()
              }
            ]
          }
        }));
      },

      clearAIHistory: () => {
        set(state => ({
          aiState: {
            ...state.aiState,
            history: []
          }
        }));
      },

      // State Persistence Actions
      saveVectorState: (state: any) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: {
              ...currentProject,
              vectorState: state,
              modifiedAt: Date.now()
            }
          });
          get().saveProject();
        }
      },

      saveTextureState: (state: any) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: {
              ...currentProject,
              textureState: state,
              modifiedAt: Date.now()
            }
          });
          get().saveProject();
        }
      },

      saveSceneState: (state: any) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: {
              ...currentProject,
              sceneState: state,
              modifiedAt: Date.now()
            }
          });
          get().saveProject();
        }
      }
    }),
    {
      name: 'unified-3d-creator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        assets: state.assets,
        currentProject: state.currentProject
      })
    }
  )
);

/**
 * Selectors for optimized access
 */
export const useCurrentProject = () => useUnifiedStore(state => state.currentProject);
export const useAssets = () => useUnifiedStore(state => state.assets);
export const useDragState = () => useUnifiedStore(state => state.dragState);
export const useAIState = () => useUnifiedStore(state => state.aiState);
