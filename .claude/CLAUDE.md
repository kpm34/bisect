# Bisect Project Configuration

## RAG Knowledge System (AUTO-QUERY)

**MCP Tools Available** - Use these proactively!

| Tool | When to Use |
|------|-------------|
| `auto_context(prompt)` | Any technical question - auto-detects relevant knowledge |
| `search_knowledge(query, "threejs")` | Three.js/R3F questions |
| `search_knowledge(query, "blender")` | Blender material/render questions |
| `search_knowledge(query, "database")` | Supabase/database patterns |
| `search_knowledge(query, "api")` | REST/API patterns |
| `get_project_context("bisect")` | Bisect-specific patterns |

**Relevant Knowledge Domains:**
- `threejs` - React Three Fiber, Drei, materials, shaders, HDRI
- `blender` - Material rendering, GLB export
- `database` - Supabase patterns, PostgreSQL
- `api` - REST patterns, Next.js API routes

**Quick CLI Query:**
```bash
python3 ~/Blender-Workspace/rag/query/query_rag.py "your query"
```

---

## Project Overview

**Bisect** (v0.1.0 Beta) is a unified 3D creator platform with three studios:

| Studio | Purpose | Status |
|--------|---------|--------|
| **Vector Studio** | SVG editor + AI vectorization | 95% complete |
| **Texture Studio** | MatCap/PBR generation (Gemini) | 90% complete |
| **3D Studio** | Scene editor + materials | 85% complete |

**Live Domain**: [bisect.app](https://bisect.app)
**Repository**: https://github.com/kpm34/bisect

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
- **Auto-deploy**: Main branch → production

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
- **@splinetool/runtime** 1.10.99

### AI Integration
- **OpenAI** 4.67.0 (GPT-4o for scene editing)
- **@google/generative-ai** 0.21.0 (Gemini for textures)
- **@anthropic-ai/sdk** 0.32.0 (Claude for reasoning)

### Data
- **Zustand** 4.5.0 (state)
- **Supabase** 2.84.0 (database + storage)
- **idb** 8.0.0 (IndexedDB)

---

## Project Structure

```
Bisect/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── api/                        # API routes
│   │   ├── ai/                     # AI endpoints
│   │   ├── materials/              # Material queries
│   │   └── tex-factory/            # Texture generation
│   └── studio/
│       ├── 3d-canvas/              # 3D Studio
│       │   └── components/
│       │       └── MaterialPreviewOverlay.tsx  # Material selector
│       ├── svg-canvas/             # Vector Studio
│       └── tex-factory/            # Texture Studio
├── lib/
│   ├── core/                       # Core library
│   │   ├── adapters/               # Format adapters (Spline, GLTF)
│   │   ├── ai/                     # AI agents
│   │   │   ├── unified-spline-agent.ts
│   │   │   ├── gemini-spatial-agent.ts
│   │   │   └── material-agent.ts
│   │   ├── materials/              # Material system
│   │   │   └── material-manifest.ts  # 600+ presets
│   │   └── scene/                  # Scene utilities
│   ├── store/
│   │   └── unified-store.ts        # Zustand state
│   ├── services/
│   │   └── mcp-bridge-handler.ts   # MCP integration
│   └── drag-drop/                  # Cross-studio transfer
├── components/
│   └── shared/
│       └── Shell.tsx               # Navigation shell
├── hooks/
│   ├── useMaterials.ts
│   └── useSceneSession.ts
├── mcp-server/                     # MCP server
└── cli/                            # CLI tool
```

---

## Material System Architecture

### Two-Tier Selection Flow
```
Select Object → Open Material Panel → Choose Preset (applied immediately)
                                              ↓
                                    Click "Browse" in footer
                                              ↓
                              Fine-tuned variations of selected preset
```

### Supabase Structure
```
Database: PostgreSQL (vmawsauglaejrwfajnht)
├── material_categories    (Gold, Silver, Copper, Iron, Titanium)
├── material_presets       (Finishes, Tints, Aged per category)
└── material_variations    (Browse variations for each preset)

Storage Bucket: material-previews
└── {category}/{preset}/{variation}.png (512x512 Blender renders)
```

### Key Files
| File | Purpose |
|------|---------|
| `lib/core/materials/material-manifest.ts` | 600+ material definitions |
| `app/studio/3d-canvas/components/MaterialPreviewOverlay.tsx` | Material UI |
| `lib/services/supabase/material-queries.ts` | Database queries |
| `scripts/render-gold-variations.py` | Blender headless render |
| `docs/material-system-flow.md` | Full documentation |

---

## Key Entry Points

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page |
| `app/studio/3d-canvas/page.tsx` | 3D Studio entry |
| `app/studio/svg-canvas/page.tsx` | Vector Studio entry |
| `app/studio/tex-factory/page.tsx` | Texture Studio entry |
| `lib/store/unified-store.ts` | Central state |

---

## Environment Variables

```env
# Required
OPENAI_API_KEY              # GPT-4o for 3D scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for textures & SVG
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key

# Optional
ANTHROPIC_API_KEY           # Claude for reasoning
OPENROUTER_API_KEY          # Multi-model access
```

---

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Deploy to Vercel
vercel --prod

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

---

## Current Implementation Status

### Fully Implemented
- Vector Studio (SVG editor, AI vectorization, exports)
- Texture Studio (MatCap/PBR generation, normal maps)
- 3D scene loading & format adapters
- Material system with 600+ presets
- Scene hierarchy & transform controls
- Project persistence (IndexedDB + Supabase)

### In Progress
- MCP bridge smart edit integration
- AI orchestrator API completions
- Cross-studio drag & drop handlers

### Not Started
- Object creation tools (primitives)
- Boolean operations
- Animation timeline
- Scene lighting/camera controls
- AR/VR support (WebXR)
- Material editor UI
- Export hub

---

## Documentation Files

| File | Description |
|------|-------------|
| `.memory.md` | Project status & priorities |
| `README.md` | Project overview |
| `docs/material-system-flow.md` | Material architecture |
| `PROJECT_MAP.md` | Cross-project navigation |
| `QUICK_DEPLOY.md` | Deployment guide |

---

*Last updated: Nov 30, 2025*
