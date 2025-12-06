# Developer Tools

## Overview

Bisect provides a complete developer toolkit for automation, integration, and extension:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER TOOLKIT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     ┌─────────────┐     ┌─────────────┐          │
│   │   CLI   │────▶│   Bridge    │────▶│   Editor    │          │
│   │ bisect  │     │  WebSocket  │     │  3D Studio  │          │
│   └─────────┘     └─────────────┘     └─────────────┘          │
│                          │                    │                  │
│                          ▼                    ▼                  │
│                   ┌─────────────┐     ┌─────────────┐          │
│                   │ MCP Server  │────▶│  Blender    │          │
│                   │  AI Tools   │     │    MCP      │          │
│                   └─────────────┘     └─────────────┘          │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                     REST APIs                            │  │
│   │  /api/configurator  /api/webhooks  /api/ai  /api/tex    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CLI Tool (`cli/bisect.js`)

Command-line interface for scripting and automation.

### Installation

```bash
# From project root
cd cli
npm link  # Makes 'bisect' available globally
```

### Commands

| Category | Command | Description |
|----------|---------|-------------|
| **Objects** | `add <type>` | Add primitive (box, sphere, plane, cylinder, cone, torus, text) |
| | `select <name>` | Select object by name |
| | `delete [name]` | Delete selected or named object |
| **Transform** | `move <x,y,z>` | Move object to position |
| | `rotate <x,y,z>` | Rotate object (degrees) |
| | `scale <x,y,z>` | Scale object |
| **Appearance** | `color <hex>` | Set object color |
| | `material <preset>` | Apply material from 600+ presets |
| | `opacity <0-1>` | Set transparency |
| **Events** | `event <trigger> <action>` | Add event listener |
| **Animation** | `animate <name>` | Play animation |
| | `stop-animation` | Stop current animation |
| **Cloner** | `clone` | Create cloner for instancing |
| **AI** | `ai "<instruction>"` | Natural language editing |
| | `arrange <pattern>` | Arrange objects (grid, circle, spiral) |
| **Scene** | `scene` | Get scene info |
| | `screenshot [file]` | Capture viewport |
| | `save <file>` | Save scene |
| | `load <file>` | Load scene |
| **Import/Export** | `import <file>` | Import 3D asset |
| | `export <file>` | Export scene |
| **Utility** | `run <file>` | Run script file |
| | `status` | Check connection |
| | `list-materials` | List available materials |

### Scripting

Create `.bisect` script files:

```bash
# setup.bisect
add box
color #3498db
event hover glow
animate float 0.8

add sphere
color #e74c3c
event click bounce
```

Run with:
```bash
bisect run setup.bisect
```

### Architecture

```
CLI (bisect.js)
     │
     ▼ WebSocket
Bridge Server (server.js) ◀─────▶ Editor (3D Studio)
     │
     ▼
MCP Server (optional)
```

---

## WebSocket Bridge (`cli/server.js`)

Bidirectional communication hub between CLI, Editor, and MCP.

### Endpoint

```
ws://localhost:8080
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `REGISTER_EDITOR` | Editor → Bridge | Register editor connection |
| `REGISTER_MCP` | MCP → Bridge | Register MCP server |
| `REQUEST` | Any → Bridge | Send request (routed to target) |
| `RESPONSE` | Any → Bridge | Response to request |
| `CLI_COMMAND` | CLI → Bridge | Execute CLI command in editor |

### Message Format

```typescript
interface BridgeMessage {
  type: 'REGISTER_EDITOR' | 'REGISTER_MCP' | 'REQUEST' | 'RESPONSE' | 'CLI_COMMAND';
  id?: string;           // Request ID for matching responses
  command?: string;      // CLI command name
  args?: any;            // Command arguments
  source?: string;       // Origin identifier
  target?: 'editor' | 'mcp';  // Routing target
  data?: any;            // Payload
}
```

### Starting the Bridge

```bash
cd cli
node server.js
# Bridge server running on ws://localhost:8080
```

---

## MCP Server (`mcp-server/index.js`)

Model Context Protocol server with AI-powered scene manipulation tools.

### Connection

```
Stdio transport (for Claude Code integration)
```

### AI Tools (v2.1)

| Tool | Description | Parameters |
|------|-------------|------------|
| `smart_edit` | AI-powered scene editing | `command: string, useVision?: boolean` |
| `get_scene_analysis` | Get AI analysis with relationships | - |
| `get_screenshot` | Capture viewport screenshot | - |
| `describe_scene` | Natural language scene description | - |

### Object Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `spawn_object` | Create primitive | `type: box/sphere/plane` |
| `select_object` | Select by name | `name: string` |
| `delete_object` | Delete object | `name?: string` |
| `modify_object` | Update properties | `color, position, scale, rotation` |

### Material Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `set_material` | Apply material preset | `preset: string, category?: string` |

### Arrangement Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `arrange_objects` | Pattern arrangement | `pattern: grid/circle/spiral/scatter, count, radius, spacing` |
| `create_cloner` | Instancing cloner | `mode: linear/radial/grid/scatter/spline/object, count, spacing` |

### Scene Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `add_hotspot` | Add 3D annotation | `position, title, content, attachTo` |
| `export_scene` | Export to format | `format: glb/gltf/react/threejs, path, options` |
| `import_asset` | Import 3D file | `url, format` |

### Integration Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `configure_product` | Product configurator | `productId, selections` |
| `trigger_blender` | Blender MCP command | `operation: render/bake_physics/export_glb/apply_material` |

### Legacy Tools

| Tool | Description |
|------|-------------|
| `attach_listener` | Add event listener |
| `apply_modifier` | Mesh modifier |
| `play_animation` | Play animation |
| `bake_model` | Model optimization |
| `set_lod` | LOD configuration |
| `generate_parametric` | Parametric surface |

### Example: Claude Code Integration

```bash
# In Claude Code config
{
  "mcpServers": {
    "bisect": {
      "command": "node",
      "args": ["/path/to/Bisect/mcp-server/index.js"]
    }
  }
}
```

Usage in Claude:
```
"Use the smart_edit tool to arrange all cubes in a circle"
```

---

## REST APIs

### Materials API (`/api/materials`)

Access the 600+ material preset library.

**GET /api/materials**
```bash
# List all materials
curl http://localhost:3000/api/materials

