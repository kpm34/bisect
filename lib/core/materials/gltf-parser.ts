/**
 * GLTF Material Parser
 *
 * Extracts material data from GLTF exports and converts to MaterialPreset format.
 * Maps GLTF PBR properties to Spline RootNodeMaterial uniforms.
 */

import type {
  MaterialPreset,
  MaterialUniforms,
  GLTFPBRMaterial,
  MaterialCategory,
  MaterialTextures,
  TextureMap,
} from './types';

/**
 * Extract texture data from GLTF
 *
 * @param gltfData - Parsed GLTF JSON
 * @param textureIndex - Index of texture in GLTF.textures array
 * @returns TextureMap or null if not found
 */
function extractTextureData(
  gltfData: any,
  textureIndex: number | undefined
): TextureMap | null {
  if (textureIndex === undefined || !gltfData.textures) {
    return null;
  }

  const texture = gltfData.textures[textureIndex];
  if (!texture) {
    return null;
  }

  // Get image from texture
  const imageIndex = texture.source;
  if (imageIndex === undefined || !gltfData.images) {
    return null;
  }

  const image = gltfData.images[imageIndex];
  if (!image) {
    return null;
  }

  // Handle embedded base64 data URI
  if (image.uri && image.uri.startsWith('data:')) {
    const matches = image.uri.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.warn('Invalid data URI format');
      return null;
    }

    const format = matches[1] as 'png' | 'jpeg' | 'webp';
    const base64Data = matches[2];

    // Estimate size from base64 length (base64 is ~4/3 of binary size)
    const size = Math.floor((base64Data.length * 3) / 4);

    return {
      data: image.uri,
      resolution: {
        width: 0, // Will be determined when loaded in browser
        height: 0,
      },
      format,
      size,
    };
  }

  // Handle buffer view (embedded binary data)
  if (image.bufferView !== undefined && gltfData.bufferViews) {
    const bufferView = gltfData.bufferViews[image.bufferView];
    if (bufferView && gltfData.buffers) {
      const buffer = gltfData.buffers[bufferView.buffer];
      if (buffer && buffer.uri) {
        // Buffer data (typically base64 in .gltf or binary in .glb)
        const format = image.mimeType?.includes('png') ? 'png' :
                      image.mimeType?.includes('jpeg') ? 'jpeg' : 'png';

        return {
          data: buffer.uri,
          resolution: {
            width: 0,
            height: 0,
          },
          format,
          size: bufferView.byteLength || 0,
        };
      }
    }
  }

  // External file reference (relative path)
  if (image.uri && !image.uri.startsWith('data:')) {
    // Return a marker indicating external file that needs to be loaded
    // The processing script will handle loading these files
    return {
      data: image.uri, // Store relative path as placeholder
      resolution: {
        width: 0,
        height: 0,
      },
      format: image.mimeType?.includes('png') ? 'png' :
              image.mimeType?.includes('jpeg') ? 'jpeg' : 'png',
      size: 0,
    };
  }

  return null;
}

/**
 * Extract all texture maps from GLTF material
 *
 * @param gltfData - Parsed GLTF JSON
 * @param material - GLTF material object
 * @returns MaterialTextures object with extracted maps
 */
function extractTextureMaps(
  gltfData: any,
  material: any
): MaterialTextures | undefined {
  const textures: MaterialTextures = {};
  const pbr = material.pbrMetallicRoughness;

  if (!pbr) {
    return undefined;
  }

  // Base color texture
  if (pbr.baseColorTexture) {
    const textureData = extractTextureData(gltfData, pbr.baseColorTexture.index);
    if (textureData) {
      textures.baseColor = textureData;
    }
  }

  // Metallic-roughness texture (packed: R=AO, G=Roughness, B=Metalness)
  if (pbr.metallicRoughnessTexture) {
    const textureData = extractTextureData(gltfData, pbr.metallicRoughnessTexture.index);
    if (textureData) {
      textures.metallicRoughness = textureData;
    }
  }

  // Normal map
  if (material.normalTexture) {
    const textureData = extractTextureData(gltfData, material.normalTexture.index);
    if (textureData) {
      textures.normal = textureData;
    }
  }

  // Ambient occlusion (if separate from packed texture)
  if (material.occlusionTexture) {
    const textureData = extractTextureData(gltfData, material.occlusionTexture.index);
    if (textureData) {
      textures.occlusion = textureData;
    }
  }

  // Emissive map
  if (material.emissiveTexture) {
    const textureData = extractTextureData(gltfData, material.emissiveTexture.index);
    if (textureData) {
      textures.emissive = textureData;
    }
  }

  // Return undefined if no textures found
  return Object.keys(textures).length > 0 ? textures : undefined;
}

/**
 * Generate semantic description for material (used for ChromaDB search)
 *
 * @param name - Material name
 * @param uniforms - Material uniforms
 * @param textures - Material textures
 * @returns Human-readable description for semantic search
 */
