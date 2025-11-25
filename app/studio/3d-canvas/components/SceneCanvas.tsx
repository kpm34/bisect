'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { Suspense, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useSelection } from '../r3f/SceneSelectionContext';
import { ErrorBoundary } from './ErrorBoundary';
import GlitchLoader from './GlitchLoader';
import { GoldVariations } from './GoldVariations';
import { IconGenerator } from './IconGenerator';


interface R3FCanvasProps {
  sceneFile: File | null;
  onFileUpload?: (file: File) => void;
  showFileUpload?: boolean;
  setIsSceneReady?: (ready: boolean) => void;
  setIsLoading?: (loading: boolean) => void;
}

/**
 * R3FCanvas - Universal 3D Editor Canvas (React Three Fiber)
 *
 * Simple, stable implementation:
 * - Create object URL once per file
 * - Clean up on file change or unmount
 * - No infinite loops
 */
export default function R3FCanvas({
  sceneFile,
  onFileUpload,
  showFileUpload = true,
  setIsSceneReady,
  setIsLoading
}: R3FCanvasProps) {
  const [cameraPosition] = useState<[number, number, number]>([0, 5, 10]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showGoldPreview, setShowGoldPreview] = useState(false);

  // Create and manage object URL for the file
  useEffect(() => {
    if (!sceneFile) {
      setFileUrl(null);
      return;
    }

    // Create new URL
    const url = URL.createObjectURL(sceneFile);
    console.log('📦 Created object URL:', url);
    setFileUrl(url);

    // Cleanup when sceneFile changes or component unmounts
    return () => {
      console.log('🧹 Cleaning up object URL:', url);
      URL.revokeObjectURL(url);
    };
  }, [sceneFile]);

  return (
    <div className="w-full h-screen relative">
      {/* File Upload UI */}
      {showFileUpload && onFileUpload && (
        <FileUploadOverlay
          onFileSelect={(file) => {
            if (file) {
              onFileUpload(file);
            }
          }}
          currentFile={sceneFile}
        />
      )}

      {/* 3D Canvas */}
      <Canvas
        shadows
        frameloop="always"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          autoClear: true
        }}
        dpr={[1, 2]}
      >
        {/* Camera Setup */}
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
          near={0.1}
          far={1000}
        />

        {/* Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight intensity={0.2} groundColor="#444444" />

        {/* Sync R3F scene to SelectionContext */}
        <SceneSync />

        {/* Background click to deselect */}
        <BackgroundClick />

        {/* Scene Content with Error Handling */}
        <ErrorBoundary fallback={(error) => <ErrorFallback error={error} />}>
          <Suspense fallback={null}>
            {fileUrl && sceneFile && (
              <GLBScene
                url={fileUrl}
                fileName={sceneFile.name}
                setIsSceneReady={setIsSceneReady}
                setLoadingProgress={setLoadingProgress}
              />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* Environment & Background */}
        <Environment preset="city" background blur={0.8} />

        {/* Grid Helper */}
        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.5}
          sectionSize={10}
          sectionThickness={1}
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />



        {/* Gold Variations Overlay for Review */}
        {showGoldPreview && <IconGenerator index={0} />}

        {/* Camera Controls - Option+Drag to orbit, MMB to pan, Scroll to zoom */}
        <ConditionalOrbitControls />

        {/* Selection Outline - Must be last so it processes the rendered scene */}
        <SelectionOutline />
      </Canvas>

      {/* Loading Animation Overlay */}
      {sceneFile && loadingProgress < 100 && (
        <GlitchLoader
          progress={loadingProgress}
          fileName={sceneFile.name}
          fileSize={`${(sceneFile.size / 1024 / 1024).toFixed(2)} MB`}
        />
      )}

      {/* Editor UI Overlay */}
      <EditorUIOverlay
        showPreview={showGoldPreview}
        onTogglePreview={() => setShowGoldPreview(!showGoldPreview)}
      />
    </div>
  );
}

