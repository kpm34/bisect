import { NextRequest, NextResponse } from 'next/server';

// Material categories and presets
const MATERIAL_CATEGORIES = {
  metal: {
    description: 'Metallic materials with various finishes',
    presets: [
      'gold-polished', 'gold-brushed', 'gold-aged', 'gold-rose',
      'silver-polished', 'silver-brushed', 'silver-aged', 'silver-matte',
      'copper-polished', 'copper-brushed', 'copper-aged', 'copper-verdigris',
      'bronze-polished', 'bronze-brushed', 'bronze-aged',
      'iron-polished', 'iron-brushed', 'iron-rusted', 'iron-weathered',
      'titanium-polished', 'titanium-brushed', 'titanium-anodized',
      'aluminum-polished', 'aluminum-brushed', 'aluminum-anodized',
      'chrome-polished', 'chrome-brushed',
      'brass-polished', 'brass-brushed', 'brass-aged',
      'steel-polished', 'steel-brushed', 'steel-galvanized', 'steel-corten'
    ]
  },
  wood: {
    description: 'Natural wood materials',
    presets: [
      'oak-natural', 'oak-stained', 'oak-weathered',
      'walnut-natural', 'walnut-stained', 'walnut-dark',
      'maple-natural', 'maple-stained',
      'cherry-natural', 'cherry-stained',
      'mahogany-natural', 'mahogany-stained',
      'pine-natural', 'pine-stained', 'pine-knotty',
      'bamboo-natural', 'bamboo-carbonized',
      'teak-natural', 'teak-weathered',
      'cedar-natural', 'cedar-weathered',
      'birch-natural', 'birch-plywood'
    ]
  },
  stone: {
    description: 'Stone and mineral materials',
    presets: [
      'marble-white', 'marble-black', 'marble-carrara', 'marble-verde',
      'granite-black', 'granite-gray', 'granite-pink',
      'slate-black', 'slate-gray', 'slate-multicolor',
      'limestone-white', 'limestone-cream', 'limestone-gray',
      'sandstone-tan', 'sandstone-red', 'sandstone-white',
      'travertine-cream', 'travertine-noce',
      'onyx-white', 'onyx-honey', 'onyx-green',
      'concrete-smooth', 'concrete-rough', 'concrete-polished',
      'terrazzo-white', 'terrazzo-gray', 'terrazzo-colorful'
    ]
  },
  fabric: {
    description: 'Textile and fabric materials',
    presets: [
      'cotton-white', 'cotton-canvas', 'cotton-denim',
      'linen-natural', 'linen-white', 'linen-gray',
      'silk-white', 'silk-satin', 'silk-raw',
      'velvet-black', 'velvet-red', 'velvet-blue',
      'wool-natural', 'wool-tweed', 'wool-felt',
      'leather-brown', 'leather-black', 'leather-tan', 'leather-distressed',
      'suede-brown', 'suede-black', 'suede-gray',
      'nylon-black', 'nylon-ripstop',
      'mesh-athletic', 'mesh-technical'
    ]
  },
  plastic: {
    description: 'Plastic and synthetic materials',
    presets: [
      'abs-white', 'abs-black', 'abs-gray',
      'acrylic-clear', 'acrylic-frosted', 'acrylic-colored',
      'polycarbonate-clear', 'polycarbonate-smoke',
      'pvc-white', 'pvc-black',
      'rubber-black', 'rubber-red', 'rubber-silicone',
      'neoprene-black', 'neoprene-colored',
      'vinyl-matte', 'vinyl-glossy',
      'resin-clear', 'resin-amber', 'resin-colored'
    ]
  },
  glass: {
    description: 'Glass and transparent materials',
    presets: [
      'glass-clear', 'glass-frosted', 'glass-tinted',
      'glass-colored', 'glass-mirror',
      'crystal-clear', 'crystal-cut',
      'ice-clear', 'ice-frosted',
      'water-clear', 'water-rippled'
    ]
  },
  ceramic: {
    description: 'Ceramic and porcelain materials',
    presets: [
      'porcelain-white', 'porcelain-glazed', 'porcelain-matte',
      'ceramic-terracotta', 'ceramic-glazed', 'ceramic-raku',
      'tile-subway', 'tile-moroccan', 'tile-hexagonal'
    ]
  },
  special: {
    description: 'Special effect materials',
    presets: [
      'holographic', 'iridescent', 'pearlescent',
      'glow-white', 'glow-colored', 'glow-neon',
      'carbon-fiber', 'carbon-kevlar',
      'foil-gold', 'foil-silver', 'foil-holographic'
    ]
  }
};

// GET /api/materials - List all materials or by category
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    if (category) {
      // Return specific category
      const cat = MATERIAL_CATEGORIES[category as keyof typeof MATERIAL_CATEGORIES];
      if (!cat) {
        return NextResponse.json(
          { error: `Unknown category: ${category}` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        category,
        description: cat.description,
        presets: cat.presets,
        count: cat.presets.length
      });
    }

    if (search) {
      // Search across all categories
      const results: { category: string; preset: string }[] = [];
      for (const [catName, cat] of Object.entries(MATERIAL_CATEGORIES)) {
        for (const preset of cat.presets) {
          if (preset.toLowerCase().includes(search.toLowerCase())) {
            results.push({ category: catName, preset });
          }
        }
      }
      return NextResponse.json({
        search,
        results,
        count: results.length
      });
    }

    // Return all categories with counts
    const categories: Record<string, { description: string; count: number; presets: string[] }> = {};
    let totalCount = 0;

    for (const [catName, cat] of Object.entries(MATERIAL_CATEGORIES)) {
      categories[catName] = {
        description: cat.description,
        count: cat.presets.length,
        presets: cat.presets
      };
      totalCount += cat.presets.length;
    }

    return NextResponse.json({
      categories,
      totalCount,
      message: `${totalCount} material presets available across ${Object.keys(categories).length} categories`
    });

  } catch (error) {
    console.error('Materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST /api/materials - Get material details or apply material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, preset, category, objectId } = body;

    switch (action) {
      case 'get_details': {
        // Return detailed material properties
        // In production, this would fetch from Supabase
        return NextResponse.json({
          preset,
          category: category || 'unknown',
          properties: {
            metalness: category === 'metal' ? 1.0 : 0.0,
            roughness: preset.includes('polished') ? 0.1 : preset.includes('matte') ? 0.8 : 0.5,
            clearcoat: preset.includes('glossy') ? 1.0 : 0.0,
            transmission: category === 'glass' ? 0.9 : 0.0
          },
          previewUrl: `/api/materials/preview/${category}/${preset}.png`
        });
      }

      case 'apply': {
        // Apply material to object (returns command for frontend)
        if (!objectId) {
          return NextResponse.json(
            { error: 'objectId required for apply action' },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          command: {
            type: 'SET_MATERIAL',
            payload: { objectId, preset, category }
          },
          message: `Material ${preset} applied to ${objectId}`
        });
      }

      case 'recommend': {
        // AI-powered material recommendation
        const { description, style } = body;
        // In production, this would use the Material Agent
        const recommendations = Object.entries(MATERIAL_CATEGORIES)
          .flatMap(([cat, data]) =>
            data.presets.slice(0, 2).map(p => ({ category: cat, preset: p }))
          )
          .slice(0, 5);

        return NextResponse.json({
          query: description,
          style,
          recommendations,
          message: 'Recommendations based on your description'
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
