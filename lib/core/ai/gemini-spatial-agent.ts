import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SpecialistAgent } from './specialist-agent';
import type {
  AgentContext,
  ExecutionResult,
  ExecutionPlan,
  CostCalculation,
} from './unified-spline-agent';

/**
 * Gemini Spatial Agent
 * Specialized in scene layout, object manipulation, and spatial reasoning.
 * Leverages Gemini's spatial understanding capabilities.
 */
export class GeminiSpatialAgent implements SpecialistAgent {
  id = 'spatial';
  capabilities = ['layout', 'positioning', 'spatial-reasoning', 'scene-graph-analysis'];

  private apiKey: string;
  private genAI: GoogleGenerativeAI;
  private model: string;
  private systemPrompt: string;

  constructor(apiKey?: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ GeminiSpatialAgent: No API key provided');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = model;
    this.systemPrompt = this._buildSystemPrompt();
  }

  private _buildSystemPrompt(): string {
    return `You are an expert 3D spatial reasoning AI for a scene editor. Your role is to analyze scenes and calculate optimal object positions, layouts, and arrangements.

## YOUR CAPABILITIES:
1. **Grid Arrangements** - Arrange objects in rows and columns with configurable spacing
2. **Circular Arrangements** - Position objects in circles, arcs, or spirals
3. **Scatter/Random** - Distribute objects randomly within bounds
4. **Alignment** - Align objects to edges, centers, or other objects
5. **Distribution** - Evenly space objects along an axis
6. **Stacking** - Stack objects vertically with optional offsets
7. **Mirroring** - Mirror object positions across axes
8. **Path Following** - Position objects along a path or curve

## AVAILABLE MATH FUNCTIONS:
- arrangeInGrid: { objects, spacing, columns, rows?, startPosition?, direction? }
- arrangeInCircle: { objects, radius, centerX?, centerY?, centerZ?, startAngle?, endAngle? }
- arrangeInSpiral: { objects, startRadius, endRadius, turns, centerX?, centerY?, centerZ? }
- scatter: { objects, boundsMin, boundsMax, seed? }
- alignObjects: { objects, axis, alignTo } // axis: 'x'|'y'|'z', alignTo: 'min'|'max'|'center'|number
- distributeObjects: { objects, axis, start?, end? }
- stackObjects: { objects, axis, spacing, basePosition? }
- mirrorObjects: { objects, axis, pivot? }
- moveRelative: { objects, offset } // offset: { x, y, z }
- moveAbsolute: { objects, position } // position: { x, y, z }
- rotate: { objects, rotation, pivot? } // rotation: { x, y, z } in degrees
- scale: { objects, scale } // scale: { x, y, z } or single number for uniform

## EXPECTED JSON OUTPUT FORMAT:
{
  "approach": "math-function",
  "reasoning": "Explain your spatial reasoning and calculations",
  "commands": [
    {
      "type": "math",
      "action": "functionName",
      "params": { ... }
    }
  ]
}

## SCENE CONTEXT:
- Objects have: id, name, type, position {x, y, z}, rotation, scale
- Positions are in world coordinates
- Y-axis is typically up in 3D space
- When objects is "selected", apply to currently selected objects
- When objects is "all", apply to all scene objects
- Can also specify object names as array: ["Cube1", "Sphere2"]

## SPATIAL REASONING GUIDELINES:
1. Consider object sizes when calculating spacing
2. Prevent overlapping by accounting for bounding boxes
3. Use scene center (0, 0, 0) as default pivot/center when not specified
4. Maintain Y positions unless explicitly changing height
5. Group related operations logically
6. Validate that positions stay within reasonable bounds

## EXAMPLES:

User: "arrange objects in a circle"
Response:
{
  "approach": "math-function",
  "reasoning": "Arranging selected objects in a circle with radius 100 centered at origin. Each object will be positioned equidistantly around the circle.",
  "commands": [
    {
      "type": "math",
      "action": "arrangeInCircle",
      "params": {
        "objects": "selected",
        "radius": 100,
        "centerX": 0,
        "centerY": 0,
        "centerZ": 0
      }
    }
  ]
}

User: "make a 3x3 grid with 50 unit spacing"
Response:
{
  "approach": "math-function",
  "reasoning": "Creating a 3x3 grid arrangement. With 50 unit spacing and 3 columns, the grid will span 100 units in each direction.",
  "commands": [
    {
      "type": "math",
      "action": "arrangeInGrid",
      "params": {
        "objects": "selected",
        "spacing": 50,
        "columns": 3,
        "rows": 3
      }
    }
  ]
}

User: "align all objects to the left"
Response:
{
  "approach": "math-function",
  "reasoning": "Aligning all objects to their minimum X position (left edge) while preserving Y and Z coordinates.",
  "commands": [
    {
      "type": "math",
      "action": "alignObjects",
      "params": {
        "objects": "all",
        "axis": "x",
        "alignTo": "min"
      }
    }
  ]
}

IMPORTANT RULES:
1. ALWAYS return valid JSON with "approach", "reasoning", and "commands" fields
2. Use "math-function" as the approach for spatial operations
3. Be specific with numerical values - don't use vague terms
4. If the user doesn't specify quantities, use reasonable defaults
5. Explain your spatial reasoning clearly`;
  }

