# Material System Flow - User Manual

## Overview

The Bisect material system provides a two-tier selection workflow: **Presets** for quick material application and **Browse** for exploring deeper variations within each preset.

**Storage:** All material presets are stored in **Supabase** (PostgreSQL + Storage) for dynamic content management.

---

## Material Hierarchy

```
Material Categories (5 total) - Supabase Table: `material_categories`
├── Gold
├── Silver
├── Copper
├── Iron
└── Titanium

Each Category has Preset Variations - Supabase Table: `material_presets`
├── Finishes (Mirror, Polished, Satin, Brushed, Matte)
├── Tints (color variations specific to metal type)
└── Aged/Special (weathered, antique, patina effects)

Each Preset has further Browse Variations - Supabase Table: `material_variations`
└── Fine-tuned roughness, color shifts, and surface details
```

---

## Supabase Database Schema

### Table: `material_categories`
| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `slug` | string | URL-safe ID (e.g., "gold", "silver") |
| `name` | string | Display name |
| `sort_order` | integer | Sort order |
| `icon` | string | Icon identifier |

### Table: `material_presets`
| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `category_id` | uuid | Foreign key to material_categories |
| `slug` | string | URL-safe ID (e.g., "gold-polished") |
| `name` | string | Display name (e.g., "Polished") |
| `tab` | enum | "finishes" \| "tints" \| "aged" |
| `preview_url` | string | Supabase Storage URL for preview image |
| `color` | string | Hex color (e.g., "#FFD700") |
| `roughness` | float | 0.0 - 1.0 |
| `metalness` | float | 0.0 - 1.0 |
| `clearcoat` | float | 0.0 - 1.0 (optional) |
| `physical_props` | jsonb | Extended MeshPhysicalMaterial properties |
| `sort_order` | integer | Sort order within tab |

### Table: `material_variations`
| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `preset_id` | uuid | Foreign key to material_presets |
| `slug` | string | URL-safe ID |
| `name` | string | Variation name |
| `preview_url` | string | Supabase Storage URL |
| `roughness` | float | Fine-tuned roughness |
| `metalness` | float | Fine-tuned metalness |
| `color_shift` | string | Optional color adjustment |
| `physical_props` | jsonb | Extended material properties |
| `sort_order` | integer | Sort order |

### Storage Bucket: `material-previews`
- Blender-rendered 512x512 PNG images
- Organized by: `{category}/{preset}/{variation}.png`

---

## User Flow

### Step 1: Select Object
- Click on any 3D object in the scene
- The object will be highlighted with an orange outline
- Selection info appears in the bottom-right badge

### Step 2: Open Material Panel
- Click **"Gold Variations"** button (top-right)
- Modal overlay opens showing material presets

### Step 3: Choose Category Tab
Three category tabs organize the presets:
| Tab | Description | Example Presets |
|-----|-------------|-----------------|
| **Finishes** | Surface texture variations | Mirror, Polished, Satin, Brushed, Matte |
| **Tints** | Color variations of the base metal | Rose Gold, White Gold, Champagne |
| **Aged** | Weathered and special effects | Antique, Worn, Patina, Rough Cast |

### Step 4: Select Preset
- Click any preset thumbnail to **immediately apply** it to the selected object
- A checkmark appears on the selected preset
- The 3D object updates in real-time with the new material

### Step 5: Browse Further Variations (Optional)
- After selecting a preset, click **"Browse"** in the footer
- Opens expanded view with fine-tuned variations of the selected preset
- Allows micro-adjustments to:
  - Roughness (0.0 - 1.0)
  - Metalness intensity
  - Color temperature shifts
  - Surface detail intensity

### Step 6: Confirm Selection
- Click **"Done"** to close the modal and keep the applied material
- Click **"Cancel"** to close without changes (material already applied persists)

---

## Technical Implementation

### Material Application
When a preset is selected:
1. Base color (hex) is converted to Three.js color
2. `MeshPhysicalMaterial` is created with:
   - `color`: Base metal color
   - `metalness`: 0.8 - 1.0 (full metal)
   - `roughness`: 0.0 (mirror) to 0.8 (rough)
   - `clearcoat`: Added for polished metals (roughness < 0.2)
   - `clearcoatRoughness`: 0.1
   - `envMapIntensity`: 1.5 (enhanced reflections)

### Preset Data Structure
```typescript
interface MaterialVariation {
  id: string;           // e.g., "gold-polished"
  name: string;         // e.g., "Polished"
  previewPath: string;  // Path to Blender-rendered preview image
  color: string;        // Hex color, e.g., "#FFD700"
  roughness: number;    // 0.0 (mirror) to 1.0 (rough)
  metalness: number;    // 0.0 (dielectric) to 1.0 (full metal)
  category: 'standard' | 'tints' | 'aged';
}
```

### Preview Images
- Rendered in Blender using Cycles (GPU accelerated)
- 512x512 PNG with transparent background
- Studio lighting: 3-point setup + HDRI environment
- Located at: `/public/assets/materials/metal/{metal}-variations/`

---

## Gold Variations Reference

### Finishes (Standard)
| Preset | Roughness | Visual |
|--------|-----------|--------|
| Mirror | 0.00 | Perfect reflection, chrome-like |
| Polished | 0.10 | High shine with slight diffusion |
| Satin | 0.30 | Soft sheen, elegant finish |
| Brushed | 0.45 | Linear texture, industrial look |
| Matte | 0.60 | No shine, soft appearance |

### Tints
| Preset | Color | Description |
|--------|-------|-------------|
| Rose Gold | #B76E79 | Pink-copper tone |
| White Gold | #F5F5F5 | Silvery-white alloy look |
| Champagne | #F7E7CE | Warm, subtle gold |
| Rich Gold | #FFC125 | Deep, saturated yellow |
| Pale Gold | #E6C288 | Light, understated tone |

### Aged & Special
| Preset | Effect |
|--------|--------|
| Aged | Slight tarnish, lived-in look |
| Antique | Heavy patina, vintage appearance |
| Dark Gold | Deep bronze-gold tone |
| Worn | Surface wear, muted reflections |
| Rough Cast | Textured surface, raw finish |

---

## Future Metal Categories

The same 5-category structure applies to:

| Metal | Tint Examples | Aged Examples |
|-------|---------------|---------------|
| **Silver** | Sterling, Oxidized, Warm, Cool | Tarnished, Antique, Patina |
| **Copper** | Rose, Polished, Penny | Green Patina, Weathered |
| **Iron** | Polished, Cast, Wrought | Rusty, Blackened, Galvanized |
| **Titanium** | Natural, Anodized (blue/purple/gold) | Brushed, Dark |

---

## Component Files

| File | Purpose |
|------|---------|
| `MaterialPreviewOverlay.tsx` | Main modal component |
| `SceneCanvas.tsx` | Canvas integration |
| `render-gold-variations.py` | Blender render script |
| `/public/assets/materials/metal/gold-variations/` | Preview images |

---

## Keyboard Shortcuts (Planned)

| Key | Action |
|-----|--------|
| `M` | Open material panel |
| `1-5` | Select preset 1-5 in current tab |
| `Tab` | Cycle through category tabs |
| `Esc` | Close panel |
| `Enter` | Confirm and close |
