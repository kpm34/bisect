import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Terminal,
  PenTool,
  CheckCircle2,
  Layers,
  Wand2,
  Download,
  Code,
  Zap,
  Grid3x3,
  Palette,
  BookOpen,
  ChevronDown,
  Cuboid,
  Sparkles,
  Brain,
  Globe
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
              <div className="w-3 h-3 bg-cta-orange rounded-sm rotate-45"></div>
              <span className="font-sans font-semibold text-charcoal tracking-tight">Bisect</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors">
                Features
              </a>
              <a href="#vector-studio" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors">
                Vector
              </a>
              <a href="#3d-studio" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors">
                3D Scene
              </a>
              <a href="#texture-studio" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors">
                Texture
              </a>
            </div>
          </div>

          {/* Right Side - Studio Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/studio/vector"
              className="text-sm font-medium text-text-primary/60 hover:text-text-primary transition-colors hidden sm:block"
            >
              Vector Studio
            </Link>
            <Link
              href="/studio/scene"
              className="text-sm font-medium text-text-primary/60 hover:text-text-primary transition-colors hidden sm:block"
            >
              3D Studio
            </Link>
            <Link
              href="/studio/textures"
              className="px-4 py-2 bg-cta-orange text-white rounded-lg text-sm font-medium hover:bg-cta-orange-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-cta-orange/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-purple/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal/5 border border-charcoal/10 text-[10px] font-mono text-cta-orange uppercase tracking-wider">
              Beta
            </div>

            <h1 className="text-6xl md:text-7xl font-sans font-bold text-charcoal tracking-tight leading-none">
              Connect.<br/>
              <span className="text-text-primary/40">Create. Export.</span>
            </h1>

            <p className="text-xl text-text-primary/70 max-w-md font-light">
              Three creative studios in one platform. Vector graphics, 3D scenes, and AI-powered textures.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/studio/vector"
                className="group px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-all flex items-center gap-2 shadow-lg shadow-cta-orange/25"
              >
                <PenTool size={16} />
                Vector Studio
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/studio/scene"
                className="group px-8 py-4 bg-white border border-charcoal/20 text-charcoal rounded-xl font-medium hover:border-accent-purple hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Cuboid size={16} />
                3D Studio
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Graphic */}
          <div className="relative h-auto w-full hidden md:flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-charcoal/10 p-8 shadow-lg h-full flex flex-col justify-center relative overflow-hidden w-full max-w-md">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Grid3x3 size={120} />
              </div>

              <div className="flex flex-col items-center justify-center gap-6 relative z-10">
                {/* Three interconnected circles representing the studios */}
                <div className="relative w-48 h-48">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-cta-orange to-cta-orange-hover flex items-center justify-center shadow-lg">
                    <PenTool size={28} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 left-4 w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-purple-600 flex items-center justify-center shadow-lg">
                    <Cuboid size={28} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-accent-teal to-cyan-600 flex items-center justify-center shadow-lg">
                    <Palette size={28} className="text-white" />
                  </div>
                  {/* Center connection */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-charcoal flex items-center justify-center shadow-xl">
                    <Sparkles size={20} className="text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-text-primary/60 text-sm italic">
                    &ldquo;Where creative domains intersect&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-mono text-text-primary/40 uppercase tracking-wider">Scroll</span>
          <ChevronDown size={20} className="text-text-primary/40" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 border-y border-charcoal/10 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">Three Studios. One Platform.</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              Everything you need to create production-ready assets for modern 3D workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Vector Studio Card */}
            <Link
              href="/studio/vector"
              className="p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-cta-orange/30 transition-all duration-200 group shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
            >
              <PenTool className="text-cta-orange mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">Vector Studio</h3>
              <p className="text-text-primary/60 text-sm mb-4">Draw, clean, and optimize vector paths with AI-powered tools.</p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  15+ drawing tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  AI vectorization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  7 export formats
                </li>
              </ul>
            </Link>

            {/* 3D Studio Card */}
            <Link
              href="/studio/scene"
              className="p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-accent-purple/30 transition-all duration-200 group shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
            >
              <Cuboid className="text-accent-purple mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">3D Studio</h3>
              <p className="text-text-primary/60 text-sm mb-4">Edit 3D scenes with AI, apply materials, export to any format.</p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-purple" />
                  Universal format support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-purple" />
                  AI scene editing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-purple" />
                  600+ material presets
                </li>
              </ul>
            </Link>

            {/* Texture Studio Card */}
            <Link
              href="/studio/textures"
              className="p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-accent-teal/30 transition-all duration-200 group shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
            >
              <Palette className="text-accent-teal mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">Texture Studio</h3>
              <p className="text-text-primary/60 text-sm mb-4">Generate MatCap and PBR textures with AI prompts.</p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-teal" />
                  AI texture generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-teal" />
                  Auto normal maps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-teal" />
                  Real-time 3D preview
                </li>
              </ul>
            </Link>
          </div>
        </div>
      </section>

      {/* The Workflow */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-sans font-bold text-charcoal mb-12">The Workflow</h2>

          <div className="flex flex-col md:flex-row items-center gap-6 text-text-primary/60 text-sm font-mono">
            <span className="px-6 py-3 border border-charcoal/20 bg-white rounded-lg shadow-sm">INPUT</span>
            <ArrowRight size={16} className="rotate-90 md:rotate-0 text-cta-orange" />
            <span className="px-6 py-3 border border-cta-orange/30 text-cta-orange bg-cta-orange/10 rounded-lg shadow-[0_0_20px_rgba(255,107,53,0.15)]">BISECT</span>
            <ArrowRight size={16} className="rotate-90 md:rotate-0 text-cta-orange" />
            <span className="px-6 py-3 border border-charcoal/20 bg-white rounded-lg shadow-sm">PRODUCTION</span>
          </div>
        </div>
      </section>

      {/* Texture Showcase - See It In Action */}
      <TextureShowcase />

      {/* CHAPTER 1: VECTOR STUDIO */}
      <section id="vector-studio" className="py-32 border-y border-charcoal/10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cta-orange/10 border border-cta-orange/20 text-[10px] font-mono text-cta-orange uppercase tracking-wider mb-6">
              Chapter 1
            </div>
            <h2 className="text-4xl md:text-5xl font-sans font-bold text-charcoal mb-4">Vector Studio</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              Production-ready SVG editing with AI-powered optimization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Drawing Engine */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <PenTool className="text-cta-orange" size={24} />
                <h3 className="text-xl font-sans font-semibold text-white">Canvas Drawing Engine</h3>
              </div>
              <p className="text-white/70 mb-4">
                Browser-native HTML5 Canvas rendering with sub-pixel precision.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Pen Tool:</strong> B&eacute;zier curve support with node manipulation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Shape Tools:</strong> Rectangle, circle, polygon primitives</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Live Preview:</strong> Real-time SVG path generation</span>
                </li>
              </ul>
            </div>

            {/* AI Vectorization */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="text-accent-teal" size={24} />
                <h3 className="text-xl font-semibold text-white">AI Vectorization</h3>
              </div>
              <p className="text-white/70 mb-4">
                Gemini-powered raster-to-vector conversion with intelligent tracing.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Smart Tracing:</strong> Edge detection with color quantization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Path Simplification:</strong> Reduces nodes by up to 70%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Logo Mode:</strong> Optimized for clean, geometric shapes</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/studio/vector"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25"
            >
              <PenTool size={16} />
              Launch Vector Studio
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: 3D STUDIO */}
      <section id="3d-studio" className="py-32 bg-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-[10px] font-mono text-accent-purple uppercase tracking-wider mb-6">
              Chapter 2
            </div>
            <h2 className="text-4xl md:text-5xl font-sans font-bold text-charcoal mb-4">3D Studio</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              AI-powered 3D scene editing with universal format support
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* AI Scene Editing */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="text-accent-purple" size={24} />
                <h3 className="text-xl font-semibold text-white">AI Scene Editing</h3>
              </div>
              <p className="text-white/70 mb-4">
                GPT-4o powered scene understanding and natural language editing.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-purple mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Natural Language:</strong> &ldquo;Make the sphere red&rdquo;</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-purple mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Scene Understanding:</strong> Vision-based object detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-purple mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Multi-Model:</strong> GPT-4o, Gemini, Claude orchestration</span>
                </li>
              </ul>
            </div>

            {/* Format Support */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="text-accent-green" size={24} />
                <h3 className="text-xl font-semibold text-white">Universal Formats</h3>
              </div>
              <p className="text-white/70 mb-4">
                Import and export to any 3D format with material preservation.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Import:</strong> GLTF, GLB, OBJ, FBX, Spline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Export:</strong> GLTF, GLB, OBJ with textures</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Materials:</strong> 600+ built-in presets</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/studio/scene"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-purple text-white rounded-xl font-medium hover:bg-purple-600 transition-colors shadow-lg shadow-accent-purple/25"
            >
              <Cuboid size={16} />
              Launch 3D Studio
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: TEXTURE STUDIO */}
      <section id="texture-studio" className="py-32 border-y border-charcoal/10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-[10px] font-mono text-accent-teal uppercase tracking-wider mb-6">
              Chapter 3
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal font-sans mb-4">Texture Studio</h2>
            <p className="text-text-primary/70 text-lg max-w-2xl mx-auto">
              AI-powered MatCap and PBR texture generation for 3D workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* MatCap Generation */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="text-accent-teal" size={24} />
                <h3 className="text-xl font-semibold text-white">MatCap Generator</h3>
              </div>
              <p className="text-white/70 mb-4">
                Gemini-powered material capture textures for real-time 3D rendering.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Prompt-Based:</strong> &ldquo;Chrome&rdquo;, &ldquo;Clay&rdquo;, &ldquo;Velvet&rdquo; - instant results</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">1K/2K Resolution:</strong> Fast generation, upscale on demand</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Live Preview:</strong> Real-time 3D sphere preview</span>
                </li>
              </ul>
            </div>

            {/* PBR Generation */}
            <div className="p-8 rounded-2xl bg-charcoal border border-charcoal shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="text-cta-orange" size={24} />
                <h3 className="text-xl font-semibold text-white">PBR Texture Maps</h3>
              </div>
              <p className="text-white/70 mb-4">
                Complete physically-based rendering texture sets from a single prompt.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Albedo:</strong> Base color map via Gemini</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Normal Map:</strong> Auto-generated with Sobel filtering</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Roughness:</strong> Luminance-based extraction</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/studio/textures"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-teal text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors shadow-lg shadow-accent-teal/25"
            >
              <Palette size={16} />
              Launch Texture Studio
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Powered by AI Section */}
      <section className="py-24 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-sans font-bold mb-4">Powered by Multi-Agent AI</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Best-in-class AI models working together for optimal results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-4xl mb-3">&#x1F916;</div>
              <h4 className="font-semibold mb-2">GPT-4o</h4>
              <p className="text-sm text-white/60">Scene understanding with vision</p>
            </div>

            <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-4xl mb-3">&#x2728;</div>
              <h4 className="font-semibold mb-2">Gemini</h4>
              <p className="text-sm text-white/60">Fast texture &amp; vector generation</p>
            </div>

            <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-4xl mb-3">&#x1F9E0;</div>
              <h4 className="font-semibold mb-2">Claude</h4>
              <p className="text-sm text-white/60">Complex reasoning &amp; planning</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 border-t border-charcoal/10 text-center bg-white">
        <h2 className="text-3xl font-sans font-bold text-charcoal mb-4">Ready to Create?</h2>
        <p className="text-text-primary/60 mb-8 max-w-md mx-auto">
          Start building production-ready assets with Bisect
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio/vector"
            className="px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25 flex items-center gap-2"
          >
            <PenTool size={16} />
            Vector Studio
          </Link>
          <Link
            href="/studio/scene"
            className="px-8 py-4 bg-accent-purple text-white rounded-xl font-medium hover:bg-purple-600 transition-colors shadow-lg shadow-accent-purple/25 flex items-center gap-2"
          >
            <Cuboid size={16} />
            3D Studio
          </Link>
          <Link
            href="/studio/textures"
            className="px-8 py-4 bg-white border border-charcoal/20 text-charcoal rounded-xl font-medium hover:border-accent-teal hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Palette size={16} />
            Texture Studio
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
                <div className="w-3 h-3 bg-cta-orange rounded-sm rotate-45"></div>
                <span className="font-sans font-semibold text-charcoal tracking-tight">Bisect</span>
              </div>
              <p className="text-sm text-text-primary/60">
                Connecting creative domains: vector graphics, 3D scenes, and AI-powered textures.
              </p>
            </div>

            {/* Studios Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Studios</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/studio/vector" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Vector Studio
                  </Link>
                </li>
                <li>
                  <Link href="/studio/scene" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    3D Studio
                  </Link>
                </li>
                <li>
                  <Link href="/studio/textures" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Texture Studio
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#vector-studio" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    AI Vectorization
                  </a>
                </li>
                <li>
                  <a href="#3d-studio" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Scene Editing
                  </a>
                </li>
                <li>
                  <a href="#texture-studio" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Texture Generation
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-sans font-semibold text-charcoal mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Community
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
