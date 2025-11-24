/**
 * Material Spline Scene Mapping
 * 
 * Maps material IDs to their Spline scene URLs for 3D previews.
 * 
 * To add your Spline scenes:
 * 1. Create a Spline scene showcasing each material
 * 2. Export from Spline: File → Export → Code → Copy URL
 * 3. Add the mapping below: materialId -> Spline scene URL
 * 
 * Example:
 * export const MATERIAL_SPLINE_SCENES: Record<string, string> = {
 *   'FBR_Canvas_Natural': 'https://prod.spline.design/xxx/scene.splinecode',
 *   'MTL_Gold_Polished': 'https://prod.spline.design/yyy/scene.splinecode',
 * };
 */

export const MATERIAL_SPLINE_SCENES: Record<string, string> = {
  // TODO: Add your Spline scene URLs here
  // Format: 'MATERIAL_ID': 'https://prod.spline.design/xxx/scene.splinecode',
  
  // Example mappings (replace with your actual URLs):
  // 'FBR_Canvas_Natural': 'https://prod.spline.design/xxx/scene.splinecode',
  // 'FBR_Cotton_White': 'https://prod.spline.design/yyy/scene.splinecode',
  // 'MTL_Gold_Polished': 'https://prod.spline.design/zzz/scene.splinecode',
};

/**
 * Get Spline scene URL for a material
 */
export function getMaterialSplineScene(materialId: string): string | null {
  return MATERIAL_SPLINE_SCENES[materialId] || null;
}


