/**
 * Browser-compatible adapter for Unified Spline Agent
 *
 * Adapts the UnifiedSplineAgent for use in browser extension service workers
 * by removing Node.js dependencies and using chrome.storage for configuration.
 */

import OpenAI from 'openai';
import type {
    AgentContext,
    ExecutionResult,
    ErrorResult,
    ExecutionPlan,
    CostCalculation,
} from './unified-spline-agent';
import { BrowserRAGSystem, type BrowserRAGConfig } from '../rag/browser-rag-system';

// Re-export types for convenience
export type { ErrorResult, ExecutionResult, ExecutionPlan, AgentContext, CostCalculation };

/**
 * Configuration for browser agent
 */
export interface BrowserAgentConfig {
    apiKey?: string;
    model?: string;
    maxHistoryLength?: number;
    ragConfig?: BrowserRAGConfig;
    enableRAG?: boolean;
}

/**
 * Conversation history entry
 */
interface HistoryEntry {
    command: string;
    result: ExecutionPlan;
    timestamp: number;
}

/**
 * Browser-compatible Spline AI Agent
 *
 * This adapter provides the same functionality as UnifiedSplineAgent
 * but without Node.js dependencies, making it suitable for browser service workers.
 */
export class BrowserAgentAdapter {
    private openai: OpenAI;
    private model: string;
    private conversationHistory: HistoryEntry[];
    private maxHistoryLength: number;
    private systemPrompt: string;
    private ragSystem: BrowserRAGSystem | null;
    private ragInitialized: boolean = false;

    constructor(config: BrowserAgentConfig = {}) {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.openai = new OpenAI({
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true, // Required for browser usage
        });

        this.model = config.model || 'gpt-4o';
        this.conversationHistory = [];
        this.maxHistoryLength = config.maxHistoryLength || 10;
        this.systemPrompt = this._buildSystemPrompt();

        // Initialize RAG system if enabled
        if (config.enableRAG !== false) {
            this.ragSystem = new BrowserRAGSystem({
                ...config.ragConfig,
                openaiApiKey: config.apiKey, // Reuse OpenAI key for embeddings
            });

            // Initialize RAG asynchronously (don't block constructor)
            this.ragSystem.initialize()
                .then(() => {
                    this.ragInitialized = true;
                    console.log('✅ RAG system ready for browser agent');
                })
                .catch(err => {
                    console.warn('⚠️ RAG initialization failed, continuing without memory:', err);
                    this.ragSystem = null;
                });
        } else {
            this.ragSystem = null;
        }
    }

