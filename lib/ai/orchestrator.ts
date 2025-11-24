/**
 * AI Orchestrator - Multi-Agent Task Routing
 *
 * Routes tasks to the most appropriate AI model based on:
 * - Task type (texture generation, scene editing, SVG manipulation)
 * - Complexity level
 * - Vision requirements
 * - Cost optimization
 */

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'openrouter';

export type TaskType =
  | 'texture_generation'
  | 'scene_edit'
  | 'svg_edit'
  | 'material_search'
  | 'complex_reasoning'
  | 'image_analysis';

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface Task {
  type: TaskType;
  complexity: TaskComplexity;
  requiresVision: boolean;
  prompt: string;
  context?: {
    sceneData?: any;
    screenshot?: string;
    svgContent?: string;
    selectedObjects?: string[];
  };
}

export interface AgentConfig {
  provider: AIProvider;
  model: string;
  priority: number;
  costPerToken: number;
  strengths: TaskType[];
}

export interface AgentResponse {
  provider: AIProvider;
  model: string;
  result: any;
  tokensUsed?: number;
  cost?: number;
  executionTime: number;
}

/**
 * Agent configurations with their strengths
 */
const AGENT_CONFIGS: AgentConfig[] = [
  {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    priority: 1,
    costPerToken: 0.00001, // Very cost-effective
    strengths: ['texture_generation', 'svg_edit', 'image_analysis']
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    priority: 2,
    costPerToken: 0.00003,
    strengths: ['scene_edit', 'complex_reasoning', 'image_analysis']
  },
  {
    provider: 'claude',
    model: 'claude-sonnet-4.5',
    priority: 3,
    costPerToken: 0.00003,
    strengths: ['complex_reasoning', 'scene_edit']
  },
  {
    provider: 'gemini',
    model: 'gemini-3-pro',
    priority: 4,
    costPerToken: 0.00005, // Higher quality, higher cost
    strengths: ['texture_generation', 'image_analysis']
  }
];

export class AIOrchestrator {
  private agentConfigs: AgentConfig[];

  constructor(configs?: AgentConfig[]) {
    this.agentConfigs = configs || AGENT_CONFIGS;
  }

  /**
   * Route a task to the most appropriate agent
   */
  async route(task: Task): Promise<AgentResponse> {
    const startTime = Date.now();

    // Find best agent for this task
    const agent = this.selectAgent(task);

    console.log(`[AIOrchestrator] Routing ${task.type} to ${agent.provider}:${agent.model}`);

    try {
      const result = await this.executeWithAgent(agent, task);

      return {
        provider: agent.provider,
        model: agent.model,
        result,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error(`[AIOrchestrator] Error with ${agent.provider}:`, error);

      // Try fallback agent
      const fallbackAgent = this.selectFallbackAgent(agent, task);
      if (fallbackAgent) {
        console.log(`[AIOrchestrator] Falling back to ${fallbackAgent.provider}:${fallbackAgent.model}`);
        const result = await this.executeWithAgent(fallbackAgent, task);

        return {
          provider: fallbackAgent.provider,
          model: fallbackAgent.model,
          result,
          executionTime: Date.now() - startTime
        };
      }

      throw error;
    }
  }

  /**
   * Execute a multi-agent workflow for complex tasks
   */
  async executeMultiAgent(tasks: Task[]): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];

    for (const task of tasks) {
      const response = await this.route(task);
      responses.push(response);

      // If any task fails, stop the workflow
      if (!response.result) {
        throw new Error(`Multi-agent workflow failed at task: ${task.type}`);
      }
    }

