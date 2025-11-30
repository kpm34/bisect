# Bisect

A unified no-code 3D creator platform that merges three creative studios into a single application. Built with Next.js 14, React Three Fiber, and multi-model AI integration.

**Version**: 0.1.0 (Beta)
**Live**: [bisect.app](https://bisect.app)

## Vision

Create a Spline-like tool with **zero learning curve** for:
- **UI Development** - Create 3D UI components and interactions
- **3D Workflows** - Professional 3D scene creation and editing
- **Branding** - Logo creation and brand asset generation
- **Website Enhancement** - Add 3D elements to websites
- **AR/VR Flows** - Prepare content for immersive experiences

## Features

### Vector Studio
- Complete SVG editor with 15+ drawing tools
- AI-powered vectorization (PNG/JPG to SVG)
- 7 export formats: SVG, JSX, Animated SVG, Decal Pack, Blender Curves, Design Tokens
- Website screenshot import capability

### Texture Studio
- AI-powered MatCap and PBR texture generation (Gemini)
- Auto-generate normal and roughness maps
- Real-time 3D preview
- Quality modes: Fast (1K) / High (2K)

### 3D Studio
- Universal format support: Spline, GLTF, GLB, FBX, OBJ
- 600+ PBR material presets (Gold, Silver, Copper, Iron, Titanium)
- Natural language scene editing via AI
- Object transform controls (position, rotation, scale)
- Scene hierarchy panel with tree view
- Project persistence (IndexedDB + Supabase)

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/kpm34/bisect.git
cd Bisect

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

### Build & Deploy

```bash
# Build for production
pnpm build

# Deploy to Vercel (uses existing bisect project)
vercel --prod
```

## Environment Variables

```env
# Required
OPENAI_API_KEY              # GPT-4o for 3D scene editing
GOOGLE_GEMINI_API_KEY       # Gemini for texture & SVG generation
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key

# Optional
ANTHROPIC_API_KEY           # Claude for complex reasoning
OPENROUTER_API_KEY          # Multi-model access
```

## Project Structure

```
Bisect/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── api/                     # API routes
│   │   ├── ai/                  # AI endpoints
│   │   ├── materials/           # Material endpoints
│   │   └── tex-factory/         # Texture generation
│   └── studio/
│       ├── 3d-canvas/           # 3D Studio
│       ├── svg-canvas/          # Vector Studio
│       └── tex-factory/         # Texture Studio
├── lib/
│   ├── core/                    # Core library
│   │   ├── adapters/            # Format adapters (Spline, GLTF)
│   │   ├── ai/                  # AI agents
│   │   ├── materials/           # 600+ material library
│   │   └── scene/               # Scene manipulation
│   ├── store/                   # Zustand state
│   ├── services/                # API services
│   └── drag-drop/               # Cross-studio transfer
├── components/
│   ├── shared/                  # Shell, navigation
│   └── studio/                  # Studio components
├── hooks/                       # React hooks
├── mcp-server/                  # MCP server implementation
└── cli/                         # Command-line tool
```

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | Next.js 14, React 18, TypeScript |
| **3D** | Three.js, React Three Fiber, Drei, Spline Runtime |
| **AI** | OpenAI GPT-4o, Google Gemini, Anthropic Claude |
| **State** | Zustand, React Query |
| **Database** | Supabase (PostgreSQL), IndexedDB |
| **Styling** | Tailwind CSS, Framer Motion |

## Documentation

| Document | Description |
|----------|-------------|
| [.memory.md](./.memory.md) | Project status and priorities |
| [docs/material-system-flow.md](./docs/material-system-flow.md) | Material system architecture |
| [PROJECT_MAP.md](./PROJECT_MAP.md) | Cross-project navigation |
| [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) | Deployment guide |

## Material System

Bisect includes a comprehensive material library with Blender-rendered previews:

```
Database Structure:
├── material_categories    (Gold, Silver, Copper, Iron, Titanium)
├── material_presets       (Finishes, Tints, Aged variants)
└── material_variations    (Fine-tuned variations per preset)

Storage: Supabase bucket with 512x512 PNG previews
```

## Deployment

- **Platform**: Vercel
- **Project**: `bisect` (existing project)
- **Domain**: bisect.app
- **Auto-deploy**: Main branch pushes deploy automatically

```bash
# Manual deployment
vercel --prod
```

## License

MIT

---

**Built to make 3D creation accessible to everyone**
