'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Shell } from '@/components/shared/Shell';
import { SelectionProvider } from './r3f/SelectionContext';
import { scenePersistence } from './utils/scenePersistence';

// Disable SSR for R3FCanvas (requires WebGL/browser APIs)
// Using React Three Fiber for declarative 3D scene management
const R3FCanvas = dynamic(() => import('./components/R3FCanvas_v3'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-white">Loading 3D Editor...</div>
    </div>
  ),
});

// Disable SSR for PromptLine
const PromptLine = dynamic(() => import('./components/PromptLine'), {
  ssr: false,
});

// Disable SSR for PrismCopilot
const PrismCopilot = dynamic(() => import('./components/PrismCopilot'), {
  ssr: false,
});

// Disable SSR for Scene Hierarchy Panel
const SceneHierarchyPanel = dynamic(() => import('./r3f/SceneHierarchyPanel'), {
  ssr: false,
});

// Disable SSR for Material Preview Panel (dev mode)
const MaterialPreviewPanel = dynamic(() => import('./components/MaterialPreviewPanel'), {
  ssr: false,
});

/**
 * Universal Scene Editor Page (with Suspense wrapper)
 */
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-white">Loading editor...</div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

/**
 * Editor Content Component
 *
 * Split layout:
 * - Left: 3D canvas supporting Spline (.splinecode) and GLTF (.gltf, .glb)
 * - Right: AI agent panel (Material, Object, Animation, Scene tabs)
 *
 * Features:
 * - Automatic format detection
 * - Natural language commands ("make it red", "move to 0 5 0")
 * - Case-insensitive object selection
 * - Works with both Spline and GLTF scenes
 */
function EditorContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project'); // Get project ID from URL

  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('material');
  const [panelWidth, setPanelWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [isRestoringScene, setIsRestoringScene] = useState(!!projectId); // Only restore if project ID present
  const [showMaterialPreview, setShowMaterialPreview] = useState(false); // Dev mode material preview

  // Load project if ID is provided in URL (only on initial mount or when projectId actually changes)
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        // No project ID = clean canvas
        console.log('ℹ️ No project ID - starting with clean canvas');
        setIsRestoringScene(false);
        return;
      }

      // Skip loading if we already have this project loaded
      if (currentProjectId === projectId && sceneFile) {
        console.log(`✅ Project ${projectId} already loaded, skipping redundant load`);
        setIsRestoringScene(false);
        return;
      }

      try {
        setIsRestoringScene(true);
        console.log(`📂 Loading project: ${projectId}`);

        const project = await scenePersistence.loadProject(projectId);

        if (project) {
          const file = scenePersistence.projectToFile(project);
          console.log('✅ Project loaded:', project.name, `(${(project.fileSize / 1024 / 1024).toFixed(2)} MB)`);
          setSceneFile(file);
          setCurrentProjectId(projectId);
        } else {
          console.warn(`⚠️ Project not found: ${projectId}`);
          alert(`Project not found. Starting with clean canvas.`);
        }
      } catch (error) {
        console.error('❌ Failed to load project:', error);
        alert('Failed to load project. Starting with clean canvas.');
      } finally {
        setIsRestoringScene(false);
      }
    };

    loadProject();
  }, [projectId]); // Note: intentionally not including currentProjectId/sceneFile in deps

  // Reset scene ready state when scene file changes
  useEffect(() => {
    if (sceneFile) {
      setIsSceneReady(false);
      setShowHierarchy(false);
    }
  }, [sceneFile]);

  // Keyboard shortcut: H key to toggle hierarchy panel (only when scene is ready)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // H key (not in an input field) and scene is ready
      if (
        e.key === 'h' &&
        isSceneReady &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setShowHierarchy((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSceneReady]);

  // Panel resize logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width from right edge of screen
      const newWidth = window.innerWidth - e.clientX;
      // Constrain between 300px and 800px
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      setPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  /**
   * Handle file upload
   * Supports: .splinecode, .gltf, .glb
   */
  const handleFileUpload = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    const supported = ['splinecode', 'gltf', 'glb', 'fbx', 'obj'];

    if (!ext || !supported.includes(ext)) {
      alert(`Please upload a supported 3D file:\n- GLTF/GLB (.gltf, .glb)\n- Spline (.splinecode)\n- FBX (.fbx)\n- OBJ (.obj)`);
      return;
    }

    console.log(`📁 Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Clear current scene first
    setIsSceneReady(false);

    // Save to project
    try {
      console.log(`💾 Saving to project...`);

      // If we have a current project ID, update it. Otherwise create new project.
      const savedProjectId = await scenePersistence.saveProject(
        file,
        currentProjectId ? undefined : file.name.replace(/\.[^/.]+$/, ''), // Only set name for new projects
        currentProjectId || undefined
      );

      console.log(`✅ Project saved: ${savedProjectId}`);

      // Update current project ID if this was a new project
      if (!currentProjectId) {
        setCurrentProjectId(savedProjectId);
        // Update URL to include project ID
        window.history.replaceState(null, '', `/editor?project=${savedProjectId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to save project:', errorMessage);

      // Check if it's a quota error
      if (errorMessage.includes('quota') || errorMessage.includes('QuotaExceeded')) {
        console.warn('⚠️ IndexedDB quota exceeded. Project will not persist.');
        console.warn('💡 Consider clearing browser data or using a smaller file.');
      }

      // Still allow the upload even if persistence fails
    }

    // Set new scene file (this will trigger cleanup and reload)
    setSceneFile(file);
  };

  /**
   * Handle scene unload/exit
   * Note: This doesn't delete the project, just clears it from view
   */
  const handleUnloadScene = async () => {
    console.log('🚪 Unloading current scene');
    setIsSceneReady(false);
    setSceneFile(null);
    // Don't delete the project - it's saved in the projects list
  };

  return (
    <SelectionProvider>
      <Shell
        rightPanel={
          <div
            className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white overflow-hidden relative"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-cyan-500/50 cursor-col-resize transition-all z-50"
              onMouseDown={() => setIsResizing(true)}
              title="Drag to resize panel"
            />
            <PrismCopilot onTabChange={setActiveTab} />
          </div>
        }
      >
        <div className="h-full w-full flex overflow-hidden bg-[#0f1419]">
          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side: Universal 3D Canvas with Overlays */}
            <div className="flex-1 relative">
            {/* Hierarchy Toggle Button - Only show when scene is fully loaded */}
            {isSceneReady && (
              <button
                onClick={() => setShowHierarchy((prev) => !prev)}
                className="absolute top-4 left-4 z-40 px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Toggle Scene Hierarchy (H)"
              >
                <span className="text-lg">☰</span>
                <span>Hierarchy</span>
              </button>
            )}

            {/* Material Preview Button (temporarily visible for review) */}
            <button
              onClick={() => setShowMaterialPreview(true)}
              className="absolute top-4 right-4 z-40 px-3 py-2 bg-amber-600/90 hover:bg-amber-500/90 backdrop-blur-sm text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Material Preview"
            >
              <span className="text-lg">🎨</span>
              <span>Material Preview</span>
            </button>

            {/* Material Preview Panel (Dev Mode) */}
            <MaterialPreviewPanel
              isOpen={showMaterialPreview}
              onClose={() => setShowMaterialPreview(false)}
            />

            {/* Loading indicator while restoring scene */}
            {isRestoringScene && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                <div className="bg-gray-800/90 px-6 py-4 rounded-lg text-center">
                  <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white font-medium">Restoring saved scene...</p>
                </div>
              </div>
            )}

            <R3FCanvas
              sceneFile={sceneFile}
              onFileUpload={handleFileUpload}
              showFileUpload={!isRestoringScene && !sceneFile}
              setIsSceneReady={setIsSceneReady}
              setIsLoading={setIsLoading}
            />

            {/* Scene Hierarchy Panel - Only render when scene is ready */}
            {isSceneReady && (
              <SceneHierarchyPanel open={showHierarchy} onClose={() => setShowHierarchy(false)} />
            )}

            {/* Character 2: Prompt Line - Centered with margin for hierarchy panel */}
            <div className="absolute bottom-0 left-[55%] -translate-x-1/2 w-3/5 max-w-4xl z-[60]">
              <PromptLine sceneLoaded={sceneFile !== null} activeTab={activeTab} />
            </div>
          </div>
        </div>
        </div>
      </Shell>
    </SelectionProvider>
  );
}
