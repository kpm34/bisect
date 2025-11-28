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
 * Available PBR Textures in Supabase Storage
 * These are high-quality CC0 textures from AmbientCG
 */
const SUPABASE_TEXTURES_BASE = 'https://vmawsauglaejrwfajnht.supabase.co/storage/v1/object/public/material-textures';

export const AVAILABLE_PBR_TEXTURES = {
  stone: {
    marble: {
      name: 'Marble',
      description: 'Light grey polished marble stone',
      diffuse: `${SUPABASE_TEXTURES_BASE}/stone/marble/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/stone/marble/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/stone/marble/roughness.jpg`,
      defaultProps: { roughness: 0.1, metalness: 0.0 }
    },
    granite: {
      name: 'Granite',
      description: 'Speckled grey granite rock',
      diffuse: `${SUPABASE_TEXTURES_BASE}/stone/granite/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/stone/granite/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/stone/granite/roughness.jpg`,
      defaultProps: { roughness: 0.4, metalness: 0.0 }
    },
    concrete: {
      name: 'Concrete',
      description: 'Smooth grey concrete',
      diffuse: `${SUPABASE_TEXTURES_BASE}/stone/concrete/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/stone/concrete/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/stone/concrete/roughness.jpg`,
      defaultProps: { roughness: 0.8, metalness: 0.0 }
    },
    sandstone: {
      name: 'Sandstone',
      description: 'Beige desert sandstone',
      diffuse: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/stone/sandstone/roughness.jpg`,
      defaultProps: { roughness: 0.9, metalness: 0.0 }
    },
    slate: {
      name: 'Slate',
      description: 'Dark slate rock',
      diffuse: `${SUPABASE_TEXTURES_BASE}/stone/slate/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/stone/slate/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/stone/slate/roughness.jpg`,
      defaultProps: { roughness: 0.6, metalness: 0.0 }
    },
  },
  fabric: {
    cotton: {
      name: 'Cotton',
      description: 'White cotton fabric',
      diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/fabric/cotton/roughness.jpg`,
      defaultProps: { roughness: 0.9, metalness: 0.0 }
    },
    silk: {
      name: 'Silk',
      description: 'Smooth red silk fabric',
      diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/silk/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/fabric/silk/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/fabric/silk/roughness.jpg`,
      defaultProps: { roughness: 0.4, metalness: 0.0 }
    },
    denim: {
      name: 'Denim',
      description: 'Blue denim jeans fabric',
      diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/denim/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/fabric/denim/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/fabric/denim/roughness.jpg`,
      defaultProps: { roughness: 0.8, metalness: 0.0 }
    },
    leather: {
      name: 'Leather',
      description: 'Brown saddle leather',
      diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/leather/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/fabric/leather/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/fabric/leather/roughness.jpg`,
      defaultProps: { roughness: 0.6, metalness: 0.0 }
    },
    velvet: {
      name: 'Velvet',
      description: 'Purple velvet fabric',
      diffuse: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/fabric/velvet/roughness.jpg`,
      defaultProps: { roughness: 0.7, metalness: 0.0 }
    },
  },
  wood: {
    oak: {
      name: 'Oak',
      description: 'Light brown oak wood',
      diffuse: `${SUPABASE_TEXTURES_BASE}/wood/oak/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/wood/oak/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/wood/oak/roughness.jpg`,
      defaultProps: { roughness: 0.5, metalness: 0.0 }
    },
    walnut: {
      name: 'Walnut',
      description: 'Dark brown walnut wood',
      diffuse: `${SUPABASE_TEXTURES_BASE}/wood/walnut/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/wood/walnut/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/wood/walnut/roughness.jpg`,
      defaultProps: { roughness: 0.5, metalness: 0.0 }
    },
    maple: {
      name: 'Maple',
      description: 'Light maple wood',
      diffuse: `${SUPABASE_TEXTURES_BASE}/wood/maple/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/wood/maple/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/wood/maple/roughness.jpg`,
      defaultProps: { roughness: 0.4, metalness: 0.0 }
    },
    cherry: {
      name: 'Cherry',
      description: 'Reddish cherry wood',
      diffuse: `${SUPABASE_TEXTURES_BASE}/wood/cherry/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/wood/cherry/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/wood/cherry/roughness.jpg`,
      defaultProps: { roughness: 0.45, metalness: 0.0 }
    },
    bamboo: {
      name: 'Bamboo',
      description: 'Light bamboo wood',
      diffuse: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/diffuse.jpg`,
      normal: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/normal.jpg`,
      roughness: `${SUPABASE_TEXTURES_BASE}/wood/bamboo/roughness.jpg`,
      defaultProps: { roughness: 0.4, metalness: 0.0 }
    },
  },
  metal: {
    gold: { name: 'Gold', description: 'Polished gold metal', defaultProps: { color: '#FFD700', roughness: 0.15, metalness: 1.0 } },
    silver: { name: 'Silver', description: 'Polished silver metal', defaultProps: { color: '#C0C0C0', roughness: 0.15, metalness: 1.0 } },
    copper: { name: 'Copper', description: 'Matte copper metal', defaultProps: { color: '#B87333', roughness: 0.5, metalness: 1.0 } },
    iron: { name: 'Iron', description: 'Rusted iron metal', defaultProps: { color: '#8B4513', roughness: 0.8, metalness: 0.4 } },
    titanium: { name: 'Titanium', description: 'Brushed titanium', defaultProps: { color: '#878681', roughness: 0.35, metalness: 1.0 } },
  }
} as const;

