/**
 * Material Category Constraints
 *
 * Defines property ranges and AI guidance for each material category
 * so the AI agent respects material physics when making adjustments.
 */

export type MaterialCategory = 'metal' | 'glass' | 'stone' | 'wood' | 'fabric';

export interface PropertyConstraint {
  min: number;
  max: number;
  default: number;
  description: string;
}

export interface CategoryConstraints {
  category: MaterialCategory;
  displayName: string;
  description: string;

  properties: {
    roughness: PropertyConstraint;
    metalness: PropertyConstraint;
  };

  aiGuidance: {
    commonAdjustments: string[];
    avoidPatterns: string[];
    examplePrompts: string[];
  };
}

/**
 * Category constraint definitions
 */
export const CATEGORY_CONSTRAINTS: Record<MaterialCategory, CategoryConstraints> = {
  metal: {
    category: 'metal',
    displayName: 'Metal',
    description: 'Metallic surfaces like steel, copper, gold, aluminum',
    properties: {
      roughness: {
        min: 0.0,
        max: 0.6,
        default: 0.3,
        description: '0=mirror polish, 0.3=brushed, 0.6=matte metal',
      },
      metalness: {
        min: 0.8,
        max: 1.0,
        default: 1.0,
        description: 'Should stay high (0.8-1.0) for metallic appearance',
      },
    },
    aiGuidance: {
      commonAdjustments: [
        '"more brushed" = increase roughness toward 0.4-0.5',
        '"polished/mirror" = decrease roughness toward 0.0-0.1',
        '"aged/weathered" = increase roughness, slight color shift',
        '"golden/copper/bronze tint" = shift color toward warm tones',
      ],
      avoidPatterns: [
        'Never set metalness below 0.8 for metals',
        'Roughness above 0.6 makes metal look unrealistic',
      ],
      examplePrompts: [
        'make it more brushed',
        'polished chrome look',
        'add a golden tint',
        'weathered copper',
      ],
    },
  },

  glass: {
    category: 'glass',
    displayName: 'Glass',
    description: 'Transparent and translucent surfaces like windows, crystal',
    properties: {
      roughness: {
        min: 0.0,
        max: 0.4,
        default: 0.05,
        description: '0=perfectly clear, 0.4=frosted glass',
      },
      metalness: {
        min: 0.0,
        max: 0.1,
        default: 0.0,
        description: 'Glass is non-metallic, keep at 0',
      },
    },
    aiGuidance: {
      commonAdjustments: [
        '"frosted" = increase roughness toward 0.3-0.4',
        '"clear/crystal" = decrease roughness toward 0.0',
        '"tinted" = add subtle color while keeping transparency',
        '"smoked" = add dark tint',
      ],
      avoidPatterns: [
        'Never increase metalness for glass',
        'Roughness above 0.4 loses glass appearance',
      ],
      examplePrompts: [
        'make it frosted',
        'crystal clear',
        'add blue tint',
        'smoked glass look',
      ],
    },
  },

  stone: {
    category: 'stone',
    displayName: 'Stone',
    description: 'Natural stone surfaces like marble, granite, concrete',
    properties: {
      roughness: {
        min: 0.3,
        max: 1.0,
        default: 0.7,
        description: '0.3=polished marble, 1.0=rough concrete',
      },
      metalness: {
        min: 0.0,
        max: 0.1,
        default: 0.0,
        description: 'Stone is non-metallic',
      },
    },
    aiGuidance: {
      commonAdjustments: [
        '"polished" = decrease roughness toward 0.3-0.4',
        '"rough/raw" = increase roughness toward 0.8-1.0',
        '"weathered" = increase roughness, desaturate color',
        '"marble/granite" = adjust color with veining patterns in mind',
      ],
      avoidPatterns: [
        'Never add metalness to stone',
        'Roughness below 0.3 looks too smooth for natural stone',
      ],
      examplePrompts: [
        'polished marble',
        'rough concrete',
        'weathered limestone',
        'make it darker',
      ],
    },
  },

  wood: {
    category: 'wood',
    displayName: 'Wood',
    description: 'Natural wood surfaces like oak, walnut, pine',
    properties: {
      roughness: {
        min: 0.2,
        max: 0.9,
        default: 0.5,
        description: '0.2=lacquered, 0.5=natural, 0.9=raw/unfinished',
      },
      metalness: {
        min: 0.0,
        max: 0.0,
        default: 0.0,
        description: 'Wood has no metallic properties',
      },
    },
    aiGuidance: {
      commonAdjustments: [
        '"lacquered/glossy" = decrease roughness toward 0.2-0.3',
        '"natural/satin" = set roughness around 0.4-0.6',
        '"raw/unfinished" = increase roughness toward 0.7-0.9',
        '"darker/lighter stain" = adjust color value',
      ],
      avoidPatterns: [
        'Never add metalness to wood',
        'Roughness below 0.2 looks like plastic, not wood',
      ],
      examplePrompts: [
        'more lacquered',
        'natural wood finish',
        'darker stain',
        'raw unfinished look',
      ],
    },
  },

  fabric: {
    category: 'fabric',
    displayName: 'Fabric',
    description: 'Textile surfaces like cotton, silk, velvet, leather',
    properties: {
      roughness: {
        min: 0.6,
        max: 1.0,
        default: 0.8,
        description: '0.6=silk/satin, 0.8=cotton, 1.0=rough wool',
      },
      metalness: {
        min: 0.0,
        max: 0.0,
        default: 0.0,
        description: 'Fabric has no metallic properties',
      },
    },
    aiGuidance: {
      commonAdjustments: [
        '"silky/smooth" = decrease roughness toward 0.6',
        '"soft/cotton" = set roughness around 0.8',
        '"rough/wool" = increase roughness toward 1.0',
        '"velvet" = high roughness with slight sheen consideration',
      ],
      avoidPatterns: [
        'Never add metalness to fabric',
        'Roughness below 0.6 loses fabric texture appearance',
      ],
      examplePrompts: [
        'make it silkier',
        'soft cotton feel',
        'rough wool texture',
        'change the color',
      ],
    },
  },
};

