/**
 * MCP Bridge Handler
 *
 * Runs in the browser (Next.js client) and handles bidirectional
 * communication between the MCP server and the Bisect editor.
 *
 * This bridges the gap between MCP tools and the AI stack.
 *
 * Updated to use Unified Bridge (port 9877) for:
 * - Blender Addon sync
 * - AI Agent orchestration (Gemini 3, GPT-4o, Claude 4.5)
 * - Real-time scene state synchronization
 *
 * NOTE: This module should only be dynamically imported in browser context.
 */

import type { WebGLRenderer, Scene, Object3D } from 'three';

// Lazy imports for AI modules (loaded in init())
let MultiModelRouter: typeof import('@/lib/core/ai/multi-model-router').MultiModelRouter;
let SceneGraphBuilder: typeof import('@/lib/core/ai/scene-graph-builder').SceneGraphBuilder;
let MaterialAgent: typeof import('@/lib/core/ai/material-agent').MaterialAgent;
let GeminiSpatialAgent: typeof import('@/lib/core/ai/gemini-spatial-agent').GeminiSpatialAgent;
let ClaudeBlenderAgent: typeof import('@/lib/core/ai/claude-blender-agent').ClaudeBlenderAgent;
type SemanticSceneGraph = import('@/lib/core/ai/scene-graph-builder').SemanticSceneGraph;

// Unified bridge port (shared with Blender Addon and AI agents)
const UNIFIED_BRIDGE_PORT = 9877;

// Protocol types (unified protocol - mirrors bridge-server/unified-protocol.js)
const MessageType = {
  // Legacy types (uppercase for backwards compat)
  REQUEST: 'REQUEST',
  RESPONSE: 'RESPONSE',
  CLI_COMMAND: 'CLI_COMMAND',

  // Unified bridge types (lowercase to match unified-protocol.js)
  JOIN: 'join',
  LEAVE: 'leave',
  SCENE_STATE: 'scene_state',
  SCENE_REQUEST: 'scene_request',
  OBJECT_SELECT: 'object_select',
  TRANSFORM: 'transform',

  // AI Orchestration types (Gemini routes, specialists execute)
  AI_ROUTE: 'ai_route',
  AI_ROUTE_RESULT: 'ai_route_result',
  AI_SPECIALIST_EXECUTE: 'ai_specialist_execute',
  AI_SPECIALIST_RESULT: 'ai_specialist_result',

  // AI Debate types (multi-model reasoning)
  AI_DEBATE_START: 'ai_debate_start',
  AI_DEBATE_PROPOSAL: 'ai_debate_proposal',
  AI_DEBATE_ROUND: 'ai_debate_round',
  AI_DEBATE_RESULT: 'ai_debate_result',
} as const;

const OperationType = {
  SMART_EDIT: 'SMART_EDIT',
  GET_SCENE_GRAPH: 'GET_SCENE_GRAPH',
  GET_SCREENSHOT: 'GET_SCREENSHOT',
  GET_SELECTED_OBJECT: 'GET_SELECTED_OBJECT',
} as const;

