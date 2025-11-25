'use client';

/**
 * useAIMaterialEditor - AI-powered material editing hook
 *
 * Wraps BrowserAgentAdapter for material-specific commands.
 * Users describe changes in natural language, AI executes them.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import {
  MaterialCategory,
  buildCategoryPrompt,
  clampToCategory,
  detectCategory,
} from '@/lib/core/materials/category-constraints';

// Types from browser-agent-adapter
interface ExecutionPlan {
  approach: string;
  reasoning: string;
  commands: MaterialCommand[];
  validation?: {
    expectedOutcome?: string;
    checkPoints?: string[];
  };
}

interface MaterialCommand {
  action: string;
  params: Record<string, any>;
}

interface ExecutionResult {
  success: boolean;
  plan?: ExecutionPlan;
  error?: string;
  reasoning?: string;
}

interface MaterialContext {
  objectName?: string;
  currentColor?: string;
  currentRoughness?: number;
  currentMetalness?: number;
  category?: MaterialCategory;
}

/**
 * Lightweight AI Material Editor
 *
 * Uses GPT-4o-mini for cost-effective material adjustments.
 * Falls back to rule-based parsing if AI unavailable.
 */
export function useAIMaterialEditor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Get current material properties from selected object
  const getMaterialContext = useCallback((): MaterialContext => {
    if (!selectedObject) {
      return {};
    }

    let currentColor = '#808080';
    let currentRoughness = 0.5;
    let currentMetalness = 0.0;

    // Try to extract current material values
    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (mat) {
          if (mat.color) {
            currentColor = '#' + mat.color.getHexString();
          }
          if (typeof mat.roughness === 'number') {
            currentRoughness = mat.roughness;
          }
          if (typeof mat.metalness === 'number') {
            currentMetalness = mat.metalness;
          }
        }
      }
    });

    const category = detectCategory(currentRoughness, currentMetalness);

    return {
      objectName: selectedObject.name || 'Unnamed Object',
      currentColor,
      currentRoughness,
      currentMetalness,
      category,
    };
  }, [selectedObject]);

  /**
   * Execute a material command using AI
   */
  const executeMaterialCommand = useCallback(
    async (prompt: string): Promise<ExecutionResult> => {
      if (!selectedObject) {
        return {
          success: false,
          error: 'No object selected. Select an object first.',
        };
      }

      setIsProcessing(true);
      setLastError(null);

      const context = getMaterialContext();

      try {
        // Check for OpenAI API key
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

        if (!apiKey) {
          // Fall back to simple rule-based parsing
          console.log('⚠️ No API key, using rule-based material parsing');
          return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness);
        }

        // Dynamic import to avoid loading OpenAI SDK if not needed
        const { BrowserAgentAdapter } = await import('@/lib/core/ai/browser-agent-adapter');

        const agent = new BrowserAgentAdapter({
          apiKey,
          model: 'gpt-4o-mini', // Cost-effective for simple material edits
          enableRAG: false, // Disable RAG for faster responses
        });

        // Build material-specific prompt
        const materialPrompt = buildMaterialPrompt(prompt, context);

        const result = await agent.execute(materialPrompt, {
          sceneData: {
            selectedObjects: [context.objectName || 'unknown'],
            materialCategory: context.category,
          },
        });

        if (result.success && result.plan) {
          // Execute the commands
          executeCommands(
            result.plan.commands,
            context.category || 'stone',
            setColor,
            setRoughness,
            setMetalness
          );

          return {
            success: true,
            plan: result.plan,
            reasoning: result.plan.reasoning,
          };
        } else {
          // Try rule-based fallback
          console.log('⚠️ AI failed, trying rule-based fallback');
          return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ AI material edit failed:', errorMessage);
        setLastError(errorMessage);

        // Try rule-based fallback
        return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedObject, getMaterialContext, setColor, setRoughness, setMetalness]
  );

  return {
    executeMaterialCommand,
    isProcessing,
    lastError,
    getMaterialContext,
  };
}

/**
 * Build material-specific prompt for AI
 */
function buildMaterialPrompt(userPrompt: string, context: MaterialContext): string {
  const categorySection = context.category
    ? buildCategoryPrompt(context.category)
    : '';

  return `MATERIAL EDITING TASK: "${userPrompt}"

## Current Material State:
- Object: ${context.objectName || 'Unknown'}
- Color: ${context.currentColor || 'Not set'}
- Roughness: ${context.currentRoughness?.toFixed(2) ?? 'Not set'} (0=glossy, 1=matte)
- Metalness: ${context.currentMetalness?.toFixed(2) ?? 'Not set'} (0=non-metal, 1=full metal)

${categorySection}

## Available Actions (return in commands array):
Return a JSON object with an array of commands:
{
  "approach": "material-edit",
  "reasoning": "Brief explanation of what you're doing",
  "commands": [
    { "action": "setColor", "params": { "color": 16766720 } },
    { "action": "setRoughness", "params": { "value": 0.5 } },
    { "action": "setMetalness", "params": { "value": 0.8 } }
  ]
}

## Interpretation Guide:
- "more brushed" = increase roughness by ~0.1-0.2
- "more polished/shiny" = decrease roughness by ~0.1-0.2
- "more metallic" = increase metalness (if category allows)
- "golden/copper/bronze tint" = shift color toward warm tones
- "darker/lighter" = adjust color brightness
- "matte finish" = increase roughness toward category max
- "glossy" = decrease roughness toward category min

Interpret the user's intent and adjust from current values. Stay within category constraints.`;
}

/**
 * Execute parsed commands via SelectionContext
 */
