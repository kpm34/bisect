# Bisect

**The Glue Between Blender and ComfyUI** - Bringing pro-level 3D and GenAI pipelines to everyday creators without the complexity.

**Version**: 0.2.0 (Beta)
**Live**: [bisect.app](https://bisect.app)

---

## What is Bisect?

Bisect is **not** another 3D editor. It's the **bridge between professional tools** - connecting Blender's power and ComfyUI's generative capabilities through a visual interface that everyday creators can actually use.

```
            ┌──────────────┐
            │   BISECT     │  ← Visual interface (no nodes, no code)
            │  (The Glue)  │
            └───────┬──────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ BLENDER │◄─►│ COMFYUI │◄─►│ BISECT  │
│  (MCP)  │   │(Workflows)│  │(Studios)│
└─────────┘   └─────────┘   └─────────┘
```

**The Gap We Fill:**
- Blender = powerful but steep learning curve
- ComfyUI = powerful but node complexity
- Bisect = bridges BOTH for creators who want results, not pipelines

---

## The Creative Precision Stack

We **build ON, not duplicate**:

| What We Own | What We Bridge |
|-------------|----------------|
| Visual interface | Blender (rendering, physics, animation) |
| 600+ material presets | ComfyUI (video, lip sync, style transfer) |
| AI agents | Cloud GPUs (RunPod, Vast.ai) |
| Cross-studio workflow | Cloud rendering (Render.st, Concierge) |
| Code export (React, Three.js) | E-commerce (Shopify, WooCommerce) |

---

## Studios

| Studio | Purpose | Status |
|--------|---------|--------|
| **Vector Studio** | SVG/Logo creation, AI vectorization | 95% |
| **Texture Studio** | MatCap/PBR generation via Gemini | 90% |
| **3D Studio** | Scene editing, materials, events, cloner | 85% |
| **Audio Hub** | Music/SFX library, AI generation | 15% |
| **Video Studio** | AI video, ComfyUI workflows | 10% |

---

## Developer Tools

Bisect provides a complete developer toolkit - CLI, MCP server, and REST APIs.

### CLI Tool (v2.0)

```bash
# Install globally
cd cli && npm link

# Object operations
bisect add box --position 0,1,0 --color #FF5500
bisect select MyCube
bisect delete

# Transform
bisect move 1,2,3
bisect rotate 0,45,0
bisect scale 2,2,2

# Appearance
bisect color #3498db
bisect material gold-polished --category metal
bisect opacity 0.8

# AI-powered editing
bisect ai "arrange all objects in a circle"
bisect ai "make the cube look like marble" --vision
bisect arrange grid --count 9 --spacing 2

# Events and animation
bisect event click scale --target OtherCube
bisect animate bounce --speed 1.5

# Cloner/instancing
bisect clone --mode radial --count 8 --radius 5

# Scene operations
bisect scene --json
bisect screenshot viewport.png
bisect save myscene.json
bisect load myscene.json

# Import/export
bisect import model.glb
bisect export scene.glb
bisect export --format react scene.jsx

# Run script
bisect run automation.bisect
```

### MCP Server (v2.1)

AI-powered scene manipulation for Claude Code integration:

```javascript
// AI Tools
smart_edit({ command: "arrange in a spiral pattern" })
get_scene_analysis()
get_screenshot()
describe_scene()

// Object Tools
spawn_object({ type: "sphere" })
select_object({ name: "MyCube" })
set_material({ preset: "gold-polished" })

// Arrangement Tools
arrange_objects({ pattern: "circle", count: 8 })
create_cloner({ mode: "grid", count: 25 })

// Integration Tools
configure_product({ productId: "helmet-pro", selections: {...} })
trigger_blender({ operation: "render" })
export_scene({ format: "react" })
```

### REST APIs

```bash
# Materials API (600+ presets)
GET  /api/materials              # List all materials
GET  /api/materials?category=metal
POST /api/materials              # Get details, apply, recommend

# AI API (Agent orchestration)
GET  /api/ai                     # List capabilities
POST /api/ai                     # smart_edit, analyze, suggest

# Configurator API (E-commerce)
POST /api/configurator           # calculate_price, add_to_cart, checkout

# Webhooks API
POST /api/webhooks/scene/:id     # Scene event notifications
```

> Full documentation: [docs/developer-tools.md](docs/developer-tools.md)

---

## AI Agent System

| Agent | Purpose | Capabilities |
|-------|---------|--------------|
| **Gemini Spatial** | Arrangements | Grid, circle, spiral, scatter, align, distribute |
| **Material Agent** | Material selection | RAG-powered, 600+ presets, recommendations |
| **Scene Graph Builder** | Analysis | Semantic relationships, natural language summaries |
| **Claude Blender** | Complex ops | Rendering, physics, animation via MCP |
| **Agent Debate** | Complex decisions | Multi-model consensus (Gemini vs Claude) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+

### Installation

```bash
git clone https://github.com/kpm34/bisect.git
cd Bisect
pnpm install
cp .env.example .env.local
# Add your API keys
pnpm dev
```

### Environment Variables

```env
# Required
OPENAI_API_KEY              # GPT-4o for scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for textures & SVG
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Blender + ComfyUI (key integrations)
COMFYUI_API_URL             # Local or cloud ComfyUI
RUNPOD_API_KEY              # Cloud GPU (optional)

# Optional
ANTHROPIC_API_KEY           # Claude for reasoning
HYPER3D_API_KEY             # AI 3D generation
SUNO_API_KEY                # AI music generation
ELEVENLABS_API_KEY          # AI SFX generation
```

---

## Cloud-Native Architecture

| Service | Local (Free) | Cloud |
|---------|--------------|-------|
| **Blender** | Local MCP | Render.st, SheepIt, Concierge |
| **ComfyUI** | Local GPU | RunPod, Vast.ai, Modal |
| **Audio** | - | Suno, ElevenLabs |
| **3D Gen** | - | Hyper3D, Meshy, Tripo |
| **Video** | - | Runway, Pika, Kling |

> Hobbyist = local ($0) | Pro = burst to cloud | Enterprise = self-hosted

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 14, React 18, TypeScript 5 |
| **3D** | Three.js, React Three Fiber, Drei, Rapier |
| **AI** | OpenAI GPT-4o, Gemini, Claude, Hyper3D |
| **State** | Zustand 4.5, React Query |
| **Database** | Supabase (PostgreSQL), IndexedDB |
| **Bridge** | MCP Server, WebSocket, Blender Python API |
| **Generative** | ComfyUI integration |

---

## Project Structure

```
Bisect/
├── app/
│   ├── studio/
│   │   ├── 3d-canvas/          # 3D Studio
│   │   ├── svg-canvas/         # Vector Studio
│   │   ├── tex-factory/        # Texture Studio
│   │   ├── audio-hub/          # Audio Hub
│   │   └── video-studio/       # Video Studio (WIP)
│   └── api/
│       ├── ai/                 # AI agent endpoints
│       ├── materials/          # Material library API
│       ├── configurator/       # Product configurator
│       └── webhooks/           # Automation webhooks
├── lib/
│   ├── core/
│   │   ├── ai/                 # AI agents
│   │   ├── materials/          # 600+ material presets
│   │   ├── cloner/             # Instancing system
│   │   ├── configurator/       # Product config engine
│   │   └── audio/              # Audio system
│   └── services/
│       ├── mcp-bridge-handler.ts
│       └── supabase/
├── mcp-server/                 # MCP server (v2.1)
├── cli/                        # CLI tool (v2.0)
└── docs/
    ├── developer-tools.md      # CLI/API docs
    ├── positioning.md          # Strategy
    ├── comfyui-blender-workflows.md
    └── feature-testing-tracker.md
```

---

## Implementation Status

### Fully Implemented
- [x] Vector Studio (SVG editor, AI vectorization, 7 exports)
- [x] Texture Studio (MatCap/PBR via Gemini, normal maps)
- [x] 3D Studio (scene loading, transforms, hierarchy)
- [x] Material system (600+ presets, Blender renders)
- [x] Events system (15+ triggers, animations, states)
- [x] Variables system (number, boolean, string, color)
- [x] Cloner/Instancing (6 modes, 5 effectors)
- [x] Product configurator (variants, pricing, cart)
- [x] E-commerce adapters (Shopify, WooCommerce, BigCommerce)
- [x] Hotspots (3D annotations, tooltips, media)
- [x] Code export (React, vanilla Three.js)
- [x] Scene persistence (IndexedDB + Supabase)
- [x] Blender MCP bridge
- [x] CLI tool v2.0 (30+ commands)
- [x] MCP server v2.1 (20+ tools)
- [x] REST APIs (materials, AI, configurator, webhooks)

### In Progress
- [ ] ComfyUI integration (video, lip sync, style transfer)
- [ ] Audio Hub (music/SFX library, AI generation)
- [ ] Cross-studio drag & drop
- [ ] Video Studio foundation

### Planned
- [ ] Audio-to-video sync
- [ ] Hyper3D pipeline
- [ ] Plugin system
- [ ] Team collaboration

---

## Deployment

```bash
vercel --prod
```

- **Platform**: Vercel
- **Domain**: bisect.app
- **Auto-deploy**: Main branch → production

---

## Documentation

| Document | Purpose |
|----------|---------|
| [developer-tools.md](docs/developer-tools.md) | CLI, MCP, APIs |
| [positioning.md](docs/positioning.md) | Strategy & competitive analysis |
| [comfyui-blender-workflows.md](docs/comfyui-blender-workflows.md) | ComfyUI capabilities |
| [feature-testing-tracker.md](docs/feature-testing-tracker.md) | Production readiness |
| [material-system-flow.md](docs/material-system-flow.md) | Material architecture |

---

## Contributing

We're building the glue between professional creative tools. Contributions welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT

---

**Bisect: Professional creative pipelines, simplified.**
