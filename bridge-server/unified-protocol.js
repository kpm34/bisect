/**
 * Unified Bisect Bridge Protocol v2.0
 *
 * Combines:
 * - Scene sync (Blender Addon ↔ Bisect Web)
 * - AI operations (GPT-4o, Gemini, Claude reasoning)
 * - Real-time collaboration
 *
 * Three client types share the same scene state.
 */

// ============================================================================
// Client Types
// ============================================================================

export const ClientType = {
  BLENDER: 'blender',   // Blender addon - source of truth for 3D scene
  BISECT: 'bisect',     // Bisect web editor - React Three Fiber
  AI: 'ai'              // AI agents (GPT-4o, Gemini, Claude)
};

// ============================================================================
// Message Categories
// ============================================================================

export const MessageType = {
  // --- Connection ---
  JOIN: 'join',
  LEAVE: 'leave',
  PING: 'ping',
  PONG: 'pong',

  // --- Scene Sync (Blender ↔ Bisect) ---
  SCENE_STATE: 'scene_state',
  SCENE_REQUEST: 'scene_request',

  // --- Object Operations ---
  OBJECT_ADD: 'object_add',
  OBJECT_DELETE: 'object_delete',
  OBJECT_SELECT: 'object_select',
  OBJECT_RENAME: 'object_rename',

  // --- Transform Sync ---
  TRANSFORM: 'transform',
  TRANSFORM_BATCH: 'transform_batch',

  // --- Mesh Operations ---
  MESH_UPDATE: 'mesh_update',
  MESH_REQUEST: 'mesh_request',

  // --- Material Operations ---
  MATERIAL_ASSIGN: 'material_assign',
  MATERIAL_UPDATE: 'material_update',
  MATERIAL_CREATE: 'material_create',

  // --- Hierarchy ---
  HIERARCHY_UPDATE: 'hierarchy_update',

  // --- AI Operations ---
  AI_COMMAND: 'ai_command',           // Natural language command
  AI_RESPONSE: 'ai_response',         // AI response with plan
  AI_EXECUTE: 'ai_execute',           // Execute AI-generated plan
  AI_VISION_REQUEST: 'ai_vision_request',   // Request screenshot for vision
  AI_VISION_RESPONSE: 'ai_vision_response', // Screenshot data

  // --- Smart Edit (unified AI entry point) ---
  SMART_EDIT: 'smart_edit',
  SMART_EDIT_RESULT: 'smart_edit_result',

  // --- AI Orchestration (Gemini 3 routes, specialists execute) ---
  AI_ROUTE: 'ai_route',               // Gemini 3 routes command to specialist
  AI_ROUTE_RESULT: 'ai_route_result', // Routing decision response
  AI_SPECIALIST_EXECUTE: 'ai_specialist_execute', // Specialist executes task
  AI_SPECIALIST_RESULT: 'ai_specialist_result',   // Specialist execution result

  // --- AI Debate Mode (multi-model reasoning) ---
  AI_DEBATE_START: 'ai_debate_start',     // Trigger debate for complex commands
  AI_DEBATE_PROPOSAL: 'ai_debate_proposal', // Model proposal
  AI_DEBATE_ROUND: 'ai_debate_round',     // Debate round exchange
  AI_DEBATE_RESULT: 'ai_debate_result',   // Final debate decision

  // --- Error ---
  ERROR: 'error'
};

// ============================================================================
// Message Factory
// ============================================================================

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

// ============================================================================
// Transform Messages
// ============================================================================

export function createTransformMessage(objectId, transform, sessionId) {
  return createMessage(MessageType.TRANSFORM, {
    objectId,
    position: transform.position,
    rotation: transform.rotation,
    scale: transform.scale
  }, sessionId);
}

export function createBatchTransformMessage(transforms, sessionId) {
  return createMessage(MessageType.TRANSFORM_BATCH, {
    transforms
  }, sessionId);
}

// ============================================================================
// Object Messages
// ============================================================================

export function createObjectAddMessage(object, sessionId) {
  return createMessage(MessageType.OBJECT_ADD, {
    id: object.id,
    name: object.name,
    type: object.type,
    position: object.position || [0, 0, 0],
    rotation: object.rotation || [0, 0, 0, 1],
    scale: object.scale || [1, 1, 1],
    parent: object.parent || null,
    geometry: object.geometry || null,
    material: object.material || null
  }, sessionId);
}

export function createObjectDeleteMessage(objectId, sessionId) {
  return createMessage(MessageType.OBJECT_DELETE, {
    objectId
  }, sessionId);
}

export function createObjectSelectMessage(objectIds, sessionId) {
  return createMessage(MessageType.OBJECT_SELECT, {
    objectIds: Array.isArray(objectIds) ? objectIds : [objectIds]
  }, sessionId);
}

// ============================================================================
// Material Messages
// ============================================================================