/**
 * EditorUIOverlay - Editor controls and panels
 */
function EditorUIOverlay({
  showPreview,
  onTogglePreview
}: {
  showPreview: boolean;
  onTogglePreview: () => void;
}) {
  const { selectedObject } = useSelection();

  return (
    <>
      {/* Preview Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onTogglePreview}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${showPreview
            ? 'bg-amber-500 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
        >
          {showPreview ? 'Close Preview' : 'Preview Gold'}
        </button>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <div className="text-xs font-medium">Bisect - 3D Scene Editor</div>
        <div className="text-xs text-gray-400 mt-1">
          {selectedObject ? `Selected: ${selectedObject.name || selectedObject.type}` : 'Click to select'}
        </div>
      </div>
    </>
  );
}

/**
 * SceneSync - Syncs R3F scene to SelectionContext for hierarchy panel
 */
function SceneSync() {
  const { scene } = useThree();
  const { setR3FScene } = useSelection();

  useEffect(() => {
    if (setR3FScene) {
      setR3FScene(scene);
      console.log('🔗 Synced R3F scene to SelectionContext');
    }
  }, [scene, setR3FScene]);

  return null;
}

/**
 * BackgroundClick - Clears selection when clicking empty space
 */
function BackgroundClick() {
  const { setSelectedObject } = useSelection();

  const handleBackgroundClick = () => {
    console.log('🖱️ Clicked background, clearing selection');
    setSelectedObject(null);
  };

  return (
    <mesh
      position={[0, 0, -100]}
      onClick={handleBackgroundClick}
      visible={false}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

/**
 * SelectionOutline - Professional Blender-style outline using @react-three/postprocessing v2.16.5
 *
 * Features from v3.0.4 API that work in v2.16.5:
 * - X-ray mode: See selected objects through other geometry
 * - Blend functions: Control how outline blends with scene
 * - Kernel size: Control blur quality
 * - Pattern texture: Optional pattern overlay
 */
function SelectionOutline() {
  const { selectedObject, selectionVersion } = useSelection();

  // Collect all meshes from the selected object
  const selectedMeshes = useMemo(() => {
    if (!selectedObject) {
      console.log('🔶 SelectionOutline: No selection');
      return [];
    }

    const meshes: THREE.Object3D[] = [];

    // Add the object itself if it's a mesh
    if ((selectedObject as THREE.Mesh).isMesh) {
      meshes.push(selectedObject);
    }

    // Add all child meshes
    selectedObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child !== selectedObject) {
        meshes.push(child);
      }
    });

    console.log('🔶 SelectionOutline: Outlining', meshes.length, 'meshes for:', selectedObject.name || selectedObject.type);
    return meshes;
  }, [selectedObject, selectionVersion]);

  // Don't render composer if nothing is selected
  if (selectedMeshes.length === 0) {
    return null;
  }

  return (
    <EffectComposer autoClear={false}>
      <Outline
        selection={selectedMeshes}
        visibleEdgeColor={0xff8800}  // Orange - Professional selection color
        hiddenEdgeColor={0xff4400}   // Darker orange for occluded edges
        edgeStrength={3.0}            // Strong, visible edges like Blender
        pulseSpeed={0}                // No pulsing - static outline
        blur={false}                  // Sharp edges for precision
        xRay={true}                   // See selection through other objects (Blender-like)
      />
    </EffectComposer>
  );
}

/**
 * ConditionalOrbitControls - Enables orbit only when Alt/Option key is held
 */
function ConditionalOrbitControls() {
  const [altPressed, setAltPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.key === 'Alt') {
        setAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey || e.key === 'Alt') {
        setAltPressed(false);
      }
    };

    // Also clear on window blur to avoid stuck Alt key
    const handleBlur = () => setAltPressed(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={0.01}
      maxDistance={500}
      maxPolarAngle={Math.PI / 2}
      enableRotate={altPressed}
      enableZoom={true}
      enablePan={true}
      mouseButtons={{
        LEFT: altPressed ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

/**
 * GLBScene - GLTF/GLB loader with progress tracking
 */
function GLBScene({
  url,
  fileName,
  setIsSceneReady,
  setLoadingProgress
}: {
  url: string;
  fileName: string;
  setIsSceneReady?: (ready: boolean) => void;
  setLoadingProgress?: (progress: number) => void;
}) {
  const { selectedObject, setSelectedObject } = useSelection();
  const [hasNotified, setHasNotified] = useState(false);

  // Reset when URL changes
  useEffect(() => {
    setLoadingProgress?.(0);
    setHasNotified(false);
  }, [url]);

  // Use useGLTF with stable URL
  const gltf = useGLTF(url, true, true, (loader) => {
    // Progress tracking
    loader.manager.onProgress = (item, loaded, total) => {
      const progress = (loaded / total) * 100;
      setLoadingProgress?.(progress);
      console.log(`📦 Loading: ${progress.toFixed(0)}%`);
    };

    // Error handling
    loader.manager.onError = (url: string) => {
      console.warn('⚠️ Texture load failed (continuing anyway):', url);
    };
  });

  // Process scene once loaded
  useEffect(() => {
    if (!gltf?.scene || hasNotified) return;

    console.log('✅ Processing GLTF scene');

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model
    gltf.scene.position.sub(center);

    // Scale to fit in view (max dimension = 5 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 5 / maxDim;
      gltf.scene.scale.setScalar(scale);
    }

    // Count meshes
    let meshCount = 0;
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshCount++;
      }
    });

    console.log(`🎨 Found ${meshCount} meshes in scene`);
    console.log('✅ Scene is ready!');

    // Notify parent - IMPORTANT: Set loading to 100% first, then mark scene as ready
    console.log('📡 Notifying parent: loadingProgress = 100%, isSceneReady = true');
    setLoadingProgress?.(100);

    // Use setTimeout to ensure loading overlay has time to update before marking ready
    setTimeout(() => {
      setIsSceneReady?.(true);
      console.log('✅ Scene ready state confirmed');
    }, 100);

    setHasNotified(true);
  }, [gltf, setIsSceneReady, setLoadingProgress, hasNotified]);

  // Handle clicks
  const handleClick = (event: any) => {
    event.stopPropagation();
    const object = event.object;
    console.log('🖱️ Clicked object:', object.name || object.type);
    setSelectedObject(object);
  };

  if (!gltf?.scene) {
    return null;
  }

  return <primitive object={gltf.scene} onClick={handleClick} />;
}

/**
 * ErrorFallback - Error state for failed loads
 */
function ErrorFallback({ error }: { error: Error }) {
  console.error('❌ Error loading 3D file:', error);
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff0000" wireframe />
    </mesh>
  );
}

/**
 * FileUploadOverlay - Drag-and-drop file upload UI
 */
function FileUploadOverlay({
  onFileSelect,
  currentFile
}: {
  onFileSelect: (file: File | null) => void;
  currentFile: File | null;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f =>
      /\.(glb|gltf|fbx|obj|splinecode)$/i.test(f.name)
    );

    if (validFile) {
      onFileSelect(validFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (currentFile) {
    return (
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <div className="text-sm font-medium">{currentFile.name}</div>
        <button
          onClick={() => onFileSelect(null)}
          className="text-xs text-blue-400 hover:text-blue-300 mt-1"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${isDragging ? 'bg-blue-500/20' : ''
        }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="text-center pointer-events-auto">
        <div className="text-white text-lg font-medium mb-4">
          {isDragging ? 'Drop your 3D file here' : 'Drop a 3D file to start'}
        </div>
        <label className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
          Choose File
          <input
            type="file"
            accept=".glb,.gltf,.fbx,.obj,.splinecode"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <div className="text-gray-400 text-sm mt-4">
          Supports: GLB, GLTF, FBX, OBJ, Spline
        </div>
      </div>
    </div>
  );
}


