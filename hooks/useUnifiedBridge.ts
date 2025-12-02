/**
 * useUnifiedBridge - React hook for Unified Bisect Bridge
 *
 * Connects to the unified bridge server for real-time sync between:
 * - Blender Addon (3D scene source)
 * - Bisect Web Editor (React Three Fiber)
 * - AI Agents (GPT-4o, Gemini, Claude)
 *
 * Usage:
 *   const { connected, sceneState, sendTransform, sendAICommand } = useUnifiedBridge({
 *     sessionId: 'my-scene',
 *     onSceneState: (state) => console.log('Scene updated'),
 *   });
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ClientType = 'blender' | 'bisect' | 'ai';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number, number]; // xyzw quaternion
  scale: [number, number, number];
}

export interface SceneObject {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  parent?: string | null;
  visible?: boolean;
  material?: {
    name: string;
    color?: [number, number, number];
    roughness?: number;
    metalness?: number;
  };
}

export interface SceneMaterial {
  id: string;
  name: string;
  color?: [number, number, number];
  roughness?: number;
  metalness?: number;
}

export interface SceneState {
  objects: SceneObject[];
  materials: SceneMaterial[];
  lights: Array<{
    id: string;
    name: string;
    type: string;
    color: [number, number, number];
    energy: number;
  }>;
  cameras: Array<{
    id: string;
    name: string;
    lens: number;
  }>;
  selection: string[];
}

export interface SessionInfo {
  blender: number;
  bisect: number;
  ai: number;
  total: number;
}

export interface UnifiedBridgeOptions {
  serverUrl?: string;
  sessionId: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSceneState?: (state: SceneState) => void;
  onTransform?: (objectId: string, transform: Transform) => void;
  onObjectAdd?: (object: SceneObject) => void;
  onObjectDelete?: (objectId: string) => void;
  onObjectSelect?: (objectIds: string[]) => void;
  onMaterialAssign?: (objectId: string, materialId: string) => void;
  onMaterialUpdate?: (materialId: string, properties: Partial<SceneMaterial>) => void;
  onAICommand?: (command: string, options: Record<string, unknown>) => void;
  onAIResponse?: (response: unknown) => void;
  onSmartEditResult?: (result: unknown) => void;
  onClientJoined?: (clientType: ClientType, sessionInfo: SessionInfo) => void;
  onClientLeft?: (clientType: ClientType, sessionInfo: SessionInfo) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// Message Types (match unified-protocol.js)
// ============================================================================

const MessageType = {
  // Connection
  JOIN: 'join',
  LEAVE: 'leave',
  PING: 'ping',
  PONG: 'pong',

  // Scene sync
  SCENE_STATE: 'scene_state',
  SCENE_REQUEST: 'scene_request',

  // Object operations
  OBJECT_ADD: 'object_add',
  OBJECT_DELETE: 'object_delete',
  OBJECT_SELECT: 'object_select',
  OBJECT_RENAME: 'object_rename',

  // Transforms
  TRANSFORM: 'transform',
  TRANSFORM_BATCH: 'transform_batch',

  // Materials
  MATERIAL_ASSIGN: 'material_assign',
  MATERIAL_UPDATE: 'material_update',
  MATERIAL_CREATE: 'material_create',

  // Hierarchy
  HIERARCHY_UPDATE: 'hierarchy_update',

  // AI Operations
  AI_COMMAND: 'ai_command',
  AI_RESPONSE: 'ai_response',
  AI_EXECUTE: 'ai_execute',
  AI_VISION_REQUEST: 'ai_vision_request',
  AI_VISION_RESPONSE: 'ai_vision_response',
  SMART_EDIT: 'smart_edit',
  SMART_EDIT_RESULT: 'smart_edit_result',

  // Error
  ERROR: 'error',
} as const;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUnifiedBridge(options: UnifiedBridgeOptions) {
  const {
    serverUrl = 'ws://localhost:9877',
    sessionId,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onSceneState,
    onTransform,
    onObjectAdd,
    onObjectDelete,
    onObjectSelect,
    onMaterialAssign,
    onMaterialUpdate,
    onAICommand,
    onAIResponse,
    onSmartEditResult,
    onClientJoined,
    onClientLeft,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [sceneState, setSceneState] = useState<SceneState | null>(null);

  // -------------------------------------------------------------------------
  // Message Sending
  // -------------------------------------------------------------------------

  const sendMessage = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[UnifiedBridge] Cannot send - not connected');
      return false;
    }

    const message = JSON.stringify({
      type,
      sessionId,
      timestamp: Date.now(),
      payload,
    });

    wsRef.current.send(message);
    return true;
  }, [sessionId]);

  const sendTransform = useCallback((objectId: string, transform: Transform) => {
    return sendMessage(MessageType.TRANSFORM, {
      objectId,
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale,
    });
  }, [sendMessage]);

  const sendBatchTransform = useCallback((transforms: Array<{ objectId: string } & Transform>) => {
    return sendMessage(MessageType.TRANSFORM_BATCH, { transforms });
  }, [sendMessage]);

  const sendSelection = useCallback((objectIds: string[]) => {
    return sendMessage(MessageType.OBJECT_SELECT, { objectIds });
  }, [sendMessage]);

  const sendObjectAdd = useCallback((object: Partial<SceneObject>) => {
    return sendMessage(MessageType.OBJECT_ADD, object);
  }, [sendMessage]);

  const sendObjectDelete = useCallback((objectId: string) => {
    return sendMessage(MessageType.OBJECT_DELETE, { objectId });
  }, [sendMessage]);

  const sendMaterialAssign = useCallback((objectId: string, materialId: string) => {
    return sendMessage(MessageType.MATERIAL_ASSIGN, { objectId, materialId });
  }, [sendMessage]);

  const sendMaterialUpdate = useCallback((materialId: string, properties: Partial<SceneMaterial>) => {
    return sendMessage(MessageType.MATERIAL_UPDATE, { materialId, properties });
  }, [sendMessage]);

  const requestScene = useCallback(() => {
    return sendMessage(MessageType.SCENE_REQUEST, {});
  }, [sendMessage]);

  // AI Commands
  const sendAICommand = useCallback((command: string, aiOptions: {
    useVision?: boolean;
    useDebate?: boolean;
    model?: string;
    context?: Record<string, unknown>;
  } = {}) => {
    return sendMessage(MessageType.AI_COMMAND, {
      command,
      useVision: aiOptions.useVision || false,
      useDebate: aiOptions.useDebate || false,
      model: aiOptions.model || 'gpt-4o',
      context: aiOptions.context || {},
    });
  }, [sendMessage]);

  const sendSmartEdit = useCallback((command: string, editOptions: {
    useVision?: boolean;
    screenshot?: string;
    useDebate?: boolean;
    targetObjects?: string[];
  } = {}) => {
    return sendMessage(MessageType.SMART_EDIT, {
      command,
      useVision: editOptions.useVision || false,
      screenshot: editOptions.screenshot || null,
      useDebate: editOptions.useDebate || false,
      targetObjects: editOptions.targetObjects || null,
    });
  }, [sendMessage]);

  const sendVisionResponse = useCallback((screenshot: string, width: number, height: number) => {
    return sendMessage(MessageType.AI_VISION_RESPONSE, {
      screenshot,
      width,
      height,
    });
  }, [sendMessage]);

  // -------------------------------------------------------------------------
  // Message Handling
  // -------------------------------------------------------------------------

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      const { type, payload } = message;
      const senderType = payload?._senderType;

      // Skip messages from ourselves
      if (senderType === 'bisect') return;

      switch (type) {
        case 'joined':
          setClientId(payload.clientId);
          setSessionInfo(payload.sessionInfo);
          if (payload.sceneState?.objects?.length > 0) {
            setSceneState(payload.sceneState);
            onSceneState?.(payload.sceneState);
          }
          console.log(`[UnifiedBridge] Joined session: ${payload.sessionId}`);
          break;

        case MessageType.SCENE_STATE:
          setSceneState(payload);
          onSceneState?.(payload);
          break;

        case MessageType.TRANSFORM:
          onTransform?.(payload.objectId, {
            position: payload.position,
            rotation: payload.rotation,
            scale: payload.scale,
          });
          break;

        case MessageType.TRANSFORM_BATCH:
          payload.transforms?.forEach((t: { objectId: string; position: number[]; rotation: number[]; scale: number[] }) => {
            onTransform?.(t.objectId, {
              position: t.position as [number, number, number],
              rotation: t.rotation as [number, number, number, number],
              scale: t.scale as [number, number, number],
            });
          });
          break;

        case MessageType.OBJECT_ADD:
          onObjectAdd?.(payload as SceneObject);
          break;

        case MessageType.OBJECT_DELETE:
          onObjectDelete?.(payload.objectId);
          break;

        case MessageType.OBJECT_SELECT:
          onObjectSelect?.(payload.objectIds);
          break;

        case MessageType.MATERIAL_ASSIGN:
          onMaterialAssign?.(payload.objectId, payload.materialId);
          break;

        case MessageType.MATERIAL_UPDATE:
          onMaterialUpdate?.(payload.materialId, payload.properties);
          break;

        case MessageType.AI_COMMAND:
          onAICommand?.(payload.command, payload);
          break;

        case MessageType.AI_RESPONSE:
          onAIResponse?.(payload);
          break;

        case MessageType.SMART_EDIT_RESULT:
          onSmartEditResult?.(payload);
          break;

        case MessageType.AI_VISION_REQUEST:
          // Capture and send screenshot
          // This should be handled by the component using this hook
          console.log('[UnifiedBridge] Vision request received');
          break;

        case 'client_joined':
          setSessionInfo(payload.sessionInfo);
          onClientJoined?.(payload.clientType, payload.sessionInfo);
          break;

        case 'client_left':
          setSessionInfo(payload.sessionInfo);
          onClientLeft?.(payload.clientType, payload.sessionInfo);
          break;

        case MessageType.ERROR:
          console.error('[UnifiedBridge] Error:', payload.error);
          onError?.(payload.error);
          break;

        default:
          console.log(`[UnifiedBridge] Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error('[UnifiedBridge] Failed to parse message:', err);
    }
  }, [
    onSceneState, onTransform, onObjectAdd, onObjectDelete, onObjectSelect,
    onMaterialAssign, onMaterialUpdate, onAICommand, onAIResponse,
    onSmartEditResult, onClientJoined, onClientLeft, onError,
  ]);

  // -------------------------------------------------------------------------
  // Connection Management
  // -------------------------------------------------------------------------

  const connect = useCallback(() => {
    // Skip if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[UnifiedBridge] Already connected');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[UnifiedBridge] Already connecting...');
      return;
    }

    console.log(`[UnifiedBridge] Connecting to ${serverUrl}...`);

    const ws = new WebSocket(serverUrl);

    ws.onopen = () => {
      console.log('[UnifiedBridge] Connected');
      setConnected(true);
      reconnectAttemptsRef.current = 0;

      // Join session as Bisect client
      ws.send(JSON.stringify({
        type: MessageType.JOIN,
        sessionId,
        timestamp: Date.now(),
        payload: {
          sessionId,
          clientType: 'bisect',
        },
      }));

      onConnect?.();
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error('[UnifiedBridge] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[UnifiedBridge] Disconnected');
      setConnected(false);
      setClientId(null);
      wsRef.current = null;
      onDisconnect?.();

      // Auto-reconnect with exponential backoff
      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[UnifiedBridge] Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [serverUrl, sessionId, handleMessage, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 5; // Prevent auto-reconnect

    if (wsRef.current) {
      sendMessage(MessageType.LEAVE, {});
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
    setClientId(null);
    setSessionInfo(null);
  }, [sendMessage]);

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  // Use a ref to track if we've already initiated connection
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    // Only connect once per mount, not on every dependency change
    if (autoConnect && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }

    // Handle page unload to properly close connection
    const handleBeforeUnload = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Page unload');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      hasConnectedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // Only re-run if autoConnect changes

  // -------------------------------------------------------------------------
  // Return API
  // -------------------------------------------------------------------------

  return {
    // State
    connected,
    clientId,
    sessionInfo,
    sceneState,

    // Connection
    connect,
    disconnect,

    // Scene
    requestScene,

    // Transforms
    sendTransform,
    sendBatchTransform,

    // Selection
    sendSelection,

    // Objects
    sendObjectAdd,
    sendObjectDelete,

    // Materials
    sendMaterialAssign,
    sendMaterialUpdate,

    // AI
    sendAICommand,
    sendSmartEdit,
    sendVisionResponse,

    // Raw send
    sendMessage,
  };
}

export default useUnifiedBridge;
