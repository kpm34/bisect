import { NextRequest, NextResponse } from 'next/server';

// AI Agent routing and orchestration endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, instruction, context, options } = body;

    switch (action) {
      case 'smart_edit': {
        // Route to appropriate AI agent based on instruction
        const routingResult = routeInstruction(instruction);

        return NextResponse.json({
          success: true,
          routing: routingResult,
          message: `Instruction routed to ${routingResult.agent}`,
          // In production, this would execute the actual AI call
          plan: {
            approach: routingResult.approach,
            reasoning: routingResult.reasoning,
            commands: routingResult.suggestedCommands
          }
        });
      }

      case 'analyze_scene': {
        // Scene analysis using Scene Graph Builder
        return NextResponse.json({
          success: true,
          analysis: {
            objects: context?.objects || [],
            relationships: [],
            summary: 'Scene analysis requires viewport context',
            suggestions: [
              'Add more objects to create spatial relationships',
              'Consider grouping related objects',
              'Try using the arrange command for better layout'
            ]
          }
        });
      }

      case 'suggest_materials': {
        // Material recommendations using Material Agent
        const { objectType, style, description } = options || {};

        return NextResponse.json({
          success: true,
          suggestions: getMaterialSuggestions(objectType, style, description),
          reasoning: 'Based on object type and style preference'
        });
      }

      case 'plan_arrangement': {
        // Spatial arrangement planning using Gemini Spatial Agent
        const { pattern, count, objects } = options || {};

        return NextResponse.json({
          success: true,
          plan: {
            pattern: pattern || 'grid',
            count: count || 4,
            positions: generateArrangementPositions(pattern, count),
            reasoning: `${pattern} arrangement for ${count} objects`
          }
        });
      }

      case 'debate': {
        // Multi-model debate for complex decisions
        return NextResponse.json({
          success: true,
          debate: {
            phases: ['analysis', 'proposal', 'critique', 'synthesis'],
            models: ['gemini', 'claude'],
            status: 'Debate system requires complex instruction',
            recommendation: 'Use for instructions longer than 50 characters'
          }
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

// GET /api/ai - Get AI capabilities info
export async function GET() {
  return NextResponse.json({
    version: '2.0.0',
    agents: {
      'gemini-spatial': {
        description: 'Spatial arrangements and transformations',
        capabilities: ['arrangeInGrid', 'arrangeInCircle', 'arrangeInSpiral', 'scatter', 'align', 'distribute', 'stack', 'mirror']
      },
      'material-agent': {
        description: 'Material selection and application',
        capabilities: ['recommend', 'apply', 'search', 'preview']
      },
      'scene-graph-builder': {
        description: 'Scene analysis and relationships',
        capabilities: ['analyze', 'summarize', 'inferRelationships', 'generateGraph']
      },
      'claude-blender': {
        description: 'Complex Blender operations',
        capabilities: ['render', 'physics', 'animation', 'modifiers']
      },
      'agent-debate': {
        description: 'Multi-model consensus for complex decisions',
        capabilities: ['analyze', 'propose', 'critique', 'synthesize']
      }
    },
    actions: ['smart_edit', 'analyze_scene', 'suggest_materials', 'plan_arrangement', 'debate'],
    documentation: '/docs/developer-tools.md'
  });
}

// Helper functions

function routeInstruction(instruction: string): {
  agent: string;
  approach: string;
  reasoning: string;
  suggestedCommands: string[];
} {
  const lower = instruction.toLowerCase();

  // Material-related
  if (lower.includes('material') || lower.includes('color') || lower.includes('texture') ||
      lower.includes('gold') || lower.includes('wood') || lower.includes('metal') ||
      lower.includes('glass') || lower.includes('marble') || lower.includes('look like')) {
    return {
      agent: 'material-agent',
      approach: 'Material application',
      reasoning: 'Instruction references appearance or material properties',
      suggestedCommands: ['SET_MATERIAL', 'UPDATE_OBJECT']
    };
  }

  // Spatial arrangement
  if (lower.includes('arrange') || lower.includes('grid') || lower.includes('circle') ||
      lower.includes('spiral') || lower.includes('scatter') || lower.includes('align') ||
      lower.includes('distribute') || lower.includes('stack') || lower.includes('line up')) {
    return {
      agent: 'gemini-spatial',
      approach: 'Spatial arrangement',
      reasoning: 'Instruction references object positioning or patterns',
      suggestedCommands: ['ARRANGE_OBJECTS', 'UPDATE_OBJECT']
    };
  }

  // Scene analysis
  if (lower.includes('analyze') || lower.includes('describe') || lower.includes('what') ||
      lower.includes('relationships') || lower.includes('scene')) {
    return {
      agent: 'scene-graph-builder',
      approach: 'Scene analysis',
      reasoning: 'Instruction requests information about the scene',
      suggestedCommands: ['GET_SCENE_GRAPH']
    };
  }

  // Blender operations
  if (lower.includes('render') || lower.includes('physics') || lower.includes('animate') ||
      lower.includes('blender') || lower.includes('bake')) {
    return {
      agent: 'claude-blender',
      approach: 'Blender operation',
      reasoning: 'Instruction requires Blender-specific functionality',
      suggestedCommands: ['BLENDER_COMMAND']
    };
  }

  // Complex instructions use debate
  if (instruction.length > 50) {
    return {
      agent: 'agent-debate',
      approach: 'Multi-model consensus',
      reasoning: 'Complex instruction benefits from multi-model analysis',
      suggestedCommands: ['SMART_EDIT']
    };
  }

  // Default to spatial agent for object manipulation
  return {
    agent: 'gemini-spatial',
    approach: 'Object manipulation',
    reasoning: 'Default routing for general object commands',
    suggestedCommands: ['UPDATE_OBJECT', 'ADD_OBJECT']
  };
}

function getMaterialSuggestions(objectType?: string, style?: string, description?: string): {
  preset: string;
  category: string;
  confidence: number;
}[] {
  // Simple rule-based suggestions (in production, use Material Agent with RAG)
  const suggestions = [];

  if (style === 'modern' || style === 'minimal') {
    suggestions.push(
      { preset: 'concrete-polished', category: 'stone', confidence: 0.9 },
      { preset: 'steel-brushed', category: 'metal', confidence: 0.85 },
      { preset: 'glass-clear', category: 'glass', confidence: 0.8 }
    );
  } else if (style === 'rustic' || style === 'natural') {
    suggestions.push(
      { preset: 'oak-natural', category: 'wood', confidence: 0.9 },
      { preset: 'copper-aged', category: 'metal', confidence: 0.85 },
      { preset: 'leather-brown', category: 'fabric', confidence: 0.8 }
    );
  } else if (style === 'luxury' || style === 'premium') {
    suggestions.push(
      { preset: 'gold-polished', category: 'metal', confidence: 0.9 },
      { preset: 'marble-carrara', category: 'stone', confidence: 0.85 },
      { preset: 'velvet-black', category: 'fabric', confidence: 0.8 }
    );
  } else {
    // Default suggestions
    suggestions.push(
      { preset: 'silver-polished', category: 'metal', confidence: 0.7 },
      { preset: 'oak-natural', category: 'wood', confidence: 0.7 },
      { preset: 'marble-white', category: 'stone', confidence: 0.7 }
    );
  }

  return suggestions;
}

function generateArrangementPositions(pattern?: string, count?: number): { x: number; y: number; z: number }[] {
  const n = count || 4;
  const positions: { x: number; y: number; z: number }[] = [];

  switch (pattern) {
    case 'circle': {
      const radius = 3;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        positions.push({
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        });
      }
      break;
    }
    case 'line': {
      const spacing = 2;
      for (let i = 0; i < n; i++) {
        positions.push({ x: i * spacing, y: 0, z: 0 });
      }
      break;
    }
    case 'stack': {
      const spacing = 1;
      for (let i = 0; i < n; i++) {
        positions.push({ x: 0, y: i * spacing, z: 0 });
      }
      break;
    }
    case 'grid':
    default: {
      const cols = Math.ceil(Math.sqrt(n));
      const spacing = 2;
      for (let i = 0; i < n; i++) {
        positions.push({
          x: (i % cols) * spacing,
          y: 0,
          z: Math.floor(i / cols) * spacing
        });
      }
      break;
    }
  }

  return positions;
}
