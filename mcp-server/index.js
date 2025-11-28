#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { z } = require("zod");
const WebSocket = require("ws");
const {
    createRequest,
    isResponse,
    matchResponse,
    parseMessage,
    serializeMessage,
    OperationType,
} = require("./protocol.js");

// --- Configuration ---
const BRIDGE_URL = "ws://localhost:8080";
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// --- Bridge Connection ---
let bridgeSocket = null;
let isConnected = false;

// Pending requests waiting for responses
const pendingRequests = new Map();

function connectToBridge() {
    return new Promise((resolve, reject) => {
        bridgeSocket = new WebSocket(BRIDGE_URL);

        bridgeSocket.on("open", () => {
            console.error("Connected to Bisect Bridge");
            isConnected = true;
            resolve();
        });

        bridgeSocket.on("message", (data) => {
            handleBridgeMessage(data);
        });

        bridgeSocket.on("error", (err) => {
            console.error("Bridge connection error:", err.message);
            isConnected = false;
            // Don't reject, just log, so server stays alive
        });

        bridgeSocket.on("close", () => {
            console.error("Bridge disconnected");
            isConnected = false;
            // Reject all pending requests
            for (const [requestId, pending] of pendingRequests) {
                pending.reject(new Error("Bridge connection closed"));
                clearTimeout(pending.timeout);
            }
            pendingRequests.clear();
        });
    });
}

/**
 * Handle incoming messages from the bridge
 */
function handleBridgeMessage(data) {
    const message = parseMessage(data.toString());
    if (!message) {
        console.error("Failed to parse bridge message");
        return;
    }

    console.error("Received from bridge:", JSON.stringify(message).slice(0, 200));

    // Check if this is a response to a pending request
    if (isResponse(message)) {
        const pending = pendingRequests.get(message.id);
        if (pending) {
            clearTimeout(pending.timeout);
            pendingRequests.delete(message.id);

            if (message.success) {
                pending.resolve(message.data);
            } else {
                pending.reject(new Error(message.error || "Request failed"));
            }
        } else {
            console.error("Received response for unknown request:", message.id);
        }
    }
}

/**
 * Send a fire-and-forget command (legacy)
 */
function sendToEditor(command) {
    if (!isConnected || !bridgeSocket) {
        throw new Error("Not connected to Bisect Editor Bridge");
    }
    bridgeSocket.send(JSON.stringify({ type: "CLI_COMMAND", command }));
}

/**
 * Send a request and wait for response
 * @param {string} operation - Operation type from OperationType
 * @param {object} payload - Request payload
 * @returns {Promise<any>} Response data
 */
function sendRequest(operation, payload = {}) {
    return new Promise((resolve, reject) => {
        if (!isConnected || !bridgeSocket) {
            reject(new Error("Not connected to Bisect Editor Bridge"));
            return;
        }

        const request = createRequest(operation, payload);
        console.error(`Sending request: ${request.id} (${operation})`);

        // Set up timeout
        const timeout = setTimeout(() => {
            pendingRequests.delete(request.id);
            reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
        }, REQUEST_TIMEOUT_MS);

        // Store pending request
        pendingRequests.set(request.id, { resolve, reject, timeout });

        // Send the request
        bridgeSocket.send(serializeMessage(request));
    });
}

