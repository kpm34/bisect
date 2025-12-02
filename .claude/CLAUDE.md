# Bisect - The Cursor of Creative Work

## Vision & Positioning

**Bisect is NOT another 3D editor.** It's the **glue between Blender and ComfyUI** - bringing pro-level 3D and GenAI pipelines to everyday creators without the complexity.

> See [docs/positioning.md](../docs/positioning.md) for full positioning strategy and competitive analysis.

### The Creative Precision Stack

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
      │             │             │
      └─────────────┴─────────────┘
                    │
          ┌─────────▼─────────┐
          │  EVERYDAY CREATOR │
          │  (Gets pro output)│
          └───────────────────┘
```

**The Gap We Fill:**
- Blender = powerful but steep learning curve
- ComfyUI = powerful but node complexity
- Bisect = bridges BOTH for creators who want results, not pipelines

### What Bisect IS
| Identity | Description |
|----------|-------------|
| ✓ Creative pipeline hub | End-to-end content creation, not a single tool |
| ✓ Blender complexity abstraction | Pro 3D quality without the learning curve |
| ✓ AI video aggregator & editor | Connect to Runway, Pika, Kling - orchestrate them |
| ✓ Web-first output | React components, landing pages, WebGL embeds |
| ✓ Brand-to-social content factory | Logo → 3D → Video → Social in one flow |

### What Bisect is NOT
| Anti-Identity | Why Not |
|---------------|---------|
| ✗ A Blender replacement | We're the bridge, not the competitor |
| ✗ A Figma competitor | We're 3D-first, not 2D design |
| ✗ A code-heavy dev tool | Visual-first, code export is output |
| ✗ A single-purpose AI video generator | We're the orchestrator across tools |
| ✗ An enterprise DAM system | We're creative workflow, not asset management |

### Competitive Landscape
| Category | Competitors | What They Lack (Our Opportunity) |
|----------|-------------|----------------------------------|
| AI 3D Tools | Meshy, Hyper3D, Tripo | No Blender integration, no agent system |
| Creative AI | Runway, Pika, Kling | Video only, no 3D pipeline, no CLI |
| Node Workflows | ComfyUI | Steep learning curve, no web UI, no real-time collab |
| Design Tools | Spline, Vectary | No AI agents, no Blender bridge, no CLI |
| Dev Tools | Cursor, Claude Code | Not creative-focused |

### Key Differentiators to Protect
1. **Blender MCP Bridge** - Live connection to professional 3D (no competitor has this)
2. **ComfyUI Orchestration** - GenAI workflows without node complexity
3. **AI Agents** - Cross-domain reasoning (SVG → 3D → Video)
4. **Developer Experience** - CLI, code export, webhooks, APIs
5. **Cross-Studio Pipeline** - Single project across all creative domains

### Integration Architecture
| System | What It Provides | How Bisect Uses It |
|--------|------------------|-------------------|
| **Blender MCP** | Materials, rendering, physics, animation | Live bridge - real-time sync |
| **ComfyUI** | Texture gen, video gen, upscaling, style transfer | Backend orchestration - visual triggers |
| **Suno/ElevenLabs** | AI music, SFX, voiceover | Audio Hub generation |
| **Hyper3D/Meshy** | AI 3D model generation | Import pipeline |

### Cloud-Native (Local OR Cloud - User's Choice)
| Service | Local Option | Cloud Option |
|---------|--------------|--------------|
| **Blender** | Local MCP (free) | Render.st, SheepIt, Concierge |
| **ComfyUI** | Local GPU (free) | RunPod, Vast.ai, Modal |
| **Audio** | - | Suno, ElevenLabs (API only) |
| **3D Gen** | - | Hyper3D, Meshy, Tripo |
| **Video** | - | Runway, Pika, Kling |

> Hobbyist = local ($0) | Pro = burst to cloud | Enterprise = self-hosted

---

## Target Workflows

When building features, optimize for these complete workflows:

### Product Launch (Primary)
```
Vector Studio: Create/import logo → 3D Studio: Apply to product →
Texture Studio: Generate materials → 3D Studio: Build landing page →
Video Studio: Create reveal video → Export: Deploy WebGL experience
```

### Brand Asset Pipeline
```
Vector Studio: Design elements → Texture Studio: Create materials →
3D Studio: Build 3D brand kit → Export: React components, GLB, video
```

### VR/AR Landing Page
```
3D Studio: Build scene with hotspots → Configure interactions →
Add product configurator → Export: Embeddable React component
```

### E-commerce 3D
```
Import product model → Apply materials → Add configurator variants →
Connect Shopify/WooCommerce → Deploy: Interactive product page
```

---

## RAG Knowledge System

**MCP Tools Available** - Use proactively for technical questions!

| Tool | When to Use |
|------|-------------|
| `auto_context(prompt)` | Any technical question - auto-detects domain |
| `search_knowledge(query, "threejs")` | Three.js/R3F patterns |
| `search_knowledge(query, "blender")` | Blender scripts, materials |
| `search_knowledge(query, "database")` | Supabase, PostgreSQL |
| `search_knowledge(query, "api")` | REST, webhooks, API design |
| `get_project_context("bisect")` | Bisect-specific patterns |

---

## Development Priorities

### Always Prioritize
1. **Cross-domain connectivity** - Features that connect studios
2. **Blender bridge improvements** - Our moat
3. **AI agent capabilities** - Natural language workflows
4. **Export quality** - React, Three.js, GLB exports
5. **Developer experience** - CLI, APIs, webhooks

### Avoid
1. Feature-for-feature competition with Spline/Vectary
2. Isolated features that don't connect to other studios
3. Complex UI that increases learning curve
4. Features without clear workflow integration

---

## Architecture Overview

### Studios
| Studio | Purpose | Status |
|--------|---------|--------|
| **Vector Studio** | SVG/Logo creation, AI vectorization | 95% |
| **Texture Studio** | MatCap/PBR generation via Gemini | 90% |
| **3D Studio** | Scene editing, materials, physics, events | 85% |
| **Audio Hub** | Music/SFX library, AI generation, video sync | 15% |
| **Video Studio** | AI video, ComfyUI workflows | 10% |

### Core Systems
| System | Location | Purpose |
|--------|----------|---------|
| AI Agents | `lib/core/ai/` | Scene editing, material selection |
| Materials | `lib/core/materials/` | 600+ PBR presets |
| Audio | `lib/core/audio/` | Music/SFX library, AI generation |
| Configurator | `lib/core/configurator/` | Product variants, e-commerce |
| Cloner | `lib/core/cloner/` | Instancing, arrays, effectors |
| Events | `app/studio/3d-canvas/components/InteractiveObject.tsx` | 15+ event types |
| MCP Bridge | `lib/services/mcp-bridge-handler.ts` | Blender connection |

### Key Entry Points
| File | Purpose |
|------|---------|
| `app/studio/3d-canvas/page.tsx` | 3D Studio entry |
| `app/studio/svg-canvas/page.tsx` | Vector Studio entry |
| `app/studio/tex-factory/page.tsx` | Texture Studio entry |
| `app/studio/audio-hub/` | Audio Hub entry |
| `lib/store/unified-store.ts` | Central Zustand state |
| `app/api/configurator/route.ts` | Configurator API |

---

## Tech Stack

### Core
- **Next.js** 14.2.33 (App Router)
- **React** 18.3.1
- **TypeScript** 5.9.0
- **Tailwind CSS** 3.4.1

### 3D & Graphics
- **Three.js** 0.160.0
- **React Three Fiber** 8.15.0
- **@react-three/drei** 9.88.0
- **@react-three/rapier** (physics)

### AI Integration
- **OpenAI** GPT-4o (scene editing)
- **Google Gemini** (textures, SVG)
- **Anthropic Claude** (complex reasoning)
- **Hyper3D** (3D generation)
- **Suno** (AI music generation)
- **ElevenLabs** (SFX, voiceover)

### Data
- **Zustand** 4.5.0 (state)
- **Supabase** 2.84.0 (database + storage)
- **idb** 8.0.0 (IndexedDB)

### Integrations
- **Blender MCP** - Live bridge to Blender 4.5 (rendering, materials, animation)
- **ComfyUI** - Generative workflows (textures, video, upscaling, style transfer)
- **Suno** - AI music generation
- **ElevenLabs** - AI SFX and voiceover
- **Hyper3D/Meshy** - AI 3D model generation
- **Shopify/WooCommerce/BigCommerce** - E-commerce

---

## Deployment

**IMPORTANT**: Always use the existing Vercel project!

```bash
# Deploy to production
vercel --prod

