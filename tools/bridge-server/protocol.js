/**
 * Bisect Bridge Protocol v1.0
 *
 * Message types for Blender ↔ Bisect synchronization
 */

// Client types that can connect
export const ClientType = {
  BLENDER: 'blender',
  BISECT: 'bisect'
};

// Message types for sync operations
export const MessageType = {
  // Connection
  JOIN: 'join',           // Client joins a session
  LEAVE: 'leave',         // Client leaves a session
  PING: 'ping',           // Keep-alive
  PONG: 'pong',           // Keep-alive response

  // Scene sync
  SCENE_STATE: 'scene_state',     // Full scene snapshot
  SCENE_REQUEST: 'scene_request', // Request current scene state

  // Object operations
  OBJECT_ADD: 'object_add',
  OBJECT_DELETE: 'object_delete',
  OBJECT_SELECT: 'object_select',

  // Transform sync (most frequent)
  TRANSFORM: 'transform',
  TRANSFORM_BATCH: 'transform_batch',

  // Mesh sync
  MESH_UPDATE: 'mesh_update',
  MESH_REQUEST: 'mesh_request',

  // Material sync
  MATERIAL_ASSIGN: 'material_assign',
  MATERIAL_UPDATE: 'material_update',

  // Hierarchy
  HIERARCHY_UPDATE: 'hierarchy_update',

  // Error handling
  ERROR: 'error'
};

/**
 * Create a protocol message
 */
export function createMessage(type, payload = {}, sessionId = null) {
  return JSON.stringify({
    type,
    sessionId,
    timestamp: Date.now(),
    payload
  });
}

/**
 * Parse an incoming message
 */
export function parseMessage(data) {
  try {
    const message = JSON.parse(data);
    if (!message.type) {
      throw new Error('Missing message type');
    }
    return message;
  } catch (err) {
    return { type: MessageType.ERROR, payload: { error: err.message } };
  }
}

/**
 * Transform message structure
 */
export function createTransformMessage(objectId, transform, sessionId) {
  return createMessage(MessageType.TRANSFORM, {
    objectId,
    position: transform.position,    // [x, y, z]
    rotation: transform.rotation,    // [x, y, z, w] quaternion
    scale: transform.scale           // [x, y, z]
  }, sessionId);
}

/**
 * Batch transform message for efficiency
 */
export function createBatchTransformMessage(transforms, sessionId) {
  return createMessage(MessageType.TRANSFORM_BATCH, {
    transforms // Array of { objectId, position, rotation, scale }
  }, sessionId);
}
