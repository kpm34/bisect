# Next-Gen Model Capabilities & Debate Strategy

## 1. Model Personas & Strengths

Based on 2025 research data:

### **Gemini 3.0 Pro ("The Visionary")**
*   **Release:** Nov 2025
*   **Core Strength:** **System-Level Reasoning & Multimodality**.
*   **Key Features:**
    *   **Deep Think Mode:** Explores multiple solution paths in parallel.
    *   **Unified Multimodality:** Seamlessly understands video, audio, and text context.
    *   **Context:** 1M+ token window for massive scene understanding.
*   **Role in Agent System:**
    *   **Spatial Reasoning:** Analyzing scene composition, balance, and aesthetics.
    *   **Creative Direction:** Generating high-level design concepts (e.g., "Cyberpunk mood").
    *   **Context Integration:** Synthesizing the "Scene Graph" and "Visual Analysis" into a coherent vision.

### **Claude 4.5 Sonnet ("The Architect")**
*   **Release:** Sep 2025
*   **Core Strength:** **Pragmatic Coding & Agentic Execution**.
*   **Key Features:**
    *   **Zero-Error Coding:** 0% error rate on internal benchmarks.
    *   **Agentic Focus:** Can maintain complex multi-step plans for long durations.
    *   **Computer Use:** High proficiency in tool manipulation and API usage.
*   **Role in Agent System:**
    *   **Technical Planning:** Converting the "Vision" into precise API commands.
    *   **Code Generation:** Writing the actual Spline/Three.js scripts.
    *   **Validation:** Reviewing the plan for logical errors or API misuse.

---

## 2. Proposed Debate Protocol

To leverage these strengths, we will implement a **"Vision-Architect" Debate Loop**:

### **Phase 1: The Vision (Gemini 3.0)**
*   **Input:** User command (e.g., "Make a futuristic city") + Scene Graph.
*   **Action:** Gemini generates a high-level **Design Brief**.
    *   *Example:* "The scene needs verticality. Use a neon palette (Cyan/Magenta). Place tall structures in the back-right third to balance the composition."

### **Phase 2: The Blueprint (Claude 4.5)**
*   **Input:** Design Brief.
*   **Action:** Claude translates this into a **Technical Plan**.
    *   *Example:* "1. Create 5 Cube objects. 2. Scale Y to random(10, 50). 3. Apply NodeMaterial with emissive colors..."

### **Phase 3: The Critique (Debate)**
*   **Gemini:** Reviews the Blueprint for *aesthetic adherence*. ("You missed the neon palette.")
*   **Claude:** Reviews the Vision for *technical feasibility*. ("We cannot scale infinite objects; limiting to 50.")

### **Phase 4: Execution**
*   The Router executes the finalized plan.

---

## 3. Implementation Strategy

We will create `AgentDebateSystem.ts` to orchestrate this ping-pong interaction.
*   **`GeminiSpatialAgent`** will be upgraded to use `gemini-3.0-pro`.
*   **`ClaudePlannerAgent`** will be upgraded to use `claude-4-5-sonnet`.
