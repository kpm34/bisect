import Anthropic from '@anthropic-ai/sdk';
import type { SpecialistAgent } from './specialist-agent';
import type {
  AgentContext,
  ExecutionResult,
  ExecutionPlan,
  CostCalculation,
} from './unified-spline-agent';

/**
 * Blender Script Execution Result
 */
export interface BlenderExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  sceneChanges?: {
    objectsAdded?: string[];
    objectsModified?: string[];
    objectsDeleted?: string[];
  };
}

/**
 * Claude Sonnet 4.5 Blender Agent
 *
 * Specialized in Blender Python code generation and execution.
 * Uses Claude Sonnet 4.5 - the best coding model (77.2% SWE-bench).
 *
 * Key Capabilities:
 * - Generate Blender Python scripts for mesh operations
 * - Execute scripts via Blender MCP (port 9876)
 * - Handle complex multi-step Blender operations
 * - Boolean operations, modifiers, procedural generation
 *
 * Why Claude 4.5 for Blender:
 * - Best at code generation (77.2% SWE-bench Verified)
 * - Can maintain focus for 30+ hours on complex tasks
 * - 61.4% on OSWorld (computer use leader)
 * - Excellent at understanding Blender API patterns
 */
export class ClaudeBlenderAgent implements SpecialistAgent {
  id = 'blender';
  capabilities = [
    'blender-python',
    'mesh-operations',
    'modifiers',
    'boolean-ops',
    'procedural-generation',
    'code-generation',
  ];

  private client: Anthropic;
  private model: string = 'claude-sonnet-4-5-20250929'; // Claude Sonnet 4.5
  private systemPrompt: string;

