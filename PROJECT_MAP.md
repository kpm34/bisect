# Unified 3D Creator - Project Navigation Map

## 🗺️ Cross-Project Context Map

This document provides navigation paths to related projects for seamless context gathering by AI agents.

---

## 📍 Current Project Location

```
/Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator
```

---

## 🔗 Related Projects

### 1. VectorCraft AI (Source for Vector & Texture Studios)

**Location:**
```
/Users/kashyapmaheshwari/Blender-Workspace/projects/vectorcraft-ai
```

**Key Files:**
- **SVG Editor:** `src/App-SVG-Editor.tsx` (2000+ lines)
- **Texture Studio:** `src/MatcapStudio.tsx`
- **Main App:** `src/App.tsx`
- **Components:** `src/components/` (15 components)
- **Services:** `src/lib/services/` (Gemini, tracer)
- **Utilities:** `utils/geometry.ts`
- **Types:** `lib/types/types.ts`

**What We Copied:**
- ✅ Complete SVG Editor → `app/studio/vector/page.tsx`
- ✅ All components → `app/studio/vector/components/`
- ✅ Services & utils → `app/studio/vector/lib/`, `app/studio/vector/utils/`
- ✅ MatCap Studio → `app/studio/textures/page.tsx`
- ✅ Generation utilities → `app/studio/textures/matcap-&-pbr-genai/`

**Reference for:**
- SVG drawing tools implementation
- Gemini AI integration patterns
- Texture generation algorithms
- Export format implementations

---

### 2. Prism (Source for 3D Studio & Core Library)

**Location:**
```
/Users/kashyapmaheshwari/Blender-Workspace/projects/prism
```

**Key Files:**
- **3D Editor:** `src/app/editor/page.tsx`
- **Editor Components:** `src/app/editor/components/`
- **R3F Components:** `src/app/editor/r3f/`
- **Core Library:** `src/lib/core/` (~9,500 lines)
  - `adapters/` - ISceneAdapter, SplineAdapter, GLTFAdapter
  - `materials/` - 600+ PBR presets + manifest
  - `ai/` - GPT-4o agent + RAG system
  - `scene/` - Scene manipulation
  - `utils/` - Spatial math
- **Persistence:** `src/lib/persistence/`
- **Hooks:** `src/hooks/`
- **Utils:** `src/utils/`

**What We Copied:**
- ✅ Complete 3D Editor → `app/studio/scene/page.tsx`
- ✅ Editor components → `app/studio/scene/components/`
- ✅ R3F components → `app/studio/scene/r3f/`
- ✅ Core library → `lib/core/`
- ✅ Persistence layer → `lib/persistence/`
- ✅ Hooks → `hooks/`
- ✅ Utils → `app/studio/scene/utils/`

**Reference for:**
- ISceneAdapter pattern implementation
- Material library system architecture
- AI agent with RAG memory
- React Three Fiber best practices
- IndexedDB persistence patterns

---

## 📦 Source Project Dependencies

