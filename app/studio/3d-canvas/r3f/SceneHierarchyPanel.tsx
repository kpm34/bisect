'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { Object3D } from 'three';
import { Tree, NodeRendererProps } from 'react-arborist';
import { useSelection } from './SceneSelectionContext';

/**
 * Tree node data structure for react-arborist
 */
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  type: string;
  visible: boolean;
  locked: boolean;
  object: Object3D;
  onRefresh?: () => void; // Callback to refresh tree
}

/**
 * Check if object is a system/internal object that should be hidden from hierarchy
 * We hide all default scene elements - only show user-added objects and loaded models
 */
function isSystemObject(obj: Object3D): boolean {
  const name = obj.name?.toLowerCase() || '';
  const type = obj.type || '';

  // Filter out transform controls and gizmos
  if (type === 'TransformControls' ||
      name.includes('transformcontrols') ||
      name.includes('gizmo') ||
      name.includes('transformcontrolsgizmo') ||
      name.includes('transformcontrolsplane')) {
    return true;
  }

  // Filter out children of TransformControls (gizmo parts)
  let parent = obj.parent;
  while (parent) {
    if (parent.type === 'TransformControls' ||
        parent.name?.toLowerCase().includes('transformcontrols')) {
      return true;
    }
    parent = parent.parent;
  }

  // Filter out all lights (default scene lights)
  const lightTypes = [
    'AmbientLight',
    'DirectionalLight',
    'PointLight',
    'SpotLight',
    'HemisphereLight',
    'RectAreaLight',
    'Light',
  ];
  if (lightTypes.includes(type)) {
    return true;
  }

  // Filter out cameras
  const cameraTypes = [
    'Camera',
    'PerspectiveCamera',
    'OrthographicCamera',
  ];
  if (cameraTypes.includes(type)) {
    return true;
  }

  // Filter out THREE.js helpers and editing tools
  const helperTypes = [
    'GridHelper',
    'AxesHelper',
    'BoxHelper',
    'PlaneHelper',
    'ArrowHelper',
    'PolarGridHelper',
  ];
  if (helperTypes.includes(type)) {
    return true;
  }

  // Filter out environment/background objects
  if (type === 'Scene' || name === 'scene') {
    return true;
  }

  // Filter out Spline internal objects and common system objects
  if (
    name.startsWith('buildin') ||
    name.startsWith('__') ||
    name === 'helper' ||
    name === 'grid' ||
    name.includes('helper') ||
    name.includes('outline') ||
    name.includes('environment') ||
    name.includes('background')
  ) {
    return true;
  }

  // Filter out empty groups (groups with no meaningful children)
  if (type === 'Group' && obj.children.length === 0) {
    return true;
  }

  return false;
}

/**
 * Check if a node has any meaningful (non-system) descendants
 */
function hasMeaningfulContent(obj: Object3D): boolean {
  // If it's a mesh, it's meaningful
  if ((obj as any).isMesh) {
    return true;
  }

  // Check children recursively
  for (const child of obj.children) {
    if (!isSystemObject(child) && hasMeaningfulContent(child)) {
      return true;
    }
  }

  return false;
}

/**
 * Build hierarchical tree from THREE.js scene graph
 * Only includes objects with meaningful content (meshes or groups containing meshes)
 */
function buildTree(obj: Object3D, lockedObjects: Set<string>, onRefresh?: () => void): TreeNode | null {
  // Filter children first
  const meaningfulChildren = obj.children
    .filter((child) => !isSystemObject(child) && hasMeaningfulContent(child))
    .map((child) => buildTree(child, lockedObjects, onRefresh))
    .filter((child): child is TreeNode => child !== null);

  // If this is a Group with no meaningful children, skip it
  if (obj.type === 'Group' && meaningfulChildren.length === 0 && !(obj as any).isMesh) {
    return null;
  }

  return {
    id: obj.uuid,
    name: obj.name || obj.type,
    type: obj.type,
    visible: obj.visible,
    locked: lockedObjects.has(obj.uuid),
    object: obj,
    onRefresh,
    children: meaningfulChildren,
  };
}

/**
 * Build tree starting from scene children (skip scene root)
 */
