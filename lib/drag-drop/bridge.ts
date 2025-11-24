/**
 * Drag & Drop Bridge System
 *
 * Enables seamless asset transfer between studios:
 * - Vector Studio → 3D Studio (SVG as decals/textures)
 * - Texture Studio → 3D Studio (materials)
 * - Texture Studio → Vector Studio (texture fills)
 * - 3D Studio → Vector Studio (orthographic projections)
 */

import { Asset, useUnifiedStore } from '../store/unified-store';

export type StudioType = 'vector' | 'texture' | 'scene';

export interface DragData {
  asset: Asset;
  source: StudioType;
  previewImage?: string;
}

export interface DropTarget {
  studio: StudioType;
  acceptedTypes: Asset['type'][];
  onDrop: (asset: Asset, source: StudioType) => Promise<void>;
}

/**
 * Asset conversion utilities
 */
export class AssetConverter {
  /**
   * Convert SVG to texture (for applying in 3D)
   */
  static async svgToTexture(svgContent: string, width: number = 1024, height: number = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };

      img.src = url;
    });
  }

  /**
   * Convert texture to SVG fill pattern
   */
  static async textureToSVGPattern(textureUrl: string, patternId: string): Promise<string> {
    return `
      <defs>
        <pattern id="${patternId}" x="0" y="0" width="100%" height="100%">
          <image href="${textureUrl}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
    `;
  }

  /**
   * Extract 3D model UV map as SVG (for editing)
   */
  static async modelToSVGUVMap(modelData: any): Promise<string> {
    // Placeholder - would need actual UV unwrapping logic
    return `<svg viewBox="0 0 1024 1024"><text x="512" y="512" text-anchor="middle">UV Map</text></svg>`;
  }

  /**
   * Convert material properties to CSS
   */
  static materialToCSS(material: any): string {
    return `
      --material-color: ${material.color || '#ffffff'};
      --material-roughness: ${material.roughness || 0.5};
      --material-metalness: ${material.metalness || 0};
    `;
  }
}

/**
 * Drag & Drop Manager
 */
export class DragDropBridge {
  private static instance: DragDropBridge;
  private dropTargets: Map<StudioType, DropTarget> = new Map();

  private constructor() {}

  static getInstance(): DragDropBridge {
    if (!DragDropBridge.instance) {
      DragDropBridge.instance = new DragDropBridge();
    }
    return DragDropBridge.instance;
  }

  /**
   * Register a drop target
   */
  registerDropTarget(target: DropTarget) {
    this.dropTargets.set(target.studio, target);
  }

  /**
   * Unregister a drop target
   */
  unregisterDropTarget(studio: StudioType) {
    this.dropTargets.delete(studio);
  }

  /**
   * Check if an asset can be dropped on a target
   */
  canDrop(asset: Asset, targetStudio: StudioType): boolean {
    const target = this.dropTargets.get(targetStudio);
    if (!target) return false;

    return target.acceptedTypes.includes(asset.type);
  }

  /**
   * Handle drop event
   */
  async handleDrop(asset: Asset, sourceStudio: StudioType, targetStudio: StudioType): Promise<void> {
    const target = this.dropTargets.get(targetStudio);

    if (!target) {
      throw new Error(`No drop target registered for ${targetStudio}`);
    }

    if (!this.canDrop(asset, targetStudio)) {
      throw new Error(`Asset type ${asset.type} cannot be dropped on ${targetStudio}`);
    }

    await target.onDrop(asset, sourceStudio);
  }

  /**
   * Create drag preview element
   */
  createDragPreview(asset: Asset): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      background: rgba(59, 130, 246, 0.9);
      padding: 8px 12px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
    `;

    const icon = this.getAssetIcon(asset.type);
    preview.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">${icon}</span>
        <span>${asset.name}</span>
      </div>
    `;

    return preview;
  }

  private getAssetIcon(type: Asset['type']): string {
    const icons: Record<Asset['type'], string> = {
      svg: '🎨',
      texture: '🖼️',
      material: '✨',
      model: '🧊',
      decal: '🏷️'
    };
    return icons[type] || '📦';
  }
}

/**
 * React Hook for Drag & Drop
 */
export function useDragDrop(studio: StudioType) {
  const store = useUnifiedStore();
  const bridge = DragDropBridge.getInstance();

  const startDrag = (asset: Asset) => {
    store.startDrag(asset, studio);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    store.updateDragTarget(studio);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the studio
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    store.updateDragTarget(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const { draggedAsset, sourceStudio } = store.dragState;

    if (!draggedAsset || !sourceStudio) {
      console.error('[DragDrop] No dragged asset or source studio');
      return;
    }

    try {
      await bridge.handleDrop(draggedAsset, sourceStudio, studio);
      console.log(`[DragDrop] Successfully dropped ${draggedAsset.name} from ${sourceStudio} to ${studio}`);
    } catch (error) {
      console.error('[DragDrop] Drop failed:', error);
      alert((error as Error).message);
    } finally {
      store.endDrag();
    }
  };

  const endDrag = () => {
    store.endDrag();
  };

  return {
    startDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    endDrag,
    isDragging: store.dragState.isDragging,
    draggedAsset: store.dragState.draggedAsset,
    isTarget: store.dragState.targetStudio === studio
  };
}

/**
 * Preset drop handlers for each studio
 */

export const VectorStudioDropHandler: DropTarget = {
  studio: 'vector',
  acceptedTypes: ['texture', 'decal'],
  onDrop: async (asset: Asset, source: StudioType) => {
    console.log(`[VectorStudio] Received ${asset.type} from ${source}`);

    if (asset.type === 'texture' && asset.data.url) {
      // Convert texture to SVG pattern
      const patternSVG = await AssetConverter.textureToSVGPattern(
        asset.data.url,
        `pattern_${asset.id}`
      );
      // TODO: Apply pattern to selected SVG elements
      console.log('[VectorStudio] Created texture pattern:', patternSVG);
    }
  }
};

export const TextureStudioDropHandler: DropTarget = {
  studio: 'texture',
  acceptedTypes: ['svg'],
  onDrop: async (asset: Asset, source: StudioType) => {
    console.log(`[TextureStudio] Received ${asset.type} from ${source}`);

    if (asset.type === 'svg' && asset.data.svg) {
      // Use SVG as alpha mask or pattern for texture generation
      console.log('[TextureStudio] Using SVG as texture mask');
    }
  }
};

export const SceneStudioDropHandler: DropTarget = {
  studio: 'scene',
  acceptedTypes: ['svg', 'texture', 'material', 'decal'],
  onDrop: async (asset: Asset, source: StudioType) => {
    console.log(`[SceneStudio] Received ${asset.type} from ${source}`);

    if (asset.type === 'svg' && asset.data.svg) {
      // Convert SVG to texture and apply as decal
      const textureUrl = await AssetConverter.svgToTexture(asset.data.svg);
      console.log('[SceneStudio] Converted SVG to texture:', textureUrl);
      // TODO: Apply to selected object
    }

    if (asset.type === 'texture' && asset.data.url) {
      // Apply texture as material to selected object
      console.log('[SceneStudio] Applying texture to selected object');
      // TODO: Update material
    }

    if (asset.type === 'material') {
      // Apply full material properties
      console.log('[SceneStudio] Applying material properties');
      // TODO: Update object material
    }
  }
};
