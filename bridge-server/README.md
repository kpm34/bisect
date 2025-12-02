# Bisect Bridge Server

WebSocket server enabling real-time synchronization between Blender and the Bisect 3D Editor.

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐     WebSocket     ┌─────────────┐
│   Blender   │ ←───────────────→  │   Bridge    │ ←───────────────→ │   Bisect    │
│  (Add-on)   │                    │   Server    │                   │  (Browser)  │
└─────────────┘                    └─────────────┘                   └─────────────┘
```

## Quick Start

### 1. Start the Bridge Server

```bash
cd bridge-server
npm install   # or: pnpm install
npm start     # or: node server.js
```

The server runs on port `9876` by default. Use `BRIDGE_PORT` env var or CLI arg to change:

```bash
BRIDGE_PORT=8080 npm start
# or
node server.js 8080
```

### 2. Install Blender Add-on

1. Install the `websocket-client` Python package in Blender:
   ```bash
   /Applications/Blender.app/Contents/Resources/4.x/python/bin/python3.11 -m pip install websocket-client
   ```

2. In Blender: **Edit → Preferences → Add-ons → Install...**

3. Select `blender-addon/bisect_sync.py`

4. Enable "Bisect Sync" add-on

### 3. Connect from Blender

1. Open **View → Sidebar → Bisect** tab
2. Enter a session ID (e.g., `my-project`)
3. Click **Connect**

### 4. Connect from Bisect

Use the `useBlenderSync` hook in your React component:

```tsx
import { useBlenderSync } from '@/hooks/useBlenderSync';

function Scene3D() {
  const { connect, disconnect, isConnected, sendTransform } = useBlenderSync({
    sessionId: 'my-project',
    onTransform: (objectId, transform) => {
      // Apply transform from Blender to your Three.js scene
      const mesh = scene.getObjectByName(objectId);
      if (mesh) {
        mesh.position.set(...transform.position);
        mesh.quaternion.set(...transform.rotation);
        mesh.scale.set(...transform.scale);
      }
    },
    onSceneState: (objects) => {
      console.log('Received scene from Blender:', objects);
    },
  });

  return (
    <button onClick={() => connect()}>
      {isConnected ? 'Connected' : 'Connect to Blender'}
    </button>
  );
}
```

## Protocol

Messages are JSON objects with this structure:

```json
{
  "type": "transform",
  "sessionId": "my-project",
  "timestamp": 1699999999999,
  "payload": {
    "objectId": "Cube",
    "position": [1.0, 2.0, 3.0],
    "rotation": [0.0, 0.0, 0.0, 1.0],
    "scale": [1.0, 1.0, 1.0]
  }
}
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `join` | Client → Server | Join a session |
| `leave` | Client → Server | Leave current session |
| `ping`/`pong` | Both | Keep-alive |
| `transform` | Both | Single object transform update |
| `transform_batch` | Both | Multiple transforms in one message |
| `scene_state` | Blender → Bisect | Full scene snapshot |
| `scene_request` | Bisect → Blender | Request scene state |
| `object_add` | Both | New object added |
| `object_delete` | Both | Object deleted |
| `object_select` | Both | Selection changed |
| `material_assign` | Both | Material applied to object |

## Session Management

- Clients join sessions by sending a `join` message with `sessionId` and `clientType`
- Multiple Blender and Bisect clients can join the same session
- Messages are broadcast to all other clients in the same session
- Empty sessions are automatically cleaned up

## Development

```bash
# Run with auto-reload
npm run dev

# Check session stats
# Server logs active sessions every 60 seconds
```

## Files

```
bridge-server/
├── server.js           # Main WebSocket server
├── protocol.js         # Message types and helpers
├── package.json
├── README.md
└── blender-addon/
    └── bisect_sync.py  # Blender add-on
```
