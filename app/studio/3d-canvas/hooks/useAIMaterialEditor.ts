'use client';

/**
 * useAIMaterialEditor - AI-powered material editing hook
 *
 * Uses the full BrowserAgentAdapter orchestrator for intelligent editing.
 * The orchestrator routes commands to specialist agents:
 * - MaterialAgent (GPT-4o) for materials, textures, colors
 * - GeminiSpatialAgent for spatial/layout tasks
 * - ClaudePlannerAgent for complex multi-step planning
 *
 * Features:
 * - Multi-model AI routing (GPT-4o, Gemini, Claude)
 * - RAG-powered memory of past successful edits
 * - PBR texture application from Supabase library
 * - Agent debate system for complex requests
 * - Visual analysis tools
 * - Automatic fallback chain
 */

import { useState, useCallback, useRef } from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import {
  MaterialCategory,
  clampToCategory,
  detectCategory,
} from '@/lib/core/materials/category-constraints';
import { AVAILABLE_PBR_TEXTURES, findTextureByName } from '@/lib/core/ai/material-agent';

// Types for AI execution
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
  type?: string;
  params: Record<string, any>;
}

interface ExecutionResult {
  success: boolean;
  plan?: ExecutionPlan;
  error?: string;
  reasoning?: string;
  agent?: string;
  tokensUsed?: number;
  cost?: any;
}

interface MaterialContext {
  objectName?: string;
  currentColor?: string;
  currentRoughness?: number;
  currentMetalness?: number;
  category?: MaterialCategory;
}

// Texture map URLs type
interface TextureMaps {
  diffuse?: string;
  normal?: string;
  roughness?: string;
  ao?: string;
}

/**
 * AI Material Editor with Full Orchestration
 *
 * Uses BrowserAgentAdapter which:
 * 1. Routes to MaterialAgent (GPT-4o) for material/texture commands
 * 2. Routes to GeminiSpatialAgent for spatial/layout commands
 * 3. Routes to ClaudePlannerAgent for complex multi-step tasks
 * 4. Uses RAG for memory of past successful edits
 * 5. Falls back to rule-based parsing if all AI fails
 */
export function useAIMaterialEditor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastAgent, setLastAgent] = useState<string | null>(null);

  const { setColor, setRoughness, setMetalness, selectedObject } = useSelection();

  // Cache the agent adapter to avoid re-initialization
  const agentRef = useRef<any>(null);

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
   * Initialize or get cached agent adapter
   */
  const getAgent = useCallback(async () => {
    if (agentRef.current) {
      return agentRef.current;
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }

    // Dynamic import to avoid loading SDK if not needed
    const { BrowserAgentAdapter } = await import('@/lib/core/ai/browser-agent-adapter');

    agentRef.current = new BrowserAgentAdapter({
      apiKey,
      model: 'gpt-4o', // Full model for orchestration
      enableRAG: true, // Enable RAG for learning from past edits
    });

    return agentRef.current;
  }, []);

  /**
   * Execute a command using the AI orchestrator
   *
   * The orchestrator will:
   * 1. Use GPT-4o-mini to classify the command type
   * 2. Route to the appropriate specialist agent
   * 3. Execute with RAG context and agent debate if needed
   * 4. Return structured commands for execution
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
      setLastAgent(null);

      const context = getMaterialContext();

      try {
        const agent = await getAgent();

        if (!agent) {
          // No API key, fall back to rule-based
          console.log('⚠️ No API key, using rule-based parsing');
          return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness, selectedObject);
        }

        console.log('🤖 Sending to AI Orchestrator:', prompt);

        // Build rich scene context for the orchestrator
        const sceneData = {
          selectedObjects: [context.objectName || 'unknown'],
          materialCategory: context.category,
          currentMaterial: {
            color: context.currentColor,
            roughness: context.currentRoughness,
            metalness: context.currentMetalness,
          },
          // Add available textures info so AI knows what's available
          availableTextures: Object.keys(AVAILABLE_PBR_TEXTURES).flatMap(cat =>
            Object.keys((AVAILABLE_PBR_TEXTURES as any)[cat]).map(mat => `${cat}/${mat}`)
          ),
        };

        // Execute through the orchestrator (routes to appropriate agent)
        const result = await agent.execute(prompt, { sceneData });

        if (result.success && result.plan) {
          console.log('✅ AI Orchestrator returned plan:', result.plan);
          setLastAgent(result.plan.approach || 'unknown');

          // Execute the commands
          await executeCommands(
            result.plan.commands,
            context.category || 'stone',
            setColor,
            setRoughness,
            setMetalness,
            selectedObject
          );

          return {
            success: true,
            plan: result.plan,
            reasoning: result.plan.reasoning,
            agent: result.plan.approach,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
          };
        } else {
          // Orchestrator failed, try rule-based fallback
          console.log('⚠️ AI Orchestrator failed, trying rule-based fallback');
          return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness, selectedObject);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ AI execution failed:', errorMessage);
        setLastError(errorMessage);

        // Try rule-based fallback
        return executeRuleBased(prompt, context, setColor, setRoughness, setMetalness, selectedObject);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedObject, getMaterialContext, getAgent, setColor, setRoughness, setMetalness]
  );

  return {
    executeMaterialCommand,
    isProcessing,
    lastError,
    lastAgent,
    getMaterialContext,
  };
}

/**
 * Execute parsed commands via SelectionContext
 * Now supports applyTexture for PBR materials
 */
