'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { EffectComposer, Outline, Bloom, Noise, Vignette, Glitch } from '@react-three/postprocessing';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useSelection } from '../r3f/SceneSelectionContext';
import { ErrorBoundary } from './ErrorBoundary';
import GlitchLoader from './GlitchLoader';
import { GoldVariations } from './GoldVariations';
import { IconGenerator } from './IconGenerator';
import { MaterialPreviewOverlay } from './MaterialPreviewOverlay';
import { InteractiveObject } from './InteractiveObject';
import { CliBridge } from './CliBridge';
import { SceneEnvironment } from '@/lib/core/materials/types';

interface R3FCanvasProps {
  sceneFile: File | null;
  onFileUpload?: (file: File) => void;
  showFileUpload?: boolean;
  setIsSceneReady?: (ready: boolean) => void;
  setIsLoading?: (loading: boolean) => void;
  environment?: SceneEnvironment;
}

const defaultEnvironment: SceneEnvironment = {
  preset: 'city',
  background: true,
  blur: 0.8,
  intensity: 1.0,
};

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
  setIsLoading,
  environment = defaultEnvironment
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
    <div className="w-full h-full relative">
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
            <Physics gravity={[0, -9.81, 0]}>
              {fileUrl && sceneFile && (
                <GLBScene
                  url={fileUrl}
                  fileName={sceneFile.name}
                  setIsSceneReady={setIsSceneReady}
                  setLoadingProgress={setLoadingProgress}
                />
              )}
              <AddedObjectsRenderer />
            </Physics>
          </Suspense>
        </ErrorBoundary>

        {/* Environment & Background - Dynamic based on inspector settings */}
        <Environment
          preset={environment.preset || 'city'}
          background={environment.background ?? true}
          blur={environment.blur ?? 0.8}
          environmentIntensity={environment.intensity ?? 1.0}
        />

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



        {/* Camera Controls - Option+Drag to orbit, MMB to pan, Scroll to zoom */}
        <ConditionalOrbitControls />

        {/* Selection Outline */}
        <SelectionOutline />

        {/* Post-Processing Effects */}
        <SceneEffects />
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

      {/* Material Preview Overlay Modal */}
      <MaterialPreviewOverlay
        isOpen={showGoldPreview}
        onClose={() => setShowGoldPreview(false)}
        materialType="gold"
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
          {showPreview ? 'Close Preview' : 'Gold Variations'}
        </button>
      </div>


      {/* Shape Spawner Toolbar */}
      <ShapeSpawnerToolbar />

      {/* CLI Bridge */}
      <CliBridge />
    </>
  );
}

function ShapeSpawnerToolbar() {
  const { addObject } = useSelection();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/80 p-2 rounded-xl backdrop-blur-sm border border-white/10">
      <button
        onClick={() => addObject('box')}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white flex flex-col items-center gap-1 min-w-[60px]"
        title="Add Box"
      >
        <div className="w-6 h-6 border-2 border-white rounded-sm" />
        <span className="text-[10px] font-medium">Box</span>
      </button>
      <button
        onClick={() => addObject('sphere')}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white flex flex-col items-center gap-1 min-w-[60px]"
        title="Add Sphere"
      >
        <div className="w-6 h-6 border-2 border-white rounded-full" />
        <span className="text-[10px] font-medium">Sphere</span>
      </button>
      <button
        onClick={() => addObject('plane')}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white flex flex-col items-center gap-1 min-w-[60px]"
        title="Add Plane"
      >
        <div className="w-6 h-6 border-b-2 border-white mb-2" />
        <span className="text-[10px] font-medium">Plane</span>
      </button>
    </div>
  );
}

/**
 * SceneSync - Syncs R3F scene and renderer to SelectionContext for hierarchy panel and MCP bridge
 */