function generateMaterialDescription(
  name: string,
  uniforms: MaterialUniforms,
  textures?: MaterialTextures
): string {
  const parts: string[] = [name];

  // Describe surface properties
  const roughness = uniforms.nodeU5;
  const metalness = uniforms.nodeU6;

  if (metalness > 0.7) {
    parts.push('metallic');
  } else if (metalness > 0.3) {
    parts.push('semi-metallic');
  } else {
    parts.push('non-metallic');
  }

  if (roughness < 0.3) {
    parts.push('glossy', 'shiny', 'polished');
  } else if (roughness > 0.7) {
    parts.push('matte', 'rough', 'dull');
  } else {
    parts.push('semi-gloss');
  }

  // Describe texture presence
  if (textures) {
    if (textures.baseColor) {
      parts.push('textured');
    }
    if (textures.normal) {
      parts.push('detailed surface', 'bump mapping');
    }
    if (textures.metallicRoughness) {
      parts.push('PBR');
    }
  }

  // Describe color
  const color = uniforms.nodeU0;
  const hex = rgbToHex(color.r, color.g, color.b);
  parts.push(`color ${hex}`);

  // Describe opacity
  if (uniforms.nodeU1 < 1.0) {
    if (uniforms.nodeU1 < 0.3) {
      parts.push('highly transparent');
    } else if (uniforms.nodeU1 < 0.7) {
      parts.push('semi-transparent', 'translucent');
    } else {
      parts.push('slightly transparent');
    }
  } else {
    parts.push('opaque');
  }

  return parts.join(', ');
}

/**
 * Parse GLTF file and extract material preset
 *
 * @param gltfData - Parsed GLTF JSON
 * @param category - Material category for UI
 * @param name - Optional custom name (defaults to GLTF material name)
 * @returns MaterialPreset or null if no material found
 */
export function parseGLTFMaterial(
  gltfData: any,
  category: MaterialCategory,
  name?: string
): MaterialPreset | null {
  // Extract first material from GLTF
  const materials = gltfData.materials;
  if (!materials || materials.length === 0) {
    console.warn('No materials found in GLTF file');
    return null;
  }

  const material: GLTFPBRMaterial = materials[0];
  const pbr = material.pbrMetallicRoughness;

  if (!pbr) {
    console.warn('No PBR material data found');
    return null;
  }

  // Convert GLTF baseColorFactor to RootNodeMaterial nodeU0
  // Default to white if not specified
  const baseColorFactor = pbr.baseColorFactor || [1, 1, 1, 1];
  const [r, g, b, a] = baseColorFactor;

  // Build uniforms following RootNodeMaterial structure
  const uniforms: MaterialUniforms = {
    nodeU0: { r, g, b },                          // Main color
    nodeU1: a,                                     // Opacity
    nodeU5: pbr.roughnessFactor ?? 0.5,           // Roughness (default: 0.5)
    nodeU6: pbr.metallicFactor ?? 0.0,            // Metalness (default: 0.0)
  };

  // Extract textures
  const textures = extractTextureMaps(gltfData, material);

  // Generate ID from name
  const materialName = name || material.name || category;
  const id = materialName.toLowerCase().replace(/\s+/g, '-');

  // Generate description for search
  const description = generateMaterialDescription(materialName, uniforms, textures);

  return {
    id,
    name: materialName,
    category,
    uniforms,
    textures,
    source: 'gltf-export',
    description,
  };
}

/**
 * Convert RGB color (0-1) to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to RGB (0-1)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Batch parse multiple GLTF files
 */
export async function parseMultipleGLTF(
  files: Array<{
    path: string;
    category: MaterialCategory;
    name?: string;
  }>
): Promise<MaterialPreset[]> {
  const presets: MaterialPreset[] = [];

  for (const file of files) {
    try {
      // In Node.js environment, read file
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const data = fs.readFileSync(file.path, 'utf-8');
        const gltfData = JSON.parse(data);
        const preset = parseGLTFMaterial(gltfData, file.category, file.name);
        if (preset) {
          presets.push(preset);
        }
      } else {
        // In browser, fetch file
        const response = await fetch(file.path);
        const gltfData = await response.json();
        const preset = parseGLTFMaterial(gltfData, file.category, file.name);
        if (preset) {
          presets.push(preset);
        }
      }
    } catch (error) {
      console.error(`Failed to parse ${file.path}:`, error);
    }
  }

  return presets;
}

/**
 * Format material uniform values for display
 */
export function formatMaterialValues(uniforms: MaterialUniforms): {
  color: string;
  roughness: string;
  metalness: string;
  opacity: string;
} {
  return {
    color: rgbToHex(uniforms.nodeU0.r, uniforms.nodeU0.g, uniforms.nodeU0.b),
    roughness: (uniforms.nodeU5 * 100).toFixed(0) + '%',
    metalness: (uniforms.nodeU6 * 100).toFixed(0) + '%',
    opacity: (uniforms.nodeU1 * 100).toFixed(0) + '%',
  };
}
