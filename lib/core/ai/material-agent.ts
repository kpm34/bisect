import OpenAI from 'openai';
import type { SpecialistAgent } from './specialist-agent';
import type { AgentContext, ExecutionResult, ExecutionPlan, CostCalculation, AgentCommand } from './unified-spline-agent';
import { GeminiTextureBackup } from './gemini-texture-backup';
import { BrowserRAGSystem } from '../rag/browser-rag-system';
import { materialKnowledgeBase } from '../rag/material_knowledge_base_content';
import { VisualAnalysisTools } from './visual-analysis-tools';
import { SceneGraphBuilder } from './scene-graph-builder';
import { AgentDebateSystem } from './agent-debate-system';

/**
 * Material Agent (GPT-4o)
 * Specialized in material editing, texture generation, and visual analysis.
 * Contains the core logic previously in BrowserAgentAdapter.
 */
export class MaterialAgent implements SpecialistAgent {
  id = 'material';
  capabilities = ['material-editing', 'texture-generation', 'visual-analysis'];
  private openai: OpenAI;
  private model: string;
  private systemPrompt: string;
  private textureBackup: GeminiTextureBackup;
  private ragSystem: BrowserRAGSystem;
  private debateSystem: AgentDebateSystem;
  private isRagInitialized: boolean = false;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
    this.systemPrompt = this._buildSystemPrompt();
    this.textureBackup = new GeminiTextureBackup(apiKey);
    this.ragSystem = new BrowserRAGSystem({ openaiApiKey: apiKey });
    this.debateSystem = new AgentDebateSystem(apiKey);
  }

  private async _ensureRagInitialized() {
    if (this.isRagInitialized) return;

    // In a real app, we'd read the file. Here we'll use a hardcoded string or import
    // For this demonstration, I'll assume we pass the content or load it
    // Let's simulate loading the KB we just created
    const kbContent = materialKnowledgeBase;
    await this.ragSystem.ingestKnowledgeBase(kbContent);
    this.isRagInitialized = true;
  }

  async execute(command: string, context: AgentContext): Promise<ExecutionResult> {
    console.log('🎨 Material Agent executing:', command);

    // Initialize RAG if needed
    await this._ensureRagInitialized();

    // Check if this is a texture generation request
    if (this._isTextureRequest(command)) {
      console.log('🎨 Texture generation requested, delegating to Gemini Backup...');
      const plan = await this.textureBackup.generateTexturePlan(command, context);
      return {
        success: true,
        plan,
        tokensUsed: 0,
        cost: { inputTokens: 0, outputTokens: 0, totalTokens: 0, inputCost: '0', outputCost: '0', totalCost: '0' }
      };
    }

    try {
      // Retrieve relevant knowledge
      const knowledge = await this.ragSystem.retrieveKnowledge(command);
      const knowledgeContext = knowledge.length > 0
        ? `\n\nRelevant Material Knowledge: \n${knowledge.join('\n')} `
        : '';

      // Build messages with context AND knowledge
      const messages = this._buildMessages(command, context);

      // Inject knowledge into the system prompt or the last user message
      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        systemMessage.content += knowledgeContext;
      }

      // [NEW] Visual Analysis Enhancement
      // If the command mentions specific colors or geometry, use the tools to provide precise data
      let visualContext = '';

      // 1. Color Analysis
      // Simple regex to find color words (naive implementation)
      const colorMatch = command.match(/(red|blue|green|yellow|gold|silver|bronze|copper|purple|pink|orange|grey|black|white)/i);
      if (colorMatch) {
        const preciseColor = VisualAnalysisTools.resolveColor(colorMatch[0]);
        visualContext += `\n\nVisual Analysis Tool: Detected color "${colorMatch[0]}". Recommended Hex: ${preciseColor}.`;
      }

      // 2. Geometry/UV Analysis (Mocking object size for now as we don't have full scene graph access here yet)
      // In a real scenario, we'd extract the target object's size from 'context.sceneData'
      if (command.includes('texture') || command.includes('scale') || command.includes('pattern')) {
        // Assuming a default 1x1x1 unit cube if size is unknown
        const mockSize = { x: 2, y: 2, z: 2 };
        const uvData = VisualAnalysisTools.calculateOptimalUVScale(mockSize);
        visualContext += `\n\nVisual Analysis Tool: For an object of size 2x2x2, optimal UV scale is {x: ${uvData.scale.x}, y: ${uvData.scale.y}}.`;
      }

      if (visualContext) {
        messages.push({
          role: 'system',
          content: visualContext
        });
      }

      // [NEW] Semantic Scene Graph Integration
      let sceneSummary = '';
      if (context.sceneData) {
        try {
          const sceneGraph = SceneGraphBuilder.buildGraph(context.sceneData);
          sceneSummary = sceneGraph.summary;
          messages.push({
            role: 'system',
            content: `\n\nSemantic Scene Context:\n${sceneSummary}`
          });
          console.log('🧠 Injected Scene Graph:', sceneSummary);
        } catch (err) {
          console.warn('Failed to build scene graph:', err);
        }
      }

      // [NEW] Agent Debate System
      // If the command is complex/creative, trigger the debate loop
      if (command.length > 20 || command.includes('design') || command.includes('create') || command.includes('make')) {
        const debateResult = await this.debateSystem.conductDebate({
          userCommand: command,
          sceneSummary: sceneSummary,
          visualAnalysis: visualContext
        });

        // Inject the debate outcome as the "Final Plan" context for the execution model
        messages.push({
          role: 'system',
          content: `\n\n*** AGENT DEBATE OUTCOME ***\nFollowing a debate between Gemini 3.0 and Claude 4.5, here is the agreed execution plan:\n${debateResult.finalPlan}\n\nExecute this plan precisely.`
        });
      }

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

      return {
        success: true,
        plan,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this._calculateCost(response.usage),
      };
    } catch (error) {
      console.error('❌ Material Agent execution failed:', error);

      // Fallback to texture backup if standard edit fails
      console.log('⚠️ Attempting fallback to Gemini Texture Backup...');
      const fallbackPlan = await this.textureBackup.generateTexturePlan(command, context);

      return {
        success: true, // Technically a success if fallback works
        plan: fallbackPlan,
        tokensUsed: 0,
        cost: { inputTokens: 0, outputTokens: 0, totalTokens: 0, inputCost: '0', outputCost: '0', totalCost: '0' }
      };
    }
  }

  private _isTextureRequest(command: string): boolean {
    const lower = command.toLowerCase();
    return (
      lower.includes('generate texture') ||
      lower.includes('create texture') ||
      lower.includes('make a pattern') ||
      lower.includes('procedural')
    );
  }

  private _buildSystemPrompt(): string {
    return `You are a professional Spline 3D editor specialized in MATERIALS and TEXTURES.
    
You have expert - level skills in:
- Material design(PBR workflows)
    - Color theory and application
        - Texture generation and mapping
            - Lighting interactions

When given a command, return a structured execution plan in JSON format.
{
    "approach": "direct-api",
        "reasoning": "Brief explanation",
            "commands": [
                {
                    "type": "spline-api",
                    "action": "setObjectProperty",
                    "params": {
                        "objectName": "Cube",
                        "property": "material.color",
                        "value": 16711680
                    }
                }
            ]
}

IMPORTANT: Return "commands" as an array of objects, NOT strings.
Focus on modifying material properties like color, roughness, metalness, and textures.`;
  }

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

    // Add context
    if (context.sceneData) {
      messages.push({
        role: 'user',
        content: `Current Scene Data: ${JSON.stringify(context.sceneData)} `,
      });
    }

    if (context.similarEdits && context.similarEdits.length > 0) {
      messages.push({
        role: 'user',
        content: `Similar Past Edits: ${JSON.stringify(context.similarEdits)} `,
      });
    }

    messages.push({
      role: 'user',
      content: userCommand,
    });

    return messages;
  }

  private _calculateCost(usage: OpenAI.CompletionUsage | undefined): CostCalculation {
    if (!usage) return { inputTokens: 0, outputTokens: 0, totalTokens: 0, inputCost: '0', outputCost: '0', totalCost: '0' };

    // GPT-4o pricing
    const inputCost = (usage.prompt_tokens / 1000000) * 2.5;
    const outputCost = (usage.completion_tokens / 1000000) * 10.0;

    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
    };
  }
}