async function executeCommands(
  commands: MaterialCommand[],
  category: MaterialCategory,
  setColor: (hex: number) => void,
  setRoughness: (value: number) => void,
  setMetalness: (value: number) => void,
  selectedObject: any
) {
  const THREE = await import('three');
  const textureLoader = new THREE.TextureLoader();

  for (const cmd of commands) {
    const action = cmd.action;
    const params = cmd.params || {};

    switch (action) {
      case 'applyTexture':
        if (params.category && params.material) {
          console.log(`🖼️ AI: Applying texture ${params.category}/${params.material}`);
          await applyPBRTexture(
            params.category,
            params.material,
            selectedObject,
            THREE,
            textureLoader,
            setRoughness,
            setMetalness
          );
        }
        break;

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

      case 'setTextureRepeat':
        if (params.x !== undefined && params.y !== undefined && selectedObject) {
          selectedObject.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              if (mat.map) {
                mat.map.repeat.set(params.x, params.y);
                mat.map.needsUpdate = true;
              }
              if (mat.normalMap) {
                mat.normalMap.repeat.set(params.x, params.y);
                mat.normalMap.needsUpdate = true;
              }
              if (mat.roughnessMap) {
                mat.roughnessMap.repeat.set(params.x, params.y);
                mat.roughnessMap.needsUpdate = true;
              }
            }
          });
          console.log(`📐 AI: Set texture repeat to ${params.x}x${params.y}`);
        }
        break;

      default:
        console.warn(`⚠️ Unknown action: ${action}`);
    }
  }
}

/**
 * Apply PBR textures from Supabase storage
 */
async function applyPBRTexture(
  category: string,
  material: string,
  selectedObject: any,
  THREE: any,
  textureLoader: any,
  setRoughness: (value: number) => void,
  setMetalness: (value: number) => void
) {
  // Get texture data from our available textures
  const categoryTextures = (AVAILABLE_PBR_TEXTURES as any)[category];
  if (!categoryTextures) {
    console.warn(`Category "${category}" not found`);
    return;
  }

  const textureData = categoryTextures[material];
  if (!textureData) {
    console.warn(`Material "${material}" not found in category "${category}"`);
    return;
  }

  // Load textures
  const loadTexture = (url: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      textureLoader.load(
        url,
        (texture: any) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(2, 2);
          resolve(texture);
        },
        undefined,
        () => resolve(null)
      );
    });
  };

  // For metals, we don't have texture maps, just color
  if (category === 'metal') {
    const colorHex = parseInt(textureData.defaultProps.color.replace('#', ''), 16);
    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mat = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          metalness: textureData.defaultProps.metalness,
          roughness: textureData.defaultProps.roughness,
          clearcoat: textureData.defaultProps.roughness < 0.2 ? 0.5 : 0,
          envMapIntensity: 1.5,
        });
        child.material = mat;
      }
    });
    setRoughness(textureData.defaultProps.roughness);
    setMetalness(textureData.defaultProps.metalness);
    console.log(`✅ Applied ${material} metal material`);
    return;
  }

  // Load PBR texture maps in parallel
  const [diffuseMap, normalMap, roughnessMap] = await Promise.all([
    textureData.diffuse ? loadTexture(textureData.diffuse) : Promise.resolve(null),
    textureData.normal ? loadTexture(textureData.normal) : Promise.resolve(null),
    textureData.roughness ? loadTexture(textureData.roughness) : Promise.resolve(null),
  ]);

  console.log(`📦 Loaded textures for ${material}:`, {
    diffuse: !!diffuseMap,
    normal: !!normalMap,
    roughness: !!roughnessMap,
  });

  // Apply to object
  selectedObject.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const materialParams: any = {
        color: diffuseMap ? 0xffffff : 0x808080,
        metalness: textureData.defaultProps.metalness,
        roughness: textureData.defaultProps.roughness,
        envMapIntensity: 1.0,
      };

      if (diffuseMap) materialParams.map = diffuseMap;
      if (normalMap) materialParams.normalMap = normalMap;
      if (roughnessMap) materialParams.roughnessMap = roughnessMap;

      const mat = new THREE.MeshPhysicalMaterial(materialParams);
      child.material = mat;

      // Ensure UV2 for AO
      if (child.geometry && !child.geometry.attributes.uv2) {
        child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
      }
    }
  });

  setRoughness(textureData.defaultProps.roughness);
  setMetalness(textureData.defaultProps.metalness);
  console.log(`✅ Applied ${material} texture from ${category} category`);
}

/**
 * Rule-based fallback for common material adjustments
 * Used when AI API is unavailable
 * Now supports texture application by keyword matching
 */
