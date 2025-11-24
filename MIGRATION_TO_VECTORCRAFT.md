# Migration Plan: Add Prism 3D Studio to VectorCraft Repo

## Strategy
Since we're using VectorCraft's UI as the shell, we'll add Prism's 3D Studio features as additions to the existing VectorCraft repository.

## What to Add from Prism

### 1. 3D Studio Route (`/studio/scene` or `/3d`)
**Location in VectorCraft:** `src/app/studio/scene/` or `src/app/3d/`

**Files to copy:**
- `app/studio/scene/page.tsx` → Main 3D editor page
- `app/studio/scene/components/` → All editor components
- `app/studio/scene/r3f/` → React Three Fiber components
- `app/studio/scene/utils/` → Scene utilities

### 2. Core Library (Prism's shared code)
**Location in VectorCraft:** `src/lib/core/` (merge with existing lib structure)

**Files to copy:**
- `lib/core/adapters/` → Format adapters (Spline, GLTF, etc.)
- `lib/core/materials/` → 600+ material library
- `lib/core/ai/` → AI agents + RAG system
- `lib/core/scene/` → Scene manipulation utilities
- `lib/core/utils/` → Spatial math, debug logger, etc.

### 3. Persistence Layer
**Location in VectorCraft:** `src/lib/persistence/`

**Files to copy:**
- `lib/persistence/IndexedDBStore.ts`
- `lib/persistence/SceneSessionManager.ts`
- `lib/persistence/types.ts`

### 4. Hooks
**Location in VectorCraft:** `src/hooks/`

**Files to copy:**
- `hooks/useSceneSession.ts`
- `hooks/useSceneHistory.ts`
- `hooks/useMaterialThumbnails.ts`

### 5. Dependencies to Add
Add to VectorCraft's `package.json`:
```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "@react-three/postprocessing": "^2.16.5",
  "three": "^0.160.0",
  "@types/three": "^0.160.0",
  "@splinetool/runtime": "^1.10.99",
  "@splinetool/r3f-spline": "^1.0.2",
  "@gltf-transform/core": "^4.2.1",
  "openai": "^4.67.0",
  "@anthropic-ai/sdk": "^0.32.0",
  "openrouter-sdk": "^1.0.0",
  "idb": "^8.0.0",
  "react-arborist": "^3.4.3",
  "chromadb": "^1.8.0"
}
```

## Integration Points

### 1. Shell Component (Already Exists)
VectorCraft already has navigation - just add 3D Studio link:
```tsx
// In VectorCraft's navigation
{ href: '/studio/scene', label: '3D Studio', icon: Box }
```

### 2. AI Orchestrator
**Location:** `src/lib/ai/orchestrator.ts`

Merge Prism's AI orchestrator with VectorCraft's existing Gemini integration:
- Keep VectorCraft's Gemini service for textures/SVG
- Add OpenAI GPT-4o for 3D scene editing
- Add Claude for complex reasoning
- Route tasks to appropriate model

### 3. State Management
VectorCraft might use different state management. Options:
- **Option A:** Keep VectorCraft's existing state, add 3D studio state separately
- **Option B:** Migrate to Zustand unified store (from Prism)
- **Recommendation:** Start with Option A, migrate later if needed

### 4. Material Library Integration
**Location:** `src/lib/materials/` or `src/lib/core/materials/`

- Copy Prism's 600+ material library
- Integrate with Texture Studio (already in VectorCraft)
- Allow Texture Studio → 3D Studio material transfer

## File Structure After Migration

```
vectorcraft-ai/
├── src/
│   ├── app/
│   │   ├── studio/
│   │   │   ├── vector/          # Existing SVG editor
│   │   │   ├── textures/        # Existing texture generator
│   │   │   └── scene/           # NEW: 3D Studio from Prism
│   │   └── ...
│   ├── lib/
│   │   ├── core/                # NEW: Prism core library
│   │   │   ├── adapters/
│   │   │   ├── materials/
│   │   │   ├── ai/
│   │   │   └── scene/
│   │   ├── ai/
│   │   │   └── orchestrator.ts  # NEW: Multi-agent routing
│   │   ├── persistence/         # NEW: IndexedDB storage
│   │   └── services/            # Existing Gemini services
│   ├── hooks/                    # Add Prism hooks
│   └── components/
│       └── shared/
│           └── Shell.tsx        # Update with 3D Studio link
├── package.json                  # Add Prism dependencies
└── ...
```

## Step-by-Step Migration

### Phase 1: Setup (Low Risk)
1. ✅ Copy core library (`lib/core/`) to VectorCraft
2. ✅ Add Prism dependencies to package.json
3. ✅ Install dependencies: `pnpm install`

### Phase 2: 3D Studio (Medium Risk)
4. ✅ Copy 3D Studio route (`app/studio/scene/`)
5. ✅ Copy R3F components
6. ✅ Copy scene utilities
7. ✅ Update Shell component with 3D Studio link
8. ✅ Test 3D Studio loads without errors

### Phase 3: Integration (Higher Risk)
9. ✅ Copy persistence layer
10. ✅ Copy hooks
11. ✅ Integrate AI orchestrator
12. ✅ Test cross-studio workflows (Texture → 3D, Vector → 3D)

### Phase 4: Polish
13. ✅ Fix any import paths
14. ✅ Test all three studios work independently
15. ✅ Test drag & drop between studios
16. ✅ Deploy to Vercel

## Import Path Adjustments

Since VectorCraft might use different path aliases:

**From Prism (using `@/`):**
```typescript
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
```

**To VectorCraft (check existing pattern):**
```typescript
// Might be:
import { ISceneAdapter } from '../lib/core/adapters/ISceneAdapter';
// or
import { ISceneAdapter } from '@/lib/core/adapters/ISceneAdapter';
```

## Key Differences to Handle

1. **Next.js vs Vite:** VectorCraft uses Vite, Prism uses Next.js
   - **Solution:** Keep 3D Studio as Next.js route, or adapt to Vite
   - **Recommendation:** If VectorCraft is migrating to Next.js, use Next.js

2. **State Management:** May differ between projects
   - **Solution:** Keep separate initially, unify later

3. **Styling:** May use different CSS approach
   - **Solution:** Keep Prism's Tailwind classes, ensure Tailwind config includes them

## Testing Checklist

After migration:
- [ ] 3D Studio route loads (`/studio/scene`)
- [ ] Can upload GLTF/Spline files
- [ ] Material selector works
- [ ] Object transform controls work
- [ ] Scene hierarchy panel works
- [ ] AI commands work (if integrated)
- [ ] Vector Studio still works
- [ ] Texture Studio still works
- [ ] Navigation between studios works

## Rollback Plan

If issues arise:
1. Keep Prism code in separate branch
2. Can disable 3D Studio route temporarily
3. Core library is isolated, shouldn't break existing features

## Next Steps

1. **Check VectorCraft repo structure** - Understand current setup
2. **Create feature branch** - `feature/add-3d-studio`
3. **Copy files incrementally** - Start with core library, then 3D Studio
4. **Test after each phase** - Don't copy everything at once
5. **Fix imports** - Adjust paths to match VectorCraft structure
6. **Test integration** - Ensure all studios work together