function SceneSync() {
  const { scene, gl } = useThree();
  const { setR3FScene, setR3FRenderer } = useSelection();

  useEffect(() => {
    if (setR3FScene) {
      setR3FScene(scene);
      console.log('🔗 Synced R3F scene to SelectionContext');
    }
  }, [scene, setR3FScene]);

  useEffect(() => {
    if (setR3FRenderer && gl) {
      setR3FRenderer(gl);
      console.log('🔗 Synced R3F renderer to SelectionContext');
    }
  }, [gl, setR3FRenderer]);

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
 * SceneEffects - Renders active post-processing effects
 */
function SceneEffects() {
  const { effects } = useSelection();

  // If no effects are active, don't render composer (saves performance)
  if (!effects.bloom && !effects.glitch && !effects.noise && !effects.vignette) {
    return null;
  }

  return (
    <EffectComposer>
      <>
        {effects.bloom && <Bloom luminanceThreshold={0.2} mipmapBlur intensity={0.5} />}
        {effects.glitch && <Glitch delay={new THREE.Vector2(1.5, 3.5)} duration={new THREE.Vector2(0.6, 1.0)} strength={new THREE.Vector2(0.3, 1.0)} />}
        {effects.noise && <Noise opacity={0.1} />}
        {effects.vignette && <Vignette eskil={false} offset={0.1} darkness={1.1} />}
      </>
    </EffectComposer>
  );
}

/**
 * AddedObjectsRenderer - Renders user-added shapes with physics
 */
function AddedObjectsRenderer() {
  const { addedObjects, setSelectedObject } = useSelection();

  return (
    <>
      {addedObjects.map((obj) => (
        <InteractiveObject key={obj.id} obj={obj}>
          <mesh
            name={obj.name}
            userData={{ id: obj.id, isAddedObject: true }}
          >
            {obj.type === 'box' && <boxGeometry />}
            {obj.type === 'sphere' && <sphereGeometry />}
            {obj.type === 'plane' && <planeGeometry args={[10, 10]} />}
            <meshStandardMaterial color={obj.color} side={THREE.DoubleSide} />
          </mesh>
        </InteractiveObject>
      ))}
    </>
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

    // Calculate bounding box BEFORE any transforms
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Scale to fit in view (max dimension = 5 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    let scale = 1;
    if (maxDim > 0) {
      scale = 5 / maxDim;
      gltf.scene.scale.setScalar(scale);
    }

    // Place model at origin (0, 0, 0) - center it horizontally and sit on ground
    // After scaling, recalculate the center offset
    const scaledCenterX = center.x * scale;
    const scaledCenterY = center.y * scale;
    const scaledCenterZ = center.z * scale;
    const scaledMinY = box.min.y * scale;

    // Position so model is centered at origin and sits on Y=0 ground plane
    gltf.scene.position.set(
      -scaledCenterX,           // Center horizontally on X
      -scaledMinY,              // Sit on ground (Y=0)
      -scaledCenterZ            // Center horizontally on Z
    );

    console.log(`📍 Model positioned at origin (0, 0, 0), sitting on ground`);
    console.log(`📐 Scale: ${scale.toFixed(3)}, Original size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);

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

  // Prevent default browser behavior for drag events on window
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    console.log('📥 Drop event received');
    const files = Array.from(e.dataTransfer.files);
    console.log('📁 Files dropped:', files.map(f => f.name));

    const validFile = files.find(f =>
      /\.(glb|gltf|fbx|obj|splinecode)$/i.test(f.name)
    );

    if (validFile) {
      console.log('✅ Valid file found:', validFile.name);
      onFileSelect(validFile);
    } else if (files.length > 0) {
      console.warn('❌ No valid 3D file found. Dropped files:', files.map(f => f.name));
      alert(`Unsupported file type: ${files[0].name}\n\nSupported formats: GLB, GLTF, FBX, OBJ, Spline`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 File selected via input:', file.name);
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
      className={`absolute inset-0 z-10 flex items-center justify-center ${isDragging ? 'bg-blue-500/20' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set false if leaving the container, not entering a child
        if (e.currentTarget === e.target) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <div className="text-center">
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