interface MCPRequest {
  id: string;
  type: typeof MessageType.REQUEST;
  operation: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

interface MCPResponse {
  id: string;
  type: typeof MessageType.RESPONSE;
  success: boolean;
  data: unknown;
  error: string | null;
  timestamp: number;
}

interface LegacyCommand {
  type: string;
  payload?: Record<string, unknown>;
}

interface LegacyMessage {
  type: typeof MessageType.CLI_COMMAND;
  command: LegacyCommand;
}

// Unified protocol message interfaces
interface UnifiedMeta {
  sessionId: string;
  source?: string;
  timestamp: number;
}

interface UnifiedMessage {
  type: string;
  payload: Record<string, unknown>;
  meta: UnifiedMeta;
}

interface SceneStateMessage extends UnifiedMessage {
  type: 'scene_state';
  payload: {
    objects: Array<{
      id: string;
      name: string;
      type: string;
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }>;
    activeObject?: string;
  };
}

interface AIRouteResultMessage extends UnifiedMessage {
  type: 'ai_route_result';
  payload: {
    selectedAgent: 'gpt4o' | 'gemini' | 'claude';
    reason: string;
    confidence: number;
    needsDebate: boolean;
    sceneAnalysis?: Record<string, unknown>;
  };
}

interface AISpecialistResultMessage extends UnifiedMessage {
  type: 'ai_specialist_result';
  payload: {
    specialist: string;
    success: boolean;
    plan?: Record<string, unknown>;
    error?: string;
    tokensUsed?: number;
  };
}

type MCPMessage = MCPRequest | LegacyMessage | UnifiedMessage;

// Scene context interface
interface SceneContext {
  scene: Scene | null;
  renderer: WebGLRenderer | null;
  selectedObject: Object3D | null;
  addedObjects: Array<{
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    color: string;
  }>;
}

// Callbacks for legacy commands
interface LegacyCallbacks {
  onAddObject?: (type: string) => void;
  onUpdateObject?: (updates: Record<string, unknown>) => void;
  onAddEvent?: (trigger: string, action: string) => void;
  onApplyModifier?: (type: string, value?: number) => void;
  onImportAsset?: (url: string, format?: string) => void;
  onPlayAnimation?: (name: string, speed: number) => void;
}

/**
 * MCP Bridge Handler Singleton
 */
class MCPBridgeHandler {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;

  // Scene context (set by React components)
  private sceneContext: SceneContext = {
    scene: null,
    renderer: null,
    selectedObject: null,
    addedObjects: [],
  };

  // AI Router (type set dynamically after import)
  private aiRouter: InstanceType<typeof import('@/lib/core/ai/multi-model-router').MultiModelRouter> | null = null;

  // Legacy command callbacks
  private legacyCallbacks: LegacyCallbacks = {};

  // Event listeners
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Initialize the bridge handler
   */
  async init(options?: { openaiApiKey?: string }): Promise<void> {
    // Dynamically import AI modules (avoids SSR issues)
    const [routerMod, graphMod, materialMod] = await Promise.all([
      import('@/lib/core/ai/multi-model-router'),
      import('@/lib/core/ai/scene-graph-builder'),
      import('@/lib/core/ai/material-agent'),
    ]);
    MultiModelRouter = routerMod.MultiModelRouter;
    SceneGraphBuilder = graphMod.SceneGraphBuilder;
    MaterialAgent = materialMod.MaterialAgent;

    // Initialize AI Router if API key is available
    const apiKey = options?.openaiApiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (apiKey) {
      this.aiRouter = new MultiModelRouter(apiKey);

      // Register the Material Agent as default
      const materialAgent = new MaterialAgent(apiKey);
      this.aiRouter.registerAgent(materialAgent, true);

      console.log('[MCP Bridge] AI Router initialized with Material Agent');
    } else {
      console.warn('[MCP Bridge] No OpenAI API key - AI features disabled');
    }

    // Connect to WebSocket bridge
    this.connect();
  }