# Filter by category
curl http://localhost:3000/api/materials?category=metal

# Search materials
curl http://localhost:3000/api/materials?search=gold
```

**POST /api/materials**
```typescript
// Get material details
{ action: 'get_details', preset: 'gold-polished', category: 'metal' }

// Apply material
{ action: 'apply', preset: 'marble-white', objectId: 'cube-1' }

// Get recommendations
{ action: 'recommend', description: 'luxury modern look', style: 'premium' }
```

---

### AI API (`/api/ai`)

AI agent orchestration and routing.

**GET /api/ai** - Get available agents and capabilities

**POST /api/ai**
```typescript
// Smart edit (routes to appropriate agent)
{ action: 'smart_edit', instruction: 'arrange all objects in a circle' }

// Analyze scene
{ action: 'analyze_scene', context: { objects: [...] } }

// Material suggestions
{ action: 'suggest_materials', options: { style: 'modern', objectType: 'furniture' } }

// Plan arrangement
{ action: 'plan_arrangement', options: { pattern: 'grid', count: 9 } }

// Multi-model debate
{ action: 'debate', instruction: 'complex multi-step instruction...' }
```

**Available Agents:**
- `gemini-spatial` - Arrangements and transformations
- `material-agent` - Material selection with RAG
- `scene-graph-builder` - Scene analysis
- `claude-blender` - Blender operations
- `agent-debate` - Multi-model consensus

---

### Configurator API (`/api/configurator`)

Product configuration and e-commerce integration.

**Endpoint:** `POST /api/configurator`

**Actions:**

| Action | Description | Payload |
|--------|-------------|---------|
| `calculate_price` | Calculate variant price | `{ productId, selections }` |
| `add_to_cart` | Add configured product to cart | `{ productId, variantId, quantity }` |
| `checkout` | Initiate checkout | `{ cartId, platform }` |
| `sync_product` | Sync with e-commerce platform | `{ productId, platform }` |
| `get_inventory` | Check inventory levels | `{ productId, variantId }` |

**Supported Platforms:**
- Shopify
- WooCommerce
- BigCommerce

**Example:**

```typescript
const response = await fetch('/api/configurator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'calculate_price',
    productId: 'helmet-pro',
    selections: {
      color: 'metallic-gold',
      finish: 'glossy',
      decals: ['stripe-center', 'logo-front']
    }
  })
});

const { price, breakdown } = await response.json();
// { price: 149.99, breakdown: { base: 99.99, finish: 30, decals: 20 } }
```

---

### Webhooks API (`/api/webhooks/scene/[webhookId]`)

Real-time scene event notifications.

**Endpoint:** `POST /api/webhooks/scene/:webhookId`

**Security:**
- HMAC signature verification
- Header: `X-Webhook-Signature`

**Supported Events:**
- `object.created`
- `object.modified`
- `object.deleted`
- `scene.saved`
- `material.applied`
- `animation.triggered`

**Payload Format:**

```typescript
interface WebhookPayload {
  event: string;
  timestamp: number;
  data: {
    sceneId: string;
    objectId?: string;
    changes?: object;
    metadata?: object;
  };
}
```

**Example: Register Webhook**

```typescript
// In your external service
const webhookUrl = 'https://your-service.com/bisect-webhook';
const webhookSecret = 'your-secret-key';