  // Bridge connection for executing scripts in Blender
  private bridgeUrl: string = 'ws://localhost:9877';
  private mcpAvailable: boolean = false;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!key) {
      console.warn('⚠️ ClaudeBlenderAgent: No API key provided');
    }

    this.client = new Anthropic({
      apiKey: key,
      dangerouslyAllowBrowser: true, // For client-side usage
    });

    this.systemPrompt = this._buildSystemPrompt();
  }

  private _buildSystemPrompt(): string {
    return `You are an expert Blender Python programmer. Your role is to generate precise, efficient bpy scripts for 3D operations.

## YOUR CAPABILITIES:

### Mesh Operations
- Create primitives: bpy.ops.mesh.primitive_cube_add(), primitive_uv_sphere_add(), etc.
- Edit mesh: bpy.ops.mesh.subdivide(), extrude_region(), inset_faces(), bevel()
- Modifiers: bpy.ops.object.modifier_add(type='SUBSURF'), 'BEVEL', 'BOOLEAN', 'ARRAY', etc.

### Boolean Operations
- Union: modifier_add(type='BOOLEAN'), modifier.operation = 'UNION'
- Difference: modifier.operation = 'DIFFERENCE'
- Intersection: modifier.operation = 'INTERSECT'

### Materials & Shading
- Create materials: bpy.data.materials.new(name="Material")
- Assign to object: obj.data.materials.append(mat)
- Node-based shaders: mat.use_nodes = True

### Procedural Generation
- Geometry Nodes: bpy.ops.node.new_geometry_nodes_modifier()
- Particle systems: bpy.ops.object.particle_system_add()
- Scripted mesh generation with bmesh

## OUTPUT FORMAT:

Return JSON with approach, reasoning, and a single executable Python script:

{
  "approach": "blender-script",
  "reasoning": "Explanation of what the script does",
  "commands": [
    {
      "type": "blender-python",
      "script": "import bpy\\n# Your script here\\nprint('Done')",
      "expectedChanges": {
        "objectsAdded": ["NewObject"],
        "objectsModified": ["ExistingObject"],
        "objectsDeleted": []
      }
    }
  ]
}

## SCRIPT GUIDELINES:

1. Always import bpy at the start
2. Use try/except for error handling
3. Deselect all objects before operations: bpy.ops.object.select_all(action='DESELECT')
4. Set active object when needed: bpy.context.view_layer.objects.active = obj
5. Apply modifiers when appropriate: bpy.ops.object.modifier_apply(modifier="name")
6. Print status messages for debugging
7. Clean up selection state after operations

## EXAMPLE SCRIPTS:

### Subdivide Selected Object
\`\`\`python
import bpy
obj = bpy.context.active_object
if obj and obj.type == 'MESH':
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.subdivide(number_cuts=2)
    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"Subdivided {obj.name}")
\`\`\`

### Add Bevel Modifier
\`\`\`python
import bpy
obj = bpy.context.active_object
if obj and obj.type == 'MESH':
    bevel = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.1
    bevel.segments = 3
    print(f"Added bevel to {obj.name}")
\`\`\`

### Boolean Union
\`\`\`python
import bpy
target = bpy.context.active_object
cutter = bpy.data.objects.get("Cutter")
if target and cutter:
    bool_mod = target.modifiers.new(name="Boolean", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.object = cutter
    bpy.ops.object.modifier_apply(modifier="Boolean")
    bpy.data.objects.remove(cutter)
    print(f"Boolean union complete on {target.name}")
\`\`\`

IMPORTANT:
1. Always return valid JSON with the specified format
2. Scripts must be complete and executable
3. Handle edge cases (no selection, wrong object type)
4. Use meaningful variable names
5. Add print statements for debugging`;
  }

  /**
   * Execute a command - generate and optionally run Blender Python script
   */
  async execute(command: string, context: AgentContext): Promise<ExecutionResult> {
    console.log('🐍 Claude Blender Agent executing:', command);

    try {
      // Generate the Blender script using Claude 4.5
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.systemPrompt,
        messages: [
          {
            role: 'user',
            content: this._buildPrompt(command, context),
          },
        ],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const text = textContent.text;
      console.log('🐍 Claude raw response:', text.substring(0, 500));

      // Parse the response
      const plan = this._parseResponse(text);

      // Calculate cost
      const cost = this._calculateCost(
        response.usage?.input_tokens || 0,
        response.usage?.output_tokens || 0
      );

      return {
        success: true,
        plan,
        tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        cost,
      };
    } catch (error) {
      console.error('❌ Claude Blender Agent error:', error);
      return this._createErrorResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Generate a Blender Python script for a task
   */
  async generateBlenderScript(task: string, context: AgentContext): Promise<string> {
    const result = await this.execute(task, context);
    if (!result.success || !result.plan) {
      throw new Error((result as any).error || 'Failed to generate script');
    }

    // Extract script from first command
    const firstCommand = result.plan.commands?.[0];
    if (firstCommand && 'script' in firstCommand) {
      return (firstCommand as { script: string }).script;
    }

    throw new Error('No script in response');
  }

  /**
   * Execute a script in Blender via MCP
   * This would be called by the bridge/MCP system
   */
  async executeInBlender(script: string): Promise<BlenderExecutionResult> {
    // This is a placeholder - actual execution happens via:
    // 1. The unified bridge sending to Blender addon
    // 2. Or direct MCP call to mcp__blender__execute_blender_code

    console.log('🐍 Would execute in Blender:', script.substring(0, 200));

    // Return mock result for now
    return {
      success: true,
      output: 'Script execution would happen via MCP/bridge',
      sceneChanges: {
        objectsModified: [],
      },
    };
  }

  private _buildPrompt(command: string, context: AgentContext): string {
    let prompt = '';

    // Add scene context if available
    if (context.sceneData) {
      const objects = Array.isArray(context.sceneData.objects)
        ? context.sceneData.objects
        : Object.values(context.sceneData.objects || {});

      if (objects.length > 0) {
        prompt += '## CURRENT SCENE:\n';
        prompt += `Total objects: ${objects.length}\n`;

        const maxObjects = 15;
        const objectsToShow = objects.slice(0, maxObjects);

        for (const obj of objectsToShow) {
          const o = obj as Record<string, unknown>;
          prompt += `- ${o.name || o.id}: type=${o.type || 'unknown'}\n`;
        }

        if (objects.length > maxObjects) {
          prompt += `... and ${objects.length - maxObjects} more objects\n`;
        }
        prompt += '\n';
      }

      // Selected objects
      if (context.sceneData.selectedObjects?.length) {
        prompt += `## SELECTED OBJECTS: ${context.sceneData.selectedObjects.join(', ')}\n\n`;
      }
    }

    // Add scene analysis from Gemini if available
    if (context.sceneAnalysis) {
      const analysis = context.sceneAnalysis as any;
      prompt += `## SPATIAL ANALYSIS (from Gemini 3):\n`;
      prompt += `Layout: ${analysis.spatialLayout}\n`;
      prompt += `Complexity: ${analysis.complexity}\n`;
      prompt += `Suggested approach: ${analysis.suggestedApproach}\n\n`;
    }

    // Add the command
    prompt += `## USER COMMAND:\n${command}\n\n`;

    // Check if this is a proposal request (debate mode)
    if (context.mode === 'proposal') {
      prompt += `## MODE: PROPOSAL\n`;
      prompt += `You are participating in a multi-model debate. Propose your best approach for this task.\n`;
      prompt += `Explain why Blender Python is the right choice and what operations you would use.\n\n`;
    }

    prompt += '## YOUR RESPONSE (JSON only, no markdown code blocks):';

    return prompt;
  }

  private _parseResponse(text: string): ExecutionPlan {
    // Try to extract JSON
    let jsonStr = text;

    // Remove markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate and transform commands
      const commands = (parsed.commands || []).map((cmd: Record<string, unknown>) => {
        if (cmd.type === 'blender-python' && cmd.script) {
          return {
            type: 'blender-python' as const,
            action: 'executeScript',
            params: {
              script: cmd.script,
              expectedChanges: cmd.expectedChanges,
            },
          };
        }
        return cmd;
      });

      return {
        approach: parsed.approach || 'blender-script',
        reasoning: parsed.reasoning || 'Blender Python script generated by Claude',
        commands,
      };
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);

      return {
        approach: 'error',
        reasoning: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
        commands: [],
      };
    }
  }

  private _calculateCost(inputTokens: number, outputTokens: number): CostCalculation {
    // Claude Sonnet 4.5 pricing (as of late 2025)
    // Input: $3 per 1M tokens, Output: $15 per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;

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
        reasoning: `Claude Blender Agent failed: ${errorMessage}`,
        commands: [],
      },
    };
  }
}

// Alias for backward compatibility
export { ClaudeBlenderAgent as ClaudePlannerAgent };
