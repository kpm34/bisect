# Bisect - Project Navigation Map

This document provides navigation paths to related source projects for context gathering.

---

## Project Location

```
/Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect
```

**Live**: [bisect.app](https://bisect.app)
**Repository**: https://github.com/kpm34/bisect

---

## Source Projects

Bisect was created by merging two source projects. These are referenced for historical context and original implementation patterns.

### 1. VectorCraft AI (Source for Vector & Texture Studios)

**Location:**
```
/Users/kashyapmaheshwari/Blender-Workspace/projects/vectorcraft-ai
```

**Key Files (Reference Only):**
- `src/App-SVG-Editor.tsx` - Original SVG editor (2000+ lines)
- `src/MatcapStudio.tsx` - Original texture studio
- `src/components/` - 15 original components
- `src/lib/services/` - Gemini AI integration

**What Was Merged:**
- Complete SVG Editor → `app/studio/svg-canvas/`
- MatCap Studio → `app/studio/tex-factory/`
- Services & utilities → `lib/` and `app/studio/*/lib/`

---

### 2. Prism (Source for 3D Studio & Core Library)

**Location:**
```
/Users/kashyapmaheshwari/Blender-Workspace/projects/prism
```

**Key Files (Reference Only):**
- `src/app/editor/page.tsx` - Original 3D editor
- `src/lib/core/` - Core library (~9,500 lines)
- `src/lib/core/adapters/` - Format adapters
- `src/lib/core/materials/` - 600+ material presets
- `src/lib/core/ai/` - AI agent + RAG

**What Was Merged:**
- 3D Editor → `app/studio/3d-canvas/`
- Core library → `lib/core/`
- Hooks → `hooks/`
- Persistence → `lib/persistence/`

---

## Bisect Project Structure

```
Bisect/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── api/                        # API routes
│   │   ├── ai/                     # AI endpoints
│   │   ├── materials/              # Material queries
│   │   └── tex-factory/            # Texture generation
│   └── studio/
│       ├── 3d-canvas/              # 3D Studio (from Prism)
│       │   ├── page.tsx            # Entry point
│       │   └── components/         # Editor components
│       ├── svg-canvas/             # Vector Studio (from VectorCraft)
│       │   ├── page.tsx            # Entry point
│       │   └── components/         # Drawing tools
│       └── tex-factory/            # Texture Studio (from VectorCraft)
│           ├── page.tsx            # Entry point
│           └── matcap-&-pbr-genai/ # Generation utilities
├── lib/
│   ├── core/                       # Core library (from Prism)
│   │   ├── adapters/               # ISceneAdapter, SplineAdapter, GLTFAdapter
│   │   ├── ai/                     # AI agents (GPT-4o, Gemini, Claude)
│   │   ├── materials/              # 600+ material presets
│   │   ├── rag/                    # RAG system
│   │   └── scene/                  # Scene manipulation
│   ├── store/                      # Zustand state
│   │   └── unified-store.ts        # Central state management
│   ├── services/                   # API services
│   │   └── mcp-bridge-handler.ts   # MCP integration
│   ├── persistence/                # Storage
│   └── drag-drop/                  # Cross-studio transfer
├── components/
│   └── shared/                     # Shell, navigation
├── hooks/                          # React hooks
├── mcp-server/                     # MCP server
└── cli/                            # CLI tool
```

---

## File Mapping (Source → Bisect)

### Vector Studio
| Bisect Path | Original Source |
|-------------|-----------------|
| `app/studio/svg-canvas/page.tsx` | `vectorcraft-ai/src/App-SVG-Editor.tsx` |
| `app/studio/svg-canvas/components/` | `vectorcraft-ai/src/components/` |
| `app/studio/svg-canvas/lib/` | `vectorcraft-ai/src/lib/` |

### Texture Studio
| Bisect Path | Original Source |
|-------------|-----------------|
| `app/studio/tex-factory/page.tsx` | `vectorcraft-ai/src/MatcapStudio.tsx` |
| `app/studio/tex-factory/matcap-&-pbr-genai/` | `vectorcraft-ai/matcap-&-pbr-genai/` |

### 3D Studio
| Bisect Path | Original Source |
|-------------|-----------------|
| `app/studio/3d-canvas/page.tsx` | `prism/src/app/editor/page.tsx` |
| `app/studio/3d-canvas/components/` | `prism/src/app/editor/components/` |
| `lib/core/` | `prism/src/lib/core/` |

---

## Import Patterns

### Standard Imports
```typescript
// AI Orchestrator
import { orchestrator } from '@/lib/ai/orchestrator';

// Unified Store
import { useUnifiedStore } from '@/lib/store/unified-store';

// Core Library
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
import { materialLibrary } from '@/lib/core/materials/material-manifest';

// Hooks
import { useSceneSession } from '@/hooks/useSceneSession';
import { useMaterials } from '@/hooks/useMaterials';
```

---

## Context Gathering Guide

### Vector Studio Development
- Drawing tools: `app/studio/svg-canvas/components/`
- Export formats: `app/studio/svg-canvas/components/CodeExportModal.tsx`
- AI integration: `app/studio/svg-canvas/lib/services/gemini.ts`

### Texture Studio Development
- MatCap generation: `app/studio/tex-factory/page.tsx`
- PBR generation: `app/studio/tex-factory/matcap-&-pbr-genai/`

### 3D Studio Development
- Scene adapters: `lib/core/adapters/`
- Material system: `lib/core/materials/material-manifest.ts`
- AI agent: `lib/core/ai/unified-spline-agent.ts`

### AI Integration
- Gemini patterns: `app/studio/svg-canvas/lib/services/gemini.ts`
- OpenAI patterns: `lib/core/ai/unified-spline-agent.ts`
- RAG system: `lib/core/rag/BrowserRagSystem.ts`
- MCP bridge: `lib/services/mcp-bridge-handler.ts`

### State Management
- Unified store: `lib/store/unified-store.ts`
- Session management: `lib/persistence/SceneSessionManager.ts`
- IndexedDB: `lib/persistence/IndexedDBStore.ts`

---

## Quick Reference

### Find a Feature

```bash
# SVG drawing tools
grep -rn "Tool\." app/studio/svg-canvas/

# Material library
cat lib/core/materials/material-manifest.ts

# Scene rendering
cat app/studio/3d-canvas/components/
```

### Common Tasks

**Add a new drawing tool:**
1. Study: `app/studio/svg-canvas/components/`
2. Update: Tool enum in types
3. Add handler in page.tsx

**Add a new material:**
1. Study: `lib/core/materials/`
2. Add to: Material manifest
3. Include: Preview image in Supabase

**Add a new AI agent:**
1. Study: `lib/core/ai/unified-spline-agent.ts`
2. Add to: `lib/ai/orchestrator.ts`
3. Configure: Agent priorities

---

## Related Documentation

| File | Description |
|------|-------------|
| `.memory.md` | Project status & priorities |
| `README.md` | Project overview |
| `.claude/CLAUDE.md` | Claude Code configuration |
| `docs/material-system-flow.md` | Material architecture |

---

*This map is designed for AI agents to gather context. Update as architecture evolves.*
*Last updated: Nov 30, 2025*
