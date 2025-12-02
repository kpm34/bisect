/**
 * Color Presets for Video Studio
 *
 * 1-click color filters following "visual first" design philosophy.
 * These presets are applied using CSS filters for preview and
 * can be baked into the video during export.
 */

export interface ColorAdjustments {
  brightness?: number;    // 0-200, 100 = normal
  contrast?: number;      // 0-200, 100 = normal
  saturation?: number;    // 0-200, 100 = normal
  temperature?: number;   // -100 to 100, 0 = normal (warm/cool)
  sepia?: number;         // 0-100
  hueRotate?: number;     // 0-360 degrees
  blur?: number;          // 0-10 px
  grayscale?: number;     // 0-100
}

export interface ColorPreset {
  id: string;
  name: string;
  icon: string; // emoji for visual identification
  adjustments: ColorAdjustments;
  cssFilter: string; // Pre-computed CSS filter string
}

// Pre-computed CSS filter strings for each preset
function computeCssFilter(adj: ColorAdjustments): string {
  const filters: string[] = [];

  if (adj.brightness !== undefined && adj.brightness !== 100) {
    filters.push(`brightness(${adj.brightness / 100})`);
  }
  if (adj.contrast !== undefined && adj.contrast !== 100) {
    filters.push(`contrast(${adj.contrast / 100})`);
  }
  if (adj.saturation !== undefined && adj.saturation !== 100) {
    filters.push(`saturate(${adj.saturation / 100})`);
  }
  if (adj.sepia !== undefined && adj.sepia > 0) {
    filters.push(`sepia(${adj.sepia / 100})`);
  }
  if (adj.grayscale !== undefined && adj.grayscale > 0) {
    filters.push(`grayscale(${adj.grayscale / 100})`);
  }
  if (adj.hueRotate !== undefined && adj.hueRotate !== 0) {
    filters.push(`hue-rotate(${adj.hueRotate}deg)`);
  }
  if (adj.blur !== undefined && adj.blur > 0) {
    filters.push(`blur(${adj.blur}px)`);
  }
  // Temperature is simulated via hue-rotate + saturation
  if (adj.temperature !== undefined && adj.temperature !== 0) {
    // Warm = orange tint, Cool = blue tint
    const hue = adj.temperature > 0 ? -10 : 10;
    filters.push(`hue-rotate(${hue * Math.abs(adj.temperature) / 100}deg)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'none',
    name: 'Original',
    icon: '🎬',
    adjustments: {},
    cssFilter: 'none',
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: '🌅',
    adjustments: { temperature: 30, saturation: 110, brightness: 105 },
    cssFilter: computeCssFilter({ temperature: 30, saturation: 110, brightness: 105 }),
  },
  {
    id: 'cool',
    name: 'Cool',
    icon: '❄️',
    adjustments: { temperature: -30, saturation: 95, brightness: 100 },
    cssFilter: computeCssFilter({ temperature: -30, saturation: 95, brightness: 100 }),
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: '📷',
    adjustments: { sepia: 35, contrast: 110, saturation: 80, brightness: 95 },
    cssFilter: computeCssFilter({ sepia: 35, contrast: 110, saturation: 80, brightness: 95 }),
  },
  {
    id: 'bw',
    name: 'B&W',
    icon: '⬛',
    adjustments: { grayscale: 100, contrast: 110 },
    cssFilter: computeCssFilter({ grayscale: 100, contrast: 110 }),
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: '🎥',
    adjustments: { contrast: 115, saturation: 85, brightness: 95 },
    cssFilter: computeCssFilter({ contrast: 115, saturation: 85, brightness: 95 }),
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    icon: '🌈',
    adjustments: { saturation: 140, contrast: 105, brightness: 105 },
    cssFilter: computeCssFilter({ saturation: 140, contrast: 105, brightness: 105 }),
  },
  {
    id: 'muted',
    name: 'Muted',
    icon: '🌫️',
    adjustments: { saturation: 60, contrast: 90, brightness: 105 },
    cssFilter: computeCssFilter({ saturation: 60, contrast: 90, brightness: 105 }),
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    icon: '🌇',
    adjustments: { temperature: 50, saturation: 120, brightness: 110, contrast: 105 },
    cssFilter: computeCssFilter({ temperature: 50, saturation: 120, brightness: 110, contrast: 105 }),
  },
  {
    id: 'noir',
    name: 'Film Noir',
    icon: '🎩',
    adjustments: { grayscale: 100, contrast: 130, brightness: 90 },
    cssFilter: computeCssFilter({ grayscale: 100, contrast: 130, brightness: 90 }),
  },
  {
    id: 'faded',
    name: 'Faded',
    icon: '🍂',
    adjustments: { contrast: 80, saturation: 75, brightness: 110 },
    cssFilter: computeCssFilter({ contrast: 80, saturation: 75, brightness: 110 }),
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    icon: '⚡',
    adjustments: { contrast: 140, saturation: 110, brightness: 95 },
    cssFilter: computeCssFilter({ contrast: 140, saturation: 110, brightness: 95 }),
  },
];

// Get preset by ID
export function getColorPreset(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find(p => p.id === id);
}

// Get CSS filter for a preset ID
export function getPresetCssFilter(id: string | undefined): string {
  if (!id || id === 'none') return 'none';
  const preset = getColorPreset(id);
  return preset?.cssFilter || 'none';
}

// Export preset IDs as type for type safety
export type ColorPresetId = typeof COLOR_PRESETS[number]['id'];
