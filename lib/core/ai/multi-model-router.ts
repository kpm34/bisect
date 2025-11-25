import OpenAI from 'openai';
import type { SpecialistAgent } from './specialist-agent';
import type { AgentContext, ExecutionResult } from './unified-spline-agent';

/**
 * Routes commands to the appropriate specialist agent
 */
export class MultiModelRouter {
    private agents: Map<string, SpecialistAgent>;
    private defaultAgentId: string;
    private openai: OpenAI;

    constructor(apiKey?: string) {
        this.agents = new Map();
        this.defaultAgentId = 'material'; // Default to GPT-4o Material Agent

        // Initialize OpenAI for routing decisions
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true,
        });
    }

    /**
     * Register an agent
     */
    registerAgent(agent: SpecialistAgent, isDefault: boolean = false): void {
        this.agents.set(agent.id, agent);
        if (isDefault) {
            this.defaultAgentId = agent.id;
        }
    }

    /**
     * Route and execute a command
     */
    async routeAndExecute(command: string, context: AgentContext): Promise<ExecutionResult> {
        const agentId = await this._determineAgent(command);
        const agent = this.agents.get(agentId);

        if (!agent) {
            throw new Error(`Agent '${agentId}' not found`);
        }

        console.log(`🔀 Routing command "${command}" to agent: ${agentId}`);
        return agent.execute(command, context);
    }

    /**
     * Determine which agent should handle the command using LLM classification
     */
    private async _determineAgent(command: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini', // Fast and cheap for routing
                messages: [
                    {
                        role: 'system',
                        content: `You are an intelligent router for a 3D design tool.
Classify the user's command into one of these agents:

1. "material" - For changing colors, textures, materials, lighting, or visual style.
   Keywords: color, texture, material, paint, shine, rough, metal, glass, light, dark, bright.

2. "spatial" - For moving, rotating, scaling, arranging, or layout tasks.
   Keywords: move, rotate, scale, position, arrange, grid, circle, scatter, align, distribute.

3. "planner" - For complex, multi-step requests that require creating a scene from scratch or high-level planning.
   Keywords: create a scene, build a, make a forest, step by step, plan.

Return ONLY a JSON object: { "agent": "material" | "spatial" | "planner", "confidence": number }`
                    },
                    {
                        role: 'user',
                        content: command
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1, // Low temperature for consistent classification
            });

            const content = response.choices[0].message.content;
            if (!content) return this.defaultAgentId;

            const result = JSON.parse(content);
            return result.agent || this.defaultAgentId;

        } catch (error) {
            console.warn('⚠️ Router LLM failed, falling back to keyword matching:', error);
            return this._fallbackRouting(command);
        }
    }

    /**
     * Fallback keyword-based routing
     */
    private _fallbackRouting(command: string): string {
        const lower = command.toLowerCase();

        // Spatial / Layout commands -> Gemini
        if (
            lower.includes('arrange') ||
            lower.includes('scatter') ||
            lower.includes('grid') ||
            lower.includes('align') ||
            lower.includes('distribute') ||
            lower.includes('position') ||
            lower.includes('rotate') ||
            lower.includes('scale') ||
            lower.includes('move')
        ) {
            return 'spatial';
        }

        // Planning / Complex commands -> Claude
        if (
            lower.includes('plan') ||
            lower.includes('create a scene') ||
            lower.includes('build a') ||
            lower.includes('step by step') ||
            lower.includes('workflow')
        ) {
            return 'planner';
        }

        // Default to Material/General -> GPT-4o
        return 'material';
    }
}
