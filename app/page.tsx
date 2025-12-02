'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  Code,
  Palette,
  BookOpen,
  ChevronDown,
  Cuboid,
  Plug,
  FileImage,
  Sparkles,
  Layers,
  Zap
} from 'lucide-react';
import TextureShowcase from './components/TextureShowcase';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-warm-bg text-text-primary font-body selection:bg-cta-orange/20 overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-charcoal/10 bg-warm-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/assets/bisect_logo.png" alt="Bisect" width={36} height={36} className="w-9 h-9" />
              <span className="font-sans font-semibold text-charcoal tracking-tight">Bisect</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/docs" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors flex items-center gap-1">
                <BookOpen size={14} />
                Docs
              </Link>
              <a href="#extensions" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors flex items-center gap-1">
                <Plug size={14} />
                Add-ons
              </a>
              <a href="#dev-tools" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors flex items-center gap-1">
                <Terminal size={14} />
                Dev Tools
              </a>
            </div>
          </div>

          {/* Right Side - Main CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-text-primary/60 hover:text-text-primary transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/studio/3d-canvas"
              className="px-5 py-2.5 bg-cta-orange text-white rounded-lg text-sm font-medium hover:bg-cta-orange-hover transition-colors flex items-center gap-2"
            >
              <Cuboid size={16} />
              Open Editor
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - 3D Editor Focused */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-cta-orange/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cta-orange/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal/5 border border-charcoal/10 text-[10px] font-mono text-cta-orange uppercase tracking-wider">
              No-Code 3D Platform
            </div>

            <h1 className="text-6xl md:text-7xl font-sans font-bold text-charcoal tracking-tight leading-none">
              3D Editing.<br/>
              <span className="text-text-primary/40">Zero Learning Curve.</span>
            </h1>

            <p className="text-xl text-text-primary/70 max-w-md font-light">
              The fastest way to edit 3D scenes, apply materials, and export production-ready assets. AI-powered, no 3D experience required.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/studio/3d-canvas"
                className="group px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-all flex items-center gap-2 shadow-lg shadow-cta-orange/25"
              >
                <Cuboid size={18} />
                Start Editing
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#extensions"
                className="group px-8 py-4 bg-white border border-charcoal/20 text-charcoal rounded-xl font-medium hover:border-cta-orange hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plug size={16} />
                Browse Add-ons
              </a>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 pt-4 text-sm text-text-primary/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cta-orange" />
                <span>600+ Materials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cta-orange" />
                <span>AI Scene Editing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cta-orange" />
                <span>Universal Export</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - 3D Editor Preview */}
          <div className="relative h-auto w-full hidden md:flex items-center justify-center">
            <div className="bg-charcoal rounded-2xl border border-charcoal shadow-2xl p-1 w-full max-w-lg overflow-hidden">
              {/* Editor Chrome */}
              <div className="bg-neutral-800 rounded-t-xl px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs text-white/40 ml-2 font-mono">Bisect 3D Editor</span>
              </div>
              {/* Editor Content */}
              <div className="bg-neutral-900 rounded-b-xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Cuboid size={64} className="text-cta-orange mx-auto mb-4 opacity-80" />
                  <p className="text-white/60 text-sm">Drop a 3D file to start</p>
                  <p className="text-white/30 text-xs mt-1">All 3D formats supported</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Core Features - 3D Editor Capabilities */}
      <section id="features" className="py-24 border-y border-charcoal/10 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">Everything You Need in One Editor</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              Professional 3D editing capabilities without the complexity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Material System */}
            <div className="p-8 rounded-2xl bg-white border border-charcoal/10 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cta-orange/10 flex items-center justify-center mb-6">
                <Palette className="text-cta-orange" size={24} />
              </div>
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">600+ Material Presets</h3>
              <p className="text-text-primary/60 text-sm mb-4">
                From metals to fabrics, apply photorealistic materials with one click. Organized by category with real-time preview.
              </p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Gold, Silver, Copper, Iron, Titanium
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Glossy, Matte, Metallic finishes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Ready for any platform
                </li>
              </ul>
            </div>

            {/* AI Scene Editing */}
            <div className="p-8 rounded-2xl bg-white border border-charcoal/10 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cta-orange/10 flex items-center justify-center mb-6">
                <Sparkles className="text-cta-orange" size={24} />
              </div>
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">AI Scene Editing</h3>
              <p className="text-text-primary/60 text-sm mb-4">
                Describe what you want in natural language. Our AI understands scene context and makes intelligent edits.
              </p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Natural language commands
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Context-aware suggestions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Batch operations
                </li>
              </ul>
            </div>

            {/* Universal Export */}
            <div className="p-8 rounded-2xl bg-white border border-charcoal/10 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cta-orange/10 flex items-center justify-center mb-6">
                <Layers className="text-cta-orange" size={24} />
              </div>
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">Works With Any 3D File</h3>
              <p className="text-text-primary/60 text-sm mb-4">
                Import from any design tool, export anywhere. Automatic optimization for web and mobile.
              </p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  All major 3D formats
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Design tool imports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Web-optimized output
                </li>
              </ul>
            </div>
          </div>

          {/* Main CTA */}
          <div className="text-center mt-12">
            <Link
              href="/studio/3d-canvas"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25"
            >
              <Cuboid size={18} />
              Try the 3D Editor
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Add-ons Section - SVG & Texture tools */}
      <section id="extensions" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-[10px] font-mono text-accent-teal uppercase tracking-wider mb-6">
            Built-in Tools
          </div>
          <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">Powerful Add-ons Built-In</h2>
          <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
            Create assets directly in Bisect that flow seamlessly into your projects
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Texture Generator Extension */}
          <Link
            href="/studio/tex-factory"
            className="group p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-accent-teal/40 transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-accent-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="text-accent-teal" size={28} />
              </div>
              <span className="text-xs font-mono text-accent-teal bg-accent-teal/10 px-2 py-1 rounded">ADD-ON</span>
            </div>
            <h3 className="text-2xl font-sans font-semibold text-charcoal mb-3">Texture Generator</h3>
            <p className="text-text-primary/60 mb-6">
              Generate realistic textures with AI prompts. Creates depth maps automatically for lifelike lighting.
            </p>
            <ul className="space-y-2 text-sm text-text-primary/50 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent-teal" />
                AI-powered texture generation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent-teal" />
                Automatic depth and detail maps
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent-teal" />
                Real-time 3D preview
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent-teal" />
                Direct apply to 3D scenes
              </li>
            </ul>
            <div className="flex items-center gap-2 text-accent-teal font-medium text-sm group-hover:gap-3 transition-all">
              Open Texture Generator
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Vector Editor Extension */}
          <Link
            href="/studio/svg-canvas"
            className="group p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-cta-orange/40 transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-cta-orange/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="text-cta-orange" size={28} />
              </div>
              <span className="text-xs font-mono text-cta-orange bg-cta-orange/10 px-2 py-1 rounded">ADD-ON</span>
            </div>
            <h3 className="text-2xl font-sans font-semibold text-charcoal mb-3">Vector Editor</h3>
            <p className="text-text-primary/60 mb-6">
              Create and edit SVG graphics with AI vectorization. Perfect for decals, logos, and UI elements for your 3D scenes.
            </p>
            <ul className="space-y-2 text-sm text-text-primary/50 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cta-orange" />
                AI-powered vectorization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cta-orange" />
                15+ drawing tools
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cta-orange" />
                7 export formats
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cta-orange" />
                Apply as 3D decals
              </li>
            </ul>
            <div className="flex items-center gap-2 text-cta-orange font-medium text-sm group-hover:gap-3 transition-all">
              Open Vector Editor
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* The Workflow */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-t border-charcoal/10">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-sans font-bold text-charcoal mb-12">The Workflow</h2>

          <div className="flex flex-col md:flex-row items-center gap-6 text-text-primary/60 text-sm font-mono">
            <span className="px-6 py-3 border border-charcoal/20 bg-white rounded-lg shadow-sm">3D FILE</span>
            <ArrowRight size={16} className="rotate-90 md:rotate-0 text-cta-orange" />
            <span className="px-6 py-3 border border-cta-orange/30 text-cta-orange bg-cta-orange/10 rounded-lg shadow-[0_0_20px_rgba(255,107,53,0.15)]">BISECT EDITOR</span>
            <ArrowRight size={16} className="rotate-90 md:rotate-0 text-cta-orange" />
            <span className="px-6 py-3 border border-charcoal/20 bg-white rounded-lg shadow-sm">PRODUCTION</span>
          </div>
        </div>
      </section>

      {/* Texture Showcase - See It In Action */}
      <TextureShowcase />

      {/* DEV TOOLS SECTION */}
      <section id="dev-tools" className="py-32 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-[10px] font-mono text-accent-green uppercase tracking-wider mb-6">
              Developer Tools
            </div>
            <h2 className="text-4xl md:text-5xl font-sans font-bold text-charcoal mb-4">Dev Tools</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              CLI, API, and plugins for seamless integration into your development workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* CLI Tool */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="text-accent-green" size={24} />
                <h3 className="text-xl font-semibold text-white">Command-Line Interface</h3>
              </div>
              <p className="text-white/70 mb-4">
                npm-installable CLI for batch processing and CI/CD integration.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Batch Convert:</strong> <code className="text-cta-orange">bisect convert ./assets/*.glb</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Apply Materials:</strong> <code className="text-cta-orange">bisect material --preset gold</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Watch Mode:</strong> Auto-process on file changes</span>
                </li>
              </ul>
            </div>

            {/* REST API */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Code className="text-accent-teal" size={24} />
                <h3 className="text-xl font-semibold text-white">REST API</h3>
              </div>
              <p className="text-white/70 mb-4">
                Vercel-hosted serverless endpoints for on-demand processing.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">POST /api/material:</strong> Apply materials to 3D models</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">POST /api/texture:</strong> AI texture generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">POST /api/vectorize:</strong> Raster to vector conversion</span>
                </li>
              </ul>
            </div>

            {/* Framework Plugins */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Plug className="text-cta-orange" size={24} />
                <h3 className="text-xl font-semibold text-white">Framework Plugins</h3>
              </div>
              <p className="text-white/70 mb-4">
                First-party integrations for popular design and 3D tools.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Blender Add-on:</strong> Import/export with materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Three.js Helper:</strong> Direct scene integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Figma Plugin:</strong> Export optimized SVGs</span>
                </li>
              </ul>
            </div>

            {/* Developer Exports */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <FileImage className="text-cta-orange" size={24} />
                <h3 className="text-xl font-semibold text-white">Developer Exports</h3>
              </div>
              <p className="text-white/70 mb-4">
                Framework-ready code generation for modern web stacks.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">React Three Fiber:</strong> Copy-paste ready components</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Web-optimized GLB:</strong> Draco-compressed output</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">TypeScript Types:</strong> Full type definitions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-charcoal border border-white/10 rounded-xl p-6 font-mono text-sm text-text-primary/70 shadow-xl">
              <div className="flex gap-2 mb-4 opacity-50">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="space-y-2 text-white/70">
                <div><span className="text-accent-green">$</span> npm install -g @bisect/cli</div>
                <div className="text-white/40">Installed @bisect/cli@1.0.0</div>
                <div className="mt-4"><span className="text-accent-green">$</span> bisect material ./model.glb --preset &quot;polished-gold&quot;</div>
                <div className="text-white/40">Applying material: Polished Gold...</div>
                <div className="text-white/40">Exported: ./model-gold.glb (2.1MB)</div>
                <div className="text-white/40">Done in 1.2s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA - 3D Editor Focus */}
      <section className="py-20 border-t border-charcoal/10 text-center bg-white">
        <h2 className="text-3xl font-sans font-bold text-charcoal mb-4">Ready to Edit?</h2>
        <p className="text-text-primary/60 mb-8 max-w-md mx-auto">
          Start editing 3D scenes in seconds. No installation, no learning curve.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio/3d-canvas"
            className="px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25 flex items-center gap-2"
          >
            <Cuboid size={18} />
            Open 3D Editor
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white border border-charcoal/20 text-charcoal rounded-xl font-medium hover:border-cta-orange hover:shadow-lg transition-all flex items-center gap-2"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-charcoal/10 bg-warm-bg">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/assets/bisect_logo.png" alt="Bisect" width={36} height={36} className="w-9 h-9" />
                <span className="font-sans font-semibold text-charcoal tracking-tight">Bisect</span>
              </div>
              <p className="text-sm text-text-primary/60">
                No-code 3D editing platform with AI-powered tools for materials, textures, and vector graphics.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/studio/3d-canvas" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    3D Editor
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>

            {/* Add-ons Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Add-ons</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/studio/tex-factory" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Texture Generator
                  </Link>
                </li>
                <li>
                  <Link href="/studio/svg-canvas" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Vector Editor
                  </Link>
                </li>
                <li>
                  <a href="#dev-tools" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Developer Tools
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs#api-reference" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <a href="https://github.com" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-charcoal/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-primary/40">
              &copy; 2025 Bisect. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-text-primary/40 hover:text-charcoal transition-colors">
                Twitter
              </a>
              <a href="#" className="text-xs text-text-primary/40 hover:text-charcoal transition-colors">
                GitHub
              </a>
              <a href="#" className="text-xs text-text-primary/40 hover:text-charcoal transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
