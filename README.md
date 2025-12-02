# Bisect

**The Cursor of Creative Work** - A unified creative platform that connects AI, 3D, design, and video workflows into one intelligent system.

**Version**: 0.1.0 (Beta)
**Live**: [bisect.app](https://bisect.app)

---

## What is Bisect?

Bisect is **not** another 3D editor competing feature-for-feature with Spline or Vectary. Instead, it's the **connective tissue across creative domains** - an AI-powered workflow orchestrator that lets creators move seamlessly between vector, 3D, texture, and video workflows.

Think of it as **Cursor/Claude Code for creative professionals**.

### The Problem We Solve

Today's creative pipeline is fragmented:
- Design a logo in Illustrator
- Import to Blender for 3D
- Render in a separate tool
- Create video in Premiere
- Export for web somewhere else

Each tool is a silo. Each transition loses context. AI tools exist but don't talk to each other.

### Our Solution

Bisect provides:
1. **Cross-domain studios** that share context and assets
2. **AI agents** that understand the full creative pipeline
3. **Blender bridge** for professional-grade 3D (our moat)
4. **Generative integrations** (ComfyUI, Hyper3D, Runway)
5. **Developer-friendly** CLI and APIs

---

## Example Workflows

### Product Launch Workflow
```
1. Vector Studio: Create/import product logo (AI vectorization)
2. 3D Studio: Apply logo as decal to product model
3. Texture Studio: Generate materials for product
4. 3D Studio: Create immersive landing page scene
5. Video Studio: Generate product reveal video
6. Export: Deploy as interactive WebGL experience
```

### Brand Asset Pipeline
```
1. Vector Studio: Design brand elements
2. Texture Studio: Create branded materials
3. 3D Studio: Build 3D brand kit (logo, icons, scenes)
4. Export: React components, GLB files, video assets
```

### VR/AR Landing Page
```
1. 3D Studio: Build immersive scene with hotspots
2. Configure interactions and animations
3. Add product configurator with variants
4. Export as embeddable React component
5. Deploy with e-commerce integration
```

---

## Studios

| Studio | Purpose | Key Features |
|--------|---------|--------------|
| **Vector Studio** | SVG/Logo creation | AI vectorization, 15+ tools, 7 export formats |
| **Texture Studio** | Material generation | MatCap/PBR via Gemini, normal maps, Blender renders |
| **3D Studio** | Scene editing | 600+ materials, AI editing, Blender bridge, physics |
| **Video Studio** | Motion content | AI video generation, ComfyUI workflows (coming) |
| **Audio Hub** | Music & SFX | AI music (Suno), SFX library, sync to video (coming) |

---

## Competitive Position

| Category | Competitors | What They Lack |
|----------|-------------|----------------|
| **AI 3D Tools** | Meshy, Hyper3D, Tripo | No Blender integration, no agent system |
| **Creative AI** | Runway, Pika, Kling | Video only, no 3D pipeline, no CLI |
| **Node Workflows** | ComfyUI | Steep learning curve, no web UI |
| **Design Tools** | Spline, Vectary | No AI agents, no Blender bridge, no CLI |
| **Dev Tools** | Cursor, Claude Code | Not creative-focused |

**Bisect's unique value**: We're the only platform with a live Blender bridge, AI agents that understand cross-domain context, and developer-friendly exports.

---

## Key Differentiators

### 1. Blender Integration (Our Moat)
- Live MCP bridge to Blender 4.5
- Professional rendering pipeline
- Asset round-tripping (Web ↔ Blender)
- Headless batch rendering

### 2. AI Agent System
- Natural language scene editing
- Material agent with 600+ preset knowledge
- Cross-domain reasoning (SVG → 3D → Video)
- Context-aware suggestions

### 3. Cross-Domain Pipeline
- Drag assets between studios
- Shared state and context
- Unified export system
- Single project = all assets

### 4. Developer Experience
- CLI tools (like Cursor)
- React/Three.js code export
- Webhook/API system
- Embeddable components

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/kpm34/bisect.git
cd Bisect

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
pnpm dev
```

### Environment Variables

```env
# Required
OPENAI_API_KEY              # GPT-4o for scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for textures & SVG
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Optional (unlock more features)
ANTHROPIC_API_KEY           # Claude for complex reasoning
OPENROUTER_API_KEY          # Multi-model access
HYPER3D_API_KEY             # AI 3D generation
COMFYUI_API_URL             # Local ComfyUI instance
```

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 14, React 18, TypeScript |
| **3D** | Three.js, React Three Fiber, Drei, Rapier (physics) |
| **AI** | OpenAI GPT-4o, Google Gemini, Claude, Hyper3D |
| **State** | Zustand, React Query |
| **Database** | Supabase (PostgreSQL), IndexedDB |
| **Bridge** | MCP Server, Blender Python API |
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
│   │   └── video-studio/       # Video Studio (WIP)
│   └── api/
│       ├── ai/                 # AI endpoints
│       ├── configurator/       # Product configurator API
│       └── webhooks/           # Automation webhooks
├── lib/
│   ├── core/
│   │   ├── ai/                 # AI agents
│   │   ├── materials/          # 600+ material library
│   │   ├── cloner/             # Instancing system
│   │   ├── configurator/       # Product config engine
│   │   └── adapters/           # Format adapters
│   └── services/
│       ├── mcp-bridge/         # Blender bridge
│       └── supabase/           # Database services
├── mcp-server/                 # MCP server for Blender
└── cli/                        # Command-line tools
```

---

## Roadmap

### Phase 1: Foundation (Current)
- [x] Vector Studio with AI vectorization
- [x] Texture Studio with Gemini generation
- [x] 3D Studio with materials and physics
- [x] Blender MCP bridge
- [x] Scene persistence (IndexedDB + Supabase)

### Phase 2: Workflows
- [x] Events/States/Variables system
- [x] Cloner/Instancing system
- [x] Product configurator
- [x] E-commerce integration
- [ ] Cross-studio drag & drop
- [ ] Video Studio foundation
- [ ] Audio Hub (music/SFX library + AI generation)

### Phase 3: Intelligence
- [ ] AI workflow orchestrator
- [ ] ComfyUI integration
- [ ] Hyper3D generation pipeline
- [ ] Multi-agent collaboration
- [ ] Voice commands

### Phase 4: Platform
- [ ] CLI tool (`bisect create`, `bisect export`)
- [ ] Plugin system
- [ ] Marketplace
- [ ] Team collaboration
- [ ] Self-hosted option

---

## Deployment

```bash
# Deploy to Vercel (uses existing project)
vercel --prod
```

- **Platform**: Vercel
- **Domain**: bisect.app
- **Auto-deploy**: Main branch → production

---

## Contributing

We're building the future of creative tools. Contributions welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT

---

**Bisect: Where creative workflows converge.**