// --- MCP Server Setup ---
const server = new Server(
    {
        name: "bisect-mcp-server",
        version: "2.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// --- Tools Definition ---
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // ============================================
            // NEW: AI-Powered Intelligent Tools
            // ============================================
            {
                name: "smart_edit",
                description: "AI-powered scene editing using natural language. Routes to GPT-4o for materials, Gemini for spatial layouts, Claude for complex planning. Examples: 'make it look like marble', 'arrange objects in a grid', 'create a forest scene'",
                inputSchema: {
                    type: "object",
                    properties: {
                        command: {
                            type: "string",
                            description: "Natural language editing command",
                        },
                        useVision: {
                            type: "boolean",
                            description: "Include viewport screenshot for visual context (default: false)",
                        },
                    },
                    required: ["command"],
                },
            },
            {
                name: "get_scene_analysis",
                description: "Get AI-analyzed scene with semantic relationships between objects (on_top_of, next_to, inside, etc.). Returns nodes, edges, and natural language summary.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_screenshot",
                description: "Capture current viewport as base64 PNG image for vision analysis",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "describe_scene",
                description: "Get natural language description of what's currently in the scene, including object relationships and materials",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            // ============================================
            // Legacy Tools (Fire-and-Forget)
            // ============================================
            {
                name: "spawn_object",
                description: "Spawn a new 3D object in the scene (box, sphere, plane)",
                inputSchema: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            enum: ["box", "sphere", "plane"],
                            description: "Type of object to spawn",
                        },
                    },
                    required: ["type"],
                },
            },
            {
                name: "modify_object",
                description: "Modify the currently selected object (color, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        color: {
                            type: "string",
                            description: "Hex color code (e.g. #ff0000)",
                        },
                    },
                },
            },
            {
                name: "attach_listener",
                description: "Attach an event listener to the selected object",
                inputSchema: {
                    type: "object",
                    properties: {
                        trigger: {
                            type: "string",
                            enum: ["start", "click", "hover", "collision"],
                            description: "Event trigger type",
                        },
                        action: {
                            type: "string",
                            enum: ["scale", "color", "move", "destroy"],
                            description: "Action to perform",
                        },
                    },
                    required: ["trigger", "action"],
                },
            },
            {
                name: "apply_modifier",
                description: "Apply a modifier to the selected object",
                inputSchema: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            enum: ["subdivide", "decimate", "wireframe"],
                            description: "Type of modifier to apply",
                        },
                        value: {
                            type: "number",
                            description: "Intensity or ratio of the modifier",
                        },
                    },
                    required: ["type"],
                },
            },
            {
                name: "import_asset",
                description: "Import an external 3D asset",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "URL or path to the asset",
                        },
                        format: {
                            type: "string",
                            enum: ["gltf", "obj", "fbx"],
                            description: "File format",
                        },
                    },
                    required: ["url"],
                },
            },
            {
                name: "play_animation",
                description: "Play an animation on the selected object",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the animation to play",
                        },
                        speed: {
                            type: "number",
                            description: "Playback speed (default 1)",
                        },
                    },
                    required: ["name"],
                },
            },
            {
                name: "get_scene_tree",
                description: "[Legacy] Get the current scene hierarchy (use get_scene_analysis for AI-powered version)",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "bake_model",
                description: "Bake the selected model (simulated optimization)",
                inputSchema: {
                    type: "object",
                    properties: {
                        resolution: {
                            type: "number",
                            description: "Texture resolution (e.g., 1024)",
                        },
                    },
                },
            },
            {
                name: "set_lod",
                description: "Configure LOD levels for the selected object",
                inputSchema: {
                    type: "object",
                    properties: {
                        levels: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    distance: { type: "number" },
                                    url: { type: "string" },
                                },
                                required: ["distance", "url"],
                            },
                        },
                    },
                    required: ["levels"],
                },
            },
            {
                name: "generate_parametric",
                description: "Generate a parametric surface using mathematical formulas",
                inputSchema: {
                    type: "object",
                    properties: {
                        x: { type: "string", description: "Formula for x (e.g., 'u')" },
                        y: { type: "string", description: "Formula for y (e.g., 'v')" },
                        z: { type: "string", description: "Formula for z (e.g., 'Math.sin(u*v)')" },
                        u_range: { type: "array", items: { type: "number" }, description: "[min, max] for u" },
                        v_range: { type: "array", items: { type: "number" }, description: "[min, max] for v" },
                    },
                    required: ["x", "y", "z"],
                },
            },
        ],
    };
});

