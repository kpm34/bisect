import Link from 'next/link';
import {
  ArrowRight,
  Terminal,
  PenTool,
  CheckCircle2,
  Code,
  Palette,
  BookOpen,
  ChevronDown,
  Cuboid,
  Plug,
  FileImage
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
              <Link href="/docs" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors flex items-center gap-1">
                <BookOpen size={14} />
                Docs
              </Link>
              <a href="#dev-tools" className="text-sm text-text-primary/60 hover:text-text-primary transition-colors flex items-center gap-1">
                <Terminal size={14} />
                Dev Tools
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
              Tex Factory
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-cta-orange/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cta-orange/10 blur-[100px] rounded-full pointer-events-none" />

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
                className="group px-8 py-4 bg-white border border-charcoal/20 text-charcoal rounded-xl font-medium hover:border-cta-orange hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Cuboid size={16} />
                3D Studio
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Graphic: Vector Before/After */}
          <div className="relative h-auto w-full hidden md:flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-charcoal/10 p-8 shadow-lg h-full flex flex-col justify-center relative overflow-hidden w-full max-w-md">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
                {/* Before */}
                <div className="text-center group">
                  <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-charcoal/5 relative overflow-hidden">
                    {/* Raster Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/examples/bear-raster.png"
                      alt="Raster Input"
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity grayscale contrast-125"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm">
                      <span className="text-xs font-mono text-red-500 font-bold">RASTER PNG</span>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-charcoal/40 uppercase tracking-widest">Original Sketch</p>
                </div>

                <ArrowRight className="text-charcoal/20 rotate-90 md:rotate-0" size={32} />

                {/* After */}
                <div className="text-center group">
                  <div className="w-32 h-32 bg-cta-orange/5 rounded-xl flex items-center justify-center mb-4 border border-cta-orange/20 relative overflow-hidden">
                    {/* Vector Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/examples/bear-vector.svg"
                      alt="Vector Output"
                      className="w-full h-full object-contain p-2 drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 border-2 border-cta-orange/10 rounded-xl pointer-events-none"></div>
                  </div>
                  <p className="font-mono text-xs text-accent-teal uppercase tracking-widest font-bold">Vector SVG</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-text-primary/60 mx-auto text-sm italic">
                  &ldquo;Hand-drawn sketch to clean SVG in seconds.&rdquo;
                </p>
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
              className="p-8 rounded-2xl bg-white border border-charcoal/10 hover:border-cta-orange/30 transition-all duration-200 group shadow-sm hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
            >
              <Cuboid className="text-cta-orange mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-sans font-semibold text-charcoal mb-2">3D Studio</h3>
              <p className="text-text-primary/60 text-sm mb-4">Edit 3D scenes with AI, apply materials, export to any format.</p>
              <ul className="space-y-2 text-sm text-text-primary/50">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  Universal format support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
                  AI scene editing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cta-orange" />
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
                  <span><strong className="text-white/90">Batch Convert:</strong> <code className="text-cta-orange">bisect convert ./assets/*.png</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">SVG Optimize:</strong> <code className="text-cta-orange">bisect optimize --recursive ./icons</code></span>
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
                  <span><strong className="text-white/90">POST /api/vectorize:</strong> Raster to vector conversion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">POST /api/optimize:</strong> SVG compression and cleanup</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">POST /api/texture:</strong> AI texture generation</span>
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
                  <span><strong className="text-white/90">Blender Add-on:</strong> Import SVG, apply textures directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Figma Plugin:</strong> Export optimized SVGs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">VSCode Extension:</strong> Preview and edit SVGs inline</span>
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
                  <span><strong className="text-white/90">React/Vue Components:</strong> TSX/JSX with TypeScript types</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Sprite Sheet:</strong> Combined SVG with symbol references</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cta-orange mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white/90">Three.js Code:</strong> Copy-paste ready components</span>
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
                <div className="text-white/40">✓ Installed @bisect/cli@1.0.0</div>
                <div className="mt-4"><span className="text-accent-green">$</span> bisect convert ./assets/*.png --output ./svg</div>
                <div className="text-white/40">Processing 12 files...</div>
                <div className="text-white/40">✓ logo.png → logo.svg (3.2KB → 1.1KB)</div>
                <div className="text-white/40">✓ icon-home.png → icon-home.svg (1.8KB → 0.4KB)</div>
                <div className="text-white/40">✓ Done in 2.3s</div>
              </div>
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
            className="px-8 py-4 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors shadow-lg shadow-cta-orange/25 flex items-center gap-2"
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
                  <a href="#features" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    AI Vectorization
                  </a>
                </li>
                <li>
                  <a href="#dev-tools" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Developer Tools
                  </a>
                </li>
                <li>
                  <Link href="/docs" className="text-text-primary/60 hover:text-cta-orange transition-colors">
                    Documentation
                  </Link>
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