// Verify incoming webhooks
function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(payload);
  return hmac.digest('hex') === signature;
}
```

---

### Texture Factory API (`/api/tex-factory/generate`)

AI texture generation using Gemini image generation.

**Endpoint:** `POST /api/tex-factory/generate`

**Request Body:**

```typescript
{
  prompt: string;        // Description of the texture (required)
  mode: 'MATCAP' | 'PBR'; // Texture type (required)
  quality?: 'FAST' | 'HIGH'; // Generation quality (default: HIGH)
  resolution?: '1K' | '2K';  // Output resolution (default: 1K)
}
```

**Response:**

```typescript
{
  id: string;           // Unique texture ID
  mode: 'MATCAP' | 'PBR';
  prompt: string;
  albedo: string;       // Base64 data URI of generated texture
  timestamp: number;    // Unix timestamp
  resolution: '1K' | '2K';
}
```

**Example:**

```typescript
// Generate a MatCap texture
const response = await fetch('/api/tex-factory/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'weathered bronze metal with green patina',
    mode: 'MATCAP',
    quality: 'HIGH',
    resolution: '1K'
  })
});

const { id, albedo } = await response.json();
// albedo = 'data:image/png;base64,...'

// Generate a PBR texture
const pbrResponse = await fetch('/api/tex-factory/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'rough concrete with cracks',
    mode: 'PBR',
    resolution: '2K'
  })
});
// Note: Normal/roughness maps are generated client-side from albedo
```

**Notes:**
- Uses Gemini 2.0 Flash with image generation capabilities
- PBR normal and roughness maps should be generated client-side from the albedo
- For interactive generation with live preview, use the UI at `/studio/tex-factory`

---

## Integration Patterns

### 1. CLI Automation Script

```bash
#!/bin/bash
# deploy-scene.sh

# Start bridge server
node cli/server.js &
BRIDGE_PID=$!

# Wait for bridge
sleep 2

# Run setup script
bisect run scenes/product-showcase.bisect

# Export scene
curl -X POST http://localhost:3000/api/configurator \
  -H "Content-Type: application/json" \
  -d '{"action": "sync_product", "productId": "showcase", "platform": "shopify"}'

# Cleanup
kill $BRIDGE_PID
```

### 2. CI/CD Integration

```yaml
# .github/workflows/deploy-scene.yml
name: Deploy 3D Scene

on:
  push:
    paths:
      - 'scenes/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3

      - name: Run Scene Script
        run: |
          cd cli
          npm install
          node server.js &
          sleep 2
          node bisect.js run ../scenes/production.bisect

      - name: Trigger Webhook
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }} \
            -H "X-Webhook-Signature: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{"event": "scene.deployed"}'
```

### 3. External Service Integration

```typescript
// Your backend service
import { createHmac } from 'crypto';

class BisectClient {
  private baseUrl: string;
  private webhookSecret: string;

  constructor(baseUrl: string, webhookSecret: string) {
    this.baseUrl = baseUrl;
    this.webhookSecret = webhookSecret;
  }

  async calculatePrice(productId: string, selections: object) {
    const response = await fetch(`${this.baseUrl}/api/configurator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'calculate_price',
        productId,
        selections
      })
    });
    return response.json();
  }

  verifyWebhook(payload: string, signature: string): boolean {
    const hmac = createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    return hmac.digest('hex') === signature;
  }
}
```

---

## Environment Variables for Dev Tools

```env
# WebSocket Bridge
BRIDGE_PORT=8080                    # Bridge server port

# Webhooks
WEBHOOK_SECRET=your-secret-key      # HMAC signing secret

# E-commerce Adapters
SHOPIFY_STOREFRONT_TOKEN=...
WOOCOMMERCE_API_KEY=...
BIGCOMMERCE_API_TOKEN=...

# AI Services
OPENAI_API_KEY=...                  # GPT-4o for scene editing
GOOGLE_GEMINI_API_KEY=...           # Gemini for textures
```

---

## Troubleshooting

### CLI not connecting
```bash
# Check bridge is running
lsof -i :8080

# Start bridge
node cli/server.js
```

### MCP not responding
```bash
# Test MCP server directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-server/index.js
```

### Webhook signature mismatch
```bash
# Verify signature generation
node -e "
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'your-secret');
hmac.update('{\"event\":\"test\"}');
console.log(hmac.digest('hex'));
"
```

---

*Last updated: Dec 2, 2025*
