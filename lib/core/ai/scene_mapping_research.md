# Advanced Scene Mapping & Communication Research

## Executive Summary
To enable "nuanced and creative" scene understanding, we must move beyond simple object lists. The agent needs to perceive **relationships**, **composition**, and **atmosphere**.

We propose implementing a **Semantic Scene Mapper** that translates raw 3D data into rich, human-like context using three key techniques:

---

## 1. Semantic Scene Graphs (SSGs)
**Concept:** Instead of a flat list of objects, represent the scene as a graph where **Nodes** are objects and **Edges** are relationships.

**Data Structure:**
```json
{
  "nodes": [
    { "id": "table_01", "label": "Wooden Dining Table", "attributes": ["vintage", "worn"] },
    { "id": "chair_01", "label": "Modern Chair", "attributes": ["sleek", "white"] }
  ],
  "edges": [
    { "source": "chair_01", "target": "table_01", "relation": "tucked_under" },
    { "source": "vase_01", "target": "table_01", "relation": "resting_on", "context": "center" }
  ]
}
```

**Why it works:** LLMs excel at graph traversal and reasoning. "Put the lamp on the table" becomes a graph operation: `Connect(Lamp, Table, "on_top")`.

## 2. Compositional "Visual Weight" Mapping
**Concept:** Quantify artistic principles like the **Rule of Thirds** and **Visual Weight** into data the agent can use.

**Technique:**
- **Grid Mapping:** Divide the scene bounds into a 3x3 grid.
- **Weight Calculation:** Assign a "weight score" to objects based on Size, Brightness, and Color Saturation.
- **Communication:**
  > "The scene is currently unbalanced. 70% of visual weight is in the left-third. The 'Red Sofa' is the dominant focal point. To balance, place the 'Floor Lamp' at the right-third intersection."

## 3. Multimodal "Depth & Context" Snapshots
**Concept:** Give the agent "eyes" that see more than just pixels.

**Implementation:**
- **RGB Pass:** Standard view.
- **Depth Pass:** Grayscale image representing distance. Helps the agent understand "behind", "far", "near".
- **Segmentation Pass:** Color-coded image where each object is a distinct solid color. Helps the agent distinguish overlapping objects.

**Workflow:**
1. Capture these 3 passes from the viewport.
2. Feed them into **GPT-4o** or **Gemini 1.5 Pro**.
3. Prompt: *"Analyze the spatial depth and occlusion in these views. Is the 'Chair' blocking the 'Table'? Is the composition cluttered?"*

---

## Proposed Implementation: `SceneUnderstandingModule`

We can create a new module that runs alongside the `MaterialAgent`:

1.  **`SceneGraphBuilder`**: Analyzes the Spline scene tree and calculates bounding box relationships to build the JSON graph.
2.  **`CompositionAnalyzer`**: mathematically calculates the "center of visual mass" and compares it against Rule of Thirds grid lines.
3.  **`ContextInjector`**: Formats this data into a "Scene Description Language" (SDL) to prepend to the Agent's system prompt.

**Example SDL Output to Agent:**
> "You are editing a 'Cozy Living Room'.
> **Spatial Context:** A 'Sofa' is the central anchor. A 'Coffee Table' is placed in front of it.
> **Composition:** The scene is heavy on the left.
> **Lighting:** The mood is 'Warm' but the right corner is in deep shadow.
> **Goal:** Balance the composition by adding a vertical element to the right."
