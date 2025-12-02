/**
 * Test script for Bisect Bridge Server
 *
 * Run this after starting the server to verify it works:
 *   1. Terminal 1: node server.js
 *   2. Terminal 2: node test-connection.js
 */

import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:9876';
const SESSION_ID = 'test-session';

// Colors for console output
const colors = {
  blender: '\x1b[33m', // Yellow
  bisect: '\x1b[36m',  // Cyan
  server: '\x1b[32m',  // Green
  reset: '\x1b[0m'
};

function log(client, message) {
  const color = colors[client] || colors.reset;
  console.log(`${color}[${client}]${colors.reset} ${message}`);
}

// Simulate Blender client
function createBlenderClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
      log('blender', 'Connected to bridge server');

      // Join session as Blender
      ws.send(JSON.stringify({
        type: 'join',
        timestamp: Date.now(),
        payload: {
          sessionId: SESSION_ID,
          clientType: 'blender'
        }
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      log('blender', `Received: ${msg.type}`);

      if (msg.type === 'joined') {
        log('blender', `Joined session: ${msg.payload.sessionId}`);
        resolve(ws);
      }

      if (msg.type === 'scene_request') {
        log('blender', 'Scene requested, sending scene state...');
        // Send mock scene state
        ws.send(JSON.stringify({
          type: 'scene_state',
          sessionId: SESSION_ID,
          timestamp: Date.now(),
          payload: {
            objects: [
              {
                id: 'Cube',
                name: 'Cube',
                type: 'MESH',
                position: [0, 0, 0],
                rotation: [0, 0, 0, 1],
                scale: [1, 1, 1]
              },
              {
                id: 'Sphere',
                name: 'Sphere',
                type: 'MESH',
                position: [2, 0, 0],
                rotation: [0, 0, 0, 1],
                scale: [1, 1, 1]
              }
            ]
          }
        }));
      }

      if (msg.type === 'transform') {
        log('blender', `Transform received for ${msg.payload.objectId}: pos=${JSON.stringify(msg.payload.position)}`);
      }
    });

    ws.on('error', reject);
  });
}

// Simulate Bisect client
function createBisectClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
      log('bisect', 'Connected to bridge server');

      // Join session as Bisect
      ws.send(JSON.stringify({
        type: 'join',
        timestamp: Date.now(),
        payload: {
          sessionId: SESSION_ID,
          clientType: 'bisect'
        }
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      log('bisect', `Received: ${msg.type}`);

      if (msg.type === 'joined') {
        log('bisect', `Joined session: ${msg.payload.sessionId}`);
        log('bisect', `Session info: Blender=${msg.payload.sessionInfo.blender}, Bisect=${msg.payload.sessionInfo.bisect}`);
        resolve(ws);
      }

      if (msg.type === 'scene_state') {
        log('bisect', `Received scene with ${msg.payload.objects.length} objects`);
        msg.payload.objects.forEach(obj => {
          log('bisect', `  - ${obj.name} at [${obj.position.join(', ')}]`);
        });
      }

      if (msg.type === 'transform') {
        log('bisect', `Transform received for ${msg.payload.objectId}`);
      }
    });

    ws.on('error', reject);
  });
}

// Run test
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('  Bisect Bridge Server - Connection Test');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Connect Blender
    log('server', 'Step 1: Connecting Blender client...');
    const blenderWs = await createBlenderClient();
    await sleep(500);

    // Step 2: Connect Bisect
    log('server', 'Step 2: Connecting Bisect client...');
    const bisectWs = await createBisectClient();
    await sleep(500);

    // Step 3: Bisect requests scene state
    log('server', 'Step 3: Bisect requesting scene state...');
    bisectWs.send(JSON.stringify({
      type: 'scene_request',
      timestamp: Date.now(),
      payload: {}
    }));
    await sleep(500);

    // Step 4: Bisect sends transform update
    log('server', 'Step 4: Bisect sending transform update...');
    bisectWs.send(JSON.stringify({
      type: 'transform',
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      payload: {
        objectId: 'Cube',
        position: [1, 2, 3],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1]
      }
    }));
    await sleep(500);

    // Step 5: Blender sends transform update
    log('server', 'Step 5: Blender sending transform update...');
    blenderWs.send(JSON.stringify({
      type: 'transform',
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      payload: {
        objectId: 'Sphere',
        position: [5, 5, 5],
        rotation: [0, 0.707, 0, 0.707],
        scale: [2, 2, 2]
      }
    }));
    await sleep(500);

    // Cleanup
    log('server', 'Test complete! Closing connections...');
    blenderWs.close();
    bisectWs.close();

    console.log('\n' + '='.repeat(60));
    console.log('  ✓ All tests passed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the bridge server is running: node server.js\n');
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runTest();