/**
 * Get constraints for a category
 */
export function getCategoryConstraints(category: MaterialCategory): CategoryConstraints {
  return CATEGORY_CONSTRAINTS[category];
}

/**
 * Clamp a value to category-specific constraints
 */
export function clampToCategory(
  category: MaterialCategory,
  property: 'roughness' | 'metalness',
  value: number
): number {
  const constraints = CATEGORY_CONSTRAINTS[category];
  const { min, max } = constraints.properties[property];
  return Math.max(min, Math.min(max, value));
}

/**
 * Build AI system prompt section for category
 */
export function buildCategoryPrompt(category: MaterialCategory): string {
  const c = CATEGORY_CONSTRAINTS[category];

  return `
## Current Material Category: ${c.displayName}
${c.description}

### Property Constraints (MUST FOLLOW):
- Roughness: ${c.properties.roughness.min} - ${c.properties.roughness.max} (${c.properties.roughness.description})
- Metalness: ${c.properties.metalness.min} - ${c.properties.metalness.max} (${c.properties.metalness.description})

### Common Adjustments:
${c.aiGuidance.commonAdjustments.map(a => `- ${a}`).join('\n')}

### AVOID:
${c.aiGuidance.avoidPatterns.map(a => `- ${a}`).join('\n')}
`;
}

/**
 * Detect category from material properties (heuristic)
 */
export function detectCategory(roughness: number, metalness: number): MaterialCategory {
  if (metalness >= 0.8) return 'metal';
  if (roughness <= 0.4 && metalness === 0) return 'glass';
  if (roughness >= 0.6 && metalness === 0) return 'fabric';
  if (roughness >= 0.3 && roughness <= 0.9 && metalness === 0) return 'wood';
  return 'stone'; // Default fallback
}
