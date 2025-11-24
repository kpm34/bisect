/**
 * Unified Spline AI Agent
 *
 * Single AI agent that acts as a professional Spline editor with:
 * - Full scene context (JSON + screenshot)
 * - Mathematical spatial reasoning
 * - Memory from past edits (RAG)
 * - Professional editor script execution
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RAG System interface for retrieving similar edits
 */
export interface RAGSystem {
  retrieveSimilarEdits(
    command: string,
    sceneData: SceneData
  ): Promise<SimilarEdit[]>;
}

/**
 * Similar edit retrieved from RAG memory
 */
export interface SimilarEdit {
  command: string;
  outcome: string;
  similarity?: number; // Similarity score 0-1
  code?: string; // Generated code
  timestamp?: number;
}

/**
 * Scene data structure
 */
export interface SceneData {
  scene?: unknown[];
  objects?: unknown[] | Record<string, unknown>;
  selectedObjects?: string[];
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * GUI state information
 */
export interface GUIState {
  selectedObjects?: string | string[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Context passed to agent
 */
export interface AgentContext {
  sceneData?: SceneData;
  screenshot?: string; // base64 or data URL
  guiState?: GUIState;
  similarEdits?: SimilarEdit[]; // From RAG system
  [key: string]: unknown;
}

/**
 * Agent initialization options
 */
export interface AgentOptions {
  model?: string;
  maxHistoryLength?: number;
  ragSystem?: RAGSystem | null;
  editorScriptsPath?: string;
  apiKey?: string;
}

/**
 * Command structure in execution plan
 */
export interface AgentCommand {
  type: 'spline-api' | 'math' | 'script';
  action: string;
  params: Record<string, unknown>;
}

/**
 * Validation structure
 */
export interface CommandValidation {
  expectedOutcome: string;
  checkPoints: string[];
}

/**
 * Execution plan returned by AI
 */
export interface ExecutionPlan {
  approach: 'direct-api' | 'math-function' | 'editor-script' | 'combined' | 'error';
  reasoning: string;
  commands: AgentCommand[];
  validation?: CommandValidation;
}

/**
 * Cost calculation result
 */
export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: string;
  outputCost: string;
  totalCost: string;
}

/**
 * Successful execution result
 */
export interface SuccessResult {
  success: true;
  plan: ExecutionPlan;
  tokensUsed: number;
  cost: CostCalculation;
}

/**
 * Failed execution result
 */
export interface ErrorResult {
  success: false;
  error: string;
  fallback: ExecutionPlan;
}

/**
 * Execution result
 */
export type ExecutionResult = SuccessResult | ErrorResult;

/**
 * Conversation history entry
 */
interface HistoryEntry {
  command: string;
  result: ExecutionPlan;
  context: {
    timestamp: number;
    sceneObjects: number;
    hasScreenshot: boolean;
  };
}

/**
 * Editor script metadata
 */
export interface EditorScriptInfo {
  id: string;
  name: string;
  description: string;
  params: string;
}

/**
 * Agent statistics
 */
export interface AgentStats {
  historyLength: number;
  totalCommands: number;
  averageObjectsPerCommand: number;
}

/**
 * Unified Spline AI Agent
 */
export class UnifiedSplineAgent {
  private openai: OpenAI;
  private model: string;
  private conversationHistory: HistoryEntry[];
  private maxHistoryLength: number;
  private ragSystem: RAGSystem | null;
  private editorScriptsPath: string;
  private systemPrompt: string;

  constructor(options: AgentOptions = {}) {
    this.openai = new OpenAI({
      apiKey: options.apiKey || process.env['OPENAI_API_KEY'],
    });

    this.model = options.model || 'gpt-4o';
    this.conversationHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 10;
    this.ragSystem = options.ragSystem || null;
    this.editorScriptsPath =
      options.editorScriptsPath || path.join(__dirname, 'editor-scripts');

    this.systemPrompt = this._buildSystemPrompt();
  }

