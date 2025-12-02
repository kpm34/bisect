import OpenAI from 'openai';
import type { SpecialistAgent } from './specialist-agent';
import type { AgentContext, ExecutionResult } from './unified-spline-agent';
import { GeminiOrchestrator, type RoutingDecision } from './gemini-orchestrator';

/**
 * Routes commands to the appropriate specialist agent
 *
 * Updated to use Gemini 3 Orchestrator for intelligent routing.
 * Gemini 3 has the best spatial understanding (1501 Elo) making it
 * ideal for understanding scene context and routing decisions.
 *
 * Agent Mapping:
 * - 'material' / 'gpt4o' → GPT-4o Material Agent
 * - 'spatial' / 'gemini' → Gemini Spatial Agent
 * - 'planner' / 'blender' / 'claude' → Claude Blender Agent
 */
export class MultiModelRouter {
    private agents: Map<string, SpecialistAgent>;
    private defaultAgentId: string;
    private openai: OpenAI;
    private orchestrator: GeminiOrchestrator;
    private useGeminiOrchestrator: boolean = true;

    constructor(apiKey?: string, geminiApiKey?: string) {
        this.agents = new Map();
        this.defaultAgentId = 'material'; // Default to GPT-4o Material Agent

        // Initialize OpenAI for fallback routing
        this.openai = new OpenAI({
            apiKey: apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true,
        });

        // Initialize Gemini 3 Orchestrator for primary routing
        this.orchestrator = new GeminiOrchestrator(
            geminiApiKey || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY
        );
    }

    /**
     * Register an agent
     */
    registerAgent(agent: SpecialistAgent, isDefault: boolean = false): void {
        this.agents.set(agent.id, agent);
        if (isDefault) {
            this.defaultAgentId = agent.id;
        }

        // Also register with orchestrator using normalized ID
        const orchestratorId = this._normalizeAgentId(agent.id);
        if (orchestratorId) {
            this.orchestrator.registerAgent(orchestratorId, agent);
        }
    }

    /**
     * Normalize agent ID for orchestrator
     */
    private _normalizeAgentId(id: string): 'gpt4o' | 'gemini' | 'claude' | null {
        const lower = id.toLowerCase();
        if (lower === 'material' || lower === 'gpt4o') return 'gpt4o';
        if (lower === 'spatial' || lower === 'gemini') return 'gemini';
        if (lower === 'planner' || lower === 'blender' || lower === 'claude') return 'claude';
        return null;
    }

    /**
     * Route and execute a command
     * Now uses Gemini 3 Orchestrator for intelligent routing with vision support
     */
    async routeAndExecute(
        command: string,
        context: AgentContext,
        options?: {
            screenshot?: string;
            forceDebate?: boolean;
        }
    ): Promise<ExecutionResult> {
        // Use Gemini 3 orchestrator if enabled
        if (this.useGeminiOrchestrator) {
            return this._routeWithOrchestrator(command, context, options);
        }

        // Fallback to legacy routing
        const agentId = await this._determineAgent(command);
        const agent = this.agents.get(agentId);

        if (!agent) {
            throw new Error(`Agent '${agentId}' not found`);
        }

        console.log(`🔀 Routing command "${command}" to agent: ${agentId}`);
        return agent.execute(command, context);
    }

    /**
     * Route using Gemini 3 Orchestrator
     * Leverages Gemini's superior spatial understanding for smart routing
     */
    private async _routeWithOrchestrator(
        command: string,
        context: AgentContext,
        options?: { screenshot?: string; forceDebate?: boolean }
    ): Promise<ExecutionResult> {
        try {
            // Use orchestrator's full pipeline (routing + optional debate + execution)
            return await this.orchestrator.orchestrateAndExecute(
                command,
                context,
                options?.screenshot,
                options?.forceDebate
            );
        } catch (error) {
            console.warn('⚠️ Gemini orchestrator failed, falling back to legacy:', error);
            this.useGeminiOrchestrator = false; // Disable for this session

            // Fallback to legacy routing
            const agentId = await this._determineAgent(command);
            const agent = this.agents.get(agentId);
            if (agent) {
                return agent.execute(command, context);
            }
            throw error;
        }
    }

    /**
     * Get routing decision without executing
     * Useful for debugging or UI feedback
     */
    async getRoutingDecision(
        command: string,
        context: AgentContext,
        screenshot?: string
    ): Promise<RoutingDecision> {
        return this.orchestrator.route(command, context, screenshot);
    }

    /**
     * Check if command should trigger debate mode
     */
    async shouldDebate(command: string): Promise<boolean> {
        return this.orchestrator.shouldDebate(command);
    }

    /**
     * Enable/disable Gemini orchestrator
     */
    setUseOrchestrator(enabled: boolean): void {
        this.useGeminiOrchestrator = enabled;
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
