# Unified 3D Creator

A comprehensive no-code 3D creation platform merging **Prism** (3D scene editor) and **VectorCraft AI** (vector/texture tools) into one unified application. Built with VectorCraft's UI as the shell, bringing Prism's 3D capabilities as an additional canvas.

## 🎯 Vision

Create a Spline-like tool with **zero learning curve** for:
- **UI Development** - Create 3D UI components and interactions
- **3D Workflows** - Professional 3D scene creation and editing
- **Branding** - Logo creation and brand asset generation
- **Website Enhancement** - Add 3D elements to websites
- **AR/VR Flows** - Prepare content for immersive experiences

## ✨ Features

### 🎨 Vector Studio
- Complete SVG editor with 15+ drawing tools
- AI-powered vectorization (PNG/JPG → SVG)
- 7 export formats (SVG, JSX, Animated SVG, Decal Pack, Blender Curves, Design Tokens)
- Website screenshot import

### 🖼️ Texture Studio
- AI-powered MatCap and PBR texture generation
- Auto-generate normal and roughness maps
- Real-time 3D preview
- Quality modes (Fast/High)

### 🎭 3D Studio
- Universal format support (Spline, GLTF, GLB, FBX, OBJ)
- 600+ PBR material presets
- Natural language scene editing
- Object transform controls
- Scene hierarchy panel
- Project persistence (IndexedDB)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd unified-3d-creator

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔧 Environment Variables

See `.env.example` for required API keys:

- **OPENAI_API_KEY** - For 3D scene editing (GPT-4o)
- **GOOGLE_GEMINI_API_KEY** - For texture & SVG generation
- **ANTHROPIC_API_KEY** - Optional, for complex reasoning
- **OPENROUTER_API_KEY** - Optional, for multi-model access

## 📁 Project Structure

```
unified-3d-creator/
├── app/
│   ├── studio/
│   │   ├── vector/       # Vector Studio (SVG editing)
│   │   ├── textures/     # Texture Studio (MatCap/PBR)
│   │   └── scene/        # 3D Studio (Scene editing)
│   └── ...
├── lib/
│   ├── core/             # Prism core library
│   │   ├── adapters/     # Format adapters
│   │   ├── materials/    # 600+ material library
│   │   ├── ai/           # AI agents + RAG
│   │   └── scene/        # Scene manipulation
│   ├── ai/               # Multi-agent orchestrator
│   ├── store/            # Zustand state management
│   └── drag-drop/        # Cross-studio asset transfer
└── components/
    └── shared/           # Shell component
```

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **3D Rendering:** Three.js, React Three Fiber
- **AI:** OpenAI GPT-4o, Google Gemini, Anthropic Claude
- **State:** Zustand
- **Storage:** IndexedDB (browser), Appwrite (optional cloud)

## 📚 Documentation

- [Integration Status](./INTEGRATION_STATUS.md) - Current status and remaining work
- [Project Map](./PROJECT_MAP.md) - Cross-project navigation guide
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Deployment steps

## 🤝 Contributing

This project merges:
- **VectorCraft AI** - Vector Studio and Texture Studio foundation
- **Prism** - 3D Studio and core library

## 📄 License

MIT

---

**Built with ❤️ to make 3D creation accessible to everyone**
