const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Connected clients
let editorSocket = null;
let mcpSocket = null;
let cliSockets = new Set();

console.log('Bisect Bridge Server v2.0 running on ws://localhost:8080');
console.log('Waiting for connections...');

wss.on('connection', function connection(ws) {
    console.log('New connection established');

    ws.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('Failed to parse message:', e);
            return;
        }

        // Handle registration
        if (data.type === 'REGISTER_EDITOR') {
            console.log('✅ Editor connected');
            editorSocket = ws;
            return;
        }

        if (data.type === 'REGISTER_MCP') {
            console.log('✅ MCP server connected');
            mcpSocket = ws;
            return;
        }

        if (data.type === 'REGISTER_CLI') {
            console.log('✅ CLI client connected');
            cliSockets.add(ws);
            return;
        }

        // Handle REQUEST messages (MCP -> Editor)
        if (data.type === 'REQUEST') {
            console.log(`📤 Request ${data.id}: ${data.operation}`);

            if (editorSocket && editorSocket.readyState === WebSocket.OPEN) {
                // Forward request to editor
                editorSocket.send(JSON.stringify(data));
            } else {
                console.log('⚠️ Editor not connected - sending error response');
                // Send error response back to MCP
                const errorResponse = {
                    id: data.id,
                    type: 'RESPONSE',
                    success: false,
                    data: null,
                    error: 'Editor not connected',
                    timestamp: Date.now()
                };
                ws.send(JSON.stringify(errorResponse));
            }
            return;
        }

        // Handle RESPONSE messages (Editor -> MCP)
        if (data.type === 'RESPONSE') {
            console.log(`📥 Response ${data.id}: ${data.success ? 'success' : 'error'}`);

            if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) {
                // Forward response to MCP server
                mcpSocket.send(JSON.stringify(data));
            } else {
                console.log('⚠️ MCP server not connected - response dropped');
            }
            return;
        }

        // Handle legacy CLI_COMMAND (fire-and-forget)
        if (data.type === 'CLI_COMMAND') {
            console.log('🔧 CLI Command:', data.command?.type || 'unknown');

            if (editorSocket && editorSocket.readyState === WebSocket.OPEN) {
                editorSocket.send(JSON.stringify(data.command));
            } else {
                console.log('⚠️ Editor not connected');
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Editor not connected' }));
            }
            return;
        }

        // Handle direct editor messages (legacy format)
        if (editorSocket && editorSocket.readyState === WebSocket.OPEN) {
            console.log('📨 Forwarding message to editor');
            editorSocket.send(JSON.stringify(data));
        }
    });

    ws.on('close', () => {
        if (ws === editorSocket) {
            console.log('❌ Editor disconnected');
            editorSocket = null;
        }
        if (ws === mcpSocket) {
            console.log('❌ MCP server disconnected');
            mcpSocket = null;
        }
        if (cliSockets.has(ws)) {
            console.log('❌ CLI client disconnected');
            cliSockets.delete(ws);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
});

// Status logging
setInterval(() => {
    const status = [];
    if (editorSocket && editorSocket.readyState === WebSocket.OPEN) status.push('Editor');
    if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) status.push('MCP');
    if (cliSockets.size > 0) status.push(`CLI(${cliSockets.size})`);
    if (status.length > 0) {
        // Only log periodically if there are connections
        // console.log(`Active: ${status.join(', ')}`);
    }
}, 30000);

console.log('\n=== Bisect Developer Tools ===');
console.log('');
console.log('Usage:');
console.log('  1. Start this server: node cli/server.js');
console.log('  2. Open Next.js app: pnpm dev, then visit /studio/3d-canvas');
console.log('  3. Use CLI: bisect add box, bisect ai "arrange in circle"');
console.log('  4. Or run MCP server: node mcp-server/index.js');
console.log('');
console.log('CLI Commands:');
console.log('  bisect add <type>           Add primitive (box, sphere, plane, etc.)');
console.log('  bisect color <hex>          Set object color');
console.log('  bisect material <preset>    Apply material preset');
console.log('  bisect event <trigger> <action>  Add event listener');
console.log('  bisect ai "<instruction>"   AI-powered editing');
console.log('  bisect scene                Get scene info');
console.log('  bisect export <file>        Export scene');
console.log('  bisect run <script.bisect>  Run script file');
console.log('');
console.log('For full CLI help: bisect --help');
console.log('');
