const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let editorSocket = null;

console.log('Bisect Bridge Server running on ws://localhost:8080');

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        if (data.type === 'REGISTER_EDITOR') {
            console.log('Editor connected');
            editorSocket = ws;
        } else if (data.type === 'CLI_COMMAND') {
            console.log('CLI Command received:', data.command);
            if (editorSocket && editorSocket.readyState === WebSocket.OPEN) {
                editorSocket.send(JSON.stringify(data.command));
            } else {
                console.log('Editor not connected');
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Editor not connected' }));
            }
        }
    });

    ws.on('close', () => {
        if (ws === editorSocket) {
            console.log('Editor disconnected');
            editorSocket = null;
        }
    });
});