async function executeRuleBased(
  prompt: string,
  context: MaterialContext,
  setColor: (hex: number) => void,
  setRoughness: (value: number) => void,
  setMetalness: (value: number) => void,
  selectedObject: any
): Promise<ExecutionResult> {
  const lower = prompt.toLowerCase();
  const commands: MaterialCommand[] = [];
  const category = context.category || 'stone';
  let reasoning = '';

  // Check for texture requests first (higher priority)
  const textureMatch = findTextureByName(lower);
  if (textureMatch) {
    commands.push({
      action: 'applyTexture',
      params: { category: textureMatch.category, material: textureMatch.material }
    });
    reasoning = `Applying ${textureMatch.texture.name} texture (${textureMatch.texture.description})`;
  }

  // Wood texture requests
  if (!textureMatch && (lower.includes('wood') || lower.includes('wooden'))) {
    if (lower.includes('dark') || lower.includes('walnut')) {
      commands.push({ action: 'applyTexture', params: { category: 'wood', material: 'walnut' } });
      reasoning = 'Applying dark walnut wood texture';
    } else if (lower.includes('cherry') || lower.includes('red')) {
      commands.push({ action: 'applyTexture', params: { category: 'wood', material: 'cherry' } });
      reasoning = 'Applying cherry wood texture';
    } else {
      commands.push({ action: 'applyTexture', params: { category: 'wood', material: 'oak' } });
      reasoning = 'Applying oak wood texture';
    }
  }

  // Stone texture requests
  if (!textureMatch && (lower.includes('stone') || lower.includes('rock'))) {
    if (lower.includes('marble')) {
      commands.push({ action: 'applyTexture', params: { category: 'stone', material: 'marble' } });
      reasoning = 'Applying marble stone texture';
    } else if (lower.includes('concrete') || lower.includes('cement')) {
      commands.push({ action: 'applyTexture', params: { category: 'stone', material: 'concrete' } });
      reasoning = 'Applying concrete texture';
    } else {
      commands.push({ action: 'applyTexture', params: { category: 'stone', material: 'granite' } });
      reasoning = 'Applying granite stone texture';
    }
  }

  // Fabric texture requests
  if (!textureMatch && (lower.includes('fabric') || lower.includes('cloth') || lower.includes('textile'))) {
    if (lower.includes('leather')) {
      commands.push({ action: 'applyTexture', params: { category: 'fabric', material: 'leather' } });
      reasoning = 'Applying leather texture';
    } else if (lower.includes('denim') || lower.includes('jeans')) {
      commands.push({ action: 'applyTexture', params: { category: 'fabric', material: 'denim' } });
      reasoning = 'Applying denim texture';
    } else if (lower.includes('silk')) {
      commands.push({ action: 'applyTexture', params: { category: 'fabric', material: 'silk' } });
      reasoning = 'Applying silk texture';
    } else {
      commands.push({ action: 'applyTexture', params: { category: 'fabric', material: 'cotton' } });
      reasoning = 'Applying cotton fabric texture';
    }
  }

  // Roughness adjustments (only if no texture command was added)
  if (commands.length === 0) {
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
  }

  // Metalness adjustments
  if (lower.includes('metallic') || lower.includes('metal')) {
    const newValue = Math.min((context.currentMetalness || 0) + 0.2, 1.0);
    const clamped = clampToCategory(category, 'metalness', newValue);
    commands.push({ action: 'setMetalness', params: { value: clamped } });
    reasoning += reasoning ? '. Also increased metalness.' : `Increased metalness to ${clamped.toFixed(2)}`;
  }

  // Color adjustments (metal textures)
  if (lower.includes('golden') || lower.includes('gold')) {
    commands.push({ action: 'applyTexture', params: { category: 'metal', material: 'gold' } });
    reasoning = 'Applying gold metal material';
  } else if (lower.includes('copper')) {
    commands.push({ action: 'applyTexture', params: { category: 'metal', material: 'copper' } });
    reasoning = 'Applying copper metal material';
  } else if (lower.includes('bronze')) {
    commands.push({ action: 'setColor', params: { color: 0xCD7F32 } });
    reasoning += reasoning ? '. Applied bronze tint.' : 'Applied bronze tint';
  } else if (lower.includes('silver')) {
    commands.push({ action: 'applyTexture', params: { category: 'metal', material: 'silver' } });
    reasoning = 'Applying silver metal material';
  } else if (lower.includes('iron')) {
    commands.push({ action: 'applyTexture', params: { category: 'metal', material: 'iron' } });
    reasoning = 'Applying iron metal material';
  } else if (lower.includes('titanium')) {
    commands.push({ action: 'applyTexture', params: { category: 'metal', material: 'titanium' } });
    reasoning = 'Applying titanium metal material';
  } else if (lower.includes('darker')) {
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
      error: 'Could not understand the request. Try: "make it marble", "oak wood", "leather texture", "more brushed", "gold metal"',
    };
  }

  // Execute commands
  await executeCommands(commands, category, setColor, setRoughness, setMetalness, selectedObject);

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