    /**
     * Build system prompt with Spline editor capabilities
     */
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
3. **Scene Context** - Current scene state (JSON), screenshot, selected objects
4. **Memory** - Past successful edits in conversation history

When given a command, you should:
1. Analyze the current scene context
2. Consider previous commands in this session
3. Plan the best approach (direct API calls or math functions)
4. Return a structured execution plan

## Available Spatial Math Functions:

- **arrangeInGrid(objects, spacing, columns)** - Arrange objects in a grid layout
- **arrangeInCircle(objects, radius, startAngle)** - Arrange objects in a circle
- **scatterInBounds(objects, bounds, seed)** - Randomly scatter objects within bounds
- **alignObjects(objects, axis, direction)** - Align objects along an axis
- **distributeEvenly(objects, axis, spacing)** - Distribute objects evenly along an axis
- **mirrorObjects(objects, axis, offset)** - Mirror objects across an axis

## Response Format:

Return a JSON object with executable JavaScript code:
{
    "approach": "direct-api" | "math-function" | "combined",
    "reasoning": "Brief explanation of your approach",
    "commands": [
        "// JavaScript code string that will be executed in Spline page context",
        "// Example: const cube = window.app._scene.getObjectByName('Cube'); if (cube && cube.material) { cube.material.color.set(0xff0000); }",
        "// Each command is a complete JavaScript statement"
    ],
    "validation": {
        "expectedOutcome": "Description of what should happen",
        "checkPoints": ["List of things to verify after execution"]
    }
}

**IMPORTANT**: The "commands" array must contain executable JavaScript code strings, NOT objects.
**Each command will be executed sequentially with shared context via window.__SPLINE_AI_CONTEXT__**

**TWO-PHASE COMMAND PATTERN (REQUIRED FOR MATERIAL EDITS):**

Commands MUST be split into two phases:

**Phase 1: Identify Selection & Object Type**
- First command should identify what's selected
- Check object type, material type, and store in window.__SPLINE_AI_CONTEXT__
- Example:
  \`\`\`
  const scene = window.__THREE_DEVTOOLS__?.renderers?.[0]?.pipeline?._scene;
  if (!scene) throw new Error('Scene not available');
  const selected = scene.getObjectByName('Cube'); // or get from selection
  if (!selected) throw new Error('No object selected');
  window.__SPLINE_AI_CONTEXT__.selectedObject = selected;
  window.__SPLINE_AI_CONTEXT__.objectType = selected.constructor.name;
  window.__SPLINE_AI_CONTEXT__.hasMaterial = !!selected.material;
  window.__SPLINE_AI_CONTEXT__.materialType = selected.material?.constructor.name;
  return { success: true, objectName: selected.name, materialType: selected.material?.constructor.name };
  \`\`\`

**Phase 2: Check Material Editor & Execute Edit**
- Second command should check if we're in material editor mode
- Read context from window.__SPLINE_AI_CONTEXT__ (set by Phase 1)
- Execute material edit flow only if appropriate
- Example:
  \`\`\`
  const ctx = window.__SPLINE_AI_CONTEXT__;
  if (!ctx.selectedObject) throw new Error('No object from Phase 1');
  const obj = ctx.selectedObject;
  // Check if in material editor (you may need to detect this based on URL or UI state)
  const isMaterialEditor = window.location.pathname.includes('/material') || false;
  if (!isMaterialEditor && ctx.materialType !== 'RootNodeMaterial') {
    throw new Error('Material is not RootNodeMaterial - cannot edit outside material editor');
  }
  // Execute material edit
  if (!obj.material || obj.material.constructor.name !== 'RootNodeMaterial') {
    throw new Error('Material is not RootNodeMaterial');
  }
  obj.material.uniforms.nodeU0.value.setHex(0xff0000);
  obj.material.needsUpdate = true;
  return { success: true, color: '#ff0000' };
  \`\`\`

**Correct API Usage:**
- To get scene: const scene = window.__THREE_DEVTOOLS__?.renderers?.[0]?.pipeline?._scene
- To find objects: scene.getObjectByName('ObjectName')
- Objects have: .position, .rotation, .scale, .material properties
- **IMPORTANT**: Spline uses Root NodeMaterial with specific uniform structure:
  - Material type: RootNodeMaterial
  - Main color: uniforms.nodeU0.value (Color object)
  - Secondary color: uniforms.nodeU2.value (Color object, if present)
  - Roughness: uniforms.nodeU5.value (number, 0-1)
  - Metalness: uniforms.nodeU6.value (number, 0-1)
  - Opacity: uniforms.nodeU1.value (number, 0-1)
- **IMPORTANT**: Always check if __THREE_DEVTOOLS__ exists and has renderers before accessing scene
- **IMPORTANT**: Use window.__SPLINE_AI_CONTEXT__ to share data between commands

**Scene Readiness Pattern (ALWAYS USE THIS!):**

Example code - Wait for scene with polling:
  // Poll for scene readiness (max 10 seconds)
  const waitForScene = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      const check = () => {
        const scene = window.__THREE_DEVTOOLS__?.renderers?.[0]?.pipeline?._scene;
        if (scene) {
          resolve(scene);
        } else if (attempts++ < maxAttempts) {
          setTimeout(check, 500);
        } else {
          reject(new Error('Scene failed to load after 10 seconds'));
        }
      };
      check();
    });
  };

  // Wait for scene, then execute
  return waitForScene().then(scene => {
    const cube = scene.getObjectByName('Cube');
    if (!cube) throw new Error('Object not found: Cube');
    if (!cube.material) throw new Error('Cube has no material');
    if (cube.material.constructor.name !== 'RootNodeMaterial') {
      throw new Error('Material is not RootNodeMaterial');
    }

    // Spline RootNodeMaterial: Update main color (nodeU0)
    if (!cube.material.uniforms.nodeU0) {
      throw new Error('nodeU0 color uniform not found');
    }

    // Set color to red
    cube.material.uniforms.nodeU0.value.setHex(0xff0000);

    // Optionally update material properties if needed
    // cube.material.uniforms.nodeU5.value = 0.995;  // Roughness (0-1)
    // cube.material.uniforms.nodeU6.value = 0;      // Metalness (0-1)

    cube.material.needsUpdate = true;  // Critical: mark material for re-render

    return { success: true, color: '#ff0000' };
  });

**Example responses:**

For "make cube red" (TWO-PHASE PATTERN):
{
    "approach": "direct-api",
    "reasoning": "Two-phase: (1) Identify cube selection and material type, (2) Check material editor and execute color change",
    "commands": [
        "const scene = window.__THREE_DEVTOOLS__?.renderers?.[0]?.pipeline?._scene; if (!scene) throw new Error('Scene not available'); const cube = scene.getObjectByName('Cube'); if (!cube) throw new Error('Cube not found'); window.__SPLINE_AI_CONTEXT__.selectedObject = cube; window.__SPLINE_AI_CONTEXT__.objectType = cube.constructor.name; window.__SPLINE_AI_CONTEXT__.hasMaterial = !!cube.material; window.__SPLINE_AI_CONTEXT__.materialType = cube.material?.constructor.name; return { success: true, objectName: 'Cube', materialType: cube.material?.constructor.name };",
        "const ctx = window.__SPLINE_AI_CONTEXT__; if (!ctx.selectedObject) throw new Error('No object from Phase 1'); const cube = ctx.selectedObject; if (!cube.material) throw new Error('No material'); if (cube.material.constructor.name !== 'RootNodeMaterial') throw new Error('Material is not RootNodeMaterial'); const isMaterialEditor = window.location.pathname.includes('/material') || document.querySelector('[data-material-editor]'); if (!isMaterialEditor && ctx.materialType !== 'RootNodeMaterial') { throw new Error('Material is not RootNodeMaterial - cannot edit outside material editor'); } if (!cube.material.uniforms.nodeU0) throw new Error('nodeU0 not found'); cube.material.uniforms.nodeU0.value.setHex(0xff0000); cube.material.needsUpdate = true; return { success: true, color: '#ff0000' };"
    ],
    "validation": {
        "expectedOutcome": "Phase 1 identifies cube and material type, Phase 2 checks material editor and changes color to red"
    }
}

Be creative, precise, and think like a professional 3D designer. Use mathematical approaches when appropriate for clean, precise layouts.`;
    }

    /**
     * Execute a command with full context
     */
    async execute(
        userCommand: string,
        context: AgentContext = {}
    ): Promise<ExecutionResult> {
        try {
            console.log('🤖 Executing AI command:', userCommand);

            // Retrieve similar edits from RAG if available
            if (this.ragSystem && this.ragInitialized && context.sceneData) {
                console.log('🔍 Retrieving similar edits from RAG...');
                try {
                    const similarEdits = await this.ragSystem.retrieveSimilarEdits(
                        userCommand,
                        context.sceneData
                    );
                    if (similarEdits.length > 0) {
                        context.similarEdits = similarEdits;
                        console.log(`✅ Found ${similarEdits.length} similar past edits`);
                    }
                } catch (error) {
                    console.warn('⚠️ RAG retrieval failed, continuing without memory:', error);
                }
            }

            // Build messages with context (now includes similar edits)
            const messages = this._buildMessages(userCommand, context);

            // Call OpenAI API
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content in AI response');
            }

            const plan = JSON.parse(content) as ExecutionPlan;

            // Store in history
            this._addToHistory(userCommand, plan);

            // Store successful edit in RAG for future learning
            if (this.ragSystem && this.ragInitialized && plan.commands.length > 0) {
                console.log('💾 Storing successful edit in RAG...');
                this.ragSystem.storeSuccessfulEdit({
                    command: userCommand,
                    outcome: plan.reasoning || 'Success',
                    code: JSON.stringify(plan.commands),
                    sceneData: context.sceneData,
                    timestamp: Date.now()
                }).catch(err => {
                    console.warn('⚠️ Failed to store edit in RAG:', err);
                });
            }

            console.log('✅ AI command executed successfully');

            return {
                success: true,
                plan,
                tokensUsed: response.usage?.total_tokens || 0,
                cost: this._calculateCost(response.usage),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ AI command execution failed:', error);

            return {
                success: false,
                error: errorMessage,
                fallback: this._generateFallbackPlan(userCommand),
            };
        }
    }

    /**
     * Build message array for OpenAI API
     */
    private _buildMessages(
        userCommand: string,
        context: AgentContext
    ): OpenAI.Chat.ChatCompletionMessageParam[] {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: this.systemPrompt,
            },
        ];

        // Add recent conversation history (last 3 exchanges)
        const recentHistory = this.conversationHistory.slice(-3);
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

        // Add scene data if available
        if (context.sceneData) {
            contextParts.push('**Current Scene State:**');
            contextParts.push('\`\`\`json');
            contextParts.push(JSON.stringify(context.sceneData, null, 2));
            contextParts.push('\`\`\`');
            contextParts.push('');
        }

        // Add GUI state if available
        if (context.guiState) {
            contextParts.push('**GUI State:**');
            contextParts.push(`- Selected objects: ${context.guiState.selectedObjects || 'none'}`);
            contextParts.push('');
        }

        // Add similar edits from RAG if available
        if (context.similarEdits && context.similarEdits.length > 0) {
            contextParts.push('**Similar Past Edits (from memory):**');
            for (const edit of context.similarEdits) {
                contextParts.push(`\n- Command: "${edit.command}"`);
                contextParts.push(`  Similarity: ${((edit.similarity || 0) * 100).toFixed(1)}%`);
                contextParts.push(`  Outcome: ${edit.outcome}`);
                if (edit.code) {
                    contextParts.push(`  Code: ${edit.code}`);
                }
            }
            contextParts.push('');
        }

        // Add user command
        contextParts.push('**User Command:**');
        contextParts.push(userCommand);

        const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [
            {
                type: 'text',
                text: contextParts.join('\n'),
            },
        ];

        // Add screenshot if provided (GPT-4o vision)
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
     * Add command to conversation history
     */
    private _addToHistory(command: string, result: ExecutionPlan): void {
        this.conversationHistory.push({
            command,
            result,
            timestamp: Date.now(),
        });

        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory.shift();
        }
    }

    /**
     * Calculate API cost based on token usage
     */
    private _calculateCost(usage: OpenAI.CompletionUsage | undefined): CostCalculation {
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
        const lowerCommand = userCommand.toLowerCase();

        // Simple rule-based fallbacks
        if (lowerCommand.includes('grid') || lowerCommand.includes('arrange')) {
            return {
                approach: 'math-function',
                reasoning: 'Grid layout detected (fallback)',
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

        if (lowerCommand.includes('circle') || lowerCommand.includes('radial')) {
            return {
                approach: 'math-function',
                reasoning: 'Circular arrangement detected (fallback)',
                commands: [
                    {
                        type: 'math',
                        action: 'arrangeInCircle',
                        params: {
                            objects: 'selected',
                            radius: 100,
                            startAngle: 0,
                        },
                    },
                ],
            };
        }

        return {
            approach: 'error',
            reasoning: 'Could not parse command. Please try rephrasing or be more specific.',
            commands: [],
        };
    }

    /**
     * Clear conversation history
     */
    clearHistory(): void {
        this.conversationHistory = [];
    }

    /**
     * Get history length
     */
    getHistoryLength(): number {
        return this.conversationHistory.length;
    }
}

export default BrowserAgentAdapter;
