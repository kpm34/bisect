/**
 * Bisect MCP Protocol
 *
 * Defines a request-response protocol for bidirectional communication
 * between the MCP server and the Bisect editor.
 */

// Message Types
const MessageType = {
    // Requests (MCP -> Editor)
    REQUEST: 'REQUEST',

    // Responses (Editor -> MCP)
    RESPONSE: 'RESPONSE',

    // Legacy fire-and-forget (for backwards compatibility)
    CLI_COMMAND: 'CLI_COMMAND',
};

// Operation Types
const OperationType = {
    // AI-powered smart editing
    SMART_EDIT: 'SMART_EDIT',

    // Scene queries
    GET_SCENE_GRAPH: 'GET_SCENE_GRAPH',
    GET_SCREENSHOT: 'GET_SCREENSHOT',
    GET_SELECTED_OBJECT: 'GET_SELECTED_OBJECT',

    // Legacy operations (fire-and-forget)
    ADD_OBJECT: 'ADD_OBJECT',
    UPDATE_OBJECT: 'UPDATE_OBJECT',
    ADD_EVENT: 'ADD_EVENT',
    APPLY_MODIFIER: 'APPLY_MODIFIER',
    IMPORT_ASSET: 'IMPORT_ASSET',
    PLAY_ANIMATION: 'PLAY_ANIMATION',
    BAKE_MODEL: 'BAKE_MODEL',
    SET_LOD: 'SET_LOD',
    GENERATE_PARAMETRIC: 'GENERATE_PARAMETRIC',
};

// Request ID counter
let requestIdCounter = 0;

/**
 * Generate a unique request ID
 * Format: mcp_<timestamp>_<counter>
 */
function generateRequestId() {
    requestIdCounter++;
    return `mcp_${Date.now()}_${requestIdCounter}`;
}

/**
 * Create a request message
 * @param {string} operation - The operation type (from OperationType)
 * @param {object} payload - The request payload
 * @returns {object} Request message with id, type, operation, payload, timestamp
 */
function createRequest(operation, payload = {}) {
    return {
        id: generateRequestId(),
        type: MessageType.REQUEST,
        operation: operation,
        payload: payload,
        timestamp: Date.now(),
    };
}

/**
 * Create a response message (used by editor)
 * @param {string} requestId - The original request ID
 * @param {boolean} success - Whether the operation succeeded
 * @param {object} data - The response data
 * @param {string} error - Error message if failed
 * @returns {object} Response message
 */
function createResponse(requestId, success, data = null, error = null) {
    return {
        id: requestId,
        type: MessageType.RESPONSE,
        success: success,
        data: data,
        error: error,
        timestamp: Date.now(),
    };
}

/**
 * Check if a message is a response
 * @param {object} message - The message to check
 * @returns {boolean} True if it's a response message
 */
function isResponse(message) {
    return message && message.type === MessageType.RESPONSE;
}

/**
 * Check if a response matches a specific request ID
 * @param {string} requestId - The request ID to match
 * @param {object} message - The message to check
 * @returns {boolean} True if the message is a response matching the request ID
 */
function matchResponse(requestId, message) {
    return isResponse(message) && message.id === requestId;
}

/**
 * Parse an incoming message
 * @param {string|object} rawMessage - Raw message (string or object)
 * @returns {object|null} Parsed message or null if invalid
 */
function parseMessage(rawMessage) {
    try {
        if (typeof rawMessage === 'string') {
            return JSON.parse(rawMessage);
        }
        return rawMessage;
    } catch (e) {
        console.error('Failed to parse message:', e);
        return null;
    }
}

/**
 * Serialize a message for transmission
 * @param {object} message - The message to serialize
 * @returns {string} JSON string
 */
function serializeMessage(message) {
    return JSON.stringify(message);
}

// Response schemas for validation (informational)
const ResponseSchemas = {
    [OperationType.SMART_EDIT]: {
        description: 'AI execution plan response',
        fields: {
            plan: 'ExecutionPlan object with approach, reasoning, commands',
            tokensUsed: 'Number of tokens consumed',
            cost: 'Cost calculation object',
        },
    },
    [OperationType.GET_SCENE_GRAPH]: {
        description: 'Semantic scene graph response',
        fields: {
            nodes: 'Array of SceneNode objects',
            edges: 'Array of SceneEdge objects (relationships)',
            summary: 'Natural language scene summary',
        },
    },
    [OperationType.GET_SCREENSHOT]: {
        description: 'Viewport screenshot response',
        fields: {
            base64: 'Base64 encoded PNG image',
            width: 'Image width in pixels',
            height: 'Image height in pixels',
        },
    },
    [OperationType.GET_SELECTED_OBJECT]: {
        description: 'Selected object details response',
        fields: {
            id: 'Object UUID',
            name: 'Object name',
            type: 'Object type (Mesh, Light, etc)',
            position: '{ x, y, z } world position',
            rotation: '{ x, y, z } euler rotation',
            scale: '{ x, y, z } scale',
            material: 'Current material properties',
            bounds: 'Bounding box { min, max }',
        },
    },
};

module.exports = {
    // Constants
    MessageType,
    OperationType,
    ResponseSchemas,

    // Functions
    createRequest,
    createResponse,
    isResponse,
    matchResponse,
    parseMessage,
    serializeMessage,
    generateRequestId,
};