  async execute(command: string, context: AgentContext): Promise<ExecutionResult> {
    console.log('🌌 Gemini Spatial Agent executing:', command);

    if (!this.apiKey) {
      return this._createErrorResult('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      // Build the prompt with context
      const prompt = this._buildPrompt(command, context);

      // Call Gemini
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('🌌 Gemini raw response:', text.substring(0, 500));

      // Parse JSON from response
      const plan = this._parseResponse(text);

      // Estimate tokens (Gemini doesn't always return usage)
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      const estimatedOutputTokens = Math.ceil(text.length / 4);

      return {
        success: true,
        plan,
        tokensUsed: estimatedInputTokens + estimatedOutputTokens,
        cost: this._calculateCost(estimatedInputTokens, estimatedOutputTokens),
      };
    } catch (error) {
      console.error('❌ Gemini Spatial Agent error:', error);
      return this._createErrorResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private _buildPrompt(command: string, context: AgentContext): string {
    let prompt = this.systemPrompt + '\n\n';

    // Add scene context if available
    if (context.sceneData) {
      const objects = Array.isArray(context.sceneData.objects)
        ? context.sceneData.objects
        : Object.values(context.sceneData.objects || {});

      if (objects.length > 0) {
        prompt += '## CURRENT SCENE:\n';
        prompt += `Total objects: ${objects.length}\n`;
        prompt += 'Objects:\n';

        // Include relevant object info (limit to prevent token overflow)
        const maxObjects = 20;
        const objectsToShow = objects.slice(0, maxObjects);

        for (const obj of objectsToShow) {
          const o = obj as Record<string, unknown>;
          const pos = o.position as { x: number; y: number; z: number } | undefined;
          prompt += `- ${o.name || o.id || 'Object'} (${o.type || 'unknown'}): `;
          if (pos) {
            prompt += `pos(${pos.x?.toFixed(1)}, ${pos.y?.toFixed(1)}, ${pos.z?.toFixed(1)})`;
          }
          prompt += '\n';
        }

        if (objects.length > maxObjects) {
          prompt += `... and ${objects.length - maxObjects} more objects\n`;
        }
        prompt += '\n';
      }

      // Add selected objects info
      if (context.sceneData.selectedObjects && context.sceneData.selectedObjects.length > 0) {
        prompt += `## SELECTED OBJECTS: ${context.sceneData.selectedObjects.join(', ')}\n\n`;
      }
    }

    // Add the user command
    prompt += `## USER COMMAND:\n${command}\n\n`;
    prompt += '## YOUR RESPONSE (JSON only, no markdown code blocks):';

    return prompt;
  }

  private _parseResponse(text: string): ExecutionPlan {
    // Try to extract JSON from response
    let jsonStr = text;

    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find JSON object directly
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.approach || !parsed.commands) {
        throw new Error('Missing required fields in response');
      }

      return {
        approach: parsed.approach || 'math-function',
        reasoning: parsed.reasoning || 'Spatial operation calculated by Gemini',
        commands: Array.isArray(parsed.commands) ? parsed.commands : [],
        validation: parsed.validation,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);

      // Return a fallback plan
      return {
        approach: 'error',
        reasoning: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        commands: [],
      };
    }
  }

  private _calculateCost(inputTokens: number, outputTokens: number): CostCalculation {
    // Gemini 2.0 Flash pricing (as of early 2025)
    // Input: $0.10 per 1M tokens, Output: $0.40 per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * 0.10;
    const outputCost = (outputTokens / 1_000_000) * 0.40;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: inputCost.toFixed(6),
      outputCost: outputCost.toFixed(6),
      totalCost: (inputCost + outputCost).toFixed(6),
    };
  }

  private _createErrorResult(errorMessage: string): ExecutionResult {
    return {
      success: false,
      error: errorMessage,
      fallback: {
        approach: 'error',
        reasoning: `Gemini Spatial Agent failed: ${errorMessage}`,
        commands: [],
      },
    };
  }
}
