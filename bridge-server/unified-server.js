/**
 * Unified Bisect Bridge Server v2.0
 *
 * Single WebSocket server for all clients:
 * - Blender Addon (scene source of truth)
 * - Bisect Web Editor (React Three Fiber)
 * - AI Agents (GPT-4o, Gemini, Claude)
 *
 * Usage:
 *   node unified-server.js [port]
 *   Default port: 9877
 */

import { WebSocketServer, WebSocket } from 'ws';
import { MessageType, ClientType, parseMessage, createMessage } from './unified-protocol.js';

const PORT = parseInt(process.env.BRIDGE_PORT || process.argv[2] || '9877', 10);

// ============================================================================
// State Management
// ============================================================================

// Session storage: sessionId -> SessionState
const sessions = new Map();

// Client metadata: ws -> ClientMeta
const clients = new Map();

/**
 * Session state - shared scene data for all clients in a session
 */
class SessionState {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.clients = new Set();
    this.sceneState = {
      objects: [],
      materials: [],
      lights: [],
      cameras: [],
      environment: null,
      selection: []
    };
    this.lastUpdate = Date.now();
  }

  addClient(ws) {
    this.clients.add(ws);
  }

  removeClient(ws) {
    this.clients.delete(ws);
  }

  isEmpty() {
    return this.clients.size === 0;
  }

  updateScene(sceneData) {
    this.sceneState = { ...this.sceneState, ...sceneData };
    this.lastUpdate = Date.now();
  }

  getClientCounts() {
    let blender = 0, bisect = 0, ai = 0;
    this.clients.forEach((ws) => {
      const meta = clients.get(ws);
      if (meta?.clientType === ClientType.BLENDER) blender++;
      else if (meta?.clientType === ClientType.BISECT) bisect++;
      else if (meta?.clientType === ClientType.AI) ai++;
    });
    return { blender, bisect, ai, total: this.clients.size };
  }
}

// ============================================================================
// WebSocket Server
// ============================================================================

