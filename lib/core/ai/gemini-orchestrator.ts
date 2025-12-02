import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { SpecialistAgent } from './specialist-agent';
import type { AgentContext, ExecutionResult, ExecutionPlan, CostCalculation } from './unified-spline-agent';

/**
 * Routing Decision from Gemini 3 Orchestrator
 */
export interface RoutingDecision {
  agent: 'gpt4o' | 'gemini' | 'claude';
  reason: string;
  shouldDebate: boolean;
  sceneAnalysis?: SceneAnalysis;
  transformedCommand?: string;
  confidence: number;
}

/**
 * Scene Analysis from Gemini 3's 3D spatial understanding
 */
export interface SceneAnalysis {
  objects: Array<{
    id: string;
    name: string;
    estimatedPosition: { x: number; y: number; z: number };
    estimatedSize: { width: number; height: number; depth: number };
    relationships: string[];
  }>;
  spatialLayout: string;
  suggestedApproach: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Debate Proposal from a specialist agent
 */
export interface DebateProposal {
  agent: 'gpt4o' | 'gemini' | 'claude';
  approach: string;
  commands: unknown[];
  reasoning: string;
  confidence: number;
}

/**
 * Debate Result - Gemini's final selection
 */
export interface DebateResult {
  selectedAgent: 'gpt4o' | 'gemini' | 'claude';
  selectedApproach: string;
  selectionReason: string;
  commands: unknown[];
  allProposals: DebateProposal[];
}

/**
 * Gemini 3 Orchestrator
 *
 * The central brain of the multi-agent system.
 * Uses Gemini 3's state-of-the-art spatial understanding (1501 Elo) to:
 * - Analyze scenes visually (can infer 3D from 2D)
 * - Route commands to the best specialist agent
 * - Trigger and moderate debates for complex tasks
 *
 * Routing Strategy:
 * - Material/color/texture commands → GPT-4o (94% object detection accuracy)
 * - Spatial/layout/arrangement commands → Gemini 3 (best spatial reasoning)
 * - Blender/mesh/modifier commands → Claude 4.5 (77.2% SWE-bench, best coding)
 */
export class GeminiOrchestrator {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string = 'gemini-2.0-flash-exp'; // Will update to gemini-3-pro when available
  private agents: Map<string, SpecialistAgent> = new Map();

  constructor(apiKey?: string) {
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || '';
    if (!key) {
      console.warn('⚠️ GeminiOrchestrator: No API key provided');
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  /**
   * Register a specialist agent
   */
  registerAgent(agentId: 'gpt4o' | 'gemini' | 'claude', agent: SpecialistAgent): void {
    this.agents.set(agentId, agent);
  }

  /**
   * Analyze scene using Gemini 3's superior 3D spatial understanding
   * Can infer 3D information from 2D screenshots (robotics-grade spatial reasoning)
   */
  async analyzeScene(screenshot: string): Promise<SceneAnalysis> {
    console.log('🌌 Gemini 3 analyzing scene with vision...');

    try {
      const prompt = `You are analyzing a 3D scene screenshot. Your task is to understand the spatial layout.

Analyze this image and provide:
1. List of objects you can identify with estimated positions (assume origin at center)
2. Overall spatial layout description
3. Suggested approach for modifications
4. Complexity assessment

Return JSON only:
{
  "objects": [
    {
      "id": "unique_id",
      "name": "Object Name",
      "estimatedPosition": { "x": 0, "y": 0, "z": 0 },
      "estimatedSize": { "width": 1, "height": 1, "depth": 1 },
      "relationships": ["to the left of X", "above Y"]
    }
  ],
  "spatialLayout": "Description of how objects are arranged",
  "suggestedApproach": "How to best modify this scene",
  "complexity": "simple" | "moderate" | "complex"
}`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: screenshot.replace(/^data:image\/\w+;base64,/, ''),
          },
        },
      ]);

