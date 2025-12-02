/**
 * useBlenderSync - React hook for Blender ↔ Bisect synchronization
 *
 * Connects to the Bisect Bridge Server via WebSocket and provides
 * real-time sync between Blender and the Bisect 3D editor.
 *
 * Usage:
 *   const { connect, disconnect, isConnected, sendTransform } = useBlenderSync({
 *     onTransform: (objectId, transform) => { ... },
 *     onSceneState: (objects) => { ... },
 *   });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Message types (must match protocol.js and blender addon)
export const MessageType = {
  JOIN: 'join',
  LEAVE: 'leave',
  PING: 'ping',
  PONG: 'pong',
  SCENE_STATE: 'scene_state',
  SCENE_REQUEST: 'scene_request',
  TRANSFORM: 'transform',
  TRANSFORM_BATCH: 'transform_batch',
  OBJECT_ADD: 'object_add',
  OBJECT_DELETE: 'object_delete',
  OBJECT_SELECT: 'object_select',
  MATERIAL_ASSIGN: 'material_assign',
  MATERIAL_UPDATE: 'material_update',
  HIERARCHY_UPDATE: 'hierarchy_update',
  ERROR: 'error',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

// Transform data structure
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion [x, y, z, w]
  scale: [number, number, number];
}

// Scene object from Blender
export interface SceneObject {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  parent?: string | null;
}

// Message structure
export interface BridgeMessage {
  type: MessageTypeValue | string; // string for server responses like 'joined', 'client_joined', etc.
  sessionId: string | null;
  timestamp: number;
  payload: Record<string, unknown>;
}

// Hook options
export interface UseBlenderSyncOptions {
  serverUrl?: string;
  sessionId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;

  // Callbacks
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event | Error) => void;
  onTransform?: (objectId: string, transform: Transform) => void;
  onTransformBatch?: (transforms: Array<{ objectId: string } & Transform>) => void;
  onSceneState?: (objects: SceneObject[]) => void;
  onObjectAdd?: (object: SceneObject) => void;
  onObjectDelete?: (objectId: string) => void;
  onObjectSelect?: (objectIds: string[]) => void;
  onMaterialAssign?: (objectId: string, materialId: string) => void;
  onClientJoined?: (clientType: string) => void;
  onClientLeft?: (clientType: string) => void;
}

export interface UseBlenderSyncReturn {
  // State
  isConnected: boolean;
  sessionId: string | null;
  sessionInfo: { blender: number; bisect: number } | null;

  // Actions
  connect: (sessionId?: string) => void;
  disconnect: () => void;

  // Send messages
  sendTransform: (objectId: string, transform: Transform) => void;
  sendTransformBatch: (transforms: Array<{ objectId: string } & Transform>) => void;
  sendSelection: (objectIds: string[]) => void;
  sendMaterialAssign: (objectId: string, materialId: string) => void;
  requestSceneState: () => void;

  // Raw send (for custom messages)
  send: (type: MessageTypeValue, payload: Record<string, unknown>) => void;
}

export function useBlenderSync(options: UseBlenderSyncOptions = {}): UseBlenderSyncReturn {
  const {
    serverUrl = 'ws://localhost:9876',
    sessionId: initialSessionId = 'default',
    autoReconnect = true,
    reconnectInterval = 3000,
    onConnect,
    onDisconnect,
    onError,
    onTransform,
    onTransformBatch,
    onSceneState,
    onObjectAdd,
    onObjectDelete,
    onObjectSelect,
    onMaterialAssign,
    onClientJoined,
    onClientLeft,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ blender: number; bisect: number } | null>(null);

  // Create protocol message
  const createMessage = useCallback(
    (type: MessageTypeValue, payload: Record<string, unknown> = {}): string => {
      return JSON.stringify({
        type,
        sessionId,
        timestamp: Date.now(),
        payload,
      });
    },
    [sessionId]
  );

  // Send message
  const send = useCallback(
    (type: MessageTypeValue, payload: Record<string, unknown> = {}) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(createMessage(type, payload));
      }
    },
    [createMessage]
  );

  // Send transform update
  const sendTransform = useCallback(
    (objectId: string, transform: Transform) => {
      send(MessageType.TRANSFORM, {
        objectId,
        ...transform,
      });
    },
    [send]
  );

  // Send batch transform update
  const sendTransformBatch = useCallback(
    (transforms: Array<{ objectId: string } & Transform>) => {
      send(MessageType.TRANSFORM_BATCH, { transforms });
    },
    [send]
  );

  // Send selection
  const sendSelection = useCallback(
    (objectIds: string[]) => {
      send(MessageType.OBJECT_SELECT, { objectIds });
    },
    [send]
  );

  // Send material assignment
  const sendMaterialAssign = useCallback(
    (objectId: string, materialId: string) => {
      send(MessageType.MATERIAL_ASSIGN, { objectId, materialId });
    },
    [send]
  );

  // Request scene state from Blender
  const requestSceneState = useCallback(() => {
    send(MessageType.SCENE_REQUEST, {});
  }, [send]);

  // Handle incoming message
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: BridgeMessage = JSON.parse(event.data);
        const { type, payload } = message;

        // Handle server responses that aren't in MessageType
        if (type === 'joined') {
          setSessionId(payload.sessionId as string);
          setSessionInfo(payload.sessionInfo as { blender: number; bisect: number });
          onConnect?.();
          return;
        }

        if (type === 'client_joined') {
          setSessionInfo(payload.sessionInfo as { blender: number; bisect: number });
          onClientJoined?.(payload.clientType as string);
          return;
        }

        if (type === 'client_left') {
          setSessionInfo(payload.sessionInfo as { blender: number; bisect: number });
          onClientLeft?.(payload.clientType as string);
          return;
        }

        switch (type) {

          case MessageType.TRANSFORM:
            onTransform?.(payload.objectId as string, {
              position: payload.position as [number, number, number],
              rotation: payload.rotation as [number, number, number, number],
              scale: payload.scale as [number, number, number],
            });
            break;

          case MessageType.TRANSFORM_BATCH:
            onTransformBatch?.(
              payload.transforms as Array<{ objectId: string } & Transform>
            );
            break;

          case MessageType.SCENE_STATE:
            onSceneState?.(payload.objects as SceneObject[]);
            break;

          case MessageType.OBJECT_ADD:
            onObjectAdd?.(payload as unknown as SceneObject);
            break;

          case MessageType.OBJECT_DELETE:
            onObjectDelete?.(payload.objectId as string);
            break;

          case MessageType.OBJECT_SELECT:
            onObjectSelect?.(payload.objectIds as string[]);
            break;

          case MessageType.MATERIAL_ASSIGN:
            onMaterialAssign?.(
              payload.objectId as string,
              payload.materialId as string
            );
            break;

          case MessageType.PONG:
            // Keep-alive response, no action needed
            break;

          case MessageType.ERROR:
            console.error('[BlenderSync] Server error:', payload.error);
            break;
        }
      } catch (error) {
        console.error('[BlenderSync] Failed to parse message:', error);
      }
    },
    [
      onConnect,
      onTransform,
      onTransformBatch,
      onSceneState,
      onObjectAdd,
      onObjectDelete,
      onObjectSelect,
      onMaterialAssign,
      onClientJoined,
      onClientLeft,
    ]
  );

  // Connect to bridge server
  const connect = useCallback(
    (customSessionId?: string) => {
      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const targetSessionId = customSessionId || initialSessionId;
      console.log(`[BlenderSync] Connecting to ${serverUrl} (session: ${targetSessionId})`);

      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[BlenderSync] Connected');
        setIsConnected(true);

        // Join session
        ws.send(
          JSON.stringify({
            type: MessageType.JOIN,
            timestamp: Date.now(),
            payload: {
              sessionId: targetSessionId,
              clientType: 'bisect',
            },
          })
        );

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: MessageType.PING, timestamp: Date.now() }));
          }
        }, 30000);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('[BlenderSync] WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('[BlenderSync] Disconnected');
        setIsConnected(false);
        setSessionId(null);
        setSessionInfo(null);
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[BlenderSync] Attempting reconnect...');
            connect(targetSessionId);
          }, reconnectInterval);
        }
      };
    },
    [
      serverUrl,
      initialSessionId,
      autoReconnect,
      reconnectInterval,
      handleMessage,
      onError,
      onDisconnect,
    ]
  );

  // Disconnect from bridge server
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Close connection
    if (wsRef.current) {
      // Send leave message before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: MessageType.LEAVE, timestamp: Date.now() }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setSessionId(null);
    setSessionInfo(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isConnected,
    sessionId,
    sessionInfo,

    // Actions
    connect,
    disconnect,

    // Send messages
    sendTransform,
    sendTransformBatch,
    sendSelection,
    sendMaterialAssign,
    requestSceneState,

    // Raw send
    send,
  };
}

export default useBlenderSync;
