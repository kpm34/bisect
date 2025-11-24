import * as THREE from 'three';
import { MaterialPreset, TextureMap, MaterialTextures } from './types';

export class MaterialApplicator {
  private textureLoader = new THREE.TextureLoader();

  async apply(object: THREE.Object3D, preset: MaterialPreset) {
    if (!object) return;

    // If group, apply to all children meshes
    if (object.type === 'Group' || object.type === 'Scene') {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.applyToMesh(child, preset);
        }
      });
      return;
    }

    if (object instanceof THREE.Mesh) {
      await this.applyToMesh(object, preset);
    } else {
      console.warn('MaterialApplicator: Target is not a mesh or group', object);
    }
  }

  private async applyToMesh(mesh: THREE.Mesh, preset: MaterialPreset) {
    const uniforms = preset.uniforms;
    
    // Create MeshStandardMaterial
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(uniforms.nodeU0.r, uniforms.nodeU0.g, uniforms.nodeU0.b),
      roughness: uniforms.nodeU5,
      metalness: uniforms.nodeU6,
      opacity: uniforms.nodeU1,
      transparent: uniforms.nodeU1 < 1.0,
      envMapIntensity: 1.0,
    });

    // Emissive (Secondary color in Spline logic, usually nodeU2 if used for light)
    if (uniforms.nodeU2) {
        material.emissive = new THREE.Color(uniforms.nodeU2.r, uniforms.nodeU2.g, uniforms.nodeU2.b);
    }

    // Handle textures
    if (preset.textures) {
      await this.applyTextures(material, preset.textures);
    }

    // Replace material
    // Clean up old material if necessary (optional, but good practice)
    if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
    } else if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
    }

    mesh.material = material;
    mesh.material.needsUpdate = true;
  }

  private async applyTextures(material: THREE.MeshStandardMaterial, textures: MaterialTextures) {
    const loadMap = async (mapData: TextureMap | undefined, isSRGB: boolean = true): Promise<THREE.Texture | null> => {
        if (!mapData) return null;
        
        let url = mapData.url;
        // Prefer URL, fall back to data if needed
        if (!url && mapData.data) {
            url = mapData.data; // data:image...
        }
        
        if (!url) return null;

        return new Promise<THREE.Texture>((resolve) => {
            this.textureLoader.load(
                url!,
                (tex) => {
                    tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                    resolve(tex);
                },
                undefined,
                (err) => {
                    console.error(`Failed to load texture from ${url?.substring(0, 50)}...`, err);
                    resolve(null);
                }
            );
        });
    };

    // Parallel load
    const [baseColor, normal, metallicRoughness, occlusion, emissive, displacement] = await Promise.all([
        loadMap(textures.baseColor, true), // sRGB
        loadMap(textures.normal, false),   // Linear
        loadMap(textures.metallicRoughness, false), // Linear
        loadMap(textures.occlusion, false), // Linear
        loadMap(textures.emissive, true), // sRGB
        loadMap(textures.displacement, false) // Linear
    ]);

    if (baseColor) material.map = baseColor;
    
    if (normal) {
        material.normalMap = normal;
        material.normalScale.set(1, 1);
    }
    
    if (metallicRoughness) {
        // Assuming GLTF packing: R=Occlusion, G=Roughness, B=Metalness
        // MeshStandardMaterial expects separate maps or compatible packing.
        // Three.js MeshStandardMaterial:
        // roughnessMap: Green channel
        // metalnessMap: Blue channel
        // aoMap: Red channel
        
        material.roughnessMap = metallicRoughness;
        material.metalnessMap = metallicRoughness;
        // If occlusion is NOT provided separately, use the packed one
        if (!occlusion) {
            material.aoMap = metallicRoughness;
        }
    }

    if (occlusion) {
        material.aoMap = occlusion;
        material.aoMapIntensity = 1.0;
    }

    if (emissive) {
        material.emissiveMap = emissive;
        material.emissiveIntensity = 1.0;
        if (material.emissive.getHex() === 0) {
            material.emissive.set(0xffffff); // Ensure map is visible
        }
    }

    if (displacement) {
        material.displacementMap = displacement;
        material.displacementScale = 0.1;
    }
    
    material.needsUpdate = true;
  }
}

export const materialApplicator = new MaterialApplicator();