function executeCommands(
  commands: MaterialCommand[],
  category: MaterialCategory,
  setColor: (hex: number) => void,
  setRoughness: (value: number) => void,
  setMetalness: (value: number) => void
) {
  for (const cmd of commands) {
    const action = cmd.action;
    const params = cmd.params || {};

    switch (action) {
      case 'setColor':
        if (params.color !== undefined) {
          const colorValue = typeof params.color === 'string'
            ? parseInt(params.color.replace('#', ''), 16)
            : params.color;
          setColor(colorValue);
          console.log(`🎨 AI: Set color to 0x${colorValue.toString(16)}`);
        }
        break;

      case 'setRoughness':
        if (params.value !== undefined) {
          const clampedValue = clampToCategory(category, 'roughness', params.value);
          setRoughness(clampedValue);
          console.log(`🔧 AI: Set roughness to ${clampedValue}`);
        }
        break;

      case 'setMetalness':
        if (params.value !== undefined) {
          const clampedValue = clampToCategory(category, 'metalness', params.value);
          setMetalness(clampedValue);
          console.log(`⚙️ AI: Set metalness to ${clampedValue}`);
        }
        break;

      default:
        console.warn(`⚠️ Unknown action: ${action}`);
    }
  }
}

/**
 * Rule-based fallback for common material adjustments
 * Used when AI API is unavailable
 */
function executeRuleBased(
  prompt: string,
  context: MaterialContext,
  setColor: (hex: number) => void,
  setRoughness: (value: number) => void,
  setMetalness: (value: number) => void
): ExecutionResult {
  const lower = prompt.toLowerCase();
  const commands: MaterialCommand[] = [];
  const category = context.category || 'stone';
  let reasoning = '';

  // Roughness adjustments
  if (lower.includes('brushed') || lower.includes('matte') || lower.includes('rough')) {
    const newValue = Math.min((context.currentRoughness || 0.5) + 0.15, 1.0);
    const clamped = clampToCategory(category, 'roughness', newValue);
    commands.push({ action: 'setRoughness', params: { value: clamped } });
    reasoning = `Increased roughness to ${clamped.toFixed(2)} for a more ${lower.includes('brushed') ? 'brushed' : 'matte'} look`;
  } else if (lower.includes('polished') || lower.includes('shiny') || lower.includes('glossy') || lower.includes('smooth')) {
    const newValue = Math.max((context.currentRoughness || 0.5) - 0.15, 0.0);
    const clamped = clampToCategory(category, 'roughness', newValue);
    commands.push({ action: 'setRoughness', params: { value: clamped } });
    reasoning = `Decreased roughness to ${clamped.toFixed(2)} for a more polished look`;
  }

  // Metalness adjustments
  if (lower.includes('metallic') || lower.includes('metal')) {
    const newValue = Math.min((context.currentMetalness || 0) + 0.2, 1.0);
    const clamped = clampToCategory(category, 'metalness', newValue);
    commands.push({ action: 'setMetalness', params: { value: clamped } });
    reasoning += reasoning ? '. Also increased metalness.' : `Increased metalness to ${clamped.toFixed(2)}`;
  }

  // Color adjustments
  if (lower.includes('golden') || lower.includes('gold')) {
    commands.push({ action: 'setColor', params: { color: 0xD4AF37 } });
    reasoning += reasoning ? '. Applied golden tint.' : 'Applied golden tint';
  } else if (lower.includes('copper')) {
    commands.push({ action: 'setColor', params: { color: 0xB87333 } });
    reasoning += reasoning ? '. Applied copper tint.' : 'Applied copper tint';
  } else if (lower.includes('bronze')) {
    commands.push({ action: 'setColor', params: { color: 0xCD7F32 } });
    reasoning += reasoning ? '. Applied bronze tint.' : 'Applied bronze tint';
  } else if (lower.includes('silver')) {
    commands.push({ action: 'setColor', params: { color: 0xC0C0C0 } });
    reasoning += reasoning ? '. Applied silver tint.' : 'Applied silver tint';
  } else if (lower.includes('darker')) {
    // Darken current color by 20%
    if (context.currentColor) {
      const hex = parseInt(context.currentColor.replace('#', ''), 16);
      const r = Math.floor(((hex >> 16) & 0xFF) * 0.8);
      const g = Math.floor(((hex >> 8) & 0xFF) * 0.8);
      const b = Math.floor((hex & 0xFF) * 0.8);
      const darkened = (r << 16) | (g << 8) | b;
      commands.push({ action: 'setColor', params: { color: darkened } });
      reasoning += reasoning ? '. Darkened color.' : 'Darkened color';
    }
  } else if (lower.includes('lighter') || lower.includes('brighter')) {
    // Lighten current color by 20%
    if (context.currentColor) {
      const hex = parseInt(context.currentColor.replace('#', ''), 16);
      const r = Math.min(Math.floor(((hex >> 16) & 0xFF) * 1.2), 255);
      const g = Math.min(Math.floor(((hex >> 8) & 0xFF) * 1.2), 255);
      const b = Math.min(Math.floor((hex & 0xFF) * 1.2), 255);
      const lightened = (r << 16) | (g << 8) | b;
      commands.push({ action: 'setColor', params: { color: lightened } });
      reasoning += reasoning ? '. Lightened color.' : 'Lightened color';
    }
  }

  if (commands.length === 0) {
    return {
      success: false,
      error: 'Could not understand the request. Try: "more brushed", "polished", "golden tint", "darker"',
    };
  }

  // Execute commands
  executeCommands(commands, category, setColor, setRoughness, setMetalness);

  return {
    success: true,
    reasoning: `(Rule-based) ${reasoning}`,
    plan: {
      approach: 'rule-based',
      reasoning,
      commands,
    },
  };
}

export default useAIMaterialEditor;
