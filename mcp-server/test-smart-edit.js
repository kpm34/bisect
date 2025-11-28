#!/usr/bin/env node

/**
 * Test script for MCP Bridge Smart Edit
 *
 * This script tests the bidirectional MCP bridge by:
 * 1. Connecting to the WebSocket bridge
 * 2. Sending a smart_edit command
 * 3. Sending a get_scene_analysis command
 *
 * Run with: node mcp-server/test-smart-edit.js
 *
 * Prerequisites:
 * - Bridge server running: node cli/server.js
 * - Next.js app open in browser (connects to bridge)
 */

const WebSocket = require('ws');
const {
    createRequest,
    isResponse,
    OperationType,
    parseMessage,
    serializeMessage,
} = require('./protocol.js');

const BRIDGE_URL = 'ws://localhost:8080';
const REQUEST_TIMEOUT_MS = 30000;

// Pending requests map
const pendingRequests = new Map();

// WebSocket connection
let ws = null;

/**
 * Connect to the bridge
 */
function connect() {
    return new Promise((resolve, reject) => {
        console.log(`\n🔌 Connecting to bridge at ${BRIDGE_URL}...`);

        ws = new WebSocket(BRIDGE_URL);

        ws.on('open', () => {
            console.log('✅ Connected to bridge');
            // Register as MCP client
            ws.send(JSON.stringify({ type: 'REGISTER_MCP' }));
            console.log('✅ Registered as MCP client\n');
            resolve();
        });

        ws.on('message', (data) => {
            handleMessage(data.toString());
        });

        ws.on('error', (err) => {
            console.error('❌ WebSocket error:', err.message);
            reject(err);
        });

        ws.on('close', () => {
            console.log('\n🔌 Disconnected from bridge');
        });

        // Timeout connection attempt
        setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                reject(new Error('Connection timeout'));
            }
        }, 5000);
    });
}

/**
 * Handle incoming messages
 */
function handleMessage(data) {
    const message = parseMessage(data);
    if (!message) {
        console.error('Failed to parse message');
        return;
    }

    console.log('📥 Received:', JSON.stringify(message).substring(0, 200) + '...');

    if (isResponse(message)) {
        const pending = pendingRequests.get(message.id);
        if (pending) {
            clearTimeout(pending.timeout);
            pendingRequests.delete(message.id);

            if (message.success) {
                pending.resolve(message.data);
            } else {
                pending.reject(new Error(message.error || 'Request failed'));
            }
        }
    }
}

/**
 * Send a request and wait for response
 */
function sendRequest(operation, payload = {}) {
    return new Promise((resolve, reject) => {
        const request = createRequest(operation, payload);
        console.log(`📤 Sending ${operation}: ${request.id}`);

        const timeout = setTimeout(() => {
            pendingRequests.delete(request.id);
            reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
        }, REQUEST_TIMEOUT_MS);

        pendingRequests.set(request.id, { resolve, reject, timeout });

        ws.send(serializeMessage(request));
    });
}

/**
 * Test smart_edit command
 */
async function testSmartEdit() {
    console.log('═'.repeat(60));
    console.log('TEST 1: smart_edit - "make the selected object look like brushed gold metal"');
    console.log('═'.repeat(60));

    try {
        const result = await sendRequest(OperationType.SMART_EDIT, {
            command: 'make the selected object look like brushed gold metal',
            useVision: false,
            useDebate: true,
        });

        console.log('\n✅ Smart Edit Result:');
        console.log('─'.repeat(40));
        if (result.plan) {
            console.log('Approach:', result.plan.approach);
            console.log('Reasoning:', result.plan.reasoning);
            console.log('Commands:', JSON.stringify(result.plan.commands, null, 2));
        }
        if (result.tokensUsed) {
            console.log('Tokens used:', result.tokensUsed);
        }
        if (result.cost) {
            console.log('Cost:', result.cost.totalCost);
        }
        console.log('─'.repeat(40));
        return true;
    } catch (error) {
        console.error('\n❌ Smart Edit Failed:', error.message);
        return false;
    }
}

/**
 * Test get_scene_analysis command
 */
async function testSceneAnalysis() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('TEST 2: get_scene_analysis');
    console.log('═'.repeat(60));

    try {
        const result = await sendRequest(OperationType.GET_SCENE_GRAPH, {});

        console.log('\n✅ Scene Analysis Result:');
        console.log('─'.repeat(40));

        if (result.nodes) {
            console.log(`Objects (${result.nodes.length}):`);
            for (const node of result.nodes.slice(0, 10)) {
                const pos = node.position;
                console.log(`  - ${node.name} (${node.type}) at [${pos?.x?.toFixed(1) || 0}, ${pos?.y?.toFixed(1) || 0}, ${pos?.z?.toFixed(1) || 0}]`);
            }
            if (result.nodes.length > 10) {
                console.log(`  ... and ${result.nodes.length - 10} more`);
            }
        }

        if (result.edges && result.edges.length > 0) {
            console.log(`\nRelationships (${result.edges.length}):`);
            for (const edge of result.edges.slice(0, 5)) {
                console.log(`  - ${edge.source} ${edge.relation.replace(/_/g, ' ')} ${edge.target}`);
            }
        }

        if (result.summary) {
            console.log('\nSummary:', result.summary);
        }

        console.log('─'.repeat(40));
        return true;
    } catch (error) {
        console.error('\n❌ Scene Analysis Failed:', error.message);
        return false;
    }
}

/**
 * Test get_screenshot command
 */
async function testScreenshot() {
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('TEST 3: get_screenshot');
    console.log('═'.repeat(60));

    try {
        const result = await sendRequest(OperationType.GET_SCREENSHOT, {});

        console.log('\n✅ Screenshot Result:');
        console.log('─'.repeat(40));
        console.log('Width:', result.width);
        console.log('Height:', result.height);
        console.log('Base64 length:', result.base64?.length || 0, 'characters');
        console.log('─'.repeat(40));
        return true;
    } catch (error) {
        console.error('\n❌ Screenshot Failed:', error.message);
        return false;
    }
}

/**
 * Main test runner
 */
async function main() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           MCP BRIDGE SMART EDIT TEST SUITE                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\nPrerequisites:');
    console.log('  1. Bridge server: node cli/server.js');
    console.log('  2. Next.js app open in browser at http://localhost:3000/studio/3d-canvas');
    console.log('  3. A 3D scene loaded with at least one object');

    try {
        await connect();

        // Wait a moment for connection to stabilize
        await new Promise(r => setTimeout(r, 500));

        const results = {
            smartEdit: false,
            sceneAnalysis: false,
            screenshot: false,
        };

        // Run tests
        results.sceneAnalysis = await testSceneAnalysis();
        results.screenshot = await testScreenshot();
        results.smartEdit = await testSmartEdit();

        // Summary
        console.log('\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                      TEST SUMMARY                          ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`  Scene Analysis: ${results.sceneAnalysis ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Screenshot:     ${results.screenshot ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Smart Edit:     ${results.smartEdit ? '✅ PASS' : '❌ FAIL'}`);

        const passed = Object.values(results).filter(r => r).length;
        const total = Object.values(results).length;
        console.log(`\n  Total: ${passed}/${total} tests passed`);

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('  1. Is the bridge server running? (node cli/server.js)');
        console.log('  2. Is the Next.js app open in a browser?');
        console.log('  3. Is a 3D scene loaded?');
    } finally {
        if (ws) {
            ws.close();
        }
        process.exit(0);
    }
}

// Run tests
main();