  private _buildSystemPrompt(): string {
    return `You are a professional Spline 3D editor with expert-level skills in:
- 3D scene composition and spatial layout
- Object manipulation (position, rotation, scale)
- Material and lighting design
- Animation and interactivity
- Mathematical approaches to layout and design

You have access to:
1. **Spline Runtime API** - Direct object manipulation
2. **Spatial Math Functions** - Grid layouts, circular arrangements, distributions, alignments
3. **Editor Scripts** - Professional presets and parametric operations
4. **Scene Context** - Current scene state (JSON), screenshot, selected objects, GUI state
5. **Memory** - Past successful edits retrieved from your knowledge base

## CRITICAL: Spline Object Architecture

Spline scenes export to **Three.js compatible objects**. Access via:
- window.app._scene (THREE.js scene)
- scene.getObjectByName('name') (find by name)

## Object Types and Property Ranges

**Mesh Objects** (type: 'Mesh'):
- position: {x, y, z} unbounded (typically -1000 to 1000)
- rotation: {x, y, z} in radians (0 to 2π)
- scale: {x, y, z} (0.01 to 100, typically 0.1 to 10)
- material: NodeMaterial or MeshStandardMaterial

**Light Objects** (DirectionalLight, PointLight, SpotLight):
- intensity: 0 to 100+ (typically 0.5 to 3)
- color: 0x000000 to 0xffffff
- distance (Point/Spot): 0 to 1000+ (0 = infinite)

**Camera** (PerspectiveCamera):
- fov: 1 to 180 degrees (typically 45 to 75)
- zoom: 0.1 to 10 (1 = normal)
- CRITICAL: Call camera.updateProjectionMatrix() after fov/zoom changes

## VALIDATED NodeMaterial Color Pattern

**CRITICAL**: Most Spline objects use NodeMaterial (custom shader). To change color:

\`\`\`javascript
const scene = window.app._scene;
const target = scene.getObjectByName('objectName');

if (target && target.material) {
    // Find ALL node color uniforms (nodeU0, nodeU1, etc.)
    const nodeColors = Object.keys(target.material.uniforms).filter(key =>
        key.startsWith('nodeU') &&
        target.material.uniforms[key].value &&
        target.material.uniforms[key].value.isColor
    );

    // Change ALL color uniforms (not just one!)
    nodeColors.forEach(key => {
        target.material.uniforms[key].value.setHex(0xff0000); // Red
    });

    // CRITICAL: Trigger update
    target.material.needsUpdate = true;
}
\`\`\`

**Common Mistakes to Avoid**:
- ❌ Using getAllObjects()[0] without type check
- ❌ Forgetting material.needsUpdate = true
- ❌ Changing only one nodeU* uniform
- ❌ Assuming material.color exists on NodeMaterial
- ❌ Using degrees instead of radians for rotation

## Available Spatial Math Functions

- **arrangeInGrid(objects, spacing, columns)** - Grid layout
- **arrangeInCircle(objects, radius, startAngle)** - Circular arrangement
- **scatterInBounds(objects, bounds, seed)** - Random scatter
- **alignObjects(objects, axis, direction)** - Align along axis
- **distributeEvenly(objects, axis, spacing)** - Even distribution
- **mirrorObjects(objects, axis, offset)** - Mirror across axis
- **stackVertically(objects, spacing)** - Vertical stack
- **spiralArrangement(objects, radius, height, turns)** - 3D spiral
- **wavePattern(objects, amplitude, frequency, axis)** - Wave formation
- **radialDuplicate(object, count, radius)** - Radial array
- **pathDistribute(objects, path, offset)** - Distribute along path

## Available Editor Scripts

- **duplicate-radial** - Radial array of objects
- **symmetry-mirror** - Mirror with symmetry
- **parametric-wave** - Wave patterns
- **physics-stack** - Physics-based stacking
- **color-gradient** - Color gradients

## Response Format

Return a JSON object with this structure:
{
    "approach": "direct-api" | "math-function" | "editor-script" | "combined",
    "reasoning": "Brief explanation of your approach",
    "commands": [
        {
            "type": "spline-api" | "math" | "script",
            "action": "setObjectProperty | arrangeInGrid | duplicate-radial | etc",
            "params": { ... }
        }
    ],
    "validation": {
        "expectedOutcome": "Description of what should happen",
        "checkPoints": ["List of things to verify after execution"]
    }
}

When given a command:
1. Analyze scene context and selected objects
2. Check for similar past edits in memory
3. Choose the best approach (API/math/script)
4. Generate precise commands with correct property ranges
5. ALWAYS use NodeMaterial pattern for color changes
6. ALWAYS validate object types before manipulation

Be creative, precise, and think like a professional 3D designer.`;
  }

  /**
   * Execute a command with full context
   */
  async execute(
    userCommand: string,
    context: AgentContext = {}
  ): Promise<ExecutionResult> {
    try {
      // Prepare the full context message
      const messages = await this._buildMessages(userCommand, context);

      // Make single AI call with vision if screenshot provided
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const result = JSON.parse(content) as ExecutionPlan;

      // Store in conversation history
      this._addToHistory(userCommand, result, context);

      return {
        success: true,
        plan: result,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this._calculateCost(response.usage),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Unified agent execution error:', error);
      return {
        success: false,
        error: errorMessage,
        fallback: this._generateFallbackPlan(userCommand),
      };
    }
  }

  /**
   * Build complete message array with context
   */
  private async _buildMessages(
    userCommand: string,
    context: AgentContext
  ): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];

    // Add conversation history (last 5 messages)
    const recentHistory = this.conversationHistory.slice(-5);
    for (const entry of recentHistory) {
      messages.push({
        role: 'user',
        content: `Previous command: ${entry.command}`,
      });
      messages.push({
        role: 'assistant',
        content: JSON.stringify(entry.result),
      });
    }

    // Build current context message
    const contextParts: string[] = [];