    return responses;
  }

  /**
   * Select the best agent for a task based on strengths and priority
   */
  private selectAgent(task: Task): AgentConfig {
    // Filter agents by task strengths
    const capableAgents = this.agentConfigs.filter(agent =>
      agent.strengths.includes(task.type)
    );

    if (capableAgents.length === 0) {
      // No specialized agent, use general-purpose (GPT-4o)
      return this.agentConfigs.find(a => a.model === 'gpt-4o')!;
    }

    // Vision requirement filter
    if (task.requiresVision) {
      const visionAgents = capableAgents.filter(a =>
        a.provider === 'openai' || a.provider === 'gemini'
      );

      if (visionAgents.length > 0) {
        return this.selectByPriority(visionAgents, task);
      }
    }

    // Select by priority and complexity
    return this.selectByPriority(capableAgents, task);
  }

  /**
   * Select agent based on priority and complexity
   */
  private selectByPriority(agents: AgentConfig[], task: Task): AgentConfig {
    // For high complexity, prefer more capable models
    if (task.complexity === 'high') {
      return agents.reduce((best, current) =>
        current.costPerToken > best.costPerToken ? current : best
      );
    }

    // For low/medium complexity, prefer cost-effective models
    return agents.reduce((best, current) =>
      current.priority < best.priority ? current : best
    );
  }

  /**
   * Find a fallback agent when primary fails
   */
  private selectFallbackAgent(failedAgent: AgentConfig, task: Task): AgentConfig | null {
    const alternatives = this.agentConfigs.filter(agent =>
      agent.provider !== failedAgent.provider &&
      agent.strengths.includes(task.type)
    );

    if (alternatives.length === 0) {
      return null;
    }

    return alternatives[0];
  }

  /**
   * Execute task with specific agent
   */
  private async executeWithAgent(agent: AgentConfig, task: Task): Promise<any> {
    switch (agent.provider) {
      case 'openai':
        return this.executeOpenAI(agent, task);
      case 'gemini':
        return this.executeGemini(agent, task);
      case 'claude':
        return this.executeClaude(agent, task);
      case 'openrouter':
        return this.executeOpenRouter(agent, task);
      default:
        throw new Error(`Unknown provider: ${agent.provider}`);
    }
  }

  private async executeOpenAI(agent: AgentConfig, task: Task): Promise<any> {
    // Implementation will use OpenAI SDK
    // For now, return placeholder
    return { provider: 'openai', model: agent.model, task: task.type };
  }

  private async executeGemini(agent: AgentConfig, task: Task): Promise<any> {
    // Implementation will use Gemini SDK
    return { provider: 'gemini', model: agent.model, task: task.type };
  }

  private async executeClaude(agent: AgentConfig, task: Task): Promise<any> {
    // Implementation will use Claude SDK
    return { provider: 'claude', model: agent.model, task: task.type };
  }

  private async executeOpenRouter(agent: AgentConfig, task: Task): Promise<any> {
    // Implementation will use OpenRouter SDK
    return { provider: 'openrouter', model: agent.model, task: task.type };
  }
}

/**
 * Singleton orchestrator instance
 */
export const orchestrator = new AIOrchestrator();

/**
 * Helper functions for common task types
 */

export async function generateTexture(prompt: string, quality: 'fast' | 'high' = 'fast') {
  return orchestrator.route({
    type: 'texture_generation',
    complexity: quality === 'high' ? 'medium' : 'low',
    requiresVision: false,
    prompt
  });
}

export async function editScene(prompt: string, sceneData: any, screenshot?: string) {
  return orchestrator.route({
    type: 'scene_edit',
    complexity: 'medium',
    requiresVision: !!screenshot,
    prompt,
    context: { sceneData, screenshot }
  });
}

export async function editSVG(prompt: string, svgContent: string) {
  return orchestrator.route({
    type: 'svg_edit',
    complexity: 'low',
    requiresVision: false,
    prompt,
    context: { svgContent }
  });
}

export async function analyzeImage(imageData: string) {
  return orchestrator.route({
    type: 'image_analysis',
    complexity: 'medium',
    requiresVision: true,
    prompt: 'Analyze this image',
    context: { screenshot: imageData }
  });
}

/**
 * Multi-agent workflow example: Generate material and apply to scene
 */
export async function generateAndApplyMaterial(
  materialPrompt: string,
  objectName: string,
  sceneData: any
) {
  const tasks: Task[] = [
    {
      type: 'texture_generation',
      complexity: 'medium',
      requiresVision: false,
      prompt: materialPrompt
    },
    {
      type: 'scene_edit',
      complexity: 'low',
      requiresVision: false,
      prompt: `Apply the generated material to ${objectName}`,
      context: { sceneData }
    }
  ];

  return orchestrator.executeMultiAgent(tasks);
}
