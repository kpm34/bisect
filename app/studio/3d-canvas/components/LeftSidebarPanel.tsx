'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Object3D } from 'three';
import { Tree, NodeRendererProps } from 'react-arborist';
import { useSelection } from '../r3f/SceneSelectionContext';
import { parseCommand } from '../utils/command-parser';
import { useAIMaterialEditor } from '../hooks/useAIMaterialEditor';
import { Layers, Sparkles, FolderOpen, ChevronRight, Eye, EyeOff, Lock, Unlock, Search, X, ArrowUp, PanelLeftClose, Box, Palette, Video } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface LeftSidebarPanelProps {
  sceneLoaded: boolean;
  activeInspectorTab: string;
  onClose?: () => void;
}

type SidebarTab = 'hierarchy' | 'ai' | 'assets';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  type: string;
  visible: boolean;
  locked: boolean;
  object: Object3D;
  onRefresh?: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

function isSystemObject(obj: Object3D): boolean {
  const name = obj.name?.toLowerCase() || '';
  const type = obj.type || '';

  if (
    type === 'TransformControls' ||
    name.includes('transformcontrols') ||
    name.includes('gizmo') ||
    name.includes('transformcontrolsgizmo') ||
    name.includes('transformcontrolsplane')
  ) {
    return true;
  }

  let parent = obj.parent;
  while (parent) {
    if (parent.type === 'TransformControls' || parent.name?.toLowerCase().includes('transformcontrols')) {
      return true;
    }
    parent = parent.parent;
  }

  const helperTypes = ['GridHelper', 'AxesHelper', 'BoxHelper', 'PlaneHelper', 'ArrowHelper', 'PolarGridHelper'];
  if (helperTypes.includes(type)) {
    return true;
  }

  return (
    name.startsWith('buildin') ||
    name.startsWith('__') ||
    name === 'helper' ||
    name === 'grid' ||
    name.includes('helper') ||
    name.includes('outline')
  );
}

function buildTree(obj: Object3D, lockedObjects: Set<string>, onRefresh?: () => void): TreeNode {
  return {
    id: obj.uuid,
    name: obj.name || obj.type,
    type: obj.type,
    visible: obj.visible,
    locked: lockedObjects.has(obj.uuid),
    object: obj,
    onRefresh,
    children: obj.children
      .filter((child) => !isSystemObject(child))
      .map((child) => buildTree(child, lockedObjects, onRefresh)),
  };
}

// ============================================================================
// Tree Node Renderer
// ============================================================================

