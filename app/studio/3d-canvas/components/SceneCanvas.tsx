'use client';

import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, PerspectiveCamera, useGLTF, Text3D, Center } from '@react-three/drei';
import { CombinedTransformGizmo } from './CombinedTransformGizmo';
import { EffectComposer, Outline, Bloom, Noise, Vignette, Glitch } from '@react-three/postprocessing';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { useSelection } from '../r3f/SceneSelectionContext';
import { ErrorBoundary } from './ErrorBoundary';
import GlitchLoader from './GlitchLoader';
// GlassPresetTesting - using MaterialPreviewOverlay with glass category
import { IconGenerator } from './IconGenerator';
import { MaterialPreviewOverlay } from './MaterialPreviewOverlay';
import { VideoTexturePanel } from './VideoTexturePanel';
import { InteractiveObject } from './InteractiveObject';
import { CliBridge } from './CliBridge';
import { CodeExportModal } from './CodeExportModal';
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
  intensity: 0.8,
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
  const [showPresetTesting, setShowPresetTesting] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);
  const [videoBackgroundUrl, setVideoBackgroundUrl] = useState<string | null>(null);

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

        {/* Dynamic Lighting Setup */}
        <SceneLighting />

        {/* Sync R3F scene to SelectionContext */}
        <SceneSync />

        {/* Scene Content with Error Handling */}
        <ErrorBoundary fallback={(error) => <ErrorFallback error={error} />}>
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              {fileUrl && sceneFile && (
                <SceneLoader
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



        {/* Camera Controls - MMB to orbit, MMB+Shift to pan, Scroll to zoom */}
        <SceneOrbitControls />

        {/* Combined Transform Gizmo - Shows translate arrows + rotate rings */}
        <CombinedTransformGizmo />

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
        showPreview={showPresetTesting}
        onTogglePreview={() => setShowPresetTesting(!showPresetTesting)}
        showVideoPanel={showVideoPanel}
        onToggleVideoPanel={() => setShowVideoPanel(!showVideoPanel)}
        onExportCode={() => setShowCodeExport(true)}
      />

      {/* Material Preview Overlay Modal - Glass Preset Testing */}
      <MaterialPreviewOverlay
        isOpen={showPresetTesting}
        onClose={() => setShowPresetTesting(false)}
        materialType="glass"
      />

      {/* Video Texture Panel */}
      <VideoTexturePanel
        isOpen={showVideoPanel}
        onClose={() => setShowVideoPanel(false)}
        onSetBackground={setVideoBackgroundUrl}
      />

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={showCodeExport}
        onClose={() => setShowCodeExport(false)}
        environment={{
          preset: environment.preset || 'city',
          background: environment.background ?? true,
          blur: environment.blur ?? 0.8,
          intensity: environment.intensity ?? 1.0,
        }}
      />
    </div>
  );
}

/**
 * EditorUIOverlay - Editor controls and panels
 */
function EditorUIOverlay({
  showPreview,
  onTogglePreview,
  showVideoPanel,
  onToggleVideoPanel,
  onExportCode
}: {
  showPreview: boolean;
  onTogglePreview: () => void;
  showVideoPanel: boolean;
  onToggleVideoPanel: () => void;
  onExportCode: () => void;
}) {
  const { selectedObject, addedObjects } = useSelection();

  return (
    <>
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Export Code Button */}
        <button
          onClick={onExportCode}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
          title="Export scene as code (Cmd+Shift+E)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Export Code
          {addedObjects.length > 0 && (
            <span className="bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {addedObjects.length}
            </span>
          )}
        </button>

        {/* Preset Testing Toggle Button */}
        <button
          onClick={onTogglePreview}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${showPreview
            ? 'bg-cyan-500 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
        >
          {showPreview ? 'Close Preview' : 'Preset Testing'}
        </button>
      </div>

      {/* CLI Bridge */}
      <CliBridge />
    </>
  );
}


/**
 * SceneLighting - Dynamic lighting based on SelectionContext lighting state
 */