### VectorCraft AI Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@google/generative-ai": "^0.21.0",
  "three": "^0.181.0",
  "@react-three/fiber": "^9.4.0",
  "@react-three/drei": "^10.7.0",
  "lucide-react": "^0.462.0",
  "imagetracerjs": "^1.2.6"
}
```

### Prism Key Dependencies

```json
{
  "next": "14.2.33",
  "react": "^18.3.1",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "@splinetool/runtime": "^1.10.99",
  "@splinetool/r3f-spline": "^1.0.2",
  "@gltf-transform/core": "^4.2.1",
  "openai": "^4.67.0",
  "chromadb": "^1.8.0",
  "appwrite": "^21.4.0"
}
```

---

## 🗂️ File Mapping Reference

### Vector Studio Files

| Unified Path | Original Source | Purpose |
|-------------|-----------------|---------|
| `app/studio/vector/page.tsx` | `vectorcraft-ai/src/App-SVG-Editor.tsx` | Main SVG editor |
| `app/studio/vector/components/` | `vectorcraft-ai/src/components/` | UI components |
| `app/studio/vector/lib/` | `vectorcraft-ai/src/lib/` | Services (AI, tracer) |
| `app/studio/vector/utils/` | `vectorcraft-ai/utils/` | Geometry utilities |

### Texture Studio Files

| Unified Path | Original Source | Purpose |
|-------------|-----------------|---------|
| `app/studio/textures/page.tsx` | `vectorcraft-ai/src/MatcapStudio.tsx` | MatCap/PBR generator |
| `app/studio/textures/matcap-&-pbr-genai/` | `vectorcraft-ai/matcap-&-pbr-genai/` | Generation utilities |

### 3D Studio Files

| Unified Path | Original Source | Purpose |
|-------------|-----------------|---------|
| `app/studio/scene/page.tsx` | `prism/src/app/editor/page.tsx` | Main 3D editor |
| `app/studio/scene/components/` | `prism/src/app/editor/components/` | Editor components |
| `app/studio/scene/r3f/` | `prism/src/app/editor/r3f/` | R3F components |
| `app/studio/scene/utils/` | `prism/src/utils/` | Scene utilities |

### Shared Core Library

| Unified Path | Original Source | Purpose |
|-------------|-----------------|---------|
| `lib/core/adapters/` | `prism/src/lib/core/adapters/` | Format adapters |
| `lib/core/materials/` | `prism/src/lib/core/materials/` | 600+ materials |
| `lib/core/ai/` | `prism/src/lib/core/ai/` | AI agents + RAG |
| `lib/core/scene/` | `prism/src/lib/core/scene/` | Scene manipulation |
| `lib/persistence/` | `prism/src/lib/persistence/` | IndexedDB storage |
| `hooks/` | `prism/src/hooks/` | React hooks |

---

## 🔍 Quick Navigation Commands

### Navigate to VectorCraft AI

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/vectorcraft-ai
```

**Read key files:**
```bash
# SVG Editor (main component)
cat src/App-SVG-Editor.tsx

# Gemini service
cat src/lib/services/gemini.ts

# Geometry utilities
cat utils/geometry.ts
```

### Navigate to Prism

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/prism
```

**Read key files:**
```bash
# 3D Editor (main component)
cat src/app/editor/page.tsx

# ISceneAdapter interface
cat src/lib/core/adapters/ISceneAdapter.ts

# Material manifest
cat src/lib/core/materials/material-manifest.ts

# AI agent
cat src/lib/core/ai/unified-spline-agent.ts
```

### Navigate to Unified Project

```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator
```

---

## 📚 Context Gathering Guide for AI Agents

### When Working on Vector Studio

**Need context about:**
1. **Drawing tools** → Read `vectorcraft-ai/src/App-SVG-Editor.tsx` lines 350-515 (interaction handlers)
2. **Export formats** → Read `vectorcraft-ai/src/components/CodeExportModal.tsx`
3. **AI integration** → Read `vectorcraft-ai/src/lib/services/gemini.ts`
4. **Geometry utils** → Read `vectorcraft-ai/utils/geometry.ts`

### When Working on Texture Studio

**Need context about:**
1. **MatCap generation** → Read `vectorcraft-ai/src/MatcapStudio.tsx`
2. **PBR generation** → Read `vectorcraft-ai/matcap-&-pbr-genai/`
3. **Image processing** → Search for "normal map" in `vectorcraft-ai/src/MatcapStudio.tsx`

### When Working on 3D Studio

**Need context about:**
1. **Scene adapters** → Read `prism/src/lib/core/adapters/ISceneAdapter.ts`
2. **Material system** → Read `prism/src/lib/core/materials/material-manifest.ts`
3. **AI agent** → Read `prism/src/lib/core/ai/unified-spline-agent.ts`
4. **R3F patterns** → Read `prism/src/app/editor/r3f/UniversalCanvas.tsx`
5. **Scene manipulation** → Read `prism/src/lib/core/scene/`

### When Working on AI Integration

**Need context about:**
1. **Gemini patterns** → Read `vectorcraft-ai/src/lib/services/gemini.ts`
2. **OpenAI patterns** → Read `prism/src/lib/core/ai/unified-spline-agent.ts`
3. **RAG system** → Read `prism/src/lib/core/rag/browser-rag-system.ts`

### When Working on State Management

**Need context about:**
1. **Session management** → Read `prism/src/lib/persistence/SceneSessionManager.ts`
2. **IndexedDB** → Read `prism/src/lib/persistence/IndexedDBStore.ts`
3. **Hooks** → Read `prism/src/hooks/useSceneSession.ts`

---

## 🎯 Import Path Patterns

### Original Import Patterns (to fix)

**VectorCraft:**
```typescript
// Original
import { Tool } from '../lib/types/types';
import { geometry } from '../utils/geometry';
import Toolbar from './components/Toolbar';

