/**
 * Bisect Bridge Server
 *
 * WebSocket server that routes messages between Blender and Bisect clients.
 * Supports multiple sessions (rooms) for different scene editing contexts.
 *
 * Usage:
 *   node server.js [port]
 *   Default port: 9876
 */

import { WebSocketServer, WebSocket } from 'ws';
import { MessageType, ClientType, parseMessage, createMessage } from './protocol.js';

const PORT = parseInt(process.env.BRIDGE_PORT || process.argv[2] || '9876', 10);

// Session storage: sessionId -> Set of clients
const sessions = new Map();

// Client metadata: ws -> { clientId, clientType, sessionId }
const clients = new Map();

// Create WebSocket server
const wss = new WebSocketServer({
  port: PORT,
  perMessageDeflate: false, // Disable compression for low latency
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ Bisect Bridge Server v0.1.0                          ║
║                                                           ║
║   WebSocket server for Blender ↔ Bisect live sync         ║
║                                                           ║
║   Port: ${PORT}                                              ║
║   Ready for connections...                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

/**
 * Generate a unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Broadcast a message to all clients in a session except the sender
 */
function broadcastToSession(sessionId, message, excludeWs = null) {
  const sessionClients = sessions.get(sessionId);
  if (!sessionClients) return;

  sessionClients.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Send a message to a specific client
 */
function sendToClient(ws, type, payload = {}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(createMessage(type, payload));
  }
}

/**
 * Get session info for logging
 */
function getSessionInfo(sessionId) {
  const sessionClients = sessions.get(sessionId);
  if (!sessionClients) return { blender: 0, bisect: 0 };

  let blender = 0, bisect = 0;
  sessionClients.forEach((ws) => {
    const meta = clients.get(ws);
    if (meta?.clientType === ClientType.BLENDER) blender++;
    if (meta?.clientType === ClientType.BISECT) bisect++;
  });
  return { blender, bisect };
}

/**
 * Handle client connection
 */
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientIp = req.socket.remoteAddress;

  console.log(`[+] New connection: ${clientId} from ${clientIp}`);

  // Initialize client metadata
  clients.set(ws, { clientId, clientType: null, sessionId: null });

  // Handle incoming messages
  ws.on('message', (data) => {
    const message = parseMessage(data.toString());
    const meta = clients.get(ws);

    switch (message.type) {
      case MessageType.JOIN: {
        const { sessionId, clientType } = message.payload;

        if (!sessionId || !clientType) {
          sendToClient(ws, MessageType.ERROR, { error: 'Missing sessionId or clientType' });
          return;
        }

        // Leave previous session if any
        if (meta.sessionId) {
          const prevSession = sessions.get(meta.sessionId);
          if (prevSession) {
            prevSession.delete(ws);
            if (prevSession.size === 0) {
              sessions.delete(meta.sessionId);
            }
          }
        }

        // Join new session
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, new Set());
        }
        sessions.get(sessionId).add(ws);

        // Update client metadata
        meta.sessionId = sessionId;
        meta.clientType = clientType;

        const info = getSessionInfo(sessionId);
        console.log(`[>] ${clientType} joined session "${sessionId}" (Blender: ${info.blender}, Bisect: ${info.bisect})`);

        // Confirm join
        sendToClient(ws, 'joined', {
          sessionId,
          clientId: meta.clientId,
          sessionInfo: info
        });

        // Notify others in session
        broadcastToSession(sessionId, createMessage('client_joined', {
          clientId: meta.clientId,
          clientType: meta.clientType,
          sessionInfo: info
        }), ws);

        break;
      }

      case MessageType.LEAVE: {
        handleLeave(ws);
        break;
      }

      case MessageType.PING: {
        sendToClient(ws, MessageType.PONG, { timestamp: Date.now() });
        break;
      }

      case MessageType.SCENE_REQUEST: {
        // Request scene state from Blender clients in the session
        if (meta.sessionId) {
          const sessionClients = sessions.get(meta.sessionId);
          sessionClients?.forEach((otherWs) => {
            const otherMeta = clients.get(otherWs);
            if (otherMeta?.clientType === ClientType.BLENDER && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(createMessage(MessageType.SCENE_REQUEST, {
                requestedBy: meta.clientId
              }));
            }
          });
        }
        break;
      }

      // Relay messages: just forward to other clients in the session
      case MessageType.TRANSFORM:
      case MessageType.TRANSFORM_BATCH:
      case MessageType.MESH_UPDATE:
      case MessageType.MATERIAL_ASSIGN:
      case MessageType.MATERIAL_UPDATE:
      case MessageType.OBJECT_ADD:
      case MessageType.OBJECT_DELETE:
      case MessageType.OBJECT_SELECT:
      case MessageType.HIERARCHY_UPDATE:
      case MessageType.SCENE_STATE: {
        if (meta.sessionId) {
          // Add sender info and relay
          const relayMessage = createMessage(message.type, {
            ...message.payload,
            _sender: meta.clientId,
            _senderType: meta.clientType
          }, meta.sessionId);

          broadcastToSession(meta.sessionId, relayMessage, ws);

          // Log transform messages less verbosely
          if (message.type !== MessageType.TRANSFORM && message.type !== MessageType.TRANSFORM_BATCH) {
            console.log(`[~] ${meta.clientType} → ${message.type} in "${meta.sessionId}"`);
          }
        }
        break;
      }

      default:
        console.log(`[?] Unknown message type: ${message.type}`);
        sendToClient(ws, MessageType.ERROR, { error: `Unknown message type: ${message.type}` });
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    handleLeave(ws);
    const meta = clients.get(ws);
    console.log(`[-] Disconnected: ${meta?.clientId || 'unknown'}`);
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`[!] WebSocket error for ${clients.get(ws)?.clientId}:`, err.message);
  });
});

/**
 * Handle client leaving a session
 */
function handleLeave(ws) {
  const meta = clients.get(ws);
  if (!meta?.sessionId) return;

  const session = sessions.get(meta.sessionId);
  if (session) {
    session.delete(ws);

    // Notify remaining clients
    const info = getSessionInfo(meta.sessionId);
    broadcastToSession(meta.sessionId, createMessage('client_left', {
      clientId: meta.clientId,
      clientType: meta.clientType,
      sessionInfo: info
    }));

    console.log(`[<] ${meta.clientType} left session "${meta.sessionId}" (Blender: ${info.blender}, Bisect: ${info.bisect})`);

    // Clean up empty sessions
    if (session.size === 0) {
      sessions.delete(meta.sessionId);
      console.log(`[x] Session "${meta.sessionId}" deleted (empty)`);
    }
  }

  meta.sessionId = null;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[*] Shutting down bridge server...');
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  wss.close(() => {
    console.log('[*] Bridge server closed');
    process.exit(0);
  });
});

// Periodic session stats (every 60 seconds)
setInterval(() => {
  if (sessions.size > 0) {
    console.log(`[i] Active sessions: ${sessions.size}, Total clients: ${clients.size}`);
    sessions.forEach((sessionClients, sessionId) => {
      const info = getSessionInfo(sessionId);
      console.log(`    - "${sessionId}": ${sessionClients.size} clients (Blender: ${info.blender}, Bisect: ${info.bisect})`);
    });
  }
}, 60000);
