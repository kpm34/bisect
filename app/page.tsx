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
  Zap,
  PenTool,
  Film,
  Box
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

      {/* Hero Section - Bisected 4-Quadrant Workflow */}
      <section className="pt-24 pb-16 px-6 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto">
          {/* Tagline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-charcoal tracking-tight">
              From mesh to market
            </h1>
            <p className="text-text-primary/50 mt-2">One workflow. Four tools.</p>
          </div>

          {/* The Bisected Grid */}
          <div className="relative">
            {/* Orange bisect lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-1 h-full bg-gradient-to-b from-transparent via-cta-orange to-transparent opacity-60" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-cta-orange to-transparent opacity-60" />
            </div>

            {/* 4 Quadrants */}
            <div className="grid grid-cols-2 gap-1">
              {/* Q1: Import Base Mesh */}
              <Link
                href="/studio/3d-canvas"
                className="group relative aspect-[4/3] bg-charcoal rounded-tl-2xl overflow-hidden flex flex-col items-center justify-center p-6 hover:bg-charcoal/90 transition-all"
              >
                <div className="absolute top-4 left-4 flex items-center gap-2 text-white/40 text-xs font-mono">
                  <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">1</span>
                  IMPORT
                </div>
                <Box size={48} className="text-white/20 group-hover:text-white/40 transition-colors mb-3" strokeWidth={1} />
                <p className="text-white/60 text-sm font-medium">Base Mesh</p>
                <p className="text-white/30 text-xs mt-1">Drop any 3D file</p>
              </Link>

              {/* Q2: Apply Material */}
              <Link
                href="/studio/3d-canvas"
                className="group relative aspect-[4/3] bg-charcoal rounded-tr-2xl overflow-hidden flex flex-col items-center justify-center p-6 hover:bg-charcoal/90 transition-all"
              >
                <div className="absolute top-4 left-4 flex items-center gap-2 text-white/40 text-xs font-mono">
                  <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">2</span>
                  MATERIAL
                </div>
                <div className="relative mb-3">
                  <Box size={48} className="text-cta-orange/60 group-hover:text-cta-orange transition-colors" strokeWidth={1} />
                  <Sparkles size={16} className="absolute -top-1 -right-1 text-cta-orange" />
                </div>
                <p className="text-white/60 text-sm font-medium">Apply Preset</p>
                <p className="text-white/30 text-xs mt-1">600+ materials</p>
              </Link>

              {/* Q3: Add Logo */}
              <Link
                href="/studio/svg-canvas"
                className="group relative aspect-[4/3] bg-charcoal rounded-bl-2xl overflow-hidden flex flex-col items-center justify-center p-6 hover:bg-charcoal/90 transition-all"
              >
                <div className="absolute top-4 left-4 flex items-center gap-2 text-white/40 text-xs font-mono">
                  <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">3</span>
                  BRAND
                </div>
                <div className="relative mb-3">
                  <Box size={48} className="text-cta-orange/60 group-hover:text-cta-orange transition-colors" strokeWidth={1} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded flex items-center justify-center">
                    <PenTool size={12} className="text-charcoal" />
                  </div>
                </div>
                <p className="text-white/60 text-sm font-medium">Add Logo</p>
                <p className="text-white/30 text-xs mt-1">Vector decals</p>
              </Link>

              {/* Q4: Export Video */}
              <Link
                href="/studio/video-studio"
                className="group relative aspect-[4/3] bg-charcoal rounded-br-2xl overflow-hidden flex flex-col items-center justify-center p-6 hover:bg-charcoal/90 transition-all"
              >
                <div className="absolute top-4 left-4 flex items-center gap-2 text-white/40 text-xs font-mono">
                  <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px]">4</span>
                  EXPORT
                </div>
                <div className="relative mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cta-orange to-cta-orange-hover flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Film size={24} className="text-white" />
                  </div>
                </div>
                <p className="text-white/60 text-sm font-medium">Product Video</p>
                <p className="text-white/30 text-xs mt-1">Ready to publish</p>
              </Link>
            </div>

            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-16 h-16 rounded-full bg-warm-bg border-4 border-cta-orange shadow-lg flex items-center justify-center">
                <Image src="/assets/bisect_logo.png" alt="Bisect" width={32} height={32} />
              </div>
            </div>
          </div>

          {/* CTA Below Grid */}
          <div className="flex flex-col items-center mt-10 gap-4">
            <Link
              href="/studio/3d-canvas"
              className="group px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-all flex items-center gap-2 shadow-lg shadow-cta-orange/25"
            >
              Start Your Workflow
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-text-primary/40 text-sm">No account required</p>
          </div>
        </div>
      </section>

      {/* Core Features - 3D Editor Capabilities */}
      <section id="features" className="py-24 border-y border-charcoal/10 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">Everything You Need in One Utility</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              Professional editing capabilities for every creative workflow
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
          <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">More Tools in Your Kit</h2>
          <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
            Create assets directly in Bisect that flow seamlessly into any workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Texture Generator Extension */}
          <Link
            href="/studio/tex-factory"
            className="group p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-accent-teal/40 transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            <div className="w-14 h-14 rounded-xl bg-accent-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform mb-6">
              <Palette className="text-accent-teal" size={28} />
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
            <div className="w-14 h-14 rounded-xl bg-cta-orange/10 flex items-center justify-center group-hover:scale-110 transition-transform mb-6">
              <Zap className="text-cta-orange" size={28} />
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

      {/* Texture Showcase - See It In Action */}
      <TextureShowcase />

      {/* DEV TOOLS SECTION */}
      <section id="dev-tools" className="py-32 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
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

      {/* Footer CTA */}
      <section className="py-20 border-t border-charcoal/10 text-center bg-white">
        <h2 className="text-3xl font-sans font-bold text-charcoal mb-4">Ready to Create?</h2>
        <p className="text-text-primary/60 mb-8 max-w-md mx-auto">
          One utility for video, 3D, logos, and textures. No installation, no learning curve.
        </p>
        <Link
          href="/studio/3d-canvas"
          className="inline-flex px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25 items-center gap-2"
        >
          <Cuboid size={18} />
          Open 3D Editor
          <ArrowRight size={16} />
        </Link>
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
                All-purpose editing utility for video, 3D, logos, and textures. Your creative Swiss army knife.
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
