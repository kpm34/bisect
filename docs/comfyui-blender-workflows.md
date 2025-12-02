# ComfyUI: The Creative Goldmine

## The Opportunity

ComfyUI is not just "image generation" - it's an entire creative production pipeline that keeps expanding. New workflows, models, and capabilities are added weekly by the community.

**Our job: Research, master, and package these workflows for everyday creators.**

---

## The Decision Tree: Where Does Each Capability Live?

```
┌─────────────────────────────────────────────────────────────────┐
│              CAPABILITY ROUTING DECISION TREE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   For any creative capability:                                   │
│                                                                  │
│   1. Can BISECT do it natively?                                 │
│      YES → Use Bisect (we own the experience)                   │
│      NO  → Continue...                                          │
│                                                                  │
│   2. Can BLENDER do it better?                                  │
│      YES → Use Blender MCP (pro quality, we bridge)             │
│      NO  → Continue...                                          │
│                                                                  │
│   3. Does COMFYUI have a workflow?                              │
│      YES → Research, test, package it                           │
│      NO  → Continue...                                          │
│                                                                  │
│   4. Gap exists?                                                │
│      → Build it in Bisect (own the capability)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Current Capability Routing

| Capability | Best Tool | Status | Notes |
|------------|-----------|--------|-------|
| **PBR Textures** | Bisect (Gemini) | ✅ Own | Texture Studio |
| **MatCap Generation** | Bisect (Gemini) | ✅ Own | Texture Studio |
| **Material Library** | Bisect | ✅ Own | 600+ presets |
| **3D Rendering** | Blender MCP | ✅ Bridge | Cycles/EEVEE |
| **Physics Simulation** | Blender MCP | ✅ Bridge | Rigid body, cloth |
| **Animation** | Blender MCP | ✅ Bridge | Keyframes, armatures |
| **Geometry Nodes** | Blender MCP | ✅ Bridge | Procedural modeling |
| **Video Generation** | ComfyUI | 🔴 Research | AnimateDiff, SVD |
| **Lip Sync** | ComfyUI | 🔴 Research | Wav2Lip, SadTalker |
| **Image → 3D** | ComfyUI / Hyper3D | 🔴 Research | TripoSR, LGM |
| **Style Transfer** | ComfyUI | 🔴 Research | IP-Adapter |
| **Upscaling** | ComfyUI | 🔴 Research | ESRGAN |
| **Face Animation** | ComfyUI | 🔴 Research | LivePortrait |
| **AI Music** | Bisect (Suno) | ✅ Own | Audio Hub |
| **AI SFX** | Bisect (ElevenLabs) | ✅ Own | Audio Hub |
| **Voice/TTS** | ComfyUI + ElevenLabs | 🟡 Hybrid | Research options |
| **Events System** | Bisect | ✅ Own | 15+ triggers |
| **Configurator** | Bisect | ✅ Own | Product variants |
| **Hotspots** | Bisect | ✅ Own | 3D annotations |
| **Cloner** | Bisect | ✅ Own | 6 modes, effectors |
| **Code Export** | Bisect | ✅ Own | React, Three.js |

### Gap Analysis

| Gap | Options | Recommendation |
|-----|---------|----------------|
| **Real-time collaboration** | Build in Bisect | Own it |
| **Version control for scenes** | Build in Bisect | Own it |
| **Procedural audio** | Research ComfyUI | Test first |
| **Motion capture** | Blender MCP | Bridge |

---

## AI Scene Understanding (What We've Already Built)

We have a sophisticated AI system already in place:

### Core AI Agents (`lib/core/ai/`)

| Agent | File | Capabilities |
|-------|------|--------------|
| **Gemini Spatial Agent** | `gemini-spatial-agent.ts` | Grid/circle/spiral arrangements, alignment, distribution, stacking, mirroring, path following |
| **Material Agent** | `material-agent.ts` | PBR texture selection, material recommendations, RAG-powered material knowledge |
| **Claude Blender Agent** | `claude-blender-agent.ts` | Complex Blender operations via MCP |
| **Claude Planner Agent** | `claude-planner-agent.ts` | Multi-step task planning |
| **Unified Spline Agent** | `unified-spline-agent.ts` | Scene editing orchestrator |
| **Agent Debate System** | `agent-debate-system.ts` | Gemini vs Claude debate for complex decisions |

### Analysis Tools (`lib/core/ai/`)

| Tool | File | What It Does |
|------|------|--------------|
| **Visual Analysis Tools** | `visual-analysis-tools.ts` | Color resolution ("make it red" → #FF0000), UV scale calculation, normal intensity suggestions |
| **Scene Graph Builder** | `scene-graph-builder.ts` | Semantic relationships ("on top of", "next to", "inside"), spatial reasoning, natural language summaries |
| **Multi-Model Router** | `multi-model-router.ts` | Routes tasks to best AI model |
| **Embedding Service** | `embedding-service.ts` | Vector embeddings for semantic search |

### Math & Spatial Functions (Built into Gemini Spatial Agent)

```
arrangeInGrid      → objects in rows/columns with spacing
arrangeInCircle    → objects around a center point
arrangeInSpiral    → objects in spiral pattern
scatter            → random distribution within bounds
alignObjects       → align to min/max/center on any axis
distributeObjects  → even spacing along axis
stackObjects       → vertical stacking with spacing
mirrorObjects      → mirror across axis
moveRelative       → offset positions
moveAbsolute       → set absolute positions
rotate             → rotation with pivot point
scale              → uniform or non-uniform scaling
```

### Two-Pointer & Creative Algorithms

The Scene Graph Builder uses intelligent algorithms:
- **Spatial Inference**: Distance-based relationship detection
- **Bounding Box Analysis**: Overlap and containment detection
- **Graph Generation**: Node-edge relationships for AI context
- **Natural Language Summaries**: "The Cube is on top of the Table"

### RAG Integration

| Component | Purpose |
|-----------|---------|
| **Browser RAG System** | Client-side semantic search |
| **Material Knowledge Base** | 600+ materials with properties |
| **Embedding Search** | Find similar materials/objects |

---

## What We Already Have (Don't Duplicate)

| Capability | Current Solution | Status |
|------------|------------------|--------|
| **PBR Textures** | Texture Studio + Gemini | ✅ Production ready |
| **MatCap Generation** | Texture Studio + Gemini | ✅ Production ready |
| **Material Library** | 600+ presets + Blender renders | ✅ Production ready |
| **3D Scene Editing** | 3D Studio + Blender MCP | ✅ Working |

---

## ComfyUI Capability Map (Research Needed)

### Video Production
| Capability | Models/Nodes | Research Status |
|------------|--------------|-----------------|
| **Image → Video** | AnimateDiff, SVD, Kling | 🔴 Need to test |
| **Text → Video** | Mochi, CogVideo, Hunyuan | 🔴 Need to test |
| **Lip Sync** | Wav2Lip, SadTalker, MuseTalk | 🔴 Need to test |
| **Video Upscaling** | Video2X, RIFE interpolation | 🔴 Need to test |
| **Video Style Transfer** | EbSynth, CoDeF | 🔴 Need to test |
| **Face Animation** | LivePortrait, EMO | 🔴 Need to test |
| **Motion Transfer** | DWPose → AnimateDiff | 🔴 Need to test |

### Image Generation & Editing
| Capability | Models/Nodes | Research Status |
|------------|--------------|-----------------|
| **Anime/Illustration** | NovelAI, Anything V5, Pony | 🔴 Need to test |
| **Photorealistic** | SDXL, Juggernaut, RealVis | 🔴 Need to test |
| **Style Transfer** | IP-Adapter, ControlNet Reference | 🔴 Need to test |
| **Inpainting** | SD Inpaint, PowerPaint | 🔴 Need to test |
| **Outpainting** | Extend images seamlessly | 🔴 Need to test |
| **Background Removal** | RMBG, Segment Anything | 🔴 Need to test |
| **Face Swap** | ReActor, InstantID | 🔴 Need to test |
| **Upscaling** | ESRGAN, RealESRGAN, 4x-UltraSharp | 🔴 Need to test |

### 3D Generation
| Capability | Models/Nodes | Research Status |
|------------|--------------|-----------------|
| **Image → 3D** | TripoSR, LGM, InstantMesh | 🔴 Need to test |
| **Text → 3D** | Point-E, Shap-E | 🔴 Need to test |
| **Multi-view Generation** | Zero123++, SV3D | 🔴 Need to test |
| **Mesh Texturing** | TEXTure, Text2Tex | 🔴 Need to test |
| **3D-Aware ControlNet** | Depth, Normal, Canny from Blender | 🔴 Need to test |

### Audio & Voice
| Capability | Models/Nodes | Research Status |
|------------|--------------|-----------------|
| **Text → Speech** | XTTS, Bark, Tortoise | 🔴 Need to test |
| **Voice Cloning** | RVC, So-VITS | 🔴 Need to test |
| **Music Generation** | AudioCraft, Riffusion | 🔴 Need to test |
| **Audio → Lip Sync** | Wav2Lip integration | 🔴 Need to test |

### Production Workflows
| Capability | Description | Research Status |
|------------|-------------|-----------------|
| **Batch Processing** | Generate 100 variations | 🔴 Need to test |
| **Consistent Characters** | IP-Adapter + LoRA for character consistency | 🔴 Need to test |
| **Product Photography** | AI product shots with consistent lighting | 🔴 Need to test |
| **Logo Animation** | SVG → animated video | 🔴 Need to test |
| **Social Media Assets** | Batch generate ad variations | 🔴 Need to test |

---

## Research Process

### For Each Capability:

1. **Discover**
   - Find best ComfyUI workflows on GitHub, Civitai, OpenArt
   - Identify required models and custom nodes
   - Check hardware requirements (VRAM, etc.)

2. **Test**
   - Run locally on Mac M1/M2/M3
   - Run locally on Windows NVIDIA
   - Run on RunPod (cloud)
   - Document success rate, quality, speed

3. **Master**
   - Understand all parameters
   - Find optimal settings for different use cases
   - Identify failure modes and edge cases

4. **Package**
   - Create Bisect-friendly preset
   - Simplify to 3-5 user-facing parameters
   - Build error handling
   - Add to Bisect UI

---

## Priority Research Queue

### Tier 1: High Impact (Research First)
| Capability | Why Prioritize |
|------------|----------------|
| **Lip Sync Video** | Huge demand, no easy solution exists |
| **Image → Video (AnimateDiff)** | Product reveals, logo animations |
| **Consistent Characters** | Game assets, brand mascots |
| **3D from Image** | Instant 3D from 2D artwork |

### Tier 2: Production Value
| Capability | Why Prioritize |
|------------|----------------|
| **Video Upscaling + Interpolation** | Make AI video look professional |
| **Style Transfer** | Render → concept art |
| **Product Photography AI** | E-commerce use case |
| **Anime/Illustration Style** | Huge creator market |

### Tier 3: Advanced Integration
| Capability | Why Prioritize |
|------------|----------------|
| **Blender Depth → ControlNet** | 3D-aware generation |
| **Camera Path → Video** | Controlled product videos |
| **Batch Asset Generation** | Scale for game studios |

---

## Resources to Research

### Workflow Sources
- [ ] [ComfyUI Examples](https://github.com/comfyanonymous/ComfyUI_examples)
- [ ] [CivitAI Workflows](https://civitai.com/models?types=Workflows)
- [ ] [OpenArt Workflows](https://openart.ai/workflows)
- [ ] [ComfyUI Community](https://www.reddit.com/r/comfyui/)
- [ ] [ComfyUI Discord](https://discord.gg/comfyui)

### Model Sources
- [ ] [HuggingFace](https://huggingface.co/models)
- [ ] [CivitAI Models](https://civitai.com/)
- [ ] [Replicate](https://replicate.com/)

### YouTube Channels (Tutorials)
- [ ] Olivio Sarikas
- [ ] Sebastian Kamph
- [ ] Aitrepreneur
- [ ] Nerdy Rodent

---

## Tracking Sheet

| Capability | Researched | Tested Local | Tested Cloud | Packaged | In Bisect |
|------------|------------|--------------|--------------|----------|-----------|
| Lip Sync | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| AnimateDiff | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| SVD | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Image → 3D | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Style Transfer | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Upscaling | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Consistent Chars | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Anime Style | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| ... | ... | ... | ... | ... | ... |

---

## The Vision

Every week, ComfyUI community ships new capabilities. Our job:

```
Community Ships → We Research → We Master → We Package → Users Get Magic
     (chaos)        (learning)    (testing)   (simplify)    (one click)
```

**Bisect becomes the curated, simplified interface to the entire ComfyUI ecosystem.**

---

*This is a living research document. Update as we explore.*
