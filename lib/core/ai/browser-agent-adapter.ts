import OpenAI from 'openai';
import type {
    AgentContext,
    ExecutionResult,
    ErrorResult,
    ExecutionPlan,
    CostCalculation,
} from './unified-spline-agent';
import { BrowserRAGSystem, type BrowserRAGConfig } from '../rag/BrowserRagSystem';
import { MultiModelRouter } from './multi-model-router';
import { MaterialAgent } from './material-agent';
import { GeminiSpatialAgent } from './gemini-spatial-agent';
import { ClaudePlannerAgent } from './claude-planner-agent';

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
 * Acts as the Facade/Orchestrator for the Multi-Model Agent System.
 * Routes commands to specialized agents (Material, Spatial, Planner).
 */
export class BrowserAgentAdapter {
    private router: MultiModelRouter;
    private conversationHistory: HistoryEntry[];
    private maxHistoryLength: number;
    private ragSystem: BrowserRAGSystem | null;
    private ragInitialized: boolean = false;

    constructor(config: BrowserAgentConfig = {}) {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        // Initialize Router
        this.router = new MultiModelRouter(config.apiKey);

        // Initialize and Register Agents
        // Note: In a real app, we'd pass specific keys for Gemini/Claude
        const materialAgent = new MaterialAgent(config.apiKey, config.model);
        const spatialAgent = new GeminiSpatialAgent(config.apiKey); // Placeholder key
        const plannerAgent = new ClaudePlannerAgent(config.apiKey); // Placeholder key

        this.router.registerAgent(materialAgent, true);
        this.router.registerAgent(spatialAgent);
        this.router.registerAgent(plannerAgent);

        this.conversationHistory = [];
        this.maxHistoryLength = config.maxHistoryLength || 10;

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
     * Execute a command with full context
     */
    async execute(
        userCommand: string,
        context: AgentContext = {}
    ): Promise<ExecutionResult> {
        try {
            console.log('🤖 Orchestrator received command:', userCommand);

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

            // Route execution to appropriate agent
            const result = await this.router.routeAndExecute(userCommand, context);

            // Store in history
            if (result.success && result.plan) {
                this._addToHistory(userCommand, result.plan);

                // Store successful edit in RAG for future learning
                if (this.ragSystem && this.ragInitialized && result.plan.commands.length > 0) {
                    console.log('💾 Storing successful edit in RAG...');
                    this.ragSystem.storeSuccessfulEdit({
                        command: userCommand,
                        outcome: result.plan.reasoning || 'Success',
                        code: JSON.stringify(result.plan.commands),
                        sceneData: context.sceneData,
                        timestamp: Date.now()
                    }).catch(err => {
                        console.warn('⚠️ Failed to store edit in RAG:', err);
                    });
                }
            }

            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Agent execution failed:', error);

            return {
                success: false,
                error: errorMessage,
                fallback: this._generateFallbackPlan(userCommand),
            };
        }
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
