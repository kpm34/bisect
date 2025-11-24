'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSelection } from './SelectionContext';

/**
 * Selection Outline Component
 * Renders edge outlines and face highlights for selected objects in the scene
 */
export default function SelectionOutline() {
  const { universalEditor, selectedObjects, selectedFaces, selectionVersion } = useSelection();
  const outlineGroupRef = useRef<THREE.Group | null>(null);
  const highlightGroupRef = useRef<THREE.Group | null>(null);
  const faceHighlightGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Check if we're working with a Spline scene
  const isSplineScene = universalEditor?.getFormat() === 'spline';

  useEffect(() => {
    console.info(`🔄 SelectionOutline: useEffect triggered! selectionVersion=${selectionVersion}, selectedObjects.size=${selectedObjects.size}`);

    if (!universalEditor) {
      console.warn('⚠️ SelectionOutline: No universalEditor available');
      // Clear any existing outlines
      if (outlineGroupRef.current) {
        while (outlineGroupRef.current.children.length > 0) {
          const child = outlineGroupRef.current.children[0];
          if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
          outlineGroupRef.current.remove(child);
        }
        outlineGroupRef.current = null;
      }
      if (highlightGroupRef.current) {
        while (highlightGroupRef.current.children.length > 0) {
          const child = highlightGroupRef.current.children[0];
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
          highlightGroupRef.current.remove(child);
        }
        highlightGroupRef.current = null;
      }
      if (faceHighlightGroupRef.current) {
        while (faceHighlightGroupRef.current.children.length > 0) {
          const child = faceHighlightGroupRef.current.children[0];
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
          faceHighlightGroupRef.current.remove(child);
        }
        faceHighlightGroupRef.current = null;
      }
      return;
    }

    // Check if editor is still loaded
    if (!universalEditor.isLoaded()) {
      console.warn('⚠️ SelectionOutline: Editor is not loaded');
      return;
    }

    let scene;
    try {
      scene = universalEditor.getScene();
    } catch (error) {
      console.error('⚠️ SelectionOutline: Error getting scene:', error);
      return;
    }

    if (!scene) {
      console.warn('⚠️ SelectionOutline: getScene() returned null');
      return;
    }

    console.info(`✅ SelectionOutline: Updating outlines for ${selectedObjects.size} selected object(s), scene type: ${scene.type}`);

    // Create or reuse outline group
    if (!outlineGroupRef.current) {
      outlineGroupRef.current = new THREE.Group();
      outlineGroupRef.current.name = '__selection_outline__';
      scene.add(outlineGroupRef.current);
      console.info('✅ SelectionOutline: Created outline group');
    }

    // Create or reuse highlight group
    if (!highlightGroupRef.current) {
      highlightGroupRef.current = new THREE.Group();
      highlightGroupRef.current.name = '__selection_highlight__';
      scene.add(highlightGroupRef.current);
      console.info('✅ SelectionOutline: Created highlight group');
    }

    // Create or reuse face highlight group
    if (!faceHighlightGroupRef.current) {
      faceHighlightGroupRef.current = new THREE.Group();
      faceHighlightGroupRef.current.name = '__face_selection_highlight__';
      scene.add(faceHighlightGroupRef.current);
      console.info('✅ SelectionOutline: Created face highlight group');
    }

    // Clear previous outlines
    while (outlineGroupRef.current.children.length > 0) {
      const child = outlineGroupRef.current.children[0];
      if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      outlineGroupRef.current.remove(child);
    }

    // Clear previous highlights
    while (highlightGroupRef.current.children.length > 0) {
      const child = highlightGroupRef.current.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      highlightGroupRef.current.remove(child);
    }

    // Clear previous face highlights
    while (faceHighlightGroupRef.current.children.length > 0) {
      const child = faceHighlightGroupRef.current.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      faceHighlightGroupRef.current.remove(child);
    }

    // Create new outlines for selected objects
    selectedObjects.forEach((uuid) => {
      let obj;
      try {
        obj = universalEditor.findObjectById(uuid);
      } catch (error) {
        console.error(`⚠️ SelectionOutline: Error finding object with UUID ${uuid}:`, error);
        return;
      }

      if (!obj) {
        console.warn(`⚠️ SelectionOutline: Could not find object with UUID ${uuid}`);
        return;
      }
      console.info(`✅ SelectionOutline: Creating outline for "${obj.name}" (${uuid})`);
      console.info(`🔍 SelectionOutline: Object type: ${obj.type}, has geometry: ${!!(obj as any).geometry}, children: ${obj.children.length}`);
      console.info(`🔍 SelectionOutline: Object constructor: ${obj.constructor.name}, isGroup: ${(obj as any).isGroup}, isMesh: ${(obj as any).isMesh}`);
      
      // For Spline scenes, log more details about the object structure
      if (isSplineScene) {
        console.info(`🔍 SelectionOutline: Spline scene detected - checking object structure...`);
        console.info(`  Object keys:`, Object.keys(obj).slice(0, 20));
        if ((obj as any).geometry) {
          const geom = (obj as any).geometry;
          console.info(`  Geometry found:`, {
            type: geom.type,
            hasAttributes: !!geom.attributes,
            attributes: geom.attributes ? Object.keys(geom.attributes) : [],
            isBufferGeometry: geom.isBufferGeometry,
            isGeometry: geom.isGeometry
          });
        }
      }
      
      // Helper function to check if geometry is valid
      const hasValidGeometry = (object: any): boolean => {
        // Check direct geometry property
        const geom = object.geometry;
        if (geom) {
          // More lenient check - if it has type, attributes, or is a known geometry type
          if (geom.attributes && Object.keys(geom.attributes).length > 0) {
            return true; // Has attributes (most reliable)
          }
          if (geom.type || geom.isBufferGeometry || geom.isGeometry) {
            return true; // Has type or is a known geometry class
          }
          // Check if it's a valid geometry object by checking for common properties
          if (typeof geom === 'object' && ('position' in geom || 'vertices' in geom || 'faces' in geom)) {
            return true; // Looks like geometry
          }
        }
        // Check if object has a mesh property (Spline might wrap meshes)
        if (object.mesh && object.mesh.geometry) {
          return true;
        }
        // Check if object has a model property (some 3D formats wrap geometry)
        if (object.model && object.model.geometry) {
          return true;
        }
        return false;
      };
      
      // Helper function to get geometry from object (handles various access patterns)
      const getGeometry = (object: any): THREE.BufferGeometry | null => {
        // Direct geometry
        if (object.geometry && (object.geometry.attributes || object.geometry.type || object.geometry.isBufferGeometry)) {
          return object.geometry;
        }
        // Mesh property
        if (object.mesh && object.mesh.geometry) {
          return object.mesh.geometry;
        }
        // Model property
        if (object.model && object.model.geometry) {
          return object.model.geometry;
        }
        return null;
      };
      
      // Handle Groups and other object types - find the first mesh child
      let mesh: THREE.Mesh | null = null;
      let meshGeometry: THREE.BufferGeometry | null = null;
      
      // First, check if the object itself has geometry (even if not a Mesh instance)
      if (hasValidGeometry(obj)) {
        // Object has geometry directly - use it as mesh
        meshGeometry = getGeometry(obj);
        if (meshGeometry) {
          console.info(`✅ SelectionOutline: Object "${obj.name}" has geometry directly (type: ${obj.type})`);
          // Create a temporary mesh-like object for outline creation
          mesh = obj as unknown as THREE.Mesh;
        }
      }
      // Check if object is a Mesh (handle both THREE.Mesh instances and Spline's custom Mesh types)
      const isDirectMesh = obj instanceof THREE.Mesh || (obj as any).type?.includes('Mesh');
      if (isDirectMesh && (obj as any).geometry) {
        mesh = obj as unknown as THREE.Mesh;
        meshGeometry = getGeometry(mesh);
        console.info('SelectionOutline: Object is a Mesh: ' + obj.name);
      } else {
        // Not a direct mesh - search for mesh children
        console.info(`🔍 SelectionOutline: Object "${obj.name}" is not a Mesh (type: ${obj.type}), searching for mesh children...`);
        
        // Log all children first
        if (obj.children.length > 0) {
          console.info(`🔍 SelectionOutline: Direct children of "${obj.name}":`);
          obj.children.forEach((child, idx) => {
            const childType = (child as any).type || child.constructor.name;
            const isMesh = child instanceof THREE.Mesh;
            const hasGeom = hasValidGeometry(child);
            console.info(`  ${idx + 1}. "${child.name || 'unnamed'}" (type: ${childType}, isMesh: ${isMesh}, hasGeometry: ${hasGeom}, visible: ${child.visible}, children: ${child.children.length})`);
          });
        }
        
        // Traverse the object hierarchy to find meshes (recursive)
        const meshesFound: THREE.Mesh[] = [];
        const objectsWithGeometry: any[] = [];
        
        // For Spline scenes, also check the object itself more carefully
        if (isSplineScene) {
          // In Spline, objects might be Groups that ARE the mesh (not containing a mesh)
          // Check if the object itself has geometry even if it's not a Mesh instance
          if ((obj as any).geometry) {
            const geom = (obj as any).geometry;
            console.info(`🔍 SelectionOutline: Object "${obj.name}" has .geometry property:`, {
              type: geom.type,
              hasAttributes: !!geom.attributes,
              attributes: geom.attributes ? Object.keys(geom.attributes) : [],
              isBufferGeometry: geom.isBufferGeometry,
              isGeometry: geom.isGeometry
            });
            
            // If it has valid geometry, treat it as a mesh
            if (hasValidGeometry(obj)) {
              meshGeometry = getGeometry(obj);
              if (meshGeometry) {
                mesh = obj as unknown as THREE.Mesh;
                console.info(`✅ SelectionOutline: Using object "${obj.name}" directly as mesh (has valid geometry)`);
              }
            }
          }
        }
        
        obj.traverse((child) => {
          // Skip the root object itself (we're looking for children)
          if (child === obj) return;
          
          // Check for Mesh instances with valid geometry (prefer visible, but check all)
          // For Spline scenes, check both instanceof THREE.Mesh AND type.includes('Mesh')
          const isMesh = child instanceof THREE.Mesh || (child as any).type?.includes('Mesh');
          
          if (isMesh && child instanceof THREE.Mesh) {
            if ((child as any).geometry && hasValidGeometry(child)) {
              // Prefer visible meshes, but include invisible ones too
              if (child.visible) {
                meshesFound.unshift(child); // Add visible meshes to front
                console.info(`  ├─ Found visible Mesh: "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name}, geometry: ${(child as any).geometry?.type || 'unknown'})`);
              } else {
                meshesFound.push(child); // Add invisible meshes to back
                console.info(`  ├─ Found invisible Mesh: "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name}, geometry: ${(child as any).geometry?.type || 'unknown'})`);
              }
            } else if ((child as any).geometry) {
              // Mesh has geometry but validation failed - log for debugging
              const geom = (child as any).geometry;
              console.warn(`  ⚠️ Mesh "${child.name || 'unnamed'}" has geometry but validation failed:`, {
                type: geom.type,
                hasAttributes: !!geom.attributes,
                isBufferGeometry: !!geom.isBufferGeometry,
                attributes: geom.attributes ? Object.keys(geom.attributes) : []
              });
            }
          }
          // Also check for objects with geometry property (Spline might use custom types)
          else if (hasValidGeometry(child)) {
            if (child.visible) {
              objectsWithGeometry.unshift(child); // Prefer visible
              const geom = (child as any).geometry;
              console.info(`  ├─ Found visible object with geometry: "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name}, geometry type: ${geom.type || 'unknown'})`);
            } else {
              objectsWithGeometry.push(child);
              const geom = (child as any).geometry;
              console.info(`  ├─ Found invisible object with geometry: "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name}, geometry type: ${geom.type || 'unknown'})`);
            }
          }
          // More aggressive check: if object has geometry property at all, even if validation fails
          else if ((child as any).geometry) {
            const geom = (child as any).geometry;
            // Check if it's a valid geometry object (has type or attributes)
            if (geom && (typeof geom === 'object') && (geom.type || geom.attributes || geom.isBufferGeometry || geom.isGeometry)) {
              console.warn(`  ⚠️ Found object "${child.name || 'unnamed'}" with geometry that didn't pass validation:`, {
                type: (child as any).type || child.constructor.name,
                geometryType: geom.type,
                hasAttributes: !!geom.attributes,
                isBufferGeometry: !!geom.isBufferGeometry,
                isGeometry: !!geom.isGeometry
              });
              // Try to use it anyway if it looks like valid geometry
              if (geom.attributes && Object.keys(geom.attributes).length > 0) {
                objectsWithGeometry.push(child);
                console.info(`  ├─ Using object with geometry attributes: "${child.name || 'unnamed'}"`);
              }
            }
          }
        });
        
        // Prefer THREE.Mesh instances, but fall back to objects with geometry
        // Only use found meshes if we haven't already found one from the object itself
        if (!mesh && meshesFound.length > 0) {
          mesh = meshesFound[0];
          meshGeometry = getGeometry(mesh);
          console.info(`✅ SelectionOutline: Using THREE.Mesh "${mesh.name || 'unnamed'}" from "${obj.name}" (found ${meshesFound.length} mesh(es))`);
        } else if (!mesh && objectsWithGeometry.length > 0) {
          // Use first object with geometry as a mesh (Spline custom types)
          const objWithGeom = objectsWithGeometry[0];
          meshGeometry = getGeometry(objWithGeom);
          if (meshGeometry) {
            console.info(`  ⚠️ Using object with geometry as mesh: "${objWithGeom.name || 'unnamed'}" (type: ${(objWithGeom as any).type || objWithGeom.constructor.name})`);
            mesh = objWithGeom as unknown as THREE.Mesh;
          }
        }
        
        // Last resort: try to find ANY object with geometry, even if it failed validation
        if (!mesh || !meshGeometry) {
          console.warn(`⚠️ SelectionOutline: Object "${obj.name}" has no validated mesh children. Object type: ${obj.type}`);
          console.warn(`  Attempting last-resort search for any geometry...`);
          
          // For Spline scenes, also check the object itself one more time with very lenient checks
          if (isSplineScene && (obj as any).geometry) {
            const geom = (obj as any).geometry;
            console.warn(`  🔍 Last resort: Checking object "${obj.name}" geometry directly:`, {
              type: geom.type,
              hasAttributes: !!geom.attributes,
              attributes: geom.attributes ? Object.keys(geom.attributes) : [],
              isBufferGeometry: geom.isBufferGeometry,
              isGeometry: geom.isGeometry,
              keys: Object.keys(geom).slice(0, 10)
            });
            
            // Very lenient check - if it has ANY geometry-like properties, use it
            if (geom && typeof geom === 'object' && (geom.attributes || geom.vertices || geom.faces || geom.type || geom.isBufferGeometry || geom.isGeometry)) {
              mesh = obj as unknown as THREE.Mesh;
              meshGeometry = geom;
              console.warn(`  ⚠️ Using object "${obj.name}" directly as fallback mesh`);
            }
          }
          
          // Try one more time with even more lenient checks on children
          if (!mesh) {
            let fallbackMesh: any = null;
            obj.traverse((child) => {
              if (child === obj) return;
              if (fallbackMesh) return; // Already found one
              
              const geom = (child as any).geometry;
              if (geom && typeof geom === 'object') {
                // Very lenient check - just needs to have some geometry-like properties
                if (geom.attributes || geom.vertices || geom.faces || geom.type || geom.isBufferGeometry || geom.isGeometry) {
                  fallbackMesh = child;
                  console.warn(`  ⚠️ Found fallback object with geometry: "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name})`);
                }
              }
            });
            
            if (fallbackMesh) {
              mesh = fallbackMesh as unknown as THREE.Mesh;
              meshGeometry = getGeometry(fallbackMesh);
              if (!meshGeometry && (fallbackMesh as any).geometry) {
                meshGeometry = (fallbackMesh as any).geometry;
                console.warn(`  ⚠️ Using fallback geometry directly`);
              }
            }
          }
        }
        
        if (!mesh || !meshGeometry) {
          console.warn(`⚠️ SelectionOutline: Object "${obj.name}" has no mesh children. Object type: ${obj.type}`);
          // Log full hierarchy for debugging
          console.warn(`  Full hierarchy of "${obj.name}":`);
          obj.traverse((child) => {
            const geom = (child as any).geometry;
            const geomInfo = geom ? `geometry: ${geom.type || 'unknown'}` : 'no geometry';
            const hasAttrs = geom && geom.attributes ? `, attributes: ${Object.keys(geom.attributes).join(', ')}` : '';
            console.warn(`    - "${child.name || 'unnamed'}" (type: ${(child as any).type || child.constructor.name}, visible: ${child.visible}, ${geomInfo}${hasAttrs})`);
          });
          return;
        }
      }
      
      // If we found a mesh but don't have geometry yet, get it
      if (mesh && !meshGeometry) {
        console.info(`🔍 SelectionOutline: Attempting to get geometry from mesh "${mesh.name || 'unknown'}"`);
        console.info(`  Mesh type: ${(mesh as any).type || mesh.constructor.name}`);
        console.info(`  Mesh has .geometry: ${!!(mesh as any).geometry}`);
        console.info(`  Mesh has .mesh: ${!!(mesh as any).mesh}`);
        console.info(`  Mesh has .model: ${!!(mesh as any).model}`);
        if ((mesh as any).geometry) {
          const geom = (mesh as any).geometry;
          console.info(`  Geometry type: ${geom.type || 'unknown'}, has attributes: ${!!geom.attributes}, isBufferGeometry: ${!!geom.isBufferGeometry}`);
        }
        meshGeometry = getGeometry(mesh);
        if (!meshGeometry) {
          console.warn(`  ⚠️ getGeometry() returned null for mesh "${mesh.name || 'unknown'}"`);
          // Try to inspect the mesh object more deeply
          console.warn(`  Mesh object keys:`, Object.keys(mesh));
          if ((mesh as any).geometry) {
            console.warn(`  Mesh.geometry keys:`, Object.keys((mesh as any).geometry));
          }
        } else {
          console.info(`  ✅ Successfully got geometry from mesh`);
        }
      }
      
      if (!mesh || !meshGeometry) {
        console.warn(`⚠️ SelectionOutline: Object "${obj.name}" -> Mesh "${mesh?.name || 'unknown'}" has no geometry, skipping`);
        console.warn(`  Object type: ${obj.type}, Mesh type: ${mesh ? ((mesh as any).type || mesh.constructor.name) : 'null'}`);
        return;
      }
      
      // Final validation: ensure geometry is valid
      if (!meshGeometry.attributes && !meshGeometry.type && !meshGeometry.isBufferGeometry) {
        console.warn(`⚠️ SelectionOutline: Mesh "${mesh.name || 'unknown'}" has invalid geometry, skipping`);
        return;
      }

      try {
        // Create edges from actual geometry (like Blender)
        const edges = new THREE.EdgesGeometry(meshGeometry, 15); // 15° threshold angle

        // Note: linewidth > 1 doesn't work in WebGL, so we scale up the outline instead
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0xff6600, // Brighter orange for visibility
          linewidth: 1, // WebGL only supports 1
          transparent: false,
          depthTest: true, // Respect depth for proper 3D feel
          polygonOffset: true, // Enable polygon offset
          polygonOffsetFactor: -1, // Pull outline forward
          polygonOffsetUnits: -1,
        });

        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);

        // Scale up significantly to make outline clearly visible (3% larger)
        edgeLines.scale.set(1.03, 1.03, 1.03);
        
        // Reset position/rotation when parenting - let parent transform handle it
        edgeLines.position.set(0, 0, 0);
        edgeLines.rotation.set(0, 0, 0);
        
        // Parent the outline directly to the selected object so it follows transforms automatically
        // This ensures the outline moves/rotates/scales with the object in real-time
        if (obj !== mesh && obj !== scene) {
          // If the object is different from the mesh (e.g., object is a Group containing the mesh)
          // Parent to the object so it follows the object's transform
          obj.add(edgeLines);
          console.info(`✅ Added outline to object "${obj.name}" (will follow object transforms)`);
        } else if (mesh.parent && mesh.parent !== scene) {
          // Fallback: parent to mesh's parent group
          mesh.parent.add(edgeLines);
          console.info(`✅ Added outline to parent Group "${mesh.parent.name}"`);
        } else {
          // Last resort: add to outline group and manually sync transforms
          outlineGroupRef.current?.add(edgeLines);
          // Store reference to sync transforms (we'll update this in a render loop)
          (edgeLines as any).__targetObject = obj;
          (edgeLines as any).__targetMesh = mesh;
          // Set initial transform
          edgeLines.position.copy(obj.position);
          edgeLines.rotation.copy(obj.rotation);
          edgeLines.scale.copy(obj.scale).multiplyScalar(1.03);
          console.info(`✅ Added outline to outline group (will sync transforms)`);
        }

        // Set render order to draw after the mesh
        edgeLines.renderOrder = 1;

        // Note: edgeLines is already added to parent or outlineGroup above (line 151-156)
        console.info(`✅ Added Blender-style edge outline for "${obj.name}"`);

        // Create face highlight overlay
        try {
          // Clone geometry for highlight
          const highlightGeometry = meshGeometry.clone();
          
          // Create solid light orange highlight material for better visibility
          const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa366, // Light orange highlight color (more visible)
            transparent: true,
            opacity: 0.5, // More opaque for better visibility
            side: THREE.DoubleSide, // Show both sides
            depthWrite: false, // Don't write to depth buffer (allows seeing through)
            depthTest: true, // Still respect depth for proper 3D feel
            polygonOffset: true, // Enable polygon offset
            polygonOffsetFactor: -1, // Pull highlight forward slightly
            polygonOffsetUnits: -1,
          });

          const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);

          // Set render order to draw after the original mesh but before edges
          highlightMesh.renderOrder = 0;
          
          // Reset position/rotation when parenting - let parent transform handle it
          highlightMesh.position.set(0, 0, 0);
          highlightMesh.rotation.set(0, 0, 0);
          highlightMesh.scale.set(1, 1, 1);
          
          // Parent the highlight directly to the selected object so it follows transforms automatically
          if (obj !== mesh && obj !== scene) {
            // Parent to the object so it follows the object's transform
            obj.add(highlightMesh);
            console.info(`✅ Added highlight to object "${obj.name}" (will follow object transforms)`);
          } else if (mesh.parent && mesh.parent !== scene) {
            // Fallback: parent to mesh's parent group
            mesh.parent.add(highlightMesh);
            console.info(`✅ Added highlight to parent Group "${mesh.parent.name}"`);
          } else {
            // Last resort: add to highlight group and manually sync transforms
            highlightGroupRef.current?.add(highlightMesh);
            (highlightMesh as any).__targetObject = obj;
            (highlightMesh as any).__targetMesh = mesh;
            // Set initial transform
            highlightMesh.position.copy(obj.position);
            highlightMesh.rotation.copy(obj.rotation);
            highlightMesh.scale.copy(obj.scale);
            console.info(`✅ Added highlight to highlight group (will sync transforms)`);
          }
          console.info(`✅ Added face highlight for "${obj.name}"`);
        } catch (error) {
          console.warn(`⚠️ SelectionOutline: Cannot create face highlight for "${obj.name}"`, error);
          // Don't return - still show edge outline even if highlight fails
        }
      } catch (error) {
        console.warn(`⚠️ SelectionOutline: Cannot create edge outline for "${obj.name}"`, error);
        return;
      }
    });

    // Render face highlights for selected faces
    if (selectedFaces.size > 0) {
      console.info(`🎨 Rendering ${selectedFaces.size} selected face(s)`);
      
      // Group faces by object UUID
      const facesByObject = new Map<string, number[]>();
      selectedFaces.forEach((faceKey) => {
        const [uuid, faceIndexStr] = faceKey.split(':');
        const faceIndex = parseInt(faceIndexStr, 10);
        if (!facesByObject.has(uuid)) {
          facesByObject.set(uuid, []);
        }
        facesByObject.get(uuid)!.push(faceIndex);
      });

      // Create highlights for each object's selected faces
      facesByObject.forEach((faceIndices, objectUuid) => {
        let obj;
        try {
          obj = universalEditor.findObjectById(objectUuid);
        } catch (error) {
          console.error(`⚠️ SelectionOutline: Error finding object ${objectUuid} for face highlighting:`, error);
          return;
        }

        if (!obj) {
          console.warn(`⚠️ SelectionOutline: Could not find object with UUID ${objectUuid} for face highlighting`);
          return;
        }

        const mesh = obj as THREE.Mesh;
        if (!mesh.geometry) {
          console.warn(`⚠️ SelectionOutline: Object "${obj.name}" has no geometry for face highlighting`);
          return;
        }

        try {
          const geometry = mesh.geometry;
          
          // Check if geometry has index (faces are indexed)
          if (!geometry.index) {
            console.warn(`⚠️ SelectionOutline: Geometry for "${obj.name}" has no index, cannot highlight individual faces`);
            return;
          }

          // Create a geometry for the selected faces
          const selectedFacesGeometry = new THREE.BufferGeometry();
          const positions: number[] = [];
          const indices: number[] = [];

          // Extract vertices for selected faces
          const positionAttribute = geometry.attributes.position;
          const indexAttribute = geometry.index;

          // Type guard to ensure we have BufferAttribute with getX/getY/getZ methods
          if (!indexAttribute || !('getX' in indexAttribute)) {
            console.warn('⚠️ SelectionOutline: Index attribute does not support getX method');
            return;
          }

          if (!('getX' in positionAttribute) || !('getY' in positionAttribute) || !('getZ' in positionAttribute)) {
            console.warn('⚠️ SelectionOutline: Position attribute does not support getX/getY/getZ methods');
            return;
          }

          // Cast to BufferAttribute for TypeScript - we've verified the methods exist above
          const typedIndexAttribute = indexAttribute as THREE.BufferAttribute;
          const typedPositionAttribute = positionAttribute as THREE.BufferAttribute;

          faceIndices.forEach((faceIndex) => {
            // faceIndex is the triangle index (0, 1, 2, ...)
            // Each triangle has 3 indices in the index buffer
            const idx0 = faceIndex * 3;
            const idx1 = faceIndex * 3 + 1;
            const idx2 = faceIndex * 3 + 2;

            // Get vertex indices from index buffer
            const i0 = typedIndexAttribute.getX(idx0);
            const i1 = typedIndexAttribute.getX(idx1);
            const i2 = typedIndexAttribute.getX(idx2);

            // Get vertex positions from position buffer
            const v0x = typedPositionAttribute.getX(i0);
            const v0y = typedPositionAttribute.getY(i0);
            const v0z = typedPositionAttribute.getZ(i0);
            const v1x = typedPositionAttribute.getX(i1);
            const v1y = typedPositionAttribute.getY(i1);
            const v1z = typedPositionAttribute.getZ(i1);
            const v2x = typedPositionAttribute.getX(i2);
            const v2y = typedPositionAttribute.getY(i2);
            const v2z = typedPositionAttribute.getZ(i2);

            // Add vertices
            const baseIndex = positions.length / 3;
            positions.push(v0x, v0y, v0z);
            positions.push(v1x, v1y, v1z);
            positions.push(v2x, v2y, v2z);

            // Add face indices
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
          });

          selectedFacesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          selectedFacesGeometry.setIndex(indices);

          // Create highlight material for faces
          const faceHighlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff, // Cyan-blue highlight color
            transparent: true,
            opacity: 0.4, // More opaque than object highlight for visibility
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });

          const faceHighlightMesh = new THREE.Mesh(selectedFacesGeometry, faceHighlightMaterial);

          // Apply the same transform as the original mesh
          faceHighlightMesh.position.copy(mesh.position);
          faceHighlightMesh.rotation.copy(mesh.rotation);
          faceHighlightMesh.scale.copy(mesh.scale);

          // Set render order to draw after object highlights
          faceHighlightMesh.renderOrder = 2;

          faceHighlightGroupRef.current?.add(faceHighlightMesh);
          console.info(`✅ Added face highlight for ${faceIndices.length} face(s) on "${obj.name}"`);
        } catch (error) {
          console.warn(`⚠️ SelectionOutline: Cannot create face highlight for "${obj.name}"`, error);
        }
      });
    }

    // Sync transforms for outlines that couldn't be parented (fallback case)
    // Use requestAnimationFrame to update transforms every frame
    const syncTransforms = () => {
      if (!universalEditor || !universalEditor.isLoaded()) {
        animationFrameIdRef.current = null;
        return;
      }
      
      // Sync outlines in outline group
      if (outlineGroupRef.current) {
        outlineGroupRef.current.children.forEach((child) => {
          const targetObj = (child as any).__targetObject;
          const targetMesh = (child as any).__targetMesh;
          if (targetObj && child instanceof THREE.LineSegments) {
            // Update transform to match target object
            child.position.copy(targetObj.position);
            child.rotation.copy(targetObj.rotation);
            const scale = targetObj.scale.clone().multiplyScalar(1.03);
            child.scale.copy(scale);
          }
        });
      }
      
      // Sync highlights in highlight group
      if (highlightGroupRef.current) {
        highlightGroupRef.current.children.forEach((child) => {
          const targetObj = (child as any).__targetObject;
          if (targetObj && child instanceof THREE.Mesh) {
            // Update transform to match target object
            child.position.copy(targetObj.position);
            child.rotation.copy(targetObj.rotation);
            child.scale.copy(targetObj.scale);
          }
        });
      }
      
      animationFrameIdRef.current = requestAnimationFrame(syncTransforms);
    };
    
    // Start sync loop if we have outlines that need syncing
    if (outlineGroupRef.current?.children.length > 0 || highlightGroupRef.current?.children.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(syncTransforms);
    }

    // Force a render after adding outlines (only if editor is still loaded)
    if ((selectedObjects.size > 0 || selectedFaces.size > 0) && universalEditor.isLoaded()) {
      try {
        console.info(`🎨 Forcing render for ${selectedObjects.size} outline(s) and ${selectedFaces.size} face(s)`);
        universalEditor.render?.();
      } catch (error) {
        console.error('⚠️ SelectionOutline: Error rendering:', error);
      }
    }

    // Cleanup on unmount or when editor/scene changes
    return () => {
      // Stop animation frame loop
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // Only cleanup if scene still exists
      let currentScene;
      try {
        currentScene = universalEditor?.getScene();
      } catch (error) {
        // Scene might be disposed, skip cleanup
        console.warn('⚠️ SelectionOutline: Scene disposed during cleanup');
        return;
      }

      if (!currentScene) return;

      if (outlineGroupRef.current) {
        try {
          while (outlineGroupRef.current.children.length > 0) {
            const child = outlineGroupRef.current.children[0];
            if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
              child.geometry.dispose();
              (child.material as THREE.Material).dispose();
            }
            outlineGroupRef.current.remove(child);
          }
          if (currentScene) {
            currentScene.remove(outlineGroupRef.current);
          }
        } catch (error) {
          console.warn('⚠️ SelectionOutline: Error cleaning up outline group:', error);
        }
        outlineGroupRef.current = null;
      }

      if (highlightGroupRef.current) {
        try {
          while (highlightGroupRef.current.children.length > 0) {
            const child = highlightGroupRef.current.children[0];
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              (child.material as THREE.Material).dispose();
            }
            highlightGroupRef.current.remove(child);
          }
          if (currentScene) {
            currentScene.remove(highlightGroupRef.current);
          }
        } catch (error) {
          console.warn('⚠️ SelectionOutline: Error cleaning up highlight group:', error);
        }
        highlightGroupRef.current = null;
      }

      if (faceHighlightGroupRef.current) {
        try {
          while (faceHighlightGroupRef.current.children.length > 0) {
            const child = faceHighlightGroupRef.current.children[0];
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              (child.material as THREE.Material).dispose();
            }
            faceHighlightGroupRef.current.remove(child);
          }
          if (currentScene) {
            currentScene.remove(faceHighlightGroupRef.current);
          }
        } catch (error) {
          console.warn('⚠️ SelectionOutline: Error cleaning up face highlight group:', error);
        }
        faceHighlightGroupRef.current = null;
      }
    };
  }, [universalEditor, selectedObjects, selectedFaces, selectionVersion]);

  return null; // This component doesn't render React elements, only THREE.js objects
}