# Do NOT create a new Vercel project
```

- **Platform**: Vercel
- **Project**: `bisect` (existing)
- **Domain**: bisect.app
- **Auto-deploy**: Main branch → production

---

## Environment Variables

```env
# Required
OPENAI_API_KEY              # GPT-4o for scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for textures & SVG
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Optional (unlock more features)
ANTHROPIC_API_KEY           # Claude for reasoning
OPENROUTER_API_KEY          # Multi-model access
HYPER3D_API_KEY             # AI 3D generation

# ComfyUI (key integration for GenAI workflows)
COMFYUI_API_URL             # Local or remote ComfyUI instance
COMFYUI_API_KEY             # If using remote/cloud ComfyUI

# Cloud GPU (optional - for serverless ComfyUI)
RUNPOD_API_KEY              # RunPod serverless GPU
VASTAI_API_KEY              # Vast.ai GPU rental
MODAL_API_KEY               # Modal serverless

# Cloud Rendering (optional - for heavy Blender jobs)
RENDERST_API_KEY            # Render.st cloud rendering
CONCIERGE_API_KEY           # Concierge render farm

# Audio AI (optional)
SUNO_API_KEY                # AI music generation
ELEVENLABS_API_KEY          # SFX and voiceover generation

# E-commerce (optional)
SHOPIFY_STOREFRONT_TOKEN
WOOCOMMERCE_API_KEY
BIGCOMMERCE_API_TOKEN
```

---

## Project Structure

```
Bisect/
├── app/
│   ├── studio/
│   │   ├── 3d-canvas/              # 3D Studio
│   │   │   ├── components/         # Scene components
│   │   │   │   ├── InteractiveObject.tsx  # Event system
│   │   │   │   ├── Cloner3D.tsx    # Instancing
│   │   │   │   ├── Hotspot3D.tsx   # Annotations
│   │   │   │   └── ClonerPanel.tsx # Cloner UI
│   │   │   ├── hooks/              # Scene hooks
│   │   │   └── r3f/                # R3F context
│   │   ├── svg-canvas/             # Vector Studio
│   │   ├── tex-factory/            # Texture Studio
│   │   ├── audio-hub/              # Audio Hub
│   │   │   └── components/         # AudioHubPanel.tsx
│   │   └── video-studio/           # Video Studio (WIP)
│   └── api/
│       ├── ai/                     # AI endpoints
│       ├── configurator/           # Product config API
│       │   ├── route.ts            # Main API
│       │   └── webhook/route.ts    # E-commerce webhooks
│       └── webhooks/               # Automation webhooks
├── lib/
│   ├── core/
│   │   ├── ai/                     # AI agents
│   │   ├── materials/              # 600+ material library
│   │   ├── audio/                  # Audio system
│   │   │   ├── types.ts            # Audio types
│   │   │   ├── audio-library.ts    # Library categories, search
│   │   │   └── ai-audio-generator.ts  # Suno, ElevenLabs
│   │   ├── cloner/                 # Instancing system
│   │   ├── configurator/           # Product configurator
│   │   │   ├── types.ts
│   │   │   ├── pricing-calculator.ts
│   │   │   └── ecommerce-adapters.ts
│   │   └── adapters/               # Format adapters
│   ├── services/
│   │   ├── mcp-bridge-handler.ts   # Blender bridge
│   │   └── supabase/               # Database services
│   └── store/
│       └── unified-store.ts        # Zustand state
├── mcp-server/                     # MCP server for Blender
└── cli/                            # Command-line tools
```

---

## Feature Implementation Status

### Fully Implemented
- [x] Vector Studio (SVG editor, AI vectorization, 7 exports)
- [x] Texture Studio (MatCap/PBR, normal maps)
- [x] 3D Studio (scene loading, transforms, hierarchy)
- [x] Material system (600+ presets, Blender renders)
- [x] Events system (15+ triggers, animations, states)
- [x] Variables system (number, boolean, string, color)
- [x] Cloner/Instancing (6 modes, 5 effectors)
- [x] Product configurator (variants, pricing, cart)
- [x] E-commerce adapters (Shopify, WooCommerce, BigCommerce)
- [x] Hotspots (3D annotations, tooltips, media)
- [x] Code export (React, vanilla Three.js)
- [x] Scene persistence (IndexedDB + Supabase cloud sync)
- [x] Blender MCP bridge

### In Progress
- [ ] ComfyUI integration (THE KEY - orchestrate GenAI without nodes)
- [ ] Audio Hub (music/SFX library, AI generation, timeline)
- [ ] Cross-studio drag & drop
- [ ] AI workflow orchestrator
- [ ] Video Studio foundation

### Planned
- [ ] Audio-to-video sync (beat detection, auto-sync)
- [ ] Hyper3D pipeline
- [ ] CLI tool (`bisect create`, `bisect export`)
- [ ] Plugin system
- [ ] Team collaboration

---

## Code Style Guidelines

### Component Structure
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper functions
// 5. Component
// 6. Exports
```

### Naming Conventions
- Components: PascalCase (`ClonerPanel.tsx`)
- Hooks: camelCase with `use` prefix (`useCloner.ts`)
- Utils: camelCase (`cloner-calculator.ts`)
- Types: PascalCase, suffix with type (`ClonerConfig`, `EventTrigger`)

### State Management
- Use Zustand for global state (`lib/store/`)
- Use React state for component-local state
- Persist critical state to IndexedDB + Supabase

---

## Testing & Validation

```bash
# Type check
pnpm tsc --noEmit

# Build (catches most errors)
pnpm build

# Lint
pnpm lint

# Local dev
pnpm dev
```

---

## Quick Reference

### Common Commands
```bash
pnpm dev              # Start dev server
pnpm build            # Production build
vercel --prod         # Deploy
pnpm tsc --noEmit     # Type check
```

### Key URLs
- **Production**: https://bisect.app
- **Supabase**: https://supabase.com/dashboard/project/vmawsauglaejrwfajnht
- **Vercel**: https://vercel.com/bisect

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Project overview & vision |
| `docs/material-system-flow.md` | Material architecture |
| `docs/feature-gap-analysis.csv` | Competitor analysis |

---

*Last updated: Dec 2, 2025*
