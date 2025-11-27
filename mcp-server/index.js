#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { z } = require("zod");
const WebSocket = require("ws");

// --- Bridge Connection ---
const BRIDGE_URL = "ws://localhost:8080";
let bridgeSocket = null;
let isConnected = false;

function connectToBridge() {
    return new Promise((resolve, reject) => {
        bridgeSocket = new WebSocket(BRIDGE_URL);

        bridgeSocket.on("open", () => {
            console.error("Connected to Bisect Bridge");
            isConnected = true;
            resolve();
        });

        bridgeSocket.on("error", (err) => {
            console.error("Bridge connection error:", err.message);
            isConnected = false;
            // Don't reject, just log, so server stays alive
        });

        bridgeSocket.on("close", () => {
            console.error("Bridge disconnected");
            isConnected = false;
        });
    });
}

function sendToEditor(command) {
    if (!isConnected || !bridgeSocket) {
        throw new Error("Not connected to Bisect Editor Bridge");
    }
    bridgeSocket.send(JSON.stringify({ type: "CLI_COMMAND", command }));
}

// --- MCP Server Setup ---
const server = new Server(
    {
        name: "bisect-mcp-server",
        version: "1.0.0",
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
                description: "Get the current scene hierarchy",
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
                // In a real implementation, we would request this from the editor via WebSocket
                // and wait for a response. For now, we'll send a request and return a placeholder
                // or implement a request-response pattern if possible.
                // Since sendToEditor is fire-and-forget, we can't easily return the data here
                // without a more complex async setup.
                // We'll just trigger a log in the editor for now.
                sendToEditor({ type: "GET_SCENE_TREE" });
                return {
                    content: [{ type: "text", text: "Requested scene tree (check editor console)" }],
                };
            }

            case "play_animation": {
                const { name, speed } = args;
                sendToEditor({ type: "PLAY_ANIMATION", payload: { name, speed: speed || 1 } });
                return {
                    content: [{ type: "text", text: `Playing animation: ${name}` }],
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
    console.error("Bisect MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