const wss = new WebSocketServer({
  port: PORT,
  perMessageDeflate: false
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ⚡ Unified Bisect Bridge Server v2.0                        ║
║                                                               ║
║   Clients: Blender Addon | Bisect Web | AI Agents             ║
║                                                               ║
║   Port: ${PORT}                                                  ║
║   Ready for connections...                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// Utility Functions
// ============================================================================

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function broadcastToSession(sessionId, message, excludeWs = null) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.clients.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function broadcastToClientType(sessionId, clientType, message, excludeWs = null) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.clients.forEach((ws) => {
    const meta = clients.get(ws);
    if (meta?.clientType === clientType && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function sendToClient(ws, type, payload = {}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(createMessage(type, payload));
  }
}

function getClientIcon(clientType) {
  switch (clientType) {
    case ClientType.BLENDER: return '🎨';
    case ClientType.BISECT: return '🌐';
    case ClientType.AI: return '🤖';
    default: return '❓';
  }
}

// ============================================================================
// Connection Handler
// ============================================================================

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientIp = req.socket.remoteAddress;

  console.log(`[+] New connection: ${clientId} from ${clientIp}`);

  clients.set(ws, {
    clientId,
    clientType: null,
    sessionId: null,
    joinedAt: Date.now()
  });

  // -------------------------------------------------------------------------
  // Message Handler
  // -------------------------------------------------------------------------
  ws.on('message', (data) => {
    const message = parseMessage(data.toString());
    const meta = clients.get(ws);

    switch (message.type) {
      // === Connection ===
      case MessageType.JOIN:
        handleJoin(ws, meta, message.payload);
        break;

      case MessageType.LEAVE:
        handleLeave(ws);
        break;

      case MessageType.PING:
        sendToClient(ws, MessageType.PONG, { timestamp: Date.now() });
        break;

      // === Scene Sync ===
      case MessageType.SCENE_STATE:
        handleSceneState(ws, meta, message.payload);
        break;

      case MessageType.SCENE_REQUEST:
        handleSceneRequest(ws, meta);
        break;

      // === Object Operations ===
      case MessageType.OBJECT_ADD:
      case MessageType.OBJECT_DELETE:
      case MessageType.OBJECT_SELECT:
      case MessageType.OBJECT_RENAME:
        relayMessage(ws, meta, message);
        break;

      // === Transforms ===
      case MessageType.TRANSFORM:
      case MessageType.TRANSFORM_BATCH:
        handleTransform(ws, meta, message);
        break;

      // === Materials ===
      case MessageType.MATERIAL_ASSIGN:
      case MessageType.MATERIAL_UPDATE:
      case MessageType.MATERIAL_CREATE:
        relayMessage(ws, meta, message);
        break;

      // === Hierarchy ===
      case MessageType.HIERARCHY_UPDATE:
        relayMessage(ws, meta, message);
        break;

      // === AI Operations ===
      case MessageType.AI_COMMAND:
      case MessageType.SMART_EDIT:
        handleAICommand(ws, meta, message);
        break;

      case MessageType.AI_RESPONSE:
      case MessageType.SMART_EDIT_RESULT:
        relayMessage(ws, meta, message);
        break;

      case MessageType.AI_VISION_REQUEST:
        handleVisionRequest(ws, meta, message.payload);
        break;

      case MessageType.AI_VISION_RESPONSE:
        relayMessage(ws, meta, message);
        break;

      case MessageType.AI_EXECUTE:
        handleAIExecute(ws, meta, message.payload);
        break;

      // === AI Orchestration (Gemini 3 routes, specialists execute) ===
      case MessageType.AI_ROUTE:
        handleAIRoute(ws, meta, message.payload);
        break;

      case MessageType.AI_ROUTE_RESULT:
      case MessageType.AI_SPECIALIST_RESULT:
        relayMessage(ws, meta, message);
        break;

      case MessageType.AI_SPECIALIST_EXECUTE:
        handleSpecialistExecute(ws, meta, message.payload);
        break;

      // === AI Debate Mode ===
      case MessageType.AI_DEBATE_START:
        handleDebateStart(ws, meta, message.payload);
        break;

      case MessageType.AI_DEBATE_PROPOSAL:
      case MessageType.AI_DEBATE_ROUND:
      case MessageType.AI_DEBATE_RESULT:
        relayMessage(ws, meta, message);
        break;

      default:
        console.log(`[?] Unknown message type: ${message.type}`);
        sendToClient(ws, MessageType.ERROR, { error: `Unknown message type: ${message.type}` });
    }
  });

  // -------------------------------------------------------------------------
  // Disconnect Handler
  // -------------------------------------------------------------------------
  ws.on('close', () => {
    handleLeave(ws);
    const meta = clients.get(ws);
    console.log(`[-] Disconnected: ${meta?.clientId || 'unknown'}`);
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[!] WebSocket error for ${clients.get(ws)?.clientId}:`, err.message);
  });
});

// ============================================================================
// Message Handlers
// ============================================================================

function handleJoin(ws, meta, payload) {
  const { sessionId, clientType } = payload;

  if (!sessionId || !clientType) {
    sendToClient(ws, MessageType.ERROR, { error: 'Missing sessionId or clientType' });
    return;
  }

  // Leave previous session if any
  if (meta.sessionId) {
    const prevSession = sessions.get(meta.sessionId);
    if (prevSession) {
      prevSession.removeClient(ws);
      if (prevSession.isEmpty()) {
        sessions.delete(meta.sessionId);
      }
    }
  }

  // Create or join session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new SessionState(sessionId));
  }
  const session = sessions.get(sessionId);
  session.addClient(ws);

  // Update client metadata
  meta.sessionId = sessionId;
  meta.clientType = clientType;

  const counts = session.getClientCounts();
  const icon = getClientIcon(clientType);

  console.log(`[>] ${icon} ${clientType} joined session "${sessionId}" (B:${counts.blender} W:${counts.bisect} AI:${counts.ai})`);

  // Confirm join with current scene state
  sendToClient(ws, 'joined', {
    sessionId,
    clientId: meta.clientId,
    clientType,
    sessionInfo: counts,
    sceneState: session.sceneState
  });

  // Notify others
  broadcastToSession(sessionId, createMessage('client_joined', {
    clientId: meta.clientId,
    clientType,
    sessionInfo: counts
  }), ws);

  // If Bisect or AI joins and Blender is present, request fresh scene
  if ((clientType === ClientType.BISECT || clientType === ClientType.AI) && counts.blender > 0) {
    broadcastToClientType(sessionId, ClientType.BLENDER, createMessage(MessageType.SCENE_REQUEST, {
      requestedBy: meta.clientId,
      requestedByType: clientType
    }));
  }
}

function handleLeave(ws) {
  const meta = clients.get(ws);
  if (!meta?.sessionId) return;

  const session = sessions.get(meta.sessionId);
  if (session) {
    session.removeClient(ws);

    const counts = session.getClientCounts();
    const icon = getClientIcon(meta.clientType);

    console.log(`[<] ${icon} ${meta.clientType} left session "${meta.sessionId}" (B:${counts.blender} W:${counts.bisect} AI:${counts.ai})`);

    broadcastToSession(meta.sessionId, createMessage('client_left', {
      clientId: meta.clientId,
      clientType: meta.clientType,
      sessionInfo: counts
    }));

    if (session.isEmpty()) {
      sessions.delete(meta.sessionId);
      console.log(`[x] Session "${meta.sessionId}" deleted (empty)`);
    }
  }

  meta.sessionId = null;
}

function handleSceneState(ws, meta, payload) {
  if (!meta.sessionId) return;

  const session = sessions.get(meta.sessionId);
  if (!session) return;

  // Update session's cached scene state
  session.updateScene(payload);

  // Relay to all other clients
  const message = createMessage(MessageType.SCENE_STATE, {
    ...payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }, meta.sessionId);

  broadcastToSession(meta.sessionId, message, ws);

  console.log(`[~] ${getClientIcon(meta.clientType)} ${meta.clientType} → scene_state (${payload.objects?.length || 0} objects)`);
}

function handleSceneRequest(ws, meta) {
  if (!meta.sessionId) return;

  const session = sessions.get(meta.sessionId);
  if (!session) return;

  // If we have cached scene state, send it
  if (session.sceneState.objects.length > 0) {
    sendToClient(ws, MessageType.SCENE_STATE, session.sceneState);
    return;
  }

  // Otherwise, request from Blender
  broadcastToClientType(meta.sessionId, ClientType.BLENDER, createMessage(MessageType.SCENE_REQUEST, {
    requestedBy: meta.clientId
  }));
}

function handleTransform(ws, meta, message) {
  if (!meta.sessionId) return;

  // Relay transform to all other clients (no logging for transforms - too noisy)
  const relayMessage = createMessage(message.type, {
    ...message.payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }, meta.sessionId);

  broadcastToSession(meta.sessionId, relayMessage, ws);
}

function relayMessage(ws, meta, message) {
  if (!meta.sessionId) return;

  const relayMsg = createMessage(message.type, {
    ...message.payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }, meta.sessionId);

  broadcastToSession(meta.sessionId, relayMsg, ws);

  // Log non-transform messages
  if (message.type !== MessageType.TRANSFORM && message.type !== MessageType.TRANSFORM_BATCH) {
    console.log(`[~] ${getClientIcon(meta.clientType)} ${meta.clientType} → ${message.type}`);
  }
}

function handleAICommand(ws, meta, message) {
  if (!meta.sessionId) return;

  console.log(`[~] ${getClientIcon(meta.clientType)} AI command: "${message.payload.command?.substring(0, 50)}..."`);

  // Relay AI command to all clients (Bisect will process it)
  const relayMsg = createMessage(message.type, {
    ...message.payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }, meta.sessionId);

  broadcastToSession(meta.sessionId, relayMsg, ws);
}

function handleVisionRequest(ws, meta, payload) {
  if (!meta.sessionId) return;

  console.log(`[~] ${getClientIcon(meta.clientType)} Vision request from ${meta.clientType}`);

  // Request screenshot from Bisect (web has the renderer)
  broadcastToClientType(meta.sessionId, ClientType.BISECT, createMessage(MessageType.AI_VISION_REQUEST, {
    requestedBy: meta.clientId,
    ...payload
  }));
}

function handleAIExecute(ws, meta, payload) {
  if (!meta.sessionId) return;

  console.log(`[~] ${getClientIcon(meta.clientType)} AI execute: ${payload.action}`);

  // Determine target based on action
  const action = payload.action;

  // Actions that should go to Blender
  const blenderActions = ['create_object', 'delete_object', 'modify_mesh', 'boolean', 'subdivide'];

  // Actions that should go to Bisect (materials, UI)
  const bisectActions = ['apply_material', 'change_color', 'set_roughness', 'set_metalness'];

  if (blenderActions.includes(action)) {
    broadcastToClientType(meta.sessionId, ClientType.BLENDER, createMessage(MessageType.AI_EXECUTE, payload));
  } else if (bisectActions.includes(action)) {
    broadcastToClientType(meta.sessionId, ClientType.BISECT, createMessage(MessageType.AI_EXECUTE, payload));
  } else {
    // Broadcast to all
    broadcastToSession(meta.sessionId, createMessage(MessageType.AI_EXECUTE, {
      ...payload,
      _sender: meta.clientId
    }), ws);
  }
}

// ============================================================================
// AI Orchestration Handlers (Gemini 3 routes, specialists execute)
// ============================================================================

function handleAIRoute(ws, meta, payload) {
  if (!meta.sessionId) return;

  console.log(`[~] ${getClientIcon(meta.clientType)} AI route request: "${payload.command?.substring(0, 50)}..."`);

  // Broadcast route request to all AI clients and Bisect
  // Gemini orchestrator in Bisect will handle the routing
  broadcastToClientType(meta.sessionId, ClientType.BISECT, createMessage(MessageType.AI_ROUTE, {
    ...payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }));

  // Also notify any AI clients
  broadcastToClientType(meta.sessionId, ClientType.AI, createMessage(MessageType.AI_ROUTE, {
    ...payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }));
}

function handleSpecialistExecute(ws, meta, payload) {
  if (!meta.sessionId) return;

  const agent = payload.agent; // 'gpt4o' | 'gemini' | 'claude'
  const target = payload.target; // 'bisect' | 'blender'

  console.log(`[~] ${getClientIcon(meta.clientType)} Specialist execute: ${agent} → ${target}`);

  if (target === 'blender') {
    // Claude generates Blender Python scripts, send to Blender addon
    broadcastToClientType(meta.sessionId, ClientType.BLENDER, createMessage(MessageType.AI_SPECIALIST_EXECUTE, {
      ...payload,
      _sender: meta.clientId,
      _senderType: meta.clientType
    }));
  } else {
    // GPT-4o (materials) and Gemini (spatial) execute in Bisect
    broadcastToClientType(meta.sessionId, ClientType.BISECT, createMessage(MessageType.AI_SPECIALIST_EXECUTE, {
      ...payload,
      _sender: meta.clientId,
      _senderType: meta.clientType
    }));
  }
}

function handleDebateStart(ws, meta, payload) {
  if (!meta.sessionId) return;

  console.log(`[~] ${getClientIcon(meta.clientType)} Debate started: "${payload.command?.substring(0, 50)}..."`);
  console.log(`    Participants: ${payload.participants?.join(', ') || 'all'}`);

  // Broadcast debate start to all clients in session
  // Each specialist will submit their proposal
  broadcastToSession(meta.sessionId, createMessage(MessageType.AI_DEBATE_START, {
    ...payload,
    _sender: meta.clientId,
    _senderType: meta.clientType
  }), ws);
}

// ============================================================================
// Periodic Stats
// ============================================================================

setInterval(() => {
  if (sessions.size > 0) {
    console.log(`[i] Active sessions: ${sessions.size}, Total clients: ${clients.size}`);
    sessions.forEach((session, sessionId) => {
      const counts = session.getClientCounts();
      console.log(`    - "${sessionId}": ${counts.total} clients (B:${counts.blender} W:${counts.bisect} AI:${counts.ai})`);
    });
  }
}, 60000);

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGINT', () => {
  console.log('\n[*] Shutting down unified bridge server...');
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  wss.close(() => {
    console.log('[*] Server closed');
    process.exit(0);
  });
});