function buildTreeFromScene(scene: Object3D, lockedObjects: Set<string>, onRefresh?: () => void): TreeNode[] {
  return scene.children
    .filter((child) => !isSystemObject(child) && hasMeaningfulContent(child))
    .map((child) => buildTree(child, lockedObjects, onRefresh))
    .filter((node): node is TreeNode => node !== null);
}

/**
 * Node renderer component with visibility/lock controls
 */
function NodeRenderer({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const { universalEditor, selectedObjects, setSelectedObject, toggleSelection } = useSelection();
  const [isHovered, setIsHovered] = useState(false);

  const nodeData = node.data;
  const isSelected = selectedObjects.has(nodeData.id);

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (universalEditor && nodeData.object) {
      universalEditor.setVisible(nodeData.object.name || nodeData.object.uuid, !nodeData.visible);
      // Trigger tree refresh to show updated visibility state
      if (nodeData.onRefresh) {
        nodeData.onRefresh();
      }
    }
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Lock functionality will be handled by SelectionContext
    // For now, just prevent selection
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (nodeData.locked) return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Multi-select
      toggleSelection(nodeData.object);
    } else {
      // Single select - use the object directly from the tree node
      setSelectedObject(nodeData.object);
      console.log('🖱️ Selected object from hierarchy:', nodeData.name, nodeData.object);
    }
  };

  // Type-specific SVG icons (Spline-style)
  const getTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4";

    switch (type) {
      case 'Group':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 3h4v4H3V3zm0 6h4v4H3V9zm6-6h4v4H9V3zm0 6h4v4H9V9z" opacity="0.6"/>
          </svg>
        );
      case 'Mesh':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L2 5v6l6 4 6-4V5L8 1zm0 2.2L11.6 5 8 6.8 4.4 5 8 3.2zM4 6.5l3 1.8v4.4L4 10.9V6.5zm8 4.4l-3 1.8V8.3l3-1.8v4.4z"/>
          </svg>
        );
      case 'Light':
      case 'PointLight':
      case 'DirectionalLight':
      case 'SpotLight':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 0v2M8 14v2M0 8h2M14 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case 'Camera':
      case 'PerspectiveCamera':
      case 'OrthographicCamera':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12v9H2V4zm2 2v5h8V6H4z"/>
            <path d="M6 3h4v1H6V3z"/>
          </svg>
        );
      case 'Scene':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 1v14M1 8h14M3 4.5h10M3 11.5h10" stroke="currentColor" strokeWidth="1"/>
          </svg>
        );
      default:
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="1"/>
          </svg>
        );
    }
  };

  return (
    <div
      style={style}
      ref={dragHandle}
      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer select-none ${
        isSelected
          ? 'bg-cyan-600/40 text-white'
          : isHovered
          ? 'bg-white/10 text-white'
          : 'text-gray-300'
      } ${nodeData.locked ? 'opacity-50' : ''}`}
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/Collapse Arrow */}
      {node.children && node.children.length > 0 ? (
        <span
          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white transition-transform"
          style={{ transform: node.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
        >
          ▶
        </span>
      ) : (
        <span className="w-4" />
      )}

      {/* Type Icon */}
      <div className="text-gray-400">{getTypeIcon(nodeData.type)}</div>

      {/* Name */}
      <span className="flex-1 truncate font-medium">{nodeData.name}</span>

      {/* Controls (show on hover or when selected) */}
      {(isHovered || isSelected) && (
        <div className="flex items-center gap-1">
          {/* Visibility Toggle */}
          <button
            onClick={handleToggleVisibility}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
            title={nodeData.visible ? 'Hide object' : 'Show object'}
          >
            {nodeData.visible ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
                <circle cx="8" cy="8" r="1.5"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.8 2.2L12.2 3.8C11 3.3 9.5 3 8 3 4.5 3 1.5 5.5 0 8c0.8 1.3 1.8 2.4 3 3.2L1.2 13.8l1 1 12.6-12.6-1-1zM8 11c-0.9 0-1.7-0.4-2.2-1l1.4-1.4c0.3 0.3 0.6 0.4 1 0.4 1.1 0 2-0.9 2-2 0-0.3-0.1-0.7-0.3-1l1.4-1.4c0.6 0.6 1 1.4 1 2.3 0 1.7-1.3 3-3 3zm6-3c-0.8 1.3-1.8 2.4-3 3.2l-1.5-1.5c0.3-0.5 0.5-1.1 0.5-1.7 0-1.7-1.3-3-3-3-0.6 0-1.2 0.2-1.7 0.5L3.8 4C5 3.3 6.5 3 8 3c3.5 0 6.5 2.5 8 5z"/>
              </svg>
            )}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={handleToggleLock}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
            title={nodeData.locked ? 'Unlock object' : 'Lock object'}
          >
            {nodeData.locked ? (
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C6.3 1 5 2.3 5 4v2H4c-0.6 0-1 0.4-1 1v7c0 0.6 0.4 1 1 1h8c0.6 0 1-0.4 1-1V7c0-0.6-0.4-1-1-1h-1V4c0-1.7-1.3-3-3-3zm0 2c0.6 0 1 0.4 1 1v2H7V4c0-0.6 0.4-1 1-1z"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 6V4c0-1.7-1.3-3-3-3S5 2.3 5 4h2c0-0.6 0.4-1 1-1s1 0.4 1 1v2H4c-0.6 0-1 0.4-1 1v7c0 0.6 0.4 1 1 1h8c0.6 0 1-0.4 1-1V7c0-0.6-0.4-1-1-1h-1z"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SceneHierarchyPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { universalEditor, r3fScene, selectedObjects, lockedObjects, selectionVersion } = useSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [dimensions, setDimensions] = useState({ width: 320, height: 600 });
  const [panelWidth, setPanelWidth] = useState(320); // Resizable panel width
  const [isResizing, setIsResizing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force tree refresh
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Measure container dimensions for react-arborist
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [open]);

  // Resize panel functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(250, Math.min(600, e.clientX)); // Min 250px, max 600px
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Refresh callback to rebuild tree
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Build tree from scene - only shows meaningful content (loaded models, user-added objects)
  const treeData = useMemo(() => {
    // Get scene from R3F or fallback to UniversalEditor
    const sceneRoot = r3fScene || universalEditor?.getScene();

    if (!sceneRoot) {
      return [];
    }

    // Build tree from scene children, skipping the scene root and all system objects
    const tree = buildTreeFromScene(sceneRoot, lockedObjects, handleRefresh);

    if (tree.length > 0) {
      console.info(`✅ Hierarchy: Found ${tree.length} objects`);
    }

    return tree;
  }, [r3fScene, universalEditor, lockedObjects, refreshKey, handleRefresh, selectionVersion]);

  // Filter tree based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return treeData;

    const filterTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => {
          const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
          const filteredChildren = node.children ? filterTree(node.children) : [];

          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node) => node !== null) as TreeNode[];
    };

    return filterTree(treeData);
  }, [treeData, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (!open) return null;

  return (
    <aside
      ref={panelRef}
      style={{ width: `${panelWidth}px` }}
      className="absolute top-0 left-0 h-full bg-[#141923]/95 backdrop-blur-md border-r border-white/10 text-white overflow-hidden z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-[#0f1419]">
        <span className="text-sm font-semibold">Scene Hierarchy</span>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-white/10 bg-[#0f1419]/50">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search objects..."
            className="w-full px-3 py-1.5 pl-8 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {filteredData.length > 0 ? (
          <Tree
            data={filteredData}
            openByDefault={false}
            width={dimensions.width}
            height={dimensions.height}
            indent={24}
            rowHeight={32}
            overscanCount={10}
            padding={8}
          >
            {NodeRenderer}
          </Tree>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2 px-4 text-center">
            {searchQuery ? (
              'No objects found'
            ) : (
              <>
                <span>No objects in scene</span>
                <span className="text-xs text-gray-500">Upload a 3D file or add primitives to see them here</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer - Selection Info */}
      {selectedObjects.size > 0 && (
        <div className="px-3 py-2 border-t border-white/10 bg-[#0f1419]/50 text-xs text-gray-400">
          {selectedObjects.size} object{selectedObjects.size > 1 ? 's' : ''} selected
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="px-3 py-2 border-t border-white/10 bg-[#0f1419] text-[10px] text-gray-500">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>Click: Select</span>
          <span>Shift+Click: Multi-select</span>
          <span>H: Toggle panel</span>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors group"
        title="Drag to resize"
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-gray-600 group-hover:bg-cyan-500 transition-colors rounded-l" />
      </div>
    </aside>
  );
}