function SceneLighting() {
  const { lighting } = useSelection();

  return (
    <>
      {/* Ambient Light */}
      {lighting.ambient.enabled && (
        <ambientLight
          intensity={lighting.ambient.intensity}
          color={lighting.ambient.color}
        />
      )}

      {/* Directional Light */}
      {lighting.directional.enabled && (
        <directionalLight
          intensity={lighting.directional.intensity}
          color={lighting.directional.color}
          position={lighting.directional.position}
          castShadow={lighting.directional.castShadow}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      )}

      {/* Point Light */}
      {lighting.point.enabled && (
        <pointLight
          intensity={lighting.point.intensity}
          color={lighting.point.color}
          position={lighting.point.position}
          distance={lighting.point.distance}
        />
      )}

      {/* Spot Light */}
      {lighting.spot.enabled && (
        <spotLight
          intensity={lighting.spot.intensity}
          color={lighting.spot.color}
          position={lighting.spot.position}
          angle={lighting.spot.angle}
          penumbra={lighting.spot.penumbra}
          castShadow
        />
      )}

      {/* Hemisphere Light */}
      {lighting.hemisphere.enabled && (
        <hemisphereLight
          intensity={lighting.hemisphere.intensity}
          color={lighting.hemisphere.skyColor}
          groundColor={lighting.hemisphere.groundColor}
        />
      )}
    </>
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
  const { addedObjects } = useSelection();

  return (
    <>
      {addedObjects.map((obj) => (
        <InteractiveObject key={obj.id} obj={obj}>
          {obj.type === 'text3d' ? (
            <Text3DObject obj={obj} />
          ) : (
            <mesh
              name={obj.name}
              userData={{ id: obj.id, isAddedObject: true }}
            >
              {obj.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
              {obj.type === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
              {obj.type === 'plane' && <planeGeometry args={[2, 2]} />}
              {obj.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
              {obj.type === 'cone' && <coneGeometry args={[0.5, 1, 32]} />}
              {obj.type === 'torus' && <torusGeometry args={[0.4, 0.15, 16, 48]} />}
              {obj.type === 'capsule' && <capsuleGeometry args={[0.3, 0.6, 8, 16]} />}
              <meshStandardMaterial color={obj.color} side={THREE.DoubleSide} />
            </mesh>
          )}
        </InteractiveObject>
      ))}
    </>
  );
}

/**
 * Text3DObject - Renders 3D text using drei's Text3D
 */
function Text3DObject({ obj }: { obj: any }) {
  const fontUrl = '/fonts/helvetiker_regular.typeface.json';

  return (
    <Center>
      <Text3D
        font={fontUrl}
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.01}
        bevelSegments={3}
        name={obj.name}
        userData={{ id: obj.id, isAddedObject: true }}
      >
        {obj.text || 'Hello'}
        <meshStandardMaterial color={obj.color} />
      </Text3D>
    </Center>
  );
}

// TransformGizmo moved to CombinedTransformGizmo.tsx
// Shows both translate arrows + rotation rings simultaneously

/**
 * SceneOrbitControls - MMB to orbit, MMB+Shift to pan, scroll to zoom
 * Left click is reserved for object selection
 */
function SceneOrbitControls() {
  const [shiftPressed, setShiftPressed] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === 'Shift') {
        setShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    // Clear on window blur to avoid stuck Shift key
    const handleBlur = () => setShiftPressed(false);

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
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={0.01}
      maxDistance={500}
      enableRotate={true}
      enableZoom={true}
      enablePan={true}
      mouseButtons={{
        LEFT: undefined, // Disable left click for orbit - reserved for selection
        MIDDLE: shiftPressed ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.PAN, // Right click as fallback pan
      }}
    />
  );
}

/**
 * SceneLoader - Routes to appropriate loader based on file extension
 */
function SceneLoader({
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
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'glb':
    case 'gltf':
      return (
        <GLBScene
          url={url}
          fileName={fileName}
          setIsSceneReady={setIsSceneReady}
          setLoadingProgress={setLoadingProgress}
        />
      );
    case 'obj':
      return (
        <OBJScene
          url={url}
          fileName={fileName}
          setIsSceneReady={setIsSceneReady}
          setLoadingProgress={setLoadingProgress}
        />
      );
    case 'splinecode':
      return (
        <SplineScene
          url={url}
          fileName={fileName}
          setIsSceneReady={setIsSceneReady}
          setLoadingProgress={setLoadingProgress}
        />
      );
    default:
      console.warn(`⚠️ Unsupported file format: ${ext}`);
      return null;
  }
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
 * OBJScene - OBJ loader with progress tracking
 */
function OBJScene({
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
  const { setSelectedObject } = useSelection();
  const [hasNotified, setHasNotified] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Reset when URL changes
  useEffect(() => {
    setLoadingProgress?.(0);
    setHasNotified(false);
  }, [url]);

  // Load OBJ file
  const obj = useLoader(OBJLoader, url, (loader) => {
    loader.manager.onProgress = (item, loaded, total) => {
      const progress = (loaded / total) * 100;
      setLoadingProgress?.(progress);
      console.log(`📦 Loading OBJ: ${progress.toFixed(0)}%`);
    };
    loader.manager.onError = (url: string) => {
      console.warn('⚠️ OBJ load failed:', url);
    };
  });

  // Process scene once loaded
  useEffect(() => {
    if (!obj || hasNotified) return;

    console.log('✅ Processing OBJ scene');

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Scale to fit in view (max dimension = 5 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    let scale = 1;
    if (maxDim > 0) {
      scale = 5 / maxDim;
      obj.scale.setScalar(scale);
    }

    // Position at origin
    const scaledCenterX = center.x * scale;
    const scaledCenterZ = center.z * scale;
    const scaledMinY = box.min.y * scale;

    obj.position.set(-scaledCenterX, -scaledMinY, -scaledCenterZ);

    // Add default material if none exists
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (!mesh.material || (Array.isArray(mesh.material) && mesh.material.length === 0)) {
          mesh.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
        }
      }
    });

    console.log(`📍 OBJ positioned at origin, scale: ${scale.toFixed(3)}`);

    setLoadingProgress?.(100);
    setTimeout(() => {
      setIsSceneReady?.(true);
      console.log('✅ OBJ scene ready');
    }, 100);

    setHasNotified(true);
  }, [obj, setIsSceneReady, setLoadingProgress, hasNotified]);

  // Handle clicks
  const handleClick = (event: any) => {
    event.stopPropagation();
    const object = event.object;
    console.log('🖱️ Clicked OBJ object:', object.name || object.type);
    setSelectedObject(object);
  };

  if (!obj) return null;

  return <primitive ref={groupRef} object={obj} onClick={handleClick} />;
}

/**
 * SplineScene - Spline (.splinecode) loader
 * Uses @splinetool/runtime for loading Spline scenes
 */
function SplineScene({
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
  const { setSelectedObject } = useSelection();
  const { scene } = useThree();
  const containerRef = useRef<THREE.Group>(null);
  const [splineScene, setSplineScene] = useState<THREE.Object3D | null>(null);
  const [hasNotified, setHasNotified] = useState(false);

  // Load Spline scene
  useEffect(() => {
    let mounted = true;
    setLoadingProgress?.(10);

    const loadSpline = async () => {
      try {
        console.log('📦 Loading Spline scene...');
        setLoadingProgress?.(30);

        // Dynamic import to avoid SSR issues
        const SplineLoaderModule = await import('@splinetool/loader');
        const SplineLoader = SplineLoaderModule.default;
        const loader = new SplineLoader();

        setLoadingProgress?.(50);

        loader.load(
          url,
          (spline) => {
            if (!mounted) return;
            console.log('✅ Spline scene loaded');
            setLoadingProgress?.(80);

            // Process the loaded scene
            const box = new THREE.Box3().setFromObject(spline);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Scale to fit
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              const scale = 5 / maxDim;
              spline.scale.setScalar(scale);

              const scaledCenterX = center.x * scale;
              const scaledCenterZ = center.z * scale;
              const scaledMinY = box.min.y * scale;
              spline.position.set(-scaledCenterX, -scaledMinY, -scaledCenterZ);
            }

            setSplineScene(spline);
            setLoadingProgress?.(100);

            setTimeout(() => {
              setIsSceneReady?.(true);
              console.log('✅ Spline scene ready');
            }, 100);
          },
          (progress) => {
            const percent = 50 + (progress.loaded / progress.total) * 30;
            setLoadingProgress?.(percent);
          },
          (error) => {
            console.error('❌ Spline load error:', error);
            setLoadingProgress?.(0);
          }
        );
      } catch (error) {
        console.error('❌ Failed to load Spline:', error);
      }
    };

    loadSpline();

    return () => {
      mounted = false;
    };
  }, [url, setIsSceneReady, setLoadingProgress]);

  // Handle clicks
  const handleClick = (event: any) => {
    event.stopPropagation();
    const object = event.object;
    console.log('🖱️ Clicked Spline object:', object.name || object.type);
    setSelectedObject(object);
  };

  if (!splineScene) return null;

  return <primitive ref={containerRef} object={splineScene} onClick={handleClick} />;
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
      /\.(glb|gltf|obj|splinecode)$/i.test(f.name)
    );

    if (validFile) {
      console.log('✅ Valid file found:', validFile.name);
      onFileSelect(validFile);
    } else if (files.length > 0) {
      console.warn('❌ No valid 3D file found. Dropped files:', files.map(f => f.name));
      alert(`Unsupported file type: ${files[0].name}\n\nSupported formats: GLB, GLTF, OBJ, Spline`);
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
      className={`absolute inset-0 z-20 flex items-center justify-center transition-colors ${
        isDragging ? 'bg-blue-500/30 border-2 border-dashed border-blue-400' : 'bg-zinc-900/80'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📥 DragOver event');
        setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📥 DragEnter event');
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set false if leaving the container, not entering a child
        if (e.currentTarget === e.target) {
          console.log('📤 DragLeave event');
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <div className="text-center pointer-events-none">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-white text-lg font-medium mb-2">
          {isDragging ? 'Drop your 3D file here' : 'Drop a 3D file to start'}
        </div>
        <div className="text-zinc-400 text-sm mb-6">
          or
        </div>
        <label className="pointer-events-auto inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
          Choose File
          <input
            type="file"
            accept=".glb,.gltf,.obj,.splinecode"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <div className="text-zinc-500 text-sm mt-4">
          Supports: GLB, GLTF, OBJ, Spline
        </div>
      </div>
    </div>
  );
}