export function createMaterialAssignMessage(objectId, materialId, sessionId) {
  return createMessage(MessageType.MATERIAL_ASSIGN, {
    objectId,
    materialId
  }, sessionId);
}

export function createMaterialUpdateMessage(materialId, properties, sessionId) {
  return createMessage(MessageType.MATERIAL_UPDATE, {
    materialId,
    properties  // { color, roughness, metalness, ... }
  }, sessionId);
}

// ============================================================================
// AI Messages
// ============================================================================

export function createAICommandMessage(command, options = {}, sessionId) {
  return createMessage(MessageType.AI_COMMAND, {
    command,
    useVision: options.useVision || false,
    useDebate: options.useDebate || false,
    model: options.model || 'gpt-4o',
    context: options.context || {}
  }, sessionId);
}

export function createSmartEditMessage(command, options = {}, sessionId) {
  return createMessage(MessageType.SMART_EDIT, {
    command,
    useVision: options.useVision || false,
    screenshot: options.screenshot || null,
    useDebate: options.useDebate || false,
    targetObjects: options.targetObjects || null
  }, sessionId);
}

// ============================================================================
// AI Orchestration Messages (Gemini 3 routes, specialists execute)
// ============================================================================

/**
 * Request Gemini 3 to route a command to the appropriate specialist
 */
export function createAIRouteMessage(command, options = {}, sessionId) {
  return createMessage(MessageType.AI_ROUTE, {
    command,
    screenshot: options.screenshot || null,    // Optional scene screenshot
    sceneContext: options.sceneContext || null, // Optional scene state
    forceDebate: options.forceDebate || false,  // Manual debate toggle
    preferredAgent: options.preferredAgent || null // Optional: 'gpt4o' | 'gemini' | 'claude'
  }, sessionId);
}

/**
 * Gemini 3's routing decision
 */
export function createAIRouteResultMessage(decision, sessionId) {
  return createMessage(MessageType.AI_ROUTE_RESULT, {
    agent: decision.agent,           // 'gpt4o' | 'gemini' | 'claude'
    reason: decision.reason,         // Why this agent was chosen
    shouldDebate: decision.shouldDebate || false,
    sceneAnalysis: decision.sceneAnalysis || null, // Gemini's 3D understanding
    transformedCommand: decision.transformedCommand || null // Refined command
  }, sessionId);
}

/**
 * Execute task via specialist agent
 */
export function createSpecialistExecuteMessage(task, agent, context, sessionId) {
  return createMessage(MessageType.AI_SPECIALIST_EXECUTE, {
    agent,                           // 'gpt4o' | 'gemini' | 'claude'
    task,                            // The task to execute
    target: agent === 'claude' ? 'blender' : 'bisect', // Execution target
    context                          // Scene context from Gemini analysis
  }, sessionId);
}

/**
 * Specialist execution result
 */
export function createSpecialistResultMessage(result, sessionId) {
  return createMessage(MessageType.AI_SPECIALIST_RESULT, {
    agent: result.agent,
    success: result.success,
    commands: result.commands || [],  // Commands to execute
    sceneChanges: result.sceneChanges || null,
    error: result.error || null
  }, sessionId);
}

// ============================================================================
// AI Debate Messages (multi-model reasoning for complex tasks)
// ============================================================================

/**
 * Start a debate between all three models
 */
export function createDebateStartMessage(command, context, sessionId) {
  return createMessage(MessageType.AI_DEBATE_START, {
    command,
    sceneContext: context.sceneContext || null,
    screenshot: context.screenshot || null,
    participants: ['gpt4o', 'gemini', 'claude']
  }, sessionId);
}

/**
 * Model proposal in a debate
 */
export function createDebateProposalMessage(proposal, sessionId) {
  return createMessage(MessageType.AI_DEBATE_PROPOSAL, {
    agent: proposal.agent,           // Which model is proposing
    approach: proposal.approach,     // Proposed approach description
    commands: proposal.commands,     // Proposed commands
    reasoning: proposal.reasoning,   // Why this approach is best
    confidence: proposal.confidence  // 0-1 confidence score
  }, sessionId);
}

/**
 * Final debate result (Gemini selects best approach)
 */
export function createDebateResultMessage(result, sessionId) {
  return createMessage(MessageType.AI_DEBATE_RESULT, {
    selectedAgent: result.selectedAgent,
    selectedApproach: result.selectedApproach,
    selectionReason: result.selectionReason,
    commands: result.commands,
    allProposals: result.allProposals // For transparency
  }, sessionId);
}

// ============================================================================
// Scene State
// ============================================================================

export function createSceneStateMessage(sceneData, sessionId) {
  return createMessage(MessageType.SCENE_STATE, {
    objects: sceneData.objects || [],
    materials: sceneData.materials || [],
    lights: sceneData.lights || [],
    cameras: sceneData.cameras || [],
    environment: sceneData.environment || null,
    selection: sceneData.selection || []
  }, sessionId);
}