// Helper to find texture by name
export function findTextureByName(query: string): { category: string; material: string; texture: any } | null {
  const lower = query.toLowerCase();

  for (const [category, materials] of Object.entries(AVAILABLE_PBR_TEXTURES)) {
    for (const [materialKey, texture] of Object.entries(materials)) {
      if (lower.includes(materialKey) || lower.includes(texture.name.toLowerCase())) {
        return { category, material: materialKey, texture };
      }
    }
  }
  return null;
}

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
    // Build available textures list for the prompt
    const textureList = this._buildTextureList();

    return `You are an expert AI assistant for a 3D design editor. You help users edit materials, apply textures, transform objects, and create scenes.

## YOUR CAPABILITIES:
1. **Material Editing** - Change colors, roughness, metalness, and other PBR properties
2. **Texture Application** - Apply realistic PBR textures from our library
3. **Scene Understanding** - Analyze and describe the current scene
4. **Creative Assistance** - Suggest materials and styles based on context

## AVAILABLE PBR TEXTURES:
${textureList}

## COMMAND FORMAT:
Return a JSON object with your execution plan:
{
  "approach": "direct-api",
  "reasoning": "Brief explanation of what you're doing and why",
  "commands": [
    // For applying a texture:
    { "action": "applyTexture", "params": { "category": "stone", "material": "marble" } },

    // For setting color (as hex integer):
    { "action": "setColor", "params": { "color": 16766720 } },

    // For adjusting roughness (0-1):
    { "action": "setRoughness", "params": { "value": 0.5 } },

    // For adjusting metalness (0-1):
    { "action": "setMetalness", "params": { "value": 0.8 } },

    // For UV tiling adjustment:
    { "action": "setTextureRepeat", "params": { "x": 2, "y": 2 } }
  ]
}

## INTERPRETATION GUIDE:
- "make it look like marble" → applyTexture with category="stone", material="marble"
- "wooden floor" or "oak texture" → applyTexture with category="wood", material="oak"
- "leather material" → applyTexture with category="fabric", material="leather"
- "make it gold" or "golden" → applyTexture with category="metal", material="gold"
- "more brushed/matte" → increase roughness by 0.1-0.2
- "more polished/shiny" → decrease roughness by 0.1-0.2
- "darker" → adjust color toward darker values
- "lighter/brighter" → adjust color toward lighter values

## IMPORTANT RULES:
1. ALWAYS return valid JSON with "approach", "reasoning", and "commands" fields
2. Commands must be an array of objects, not strings
3. For textures, use exact category and material names from the list above
4. Be helpful and creative - suggest alternatives if the exact request isn't available
5. If unsure, explain your reasoning and ask for clarification in the "reasoning" field`;
  }

  private _buildTextureList(): string {
    const lines: string[] = [];

    for (const [category, materials] of Object.entries(AVAILABLE_PBR_TEXTURES)) {
      lines.push(`\n### ${category.toUpperCase()}`);
      for (const [key, mat] of Object.entries(materials)) {
        lines.push(`- **${key}**: ${mat.name} - ${mat.description}`);
      }
    }

    return lines.join('\n');
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
