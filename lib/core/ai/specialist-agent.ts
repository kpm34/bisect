import type { AgentContext, ExecutionResult } from './unified-spline-agent';

/**
 * Common interface for all specialist agents
 */
export interface SpecialistAgent {
    /**
     * Unique identifier for the agent
     */
    id: string;

    /**
     * Capabilities description for the router
     */
    capabilities: string[];

    /**
     * Execute a command
     */
    execute(command: string, context: AgentContext): Promise<ExecutionResult>;
}
