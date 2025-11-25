# Bisect Project Configuration

## Deployment

**Vercel Project:** `bisect`
**Live Domain:** `bisect.app`
**GitHub Repo:** `https://github.com/kpm34/bisect`

- Always deploy to the existing `bisect` project on Vercel
- Do NOT create a new Vercel project
- Deploy command: `vercel --prod` (will use existing project)
- Pushes to `main` branch auto-deploy to production

## RAG Knowledge System Integration

**IMPORTANT**: At the start of each session, load project context from RAG:

```bash
python3 ~/Blender-Workspace/rag/integrations/project_context_loader.py bisect
```

This will retrieve:
- Relevant scripts and patterns for this project
- Previous solutions to similar problems
- Canvas/editor patterns
- Three.js web examples

## Project Overview

Bisect is an interactive canvas/editor application with:
- Drag and drop functionality
- React-based UI
- Potential 3D visualization components

## Key Directories

```
Bisect/
├── lib/              # Core libraries
│   └── drag-drop/    # Drag-drop functionality
├── src/              # Main source code
└── docs/             # Documentation
```

## RAG Queries for Common Tasks

```bash
# Canvas/editor patterns
python3 -c "import sys;sys.path.insert(0,'$HOME/Blender-Workspace/rag');from core.knowledge_manager import get_manager;print(get_manager().query('canvas editor drag drop','scripts'))"

# Three.js integration
python3 -c "import sys;sys.path.insert(0,'$HOME/Blender-Workspace/rag');from core.knowledge_manager import get_manager;print(get_manager().query('three.js react integration','scripts'))"
```