  /**
   * Connect to the WebSocket bridge
   */
  private connect(): void {
    if (typeof window === 'undefined') {
      console.warn('[MCP Bridge] Not in browser environment');
      return;
    }

    const bridgeUrl = `ws://localhost:${UNIFIED_BRIDGE_PORT}`;
    console.log(`[MCP Bridge] Connecting to unified bridge at ${bridgeUrl}...`);

    try {
      this.socket = new WebSocket(bridgeUrl);

      this.socket.onopen = () => {
        console.log('[MCP Bridge] Connected to unified bridge');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Register with unified bridge as 'bisect' client type
        // Uses unified protocol join message (lowercase)
        const joinMessage = {
          type: 'join',
          payload: {
            clientType: 'bisect',
            clientId: `bisect-web-${Date.now()}`,
            capabilities: ['scene', 'materials', 'ai'],
          },
          meta: {
            sessionId: 'my-scene',
            timestamp: Date.now(),
          },
        };
        this.socket?.send(JSON.stringify(joinMessage));
        console.log('[MCP Bridge] Joined unified bridge as bisect client (session: my-scene)');

        this.emit('connected', {});
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error('[MCP Bridge] WebSocket error:', error);
        this.emit('error', error);
      };

      this.socket.onclose = () => {
        console.log('[MCP Bridge] Disconnected from bridge');
        this.isConnected = false;
        this.emit('disconnected', {});
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[MCP Bridge] Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[MCP Bridge] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[MCP Bridge] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Handle incoming messages from the bridge
   */
  private async handleMessage(data: string): Promise<void> {
    let message: MCPMessage;

    try {
      message = JSON.parse(data);
    } catch (error) {
      console.error('[MCP Bridge] Failed to parse message:', error);
      return;
    }

    const messageType = message.type;
    console.log('[MCP Bridge] Received:', messageType, (message as MCPRequest).operation || '');

    // Handle request-response messages (legacy)
    if (messageType === MessageType.REQUEST) {
      const request = message as MCPRequest;
      await this.handleRequest(request);
      return;
    }

    // Handle legacy CLI_COMMAND messages
    if (messageType === MessageType.CLI_COMMAND) {
      const legacyMessage = message as LegacyMessage;
      this.handleLegacyCommand(legacyMessage.command);
      return;
    }

    // Handle unified protocol messages
    switch (messageType) {
      case MessageType.SCENE_STATE:
        // Scene state from Blender - update local scene context
        this.handleSceneState(message as SceneStateMessage);
        break;

      case MessageType.OBJECT_SELECT:
        // Object selection from Blender
        this.handleObjectUpdate(message as UnifiedMessage);
        break;

      case MessageType.TRANSFORM:
        // Transform update from Blender
        this.handleObjectUpdate(message as UnifiedMessage);
        break;

      case MessageType.AI_ROUTE_RESULT:
        // Gemini orchestrator routing result
        this.emit('ai-route-result', (message as AIRouteResultMessage).payload);
        break;

      case MessageType.AI_SPECIALIST_EXECUTE:
        // Request to execute in Bisect (from AI agent)
        await this.handleSpecialistExecute(message as UnifiedMessage);
        break;

      case MessageType.AI_SPECIALIST_RESULT:
        // Specialist execution result (from Claude/Blender)
        this.emit('ai-specialist-result', (message as AISpecialistResultMessage).payload);
        break;

      case MessageType.AI_DEBATE_START:
      case MessageType.AI_DEBATE_PROPOSAL:
      case MessageType.AI_DEBATE_ROUND:
      case MessageType.AI_DEBATE_RESULT:
        // Debate mode messages - emit to UI
        this.emit('ai-debate', { type: messageType, payload: (message as UnifiedMessage).payload });
        break;

      default:
        console.log('[MCP Bridge] Unhandled message type:', messageType);
    }
  }

  /**
   * Handle scene state updates from Blender
   */
  private handleSceneState(message: SceneStateMessage): void {
    console.log('[MCP Bridge] Scene state from Blender:', message.payload.objects?.length, 'objects');
    this.emit('scene-state', message.payload);
  }

  /**
   * Handle object updates from Blender
   */
  private handleObjectUpdate(message: UnifiedMessage): void {
    console.log('[MCP Bridge] Object update from Blender:', message.payload);
    this.emit('object-update', message.payload);
  }

  /**
   * Handle specialist execute request (AI agent wants Bisect to do something)
   */
  private async handleSpecialistExecute(message: UnifiedMessage): Promise<void> {
    const { specialist, command, plan } = message.payload as {
      specialist: string;
      command: string;
      plan?: Record<string, unknown>;
    };

    console.log(`[MCP Bridge] Specialist execute request from ${specialist}:`, command);

    // Emit for UI handling (React components will execute)
    this.emit('specialist-execute', { specialist, command, plan });

    // If this is for materials/scene editing, route through AI
    if (specialist === 'gpt4o' && plan) {
      // Execute material commands locally
      this.emit('execute-plan', plan);
    }
  }

  /**
   * Handle new request-response messages
   */
  private async handleRequest(request: MCPRequest): Promise<void> {
    let response: MCPResponse;

    try {
      let data: unknown;

      switch (request.operation) {
        case OperationType.SMART_EDIT:
          data = await this.handleSmartEdit(request.payload);
          break;

        case OperationType.GET_SCENE_GRAPH:
          data = this.handleGetSceneGraph();
          break;

        case OperationType.GET_SCREENSHOT:
          data = this.handleGetScreenshot();
          break;

        case OperationType.GET_SELECTED_OBJECT:
          data = this.handleGetSelectedObject();
          break;

        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }

      response = {
        id: request.id,
        type: MessageType.RESPONSE,
        success: true,
        data,
        error: null,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[MCP Bridge] Error handling ${request.operation}:`, error);
      response = {
        id: request.id,
        type: MessageType.RESPONSE,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }

    this.sendResponse(response);
  }

  /**
   * Handle SMART_EDIT operation - Route to AI stack
   */
  private async handleSmartEdit(
    payload: Record<string, unknown>
  ): Promise<{ plan: unknown; tokensUsed: number; cost: unknown; usedVision: boolean; usedDebate: boolean }> {
    const {
      command,
      useVision,
      screenshot: providedScreenshot,
      useDebate,
    } = payload as {
      command: string;
      useVision?: boolean;
      screenshot?: string;
      useDebate?: boolean;
    };

    if (!this.aiRouter) {
      throw new Error('AI Router not initialized - missing OpenAI API key');
    }

    // Build context for AI
    const context: {
      sceneData?: { objects: Array<unknown> };
      screenshot?: string;
      useDebate?: boolean;
    } = {};

    // Add scene data
    if (this.sceneContext.scene) {
      context.sceneData = this.extractSceneData();
    }

    // Add screenshot - prefer provided screenshot, otherwise capture if vision requested
    let usedVision = false;
    if (providedScreenshot) {
      // Screenshot was pre-captured by MCP server
      context.screenshot = providedScreenshot;
      usedVision = true;
      console.log('[MCP Bridge] Using pre-captured screenshot for vision');
    } else if (useVision && this.sceneContext.renderer) {
      // Capture screenshot locally
      const screenshot = this.captureScreenshot();
      if (screenshot) {
        context.screenshot = screenshot.base64;
        usedVision = true;
        console.log('[MCP Bridge] Captured local screenshot for vision');
      }
    }

    // Enable debate mode for complex commands
    context.useDebate = useDebate || false;

    // Route command through AI
    const result = await this.aiRouter.routeAndExecute(command, context);

    // Handle both success and error results
    if (result.success) {
      return {
        plan: result.plan,
        tokensUsed: result.tokensUsed || 0,
        cost: result.cost || { inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: '0' },
        usedVision,
        usedDebate: useDebate || false,
      };
    } else {
      // Return fallback plan for error case
      return {
        plan: result.fallback,
        tokensUsed: 0,
        cost: { inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: '0' },
        usedVision,
        usedDebate: useDebate || false,
      };
    }
  }

  /**
   * Handle GET_SCENE_GRAPH operation
   */
  private handleGetSceneGraph(): SemanticSceneGraph {
    const sceneData = this.extractSceneData();
    return SceneGraphBuilder.buildGraph(sceneData);
  }

  /**
   * Handle GET_SCREENSHOT operation
   */
  private handleGetScreenshot(): { base64: string; width: number; height: number } {
    const result = this.captureScreenshot();
    if (!result) {
      throw new Error('No renderer available for screenshot');
    }
    return result;
  }

  /**
   * Handle GET_SELECTED_OBJECT operation
   */
  private handleGetSelectedObject(): {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    material: unknown;
    bounds: unknown;
  } | null {
    const obj = this.sceneContext.selectedObject;
    if (!obj) {
      return null;
    }

    // Extract material info
    let material: unknown = null;
    const mesh = obj as unknown as { isMesh?: boolean; material?: unknown };
    if (mesh.isMesh && mesh.material) {
      const mat = mesh.material as {
        color?: { getHex: () => number };
        roughness?: number;
        metalness?: number;
      };
      material = {
        color: mat.color?.getHex(),
        roughness: mat.roughness,
        metalness: mat.metalness,
      };
    }

    // Calculate bounds
    let bounds: unknown = null;
    try {
      const { Box3 } = require('three');
      const box = new Box3().setFromObject(obj);
      bounds = {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      };
    } catch {
      // Bounds calculation failed
    }

    return {
      id: obj.uuid,
      name: obj.name || 'Unnamed',
      type: obj.type,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      material,
      bounds,
    };
  }

  /**
   * Extract scene data for AI context
   */
  private extractSceneData(): { objects: Array<unknown> } {
    const objects: Array<unknown> = [];

    // Add objects from R3F scene
    if (this.sceneContext.scene) {
      this.sceneContext.scene.traverse((child: Object3D) => {
        // Skip lights, cameras, helpers
        const mesh = child as unknown as { isMesh?: boolean };
        if (!mesh.isMesh) return;

        objects.push({
          uuid: child.uuid,
          id: child.uuid,
          name: child.name || child.type,
          type: child.type,
          position: {
            x: child.position.x,
            y: child.position.y,
            z: child.position.z,
          },
        });
      });
    }

    // Add user-added objects
    for (const obj of this.sceneContext.addedObjects) {
      objects.push({
        uuid: obj.id,
        id: obj.id,
        name: obj.name,
        type: obj.type,
        position: {
          x: obj.position[0],
          y: obj.position[1],
          z: obj.position[2],
        },
      });
    }

    return { objects };
  }

  /**
   * Capture viewport screenshot
   */
  private captureScreenshot(): { base64: string; width: number; height: number } | null {
    const renderer = this.sceneContext.renderer;
    if (!renderer) {
      return null;
    }

    try {
      const dataUrl = renderer.domElement.toDataURL('image/png');
      // Remove data URL prefix to get just base64
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

      return {
        base64,
        width: renderer.domElement.width,
        height: renderer.domElement.height,
      };
    } catch (error) {
      console.error('[MCP Bridge] Screenshot capture failed:', error);
      return null;
    }
  }

  /**
   * Handle legacy CLI_COMMAND messages (fire-and-forget)
   */
  private handleLegacyCommand(command: LegacyCommand): void {
    console.log('[MCP Bridge] Legacy command:', command.type);
    this.emit('legacy-command', command);

    switch (command.type) {
      case 'ADD_OBJECT':
        this.legacyCallbacks.onAddObject?.(command.payload?.type as string);
        break;

      case 'UPDATE_OBJECT':
        this.legacyCallbacks.onUpdateObject?.(command.payload || {});
        break;

      case 'ADD_EVENT':
        this.legacyCallbacks.onAddEvent?.(
          command.payload?.trigger as string,
          command.payload?.action as string
        );
        break;

      case 'APPLY_MODIFIER':
        this.legacyCallbacks.onApplyModifier?.(
          command.payload?.type as string,
          command.payload?.value as number | undefined
        );
        break;

      case 'IMPORT_ASSET':
        this.legacyCallbacks.onImportAsset?.(
          command.payload?.url as string,
          command.payload?.format as string | undefined
        );
        break;

      case 'PLAY_ANIMATION':
        this.legacyCallbacks.onPlayAnimation?.(
          command.payload?.name as string,
          (command.payload?.speed as number) || 1
        );
        break;

      case 'GET_SCENE_TREE':
        // Handle legacy scene tree request by sending a response
        // (This is for backwards compatibility)
        const sceneGraph = this.handleGetSceneGraph();
        console.log('[MCP Bridge] Scene tree (legacy):', sceneGraph);
        break;

      default:
        console.warn('[MCP Bridge] Unknown legacy command:', command.type);
    }
  }

  /**
   * Send response back to MCP server
   */
  private sendResponse(response: MCPResponse): void {
    if (!this.socket || !this.isConnected) {
      console.error('[MCP Bridge] Cannot send response - not connected');
      return;
    }

    const message = JSON.stringify(response);
    console.log('[MCP Bridge] Sending response:', response.id, response.success);
    this.socket.send(message);
  }

  /**
   * Send AI routing request through unified bridge
   * Gemini 3 will analyze and route to the appropriate specialist
   */
  requestAIRoute(command: string, options?: {
    screenshot?: string;
    forceDebate?: boolean;
  }): void {
    if (!this.socket || !this.isConnected) {
      console.error('[MCP Bridge] Cannot request AI route - not connected');
      return;
    }

    const message = {
      type: MessageType.AI_ROUTE,
      payload: {
        command,
        screenshot: options?.screenshot,
        forceDebate: options?.forceDebate || false,
        sceneContext: this.extractSceneData(),
      },
      meta: {
        sessionId: 'my-scene',
        source: 'bisect',
        timestamp: Date.now(),
      },
    };

    console.log('[MCP Bridge] Requesting AI route for:', command);
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Sync local scene state to the unified bridge
   * This allows Blender and other clients to see the current state
   */
  syncSceneState(): void {
    if (!this.socket || !this.isConnected) {
      console.error('[MCP Bridge] Cannot sync scene - not connected');
      return;
    }

    const sceneData = this.extractSceneData();
    const message = {
      type: MessageType.SCENE_STATE,
      payload: {
        objects: sceneData.objects,
        activeObject: this.sceneContext.selectedObject?.uuid,
      },
      meta: {
        sessionId: 'my-scene',
        source: 'bisect',
        timestamp: Date.now(),
      },
    };

    console.log('[MCP Bridge] Syncing scene state:', sceneData.objects.length, 'objects');
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Request scene state from Blender
   */
  requestBlenderScene(): void {
    if (!this.socket || !this.isConnected) {
      console.error('[MCP Bridge] Cannot request Blender scene - not connected');
      return;
    }

    const message = {
      type: MessageType.SCENE_REQUEST,
      payload: {},
      meta: {
        sessionId: 'my-scene',
        source: 'bisect',
        timestamp: Date.now(),
      },
    };

    console.log('[MCP Bridge] Requesting Blender scene');
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Set scene context (called by React components)
   */
  setSceneContext(context: Partial<SceneContext>): void {
    this.sceneContext = { ...this.sceneContext, ...context };
    console.log('[MCP Bridge] Scene context updated');
  }

  /**
   * Set legacy command callbacks
   */
  setLegacyCallbacks(callbacks: LegacyCallbacks): void {
    this.legacyCallbacks = { ...this.legacyCallbacks, ...callbacks };
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from bridge
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

// Lazy singleton instance (only created on first access in browser)
let _mcpBridgeHandler: MCPBridgeHandler | null = null;

export function getMCPBridgeHandler(): MCPBridgeHandler {
  if (typeof window === 'undefined') {
    throw new Error('MCPBridgeHandler can only be used in browser environment');
  }
  if (!_mcpBridgeHandler) {
    _mcpBridgeHandler = new MCPBridgeHandler();
  }
  return _mcpBridgeHandler;
}

// For backwards compatibility - getter that returns the singleton
export const mcpBridgeHandler = {
  get instance() {
    return getMCPBridgeHandler();
  },
  init: (options?: { openaiApiKey?: string }) => getMCPBridgeHandler().init(options),
  disconnect: () => _mcpBridgeHandler?.disconnect(),
  setSceneContext: (context: Partial<SceneContext>) => getMCPBridgeHandler().setSceneContext(context),
  setLegacyCallbacks: (callbacks: LegacyCallbacks) => getMCPBridgeHandler().setLegacyCallbacks(callbacks),
  on: (event: string, callback: (data: unknown) => void) => getMCPBridgeHandler().on(event, callback),
  off: (event: string, callback: (data: unknown) => void) => getMCPBridgeHandler().off(event, callback),
  get connected() { return _mcpBridgeHandler?.connected ?? false; },

  // New unified bridge methods
  requestAIRoute: (command: string, options?: { screenshot?: string; forceDebate?: boolean }) =>
    getMCPBridgeHandler().requestAIRoute(command, options),
  syncSceneState: () => getMCPBridgeHandler().syncSceneState(),
  requestBlenderScene: () => getMCPBridgeHandler().requestBlenderScene(),
};

// Convenience init function
export function initMCPBridge(options?: { openaiApiKey?: string }): Promise<void> {
  return getMCPBridgeHandler().init(options);
}

// Export types
export type { SceneContext, LegacyCallbacks, MCPRequest, MCPResponse };