function NodeRenderer({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const { universalEditor, selectedObjects, setSelectedObject, toggleSelection } = useSelection();
  const [isHovered, setIsHovered] = useState(false);

  const nodeData = node.data;
  const isSelected = selectedObjects.has(nodeData.id);

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (universalEditor && nodeData.object) {
      universalEditor.setVisible(nodeData.object.name || nodeData.object.uuid, !nodeData.visible);
      if (nodeData.onRefresh) {
        nodeData.onRefresh();
      }
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (nodeData.locked) return;

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      toggleSelection(nodeData.object);
    } else {
      setSelectedObject(nodeData.object);
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = 'w-3.5 h-3.5';
    switch (type) {
      case 'Group':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 3h4v4H3V3zm0 6h4v4H3V9zm6-6h4v4H9V3zm0 6h4v4H9V9z" opacity="0.6" />
          </svg>
        );
      case 'Mesh':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L2 5v6l6 4 6-4V5L8 1zm0 2.2L11.6 5 8 6.8 4.4 5 8 3.2zM4 6.5l3 1.8v4.4L4 10.9V6.5zm8 4.4l-3 1.8V8.3l3-1.8v4.4z" />
          </svg>
        );
      case 'Light':
      case 'PointLight':
      case 'DirectionalLight':
      case 'SpotLight':
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="3" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="1" />
          </svg>
        );
    }
  };

  return (
    <div
      style={style}
      ref={dragHandle}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded cursor-pointer select-none ${
        isSelected ? 'bg-cyan-600/40 text-white' : isHovered ? 'bg-white/10 text-white' : 'text-gray-300'
      } ${nodeData.locked ? 'opacity-50' : ''}`}
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {node.children && node.children.length > 0 ? (
        <ChevronRight
          className={`w-3 h-3 text-gray-400 transition-transform ${node.isOpen ? 'rotate-90' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
        />
      ) : (
        <span className="w-3" />
      )}
      <div className="text-gray-400">{getTypeIcon(nodeData.type)}</div>
      <span className="flex-1 truncate">{nodeData.name}</span>
      {(isHovered || isSelected) && (
        <button
          onClick={handleToggleVisibility}
          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
        >
          {nodeData.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Hierarchy Tab Content
// ============================================================================

function HierarchyContent() {
  const { universalEditor, r3fScene, selectedObjects, lockedObjects, selectionVersion } = useSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const treeData = useMemo(() => {
    const sceneRoot = r3fScene || universalEditor?.getScene();
    if (!sceneRoot) return [];
    return [buildTree(sceneRoot, lockedObjects, handleRefresh)];
  }, [r3fScene, universalEditor, lockedObjects, refreshKey, handleRefresh, selectionVersion]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return treeData;

    const filterTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => {
          const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
          const filteredChildren = node.children ? filterTree(node.children) : [];
          if (matchesSearch || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
          return null;
        })
        .filter((node) => node !== null) as TreeNode[];
    };

    return filterTree(treeData);
  }, [treeData, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objects..."
            className="w-full pl-7 pr-7 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {filteredData.length > 0 ? (
          <Tree
            data={filteredData}
            openByDefault={false}
            width={dimensions.width}
            height={dimensions.height}
            indent={16}
            rowHeight={26}
            overscanCount={10}
            padding={4}
          >
            {NodeRenderer}
          </Tree>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            {searchQuery ? 'No objects found' : 'No scene loaded'}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedObjects.size > 0 && (
        <div className="px-3 py-2 border-t border-white/10 text-[10px] text-gray-400">
          {selectedObjects.size} selected
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AI Tab Content
// ============================================================================

function AIContent({ sceneLoaded, activeInspectorTab }: { sceneLoaded: boolean; activeInspectorTab: string }) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [history, setHistory] = useState<{ prompt: string; response: string; timestamp: Date }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track container height for responsive textarea
  useEffect(() => {
    if (!containerRef.current) return;
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const {
    universalEditor,
    selectedObject,
    selectObjectByName,
    setColor,
    setRoughness,
    setMetalness,
    setPosition,
    setRotation,
    setScale,
  } = useSelection();

  const { executeMaterialCommand, isProcessing: aiProcessing } = useAIMaterialEditor();

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !sceneLoaded) return;

    setIsProcessing(true);
    const currentPrompt = command;
    setCommand('');

    try {
      const parsed = parseCommand(currentPrompt);
      let responseMessage = '';

      switch (parsed.type) {
        case 'select':
          if (parsed.target && universalEditor) {
            const success = selectObjectByName(parsed.target);
            responseMessage = success
              ? `Selected "${parsed.target}"`
              : `Object "${parsed.target}" not found`;
          }
          break;

        case 'material':
          if (!selectedObject) {
            responseMessage = 'No object selected';
            break;
          }
          switch (parsed.action) {
            case 'setColor':
              setColor(parsed.params.color);
              responseMessage = `Changed color to ${parsed.params.color}`;
              break;
            case 'setRoughness':
              setRoughness(parsed.params.value);
              responseMessage = `Set roughness to ${parsed.params.value}`;
              break;
            case 'setMetalness':
              setMetalness(parsed.params.value);
              responseMessage = `Set metalness to ${parsed.params.value}`;
              break;
          }
          break;

        case 'transform':
          if (!selectedObject) {
            responseMessage = 'No object selected';
            break;
          }
          switch (parsed.action) {
            case 'setPosition':
              const [px, py, pz] = parsed.params.position;
              setPosition(px, py, pz);
              responseMessage = `Moved to (${px}, ${py}, ${pz})`;
              break;
            case 'setRotation':
              const [rx, ry, rz] = parsed.params.rotation;
              setRotation(rx, ry, rz);
              responseMessage = `Rotated to (${rx}, ${ry}, ${rz})`;
              break;
            case 'setScale':
              const [sx, sy, sz] = parsed.params.scale;
              setScale(sx, sy, sz);
              responseMessage = `Scaled to (${sx}, ${sy}, ${sz})`;
              break;
          }
          break;

        default:
          if (activeInspectorTab === 'material' && selectedObject) {
            const result = await executeMaterialCommand(currentPrompt);
            responseMessage = result.success
              ? result.reasoning || 'Material updated'
              : result.error || 'Could not process';
          } else if (!selectedObject) {
            responseMessage = 'Select an object first';
          } else {
            responseMessage = 'Command not recognized';
          }
      }

      setHistory((prev) => [
        { prompt: currentPrompt, response: responseMessage, timestamp: new Date() },
        ...prev.slice(0, 19),
      ]);
      setFeedback(responseMessage);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setFeedback(errorMsg);
      setHistory((prev) => [
        { prompt: currentPrompt, response: `Error: ${errorMsg}`, timestamp: new Date() },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const getPlaceholder = () => {
    if (!universalEditor) return 'Load a scene first...';
    if (!selectedObject) return 'Select an object first...';
    return 'make it gold, move up 2 units...';
  };

  // Calculate responsive textarea rows based on available space
  const textareaRows = containerHeight < 300 ? 2 : containerHeight < 500 ? 3 : 4;

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      {/* History - scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-4">
            <Sparkles className={`${containerHeight < 400 ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-2 opacity-50`} />
            <p>AI Assistant</p>
            <p className="text-[10px] mt-1 text-gray-600">Type a command to edit your scene</p>
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="bg-cyan-600/20 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 break-words">{item.prompt}</div>
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 break-words">{item.response}</div>
            </div>
          ))
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mx-2 mb-2 px-2.5 py-1.5 bg-gray-800/90 rounded-lg text-xs text-white flex-shrink-0">{feedback}</div>
      )}

      {/* Input - fixed at bottom, responsive height */}
      <form onSubmit={handleCommand} className="p-2 border-t border-white/10 flex-shrink-0">
        <div className="relative">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={!sceneLoaded || isProcessing}
            rows={textareaRows}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-12 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyan-500/50"
            style={{ minHeight: `${textareaRows * 1.5 + 1}rem` }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && command.trim()) {
                e.preventDefault();
                handleCommand(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!command.trim() || !sceneLoaded || isProcessing || aiProcessing}
            className="absolute bottom-2 right-2 w-7 h-7 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-all"
          >
            {isProcessing || aiProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Assets Tab Content
// ============================================================================

function AssetsContent() {
  const [searchQuery, setSearchQuery] = useState('');

  // Asset categories
  const categories = [
    { id: 'models', name: '3D Models', icon: Box, count: 0 },
    { id: 'materials', name: 'Materials', icon: Palette, count: 0 },
    { id: 'videos', name: 'Video Assets', icon: Video, count: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
            >
              <cat.icon className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-xs text-gray-300 group-hover:text-white">{cat.name}</span>
              <span className="text-[10px] text-gray-500">{cat.count}</span>
              <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
            </button>
          ))}
        </div>

        {/* Import Button */}
        <div className="mt-4 px-2">
          <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
            + Import Asset
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function LeftSidebarPanel({ sceneLoaded, activeInspectorTab, onClose }: LeftSidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('hierarchy');
  const [panelWidth, setPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [availableHeight, setAvailableHeight] = useState(0);

  // Track available height for responsive layout
  useEffect(() => {
    const updateHeight = () => {
      if (sidebarRef.current) {
        setAvailableHeight(sidebarRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Also observe the sidebar element itself
    const resizeObserver = new ResizeObserver(updateHeight);
    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  // Resize logic with viewport constraints
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Limit max width to 50% of viewport or 400px, whichever is smaller
      const maxWidth = Math.min(400, window.innerWidth * 0.5);
      const minWidth = Math.max(200, window.innerWidth * 0.15);
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
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

  // Responsive width adjustment on window resize
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(400, window.innerWidth * 0.5);
      if (panelWidth > maxWidth) {
        setPanelWidth(maxWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelWidth]);

  const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: 'hierarchy', icon: <Layers className="w-4 h-4" />, label: 'Hierarchy' },
    { id: 'ai', icon: <Sparkles className="w-4 h-4" />, label: 'AI' },
    { id: 'assets', icon: <FolderOpen className="w-4 h-4" />, label: 'Assets' },
  ];

  // Calculate if we're in a compact mode (small screen)
  const isCompact = availableHeight < 500;

  return (
    <aside
      ref={sidebarRef}
      className="absolute top-0 left-0 h-full max-h-screen flex z-40"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Vertical Tab Bar - responsive sizing */}
      <div className={`${isCompact ? 'w-10' : 'w-11'} bg-[#0a0d12] border-r border-white/5 flex flex-col items-center py-2 gap-1 flex-shrink-0 overflow-hidden`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${isCompact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center transition-all group relative flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-cyan-600/20 text-cyan-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title={tab.label}
          >
            {tab.icon}
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-500 rounded-r" />
            )}
          </button>
        ))}

        {/* Spacer - uses min-height to ensure collapse button is visible */}
        <div className="flex-1 min-h-[8px]" />

        {/* Collapse Button - always visible at bottom */}
        {onClose && (
          <button
            onClick={onClose}
            className={`${isCompact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all mb-2 flex-shrink-0`}
            title="Collapse sidebar (H)"
          >
            <PanelLeftClose className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>
        )}
      </div>

      {/* Content Panel */}
      <div className="flex-1 min-w-0 bg-[#0f1319]/95 backdrop-blur-md border-r border-white/10 flex flex-col overflow-hidden">
        {/* Header - compact on small screens */}
        <div className={`px-3 ${isCompact ? 'py-2' : 'py-2.5'} border-b border-white/10 bg-[#0a0d12] flex-shrink-0`}>
          <h3 className="text-xs font-semibold text-white capitalize truncate">{activeTab}</h3>
        </div>

        {/* Tab Content - fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'hierarchy' && <HierarchyContent />}
          {activeTab === 'ai' && <AIContent sceneLoaded={sceneLoaded} activeInspectorTab={activeInspectorTab} />}
          {activeTab === 'assets' && <AssetsContent />}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors"
        title="Drag to resize"
      />
    </aside>
  );
}