// Should become
import { Tool } from './lib/types/types';
import { geometry } from './utils/geometry';
import Toolbar from './components/Toolbar';
```

**Prism:**
```typescript
// Original
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
import { useSceneSession } from '@/hooks/useSceneSession';

// Should become
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
import { useSceneSession } from '@/hooks/useSceneSession';
// (These should work as-is with @ alias)
```

### New Unified Imports

```typescript
// AI Orchestrator
import { orchestrator, generateTexture } from '@/lib/ai/orchestrator';

// Unified Store
import { useUnifiedStore } from '@/lib/store/unified-store';

// Drag & Drop
import { useDragDrop, AssetConverter } from '@/lib/drag-drop/bridge';

// Core (from Prism)
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
import { materialLibrary } from '@/lib/core/materials/material-manifest';
```

---

## 🏗️ Architecture Comparison

### VectorCraft AI Architecture

```
vectorcraft-ai/
├── Single-page app (Vite + React)
├── Client-side only (no SSR)
├── Multiple entry points:
│   ├── App-SVG-Editor.tsx (main)
│   ├── App.tsx (texture generator)
│   └── MatcapStudio.tsx (MatCap mode)
├── Gemini AI for all tasks
└── No persistence (in-memory state)
```

### Prism Architecture

```
prism/
├── Next.js App Router (SSR)
├── Shared core library (~9.5K lines)
├── Adapter pattern for formats
├── OpenAI GPT-4o + RAG
├── IndexedDB + Appwrite persistence
└── Context API state management
```

### Unified Architecture

```
unified-3d-creator/
├── Next.js 14 base (from Prism)
├── 3 isolated studios with routing
├── Multi-agent AI orchestrator
├── Zustand unified state
├── Drag & drop bridge
└── Best of both worlds
```

---

## 🔄 Migration Status

### Completed ✅

- [x] Project structure created
- [x] All 3 studios copied
- [x] Core library integrated
- [x] AI orchestrator built
- [x] State management configured
- [x] Drag & drop system created
- [x] Documentation written

### Pending ⏳

- [ ] Import path fixes
- [ ] Dev server testing
- [ ] AI orchestrator connection
- [ ] Drop handler implementation
- [ ] Asset library UI

---

## 🆘 Quick Reference

### Find a Feature

**"Where is the SVG pen tool?"**
```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/vectorcraft-ai
grep -n "Tool.PEN" src/App-SVG-Editor.tsx
# Line 510: handling pen tool drawing
```

**"Where is the material library?"**
```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/prism
cat src/lib/core/materials/material-manifest.ts
# 600+ PBR presets defined here
```

**"Where is scene rendering?"**
```bash
cd /Users/kashyapmaheshwari/Blender-Workspace/projects/prism
cat src/app/editor/r3f/UniversalCanvas.tsx
# React Three Fiber canvas component
```

### Common Tasks

**Add a new drawing tool:**
1. Study: `vectorcraft-ai/src/App-SVG-Editor.tsx` (handlePointerDown)
2. Add to: `unified-3d-creator/app/studio/vector/page.tsx`
3. Update: Tool enum in types

**Add a new material:**
1. Study: `prism/src/lib/core/materials/`
2. Add to: Material manifest JSON
3. Include: Texture files in public folder

**Add a new AI agent:**
1. Study: `prism/src/lib/core/ai/unified-spline-agent.ts`
2. Add to: `unified-3d-creator/lib/ai/orchestrator.ts`
3. Configure: Agent priorities and strengths

---

## 📞 Contact Information

**Project Location:** `/Users/kashyapmaheshwari/Blender-Workspace/projects/unified-3d-creator`

**Related Projects:**
- VectorCraft: `../vectorcraft-ai`
- Prism: `../prism`

**Documentation:**
- This file: `PROJECT_MAP.md`
- Architecture: `README.md`
- Workspace: `/Users/kashyapmaheshwari/Blender-Workspace/.claude/CLAUDE.md`

---

*This map is designed for AI agents to quickly gather context from source projects. Update as architecture evolves.*