// --- Tool Execution ---
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (!isConnected) {
        await connectToBridge();
    }

    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            // ============================================
            // NEW: AI-Powered Intelligent Tools
            // ============================================
            case "smart_edit": {
                const { command, useVision } = args;
                console.error(`Smart edit: "${command}" (vision: ${useVision || false})`);

                // Step 1: If vision is enabled, capture screenshot first
                let screenshot = null;
                if (useVision) {
                    console.error("Capturing screenshot for vision analysis...");
                    try {
                        const screenshotResponse = await sendRequest(OperationType.GET_SCREENSHOT, {});
                        screenshot = screenshotResponse.base64;
                        console.error(`Screenshot captured: ${screenshotResponse.width}x${screenshotResponse.height}`);
                    } catch (screenshotError) {
                        console.error("Warning: Failed to capture screenshot:", screenshotError.message);
                        // Continue without screenshot
                    }
                }

                // Step 2: Send AI command with optional screenshot
                // Use debate system for complex commands (longer than 50 chars)
                const useDebate = command.length > 50;
                console.error(`Sending AI command (debate: ${useDebate}, screenshot: ${screenshot ? 'yes' : 'no'})`);

                const response = await sendRequest(OperationType.SMART_EDIT, {
                    command,
                    useVision: useVision || false,
                    screenshot: screenshot,
                    useDebate: useDebate,
                });

                // Format the response
                const plan = response.plan;
                let resultText = `AI Execution Plan:\n`;
                resultText += `Approach: ${plan.approach}\n`;
                resultText += `Reasoning: ${plan.reasoning}\n`;
                resultText += `Commands: ${JSON.stringify(plan.commands, null, 2)}\n`;

                if (useVision && screenshot) {
                    resultText += `\nVision: Analyzed viewport screenshot`;
                }
                if (useDebate) {
                    resultText += `\nDebate: Multi-model consensus used`;
                }
                if (response.tokensUsed) {
                    resultText += `\nTokens used: ${response.tokensUsed}`;
                }
                if (response.cost) {
                    resultText += `\nCost: $${response.cost.totalCost}`;
                }

                return {
                    content: [{ type: "text", text: resultText }],
                };
            }

            case "get_scene_analysis": {
                console.error("Requesting scene analysis...");

                const response = await sendRequest(OperationType.GET_SCENE_GRAPH, {});

                let resultText = `Scene Analysis:\n`;
                resultText += `Objects: ${response.nodes?.length || 0}\n`;
                resultText += `Relationships: ${response.edges?.length || 0}\n\n`;
                resultText += `Summary: ${response.summary}\n\n`;

                if (response.nodes && response.nodes.length > 0) {
                    resultText += `Objects:\n`;
                    for (const node of response.nodes) {
                        resultText += `  - ${node.name} (${node.type}) at [${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)}]\n`;
                    }
                }

                if (response.edges && response.edges.length > 0) {
                    resultText += `\nRelationships:\n`;
                    for (const edge of response.edges) {
                        resultText += `  - ${edge.source} ${edge.relation.replace(/_/g, ' ')} ${edge.target} (confidence: ${edge.confidence})\n`;
                    }
                }

                return {
                    content: [{ type: "text", text: resultText }],
                };
            }

            case "get_screenshot": {
                console.error("Requesting viewport screenshot...");

                const response = await sendRequest(OperationType.GET_SCREENSHOT, {});

                return {
                    content: [
                        {
                            type: "image",
                            data: response.base64,
                            mimeType: "image/png",
                        },
                        {
                            type: "text",
                            text: `Screenshot captured: ${response.width}x${response.height}`,
                        },
                    ],
                };
            }

            case "describe_scene": {
                console.error("Requesting scene description...");

                // Get scene analysis first
                const sceneGraph = await sendRequest(OperationType.GET_SCENE_GRAPH, {});

                // Return the natural language summary
                return {
                    content: [{
                        type: "text",
                        text: sceneGraph.summary || "The scene appears to be empty or could not be analyzed.",
                    }],
                };
            }

            // ============================================
            // Legacy Tools (Fire-and-Forget)
            // ============================================
            case "spawn_object": {
                const { type } = args;
                sendToEditor({ type: "ADD_OBJECT", payload: { type } });
                return {
                    content: [{ type: "text", text: `Spawned object of type: ${type}` }],
                };
            }

            case "modify_object": {
                const { color } = args;
                if (color) {
                    sendToEditor({ type: "UPDATE_OBJECT", payload: { color } });
                }
                return {
                    content: [{ type: "text", text: `Modified object properties` }],
                };
            }

            case "attach_listener": {
                const { trigger, action } = args;
                sendToEditor({ type: "ADD_EVENT", payload: { trigger, action } });
                return {
                    content: [{ type: "text", text: `Attached listener: ${trigger} -> ${action}` }],
                };
            }

            case "apply_modifier": {
                const { type, value } = args;
                sendToEditor({ type: "APPLY_MODIFIER", payload: { type, value } });
                return {
                    content: [{ type: "text", text: `Applied modifier: ${type}` }],
                };
            }

            case "import_asset": {
                const { url, format } = args;
                sendToEditor({ type: "IMPORT_ASSET", payload: { url, format } });
                return {
                    content: [{ type: "text", text: `Imported asset from: ${url}` }],
                };
            }

            case "get_scene_tree": {
                // Now uses request-response pattern
                try {
                    const response = await sendRequest(OperationType.GET_SCENE_GRAPH, {});
                    return {
                        content: [{
                            type: "text",
                            text: `Scene tree:\n${JSON.stringify(response.nodes, null, 2)}`,
                        }],
                    };
                } catch (err) {
                    // Fallback to fire-and-forget
                    sendToEditor({ type: "GET_SCENE_TREE" });
                    return {
                        content: [{ type: "text", text: "Requested scene tree (check editor console)" }],
                    };
                }
            }

            case "play_animation": {
                const { name: animName, speed } = args;
                sendToEditor({ type: "PLAY_ANIMATION", payload: { name: animName, speed: speed || 1 } });
                return {
                    content: [{ type: "text", text: `Playing animation: ${animName}` }],
                };
            }

            case "bake_model": {
                sendToEditor({ type: "BAKE_MODEL", payload: { resolution: args.resolution || 1024 } });
                return {
                    content: [{ type: "text", text: "Model baking started..." }],
                };
            }

            case "set_lod": {
                const { levels } = args;
                sendToEditor({ type: "SET_LOD", payload: { levels } });
                return {
                    content: [{ type: "text", text: `LOD configured with ${levels.length} levels` }],
                };
            }

            case "generate_parametric": {
                const { x, y, z, u_range, v_range } = args;
                sendToEditor({
                    type: "GENERATE_PARAMETRIC",
                    payload: {
                        formula: { x, y, z, uRange: u_range || [0, 1], vRange: v_range || [0, 1] }
                    }
                });
                return {
                    content: [{ type: "text", text: "Generating parametric surface..." }],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

// --- Start Server ---
async function main() {
    await connectToBridge();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Bisect MCP Server v2.0 running on stdio (with AI tools)");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
