# Spline Material Previews Setup Guide

This guide explains how to add Spline scene embeds for material previews in the MaterialSelector component.

## Overview

The MaterialSelector now supports **Spline embeds** for realistic 3D material previews. When a Spline scene URL is configured for a material, it will display an interactive 3D preview instead of a static color swatch.

## How It Works

1. **MaterialPreview Component** - Embeds Spline scenes for each material
2. **Fallback System** - Shows color swatch if no Spline scene URL is configured
3. **Lazy Loading** - Spline scenes load on-demand for better performance

## Setup Steps

### Step 1: Create Spline Scenes for Materials

For each material you want to showcase:

1. Open Spline editor (app.spline.design)
2. Create a scene showcasing the material:
   - Add a 3D object (sphere, cube, etc.)
   - Apply your material to the object
   - Position camera for best view
   - Optimize scene size (keep it small for fast loading)

### Step 2: Export Spline Scene

1. In Spline: **File → Export → Code**
2. Choose **"React"** format
3. Copy the **scene URL** (format: `https://prod.spline.design/xxx/scene.splinecode`)

### Step 3: Add Scene URL to Configuration

Edit `material-spline-scenes.ts`:

```typescript
export const MATERIAL_SPLINE_SCENES: Record<string, string> = {
  'FBR_Canvas_Natural': 'https://prod.spline.design/xxx/scene.splinecode',
  'MTL_Gold_Polished': 'https://prod.spline.design/yyy/scene.splinecode',
  // Add more mappings...
};
```

**Material IDs** can be found in:
- `packages/shared-core/src/materials/material-manifest.ts`
- Or check browser console logs when MaterialSelector loads

### Step 4: Test

1. Start dev server: `pnpm --filter prism dev`
2. Open Material tab in editor
3. Materials with Spline scenes will show 3D previews
4. Materials without scenes will show color fallbacks

## Tips for Best Results

### Scene Optimization
- **Keep scenes small** - Use simple geometry (sphere, cube)
- **Single material per scene** - Focus on one material
- **Optimize camera** - Position for best material view
- **Remove unnecessary objects** - Keep scene lightweight

### Performance
- Spline scenes are **lazy loaded** (only load when visible)
- Consider creating **one scene per category** instead of per material
- Use **fallback colors** for materials that don't need 3D previews

### Scene Organization

**Option 1: One Scene Per Material** (Best quality, more scenes)
```
FBR_Canvas_Natural → https://prod.spline.design/xxx/scene.splinecode
FBR_Cotton_White → https://prod.spline.design/yyy/scene.splinecode
```

**Option 2: One Scene Per Category** (Fewer scenes, shared scene)
```
All Fabric materials → https://prod.spline.design/fabric-showcase/scene.splinecode
All Metal materials → https://prod.spline.design/metal-showcase/scene.splinecode
```

**Option 3: Hybrid** (Important materials get scenes, others use colors)
```
MTL_Gold_Polished → https://prod.spline.design/gold/scene.splinecode
Other materials → Color fallback
```

## Troubleshooting

### Scene Not Loading
- Check browser console for errors
- Verify URL is correct format
- Ensure Spline scene is published/public

### Performance Issues
- Reduce number of simultaneous Spline embeds
- Use smaller, simpler scenes
- Consider lazy loading only visible materials

### Fallback Colors Showing
- Check `material-spline-scenes.ts` has correct material ID
- Verify material ID matches `material-manifest.ts`
- Check browser console for mapping errors

## Example Scene Setup

**Recommended Scene Structure:**
```
Scene
├── Camera (positioned to show material)
├── Light (good lighting for material)
└── Object (sphere/cube with material applied)
    └── Material (your material)
```

**Camera Settings:**
- Position: Show material clearly
- FOV: 50-75 degrees
- Focus: Center on material object

## Next Steps

1. Create Spline scenes for your 40 materials
2. Export and get URLs
3. Add mappings to `material-spline-scenes.ts`
4. Test in MaterialSelector
5. Optimize scenes for performance

For questions or issues, check the browser console logs with `[MaterialPreview]` prefix.