      const text = result.response.text();
      return this._parseSceneAnalysis(text);
    } catch (error) {
      console.error('❌ Gemini scene analysis failed:', error);
      return {
        objects: [],
        spatialLayout: 'Unable to analyze scene',
        suggestedApproach: 'Use text-based context',
        complexity: 'simple',
      };
    }
  }

  /**
   * Route a command to the appropriate specialist agent
   * Uses Gemini 3's intelligence for smart routing decisions
   */
  async route(
    command: string,
    context: AgentContext,
    screenshot?: string,
    forceDebate?: boolean
  ): Promise<RoutingDecision> {
    console.log('🔀 Gemini 3 Orchestrator routing command:', command);

    // Get scene analysis if screenshot provided
    const sceneAnalysis = screenshot ? await this.analyzeScene(screenshot) : undefined;

    try {
      const prompt = `You are an intelligent orchestrator for a 3D design tool with three specialist agents.

## AVAILABLE AGENTS:

### 1. GPT-4o (id: "gpt4o") - Material & Visual Specialist
Best for: Colors, textures, materials, lighting, visual styles
Strengths: 94% object detection accuracy, excellent color/texture analysis
Use when: "make it gold", "apply glass material", "change color to red"

### 2. Gemini 3 (id: "gemini") - Spatial & Layout Specialist
Best for: Arrangements, positioning, transformations, spatial math
Strengths: Best 3D spatial understanding, robotics-grade trajectory planning
Use when: "arrange in grid", "scatter randomly", "align objects", "move left"

### 3. Claude 4.5 (id: "claude") - Blender & Code Specialist
Best for: Mesh operations, modifiers, boolean ops, Blender Python scripts
Strengths: 77.2% SWE-bench (best coding), can maintain 30+ hour focus
Use when: "subdivide mesh", "add bevel modifier", "boolean union", "create procedural"

## ROUTING RULES:
1. Simple material/color → gpt4o
2. Spatial/arrangement → gemini
3. Mesh/modifier/Blender operations → claude
4. Complex creative tasks (scenes, designs) → shouldDebate = true

## USER COMMAND:
"${command}"

${sceneAnalysis ? `## SCENE ANALYSIS:\n${JSON.stringify(sceneAnalysis, null, 2)}` : ''}

## TASK:
Analyze the command and route to the best agent.
Consider the user's intent and the agents' strengths.

Return JSON only:
{
  "agent": "gpt4o" | "gemini" | "claude",
  "reason": "Why this agent is best for this task",
  "shouldDebate": true/false,
  "transformedCommand": "Refined command if needed, or null",
  "confidence": 0.0-1.0
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const decision = this._parseRoutingDecision(text);

      // Override shouldDebate if forceDebate is true
      if (forceDebate) {
        decision.shouldDebate = true;
      }

      // Add scene analysis to decision
      decision.sceneAnalysis = sceneAnalysis;

      console.log(`🎯 Routing to ${decision.agent} (confidence: ${decision.confidence})`);
      return decision;
    } catch (error) {
      console.warn('⚠️ Gemini routing failed, using fallback:', error);
      return this._fallbackRouting(command, sceneAnalysis);
    }
  }

  /**
   * Check if a command should trigger debate mode
   * Complex creative commands benefit from multi-model perspectives
   */
  async shouldDebate(command: string): Promise<boolean> {
    const lower = command.toLowerCase();

    // Automatic debate triggers
    const debateKeywords = [
      'create a scene',
      'design',
      'build a',
      'make a complete',
      'generate a',
      'procedural',
      'landscape',
      'environment',
      'forest',
      'city',
      'room',
    ];

    // Check for complex multi-step commands
    const hasMultipleSteps = command.includes(' and ') || command.includes(' then ');
    const isLongCommand = command.length > 100;

    return (
      debateKeywords.some((kw) => lower.includes(kw)) ||
      hasMultipleSteps ||
      isLongCommand
    );
  }

  /**
   * Conduct a debate between all three models
   * Each proposes an approach, Gemini 3 selects the best
   */
  async conductDebate(
    command: string,
    context: AgentContext,
    screenshot?: string
  ): Promise<DebateResult> {
    console.log('🗣️ Starting multi-model debate for:', command);

    const sceneAnalysis = screenshot ? await this.analyzeScene(screenshot) : undefined;
    const proposals: DebateProposal[] = [];

    // Get proposal from each registered agent
    for (const [agentId, agent] of this.agents) {
      try {
        console.log(`📝 Getting proposal from ${agentId}...`);
        const result = await agent.execute(
          `DEBATE MODE: Propose your approach for: "${command}"`,
          {
            ...context,
            mode: 'proposal',
            sceneAnalysis,
          }
        );

        if (result.success && result.plan) {
          proposals.push({
            agent: agentId as 'gpt4o' | 'gemini' | 'claude',
            approach: result.plan.reasoning || '',
            commands: result.plan.commands || [],
            reasoning: result.plan.approach || '',
            confidence: 0.8, // Default confidence
          });
        }
      } catch (error) {
        console.warn(`⚠️ ${agentId} proposal failed:`, error);
      }
    }

    // If no proposals, return error
    if (proposals.length === 0) {
      return {
        selectedAgent: 'gemini',
        selectedApproach: 'No proposals received',
        selectionReason: 'All agents failed to respond',
        commands: [],
        allProposals: [],
      };
    }

    // Gemini 3 selects the best approach
    const selection = await this._selectBestProposal(command, proposals, sceneAnalysis);
    return selection;
  }

  /**
   * Select the best proposal from the debate
   */
  private async _selectBestProposal(
    command: string,
    proposals: DebateProposal[],
    sceneAnalysis?: SceneAnalysis
  ): Promise<DebateResult> {
    try {
      const prompt = `You are the judge in a multi-model debate for a 3D design task.

## USER COMMAND:
"${command}"

${sceneAnalysis ? `## SCENE CONTEXT:\n${JSON.stringify(sceneAnalysis, null, 2)}` : ''}

## PROPOSALS:
${proposals.map((p, i) => `
### Proposal ${i + 1} (${p.agent}):
Approach: ${p.approach}
Reasoning: ${p.reasoning}
Commands: ${JSON.stringify(p.commands, null, 2)}
`).join('\n')}

## SELECTION CRITERIA:
1. Best matches user intent
2. Most efficient execution
3. Leverages agent's strengths appropriately
4. Produces highest quality result

Select the best proposal and explain why.

Return JSON only:
{
  "selectedAgent": "gpt4o" | "gemini" | "claude",
  "selectedApproach": "Description of selected approach",
  "selectionReason": "Why this proposal is best",
  "commands": [...commands from selected proposal...]
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const selection = this._parseDebateSelection(text);

      return {
        ...selection,
        allProposals: proposals,
      };
    } catch (error) {
      console.warn('⚠️ Debate selection failed, using first proposal:', error);
      const first = proposals[0];
      return {
        selectedAgent: first.agent,
        selectedApproach: first.approach,
        selectionReason: 'Fallback: first proposal selected',
        commands: first.commands,
        allProposals: proposals,
      };
    }
  }

  /**
   * Execute a command through the orchestration pipeline
   */
  async orchestrateAndExecute(
    command: string,
    context: AgentContext,
    screenshot?: string,
    forceDebate?: boolean
  ): Promise<ExecutionResult> {
    // Check if debate is needed
    const needsDebate = forceDebate || (await this.shouldDebate(command));

    if (needsDebate) {
      console.log('🗣️ Complex command detected, initiating debate...');
      const debateResult = await this.conductDebate(command, context, screenshot);

      // Execute the winning proposal
      const winningAgent = this.agents.get(debateResult.selectedAgent);
      if (winningAgent) {
        const executionContext: AgentContext = {
          ...context,
          debateContext: debateResult,
        };
        return winningAgent.execute(command, executionContext);
      }

      // Return debate result as plan if no agent to execute
      return {
        success: true,
        plan: {
          approach: 'combined' as const,
          reasoning: debateResult.selectionReason,
          commands: debateResult.commands as ExecutionPlan['commands'],
        },
        tokensUsed: 0,
        cost: { inputTokens: 0, outputTokens: 0, totalTokens: 0, inputCost: '0', outputCost: '0', totalCost: '0' },
      };
    }

    // Simple routing for non-debate commands
    const decision = await this.route(command, context, screenshot);
    const agent = this.agents.get(decision.agent);

    if (!agent) {
      return {
        success: false,
        error: `Agent '${decision.agent}' not registered`,
        fallback: { approach: 'error' as const, reasoning: 'Agent not found', commands: [] },
      };
    }

    // Add scene analysis to context if available
    const enrichedContext: AgentContext = {
      ...context,
      sceneAnalysis: decision.sceneAnalysis,
      routingDecision: decision,
    };

    return agent.execute(decision.transformedCommand || command, enrichedContext);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private _parseSceneAnalysis(text: string): SceneAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse scene analysis:', e);
    }
    return {
      objects: [],
      spatialLayout: 'Unknown',
      suggestedApproach: 'Unknown',
      complexity: 'simple',
    };
  }

  private _parseRoutingDecision(text: string): RoutingDecision {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          agent: parsed.agent || 'gemini',
          reason: parsed.reason || 'Unknown',
          shouldDebate: parsed.shouldDebate || false,
          transformedCommand: parsed.transformedCommand,
          confidence: parsed.confidence || 0.5,
        };
      }
    } catch (e) {
      console.warn('Failed to parse routing decision:', e);
    }
    return {
      agent: 'gemini',
      reason: 'Fallback routing',
      shouldDebate: false,
      confidence: 0.3,
    };
  }

  private _parseDebateSelection(text: string): Omit<DebateResult, 'allProposals'> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          selectedAgent: parsed.selectedAgent || 'gemini',
          selectedApproach: parsed.selectedApproach || 'Unknown',
          selectionReason: parsed.selectionReason || 'Unknown',
          commands: parsed.commands || [],
        };
      }
    } catch (e) {
      console.warn('Failed to parse debate selection:', e);
    }
    return {
      selectedAgent: 'gemini',
      selectedApproach: 'Fallback selection',
      selectionReason: 'Parse error',
      commands: [],
    };
  }

  private _fallbackRouting(command: string, sceneAnalysis?: SceneAnalysis): RoutingDecision {
    const lower = command.toLowerCase();

    // Spatial keywords → Gemini
    if (
      lower.includes('arrange') ||
      lower.includes('scatter') ||
      lower.includes('grid') ||
      lower.includes('align') ||
      lower.includes('distribute') ||
      lower.includes('move') ||
      lower.includes('rotate') ||
      lower.includes('scale') ||
      lower.includes('position')
    ) {
      return {
        agent: 'gemini',
        reason: 'Spatial/layout operation detected',
        shouldDebate: false,
        sceneAnalysis,
        confidence: 0.7,
      };
    }

    // Blender/Mesh keywords → Claude
    if (
      lower.includes('subdivide') ||
      lower.includes('modifier') ||
      lower.includes('boolean') ||
      lower.includes('bevel') ||
      lower.includes('extrude') ||
      lower.includes('mesh') ||
      lower.includes('vertex') ||
      lower.includes('edge') ||
      lower.includes('face') ||
      lower.includes('procedural') ||
      lower.includes('blender') ||
      lower.includes('script')
    ) {
      return {
        agent: 'claude',
        reason: 'Blender/mesh operation detected',
        shouldDebate: false,
        sceneAnalysis,
        confidence: 0.7,
      };
    }

    // Default to GPT-4o for materials
    return {
      agent: 'gpt4o',
      reason: 'Material/visual operation or general command',
      shouldDebate: false,
      sceneAnalysis,
      confidence: 0.6,
    };
  }
}

// Export types for use in other modules
export type { AgentContext, ExecutionResult };