    // Add RAG memory if available
    if (this.ragSystem && context.sceneData) {
      const similarEdits = await this.ragSystem.retrieveSimilarEdits(
        userCommand,
        context.sceneData
      );
      if (similarEdits && similarEdits.length > 0) {
        contextParts.push('**Similar Past Edits:**');
        similarEdits.forEach((edit, i) => {
          contextParts.push(
            `${i + 1}. Command: "${edit.command}" - Result: ${edit.outcome}`
          );
        });
        contextParts.push('');
      }
    }

    // Add current scene data
    if (context.sceneData) {
      contextParts.push('**Current Scene State:**');
      contextParts.push('```json');
      contextParts.push(JSON.stringify(context.sceneData, null, 2));
      contextParts.push('```');
      contextParts.push('');
    }

    // Add GUI state
    if (context.guiState) {
      contextParts.push('**GUI State:**');
      contextParts.push(
        `- Selected objects: ${context.guiState.selectedObjects || 'none'}`
      );
      if (context.guiState.properties) {
        contextParts.push('- Current properties:');
        Object.entries(context.guiState.properties).forEach(([key, value]) => {
          contextParts.push(`  - ${key}: ${JSON.stringify(value)}`);
        });
      }
      contextParts.push('');
    }

    // Add the user command
    contextParts.push('**User Command:**');
    contextParts.push(userCommand);

    const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: contextParts.join('\n'),
      },
    ];

    // Add screenshot if provided
    if (context.screenshot) {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: context.screenshot,
          detail: 'high',
        },
      });
    }

    messages.push({
      role: 'user',
      content: contentParts,
    });

    return messages;
  }

  /**
   * Add to conversation history
   */
  private _addToHistory(
    command: string,
    result: ExecutionPlan,
    context: AgentContext
  ): void {
    this.conversationHistory.push({
      command,
      result,
      context: {
        timestamp: Date.now(),
        sceneObjects: context.sceneData?.scene?.length || 0,
        hasScreenshot: !!context.screenshot,
      },
    });

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Calculate API cost
   */
  private _calculateCost(
    usage: OpenAI.CompletionUsage | undefined
  ): CostCalculation {
    if (!usage) {
      return {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: '0.0000',
        outputCost: '0.0000',
        totalCost: '0.0000',
      };
    }

    // GPT-4o pricing (as of 2025)
    const inputCostPer1M = 2.5; // $2.50 per 1M input tokens
    const outputCostPer1M = 10.0; // $10.00 per 1M output tokens

    const inputCost = (usage.prompt_tokens / 1000000) * inputCostPer1M;
    const outputCost = (usage.completion_tokens / 1000000) * outputCostPer1M;

    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
    };
  }

  /**
   * Generate fallback plan if AI fails
   */
  private _generateFallbackPlan(userCommand: string): ExecutionPlan {
    // Simple rule-based fallback for common commands
    const lowerCommand = userCommand.toLowerCase();

    if (lowerCommand.includes('move') && lowerCommand.includes('up')) {
      return {
        approach: 'direct-api',
        reasoning: 'Simple vertical movement detected',
        commands: [
          {
            type: 'spline-api',
            action: 'setObjectProperty',
            params: {
              objectName: 'selected',
              property: 'position.y',
              value: '+=10',
            },
          },
        ],
      };
    }

    if (lowerCommand.includes('grid') || lowerCommand.includes('arrange')) {
      return {
        approach: 'math-function',
        reasoning: 'Grid layout detected',
        commands: [
          {
            type: 'math',
            action: 'arrangeInGrid',
            params: {
              objects: 'selected',
              spacing: 50,
              columns: 3,
            },
          },
        ],
      };
    }

    return {
      approach: 'error',
      reasoning: 'Could not parse command, please try rephrasing',
      commands: [],
    };
  }

  /**
   * Load available editor scripts
   */
  async getAvailableScripts(): Promise<EditorScriptInfo[]> {
    try {
      const files = await fs.readdir(this.editorScriptsPath);
      const scripts = files.filter((f) => f.endsWith('.js'));

      const scriptInfo: EditorScriptInfo[] = [];
      for (const script of scripts) {
        const scriptPath = path.join(this.editorScriptsPath, script);
        const content = await fs.readFile(scriptPath, 'utf8');

        // Extract metadata from script comments
        const nameMatch = content.match(/@name\s+(.+)/);
        const descMatch = content.match(/@description\s+(.+)/);
        const paramsMatch = content.match(/@params\s+(.+)/);

        scriptInfo.push({
          id: script.replace('.js', ''),
          name: nameMatch ? nameMatch[1] : script,
          description: descMatch ? descMatch[1] : '',
          params: paramsMatch ? paramsMatch[1] : '',
        });
      }

      return scriptInfo;
    } catch (error) {
      console.error('Error loading editor scripts:', error);
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation statistics
   */
  getStats(): AgentStats {
    const totalCommands = this.conversationHistory.length;
    const totalObjects = this.conversationHistory.reduce(
      (sum, entry) => sum + (entry.context.sceneObjects || 0),
      0
    );

    return {
      historyLength: this.conversationHistory.length,
      totalCommands,
      averageObjectsPerCommand: totalCommands > 0 ? totalObjects / totalCommands : 0,
    };
  }
}

export default UnifiedSplineAgent;
