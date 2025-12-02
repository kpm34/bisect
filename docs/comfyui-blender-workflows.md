# ComfyUI + Blender Workflows (What We Actually Need)

## What We Already Have (Don't Duplicate)

| Capability | Current Solution | Status |
|------------|------------------|--------|
| **PBR Textures** | Texture Studio + Gemini | ✅ Production ready |
| **MatCap Generation** | Texture Studio + Gemini | ✅ Production ready |
| **Material Library** | 600+ presets + Blender renders | ✅ Production ready |
| **3D Scene Editing** | 3D Studio + Blender MCP | ✅ Working |

## What ComfyUI Adds (Focus Here)

These are capabilities we CAN'T do with our current stack:

### Priority 1: Video Generation
| Workflow | What It Does | Why We Need It |
|----------|--------------|----------------|
| **AnimateDiff** | Animate still images | Product reveals, logo animations |
| **Stable Video Diffusion** | Image → video | Scene flythroughs |
| **Camera Path → Video** | Blender camera → AI video with motion control | Controlled product videos |

### Priority 2: Image-to-Image
| Workflow | What It Does | Why We Need It |
|----------|--------------|----------------|
| **Style Transfer** | Apply art style to renders | Concept art from 3D |
| **Upscaling** | 4x render resolution | Final output quality |
| **Inpainting** | Edit specific regions | Fix render issues |

### Priority 3: 3D-Aware Generation
| Workflow | What It Does | Why We Need It |
|----------|--------------|----------------|
| **Depth ControlNet** | Use Blender depth pass for consistent gen | VFX compositing |
| **Normal ControlNet** | Use Blender normal pass | Relighting, style transfer |
| **Multi-view Consistent** | Generate consistent character views | Game assets, turnarounds |

---

## Development Priority

### Phase 1: Video (Highest Value)
1. AnimateDiff basic (image → short video)
2. SVD image-to-video
3. Integration with Audio Hub for music sync

### Phase 2: Render Enhancement
4. 4x upscaling pipeline
5. Style transfer (render → concept art)
6. Inpainting for render fixes

### Phase 3: Advanced 3D Integration
7. Depth pass → ControlNet
8. Blender camera → video motion control
9. Batch variations via IP-Adapter

---

## Testing Environment

### Local
- ComfyUI with required models
- Test on M1/M2/M3 Mac + Windows NVIDIA

### Cloud
- RunPod serverless
- Vast.ai for cost comparison

---

## Success Criteria

- Video gen: <2 min for 4-second clip
- Upscaling: <30 sec for 2K→8K
- Style transfer: <20 sec per image
- 95%+ success rate
- Works on consumer hardware (8GB VRAM minimum)

---

*Focus on what adds NEW capabilities, not duplicating Texture Studio.*
