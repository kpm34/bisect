# Feature Testing Tracker

## The Reality

We've built a lot of features. But **built ≠ production-ready**.

Before we add more, we need to validate what we have.

---

## Testing Status Legend

| Status | Meaning |
|--------|---------|
| ⬜ | Not tested |
| 🟡 | Tested, has issues |
| ✅ | Production ready |
| ❌ | Broken, needs rebuild |

---

## Studios

### Vector Studio
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| SVG Import | ⬜ | | |
| SVG Export | ⬜ | | |
| AI Vectorization | ⬜ | | |
| Shape Tools | ⬜ | | |
| Path Editing | ⬜ | | |
| Color Picker | ⬜ | | |
| Layers Panel | ⬜ | | |

### Texture Studio
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| MatCap Generation (Gemini) | ⬜ | | |
| PBR Generation (Gemini) | ⬜ | | |
| Normal Map Generation | ⬜ | | |
| Texture Preview 3D | ⬜ | | |
| Download/Export | ⬜ | | |

### 3D Studio
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Scene Loading (Spline) | ⬜ | | |
| Scene Loading (GLTF/GLB) | ⬜ | | |
| Object Selection | ⬜ | | |
| Transform Gizmo | ⬜ | | |
| Hierarchy Panel | ⬜ | | |
| Object Properties | ⬜ | | |
| Camera Controls | ⬜ | | |
| Grid/Helpers | ⬜ | | |

### Audio Hub
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Library Browse | ⬜ | | |
| Track Preview | ⬜ | | |
| AI Music Generation (Suno) | ⬜ | | |
| AI SFX Generation (ElevenLabs) | ⬜ | | |
| Timeline | ⬜ | | |

---

## AI Agents

### Gemini Spatial Agent
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| arrangeInGrid | ⬜ | | |
| arrangeInCircle | ⬜ | | |
| arrangeInSpiral | ⬜ | | |
| scatter | ⬜ | | |
| alignObjects | ⬜ | | |
| distributeObjects | ⬜ | | |
| stackObjects | ⬜ | | |
| mirrorObjects | ⬜ | | |
| moveRelative | ⬜ | | |
| moveAbsolute | ⬜ | | |
| rotate | ⬜ | | |
| scale | ⬜ | | |

### Material Agent
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Material Selection | ⬜ | | |
| Color Resolution | ⬜ | | |
| RAG Knowledge Query | ⬜ | | |
| PBR Texture Mapping | ⬜ | | |

### Scene Graph Builder
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Node Extraction | ⬜ | | |
| Relationship Inference | ⬜ | | |
| Summary Generation | ⬜ | | |

### Agent Debate System
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Gemini Vision Phase | ⬜ | | |
| Claude Blueprint Phase | ⬜ | | |
| Critique Loop | ⬜ | | |
| Final Plan Generation | ⬜ | | |

---

## Core Systems

### Material System
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Material Library (600+) | ⬜ | | |
| Material Preview | ⬜ | | |
| Apply to Object | ⬜ | | |
| Supabase Sync | ⬜ | | |

### Events System
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| onClick | ⬜ | | |
| onHover | ⬜ | | |
| onMouseEnter | ⬜ | | |
| onMouseLeave | ⬜ | | |
| onDrag | ⬜ | | |
| onDoubleClick | ⬜ | | |
| Animation Triggers | ⬜ | | |
| State Changes | ⬜ | | |

### Cloner System
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Linear Mode | ⬜ | | |
| Radial Mode | ⬜ | | |
| Grid Mode | ⬜ | | |
| Scatter Mode | ⬜ | | |
| Spline Mode | ⬜ | | |
| Object Mode | ⬜ | | |
| Falloff Effector | ⬜ | | |
| Random Effector | ⬜ | | |
| Step Effector | ⬜ | | |

### Configurator
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Variant Definition | ⬜ | | |
| Option Selection | ⬜ | | |
| Price Calculation | ⬜ | | |
| Cart Integration | ⬜ | | |
| Shopify Adapter | ⬜ | | |
| WooCommerce Adapter | ⬜ | | |

### Hotspots
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Create Hotspot | ⬜ | | |
| Tooltip Display | ⬜ | | |
| Media Embed | ⬜ | | |
| Click Actions | ⬜ | | |

---

## Integrations

### Blender MCP
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Connection | ⬜ | | |
| Scene Sync | ⬜ | | |
| Material Apply | ⬜ | | |
| Render Request | ⬜ | | |
| GLB Export | ⬜ | | |

### Supabase
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| Auth | ⬜ | | |
| Project Save | ⬜ | | |
| Project Load | ⬜ | | |
| Asset Storage | ⬜ | | |
| Material Queries | ⬜ | | |

### Export
| Feature | Status | Notes | Last Tested |
|---------|--------|-------|-------------|
| GLB Export | ⬜ | | |
| React Component | ⬜ | | |
| Three.js Code | ⬜ | | |
| Vanilla JS | ⬜ | | |

---

## Testing Process

### For Each Feature:

1. **Functional Test**
   - Does it work at all?
   - Basic happy path

2. **Edge Cases**
   - Empty inputs
   - Large inputs
   - Invalid inputs

3. **Performance**
   - Response time acceptable?
   - Memory usage reasonable?

4. **Error Handling**
   - Graceful failures?
   - Useful error messages?

5. **UX**
   - Intuitive to use?
   - Feedback to user?

---

## Priority Testing Order

### Week 1: Core Flow
1. 3D Studio - Scene loading, selection, transforms
2. Material System - Apply materials to objects
3. Supabase - Save/load projects

### Week 2: AI Agents
4. Gemini Spatial Agent - Basic arrangements
5. Material Agent - Material selection
6. Scene Graph Builder - Relationship inference

### Week 3: Studios
7. Texture Studio - PBR generation
8. Vector Studio - SVG import/export
9. Audio Hub - Basic playback

### Week 4: Advanced
10. Events System - Interactions
11. Cloner System - Instancing
12. Configurator - Variants

---

## Notes

- Test on Chrome, Safari, Firefox
- Test on Mac and Windows
- Test with slow network
- Document all bugs found
- Create GitHub issues for fixes

---

*Update this document as testing progresses.*
