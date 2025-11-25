import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  PenTool,
  Cuboid,
  Palette,
  BookOpen,
  Terminal,
  Code,
  Layers,
  Wand2,
  Download,
  Upload,
  Globe,
  CheckCircle2,
  Zap,
  MousePointer,
  Move,
  Trash2,
  Copy,
  Undo,
  Redo
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-warm-bg text-text-primary font-body">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-charcoal/10 bg-warm-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-text-primary/60 hover:text-text-primary transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-cta-orange" />
            <span className="font-sans font-semibold text-charcoal">Documentation</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/studio/svg-canvas"
              className="text-sm text-text-primary/60 hover:text-text-primary transition-colors hidden sm:block"
            >
              Vector Studio
            </Link>
            <Link
              href="/studio/3d-canvas"
              className="text-sm text-text-primary/60 hover:text-text-primary transition-colors hidden sm:block"
            >
              3D Studio
            </Link>
            <Link
              href="/studio/tex-factory"
              className="px-4 py-2 bg-cta-orange text-white rounded-lg text-sm font-medium hover:bg-cta-orange-hover transition-colors"
            >
              Tex Factory
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 border-r border-charcoal/10 bg-white/50 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Getting Started */}
            <div>
              <h3 className="text-xs font-semibold text-text-primary/40 uppercase tracking-wider mb-3">Getting Started</h3>
              <ul className="space-y-2">
                <li><a href="#overview" className="text-sm text-text-primary/70 hover:text-cta-orange transition-colors">Overview</a></li>
                <li><a href="#quick-start" className="text-sm text-text-primary/70 hover:text-cta-orange transition-colors">Quick Start</a></li>
              </ul>
            </div>

            {/* Vector Studio */}
            <div>
              <h3 className="text-xs font-semibold text-cta-orange uppercase tracking-wider mb-3 flex items-center gap-2">
                <PenTool size={12} />
                Vector Studio
              </h3>
              <ul className="space-y-2">
                <li><a href="#vector-canvas" className="text-sm text-text-primary/70 hover:text-cta-orange transition-colors">Canvas &amp; Tools</a></li>
                <li><a href="#vector-ai" className="text-sm text-text-primary/70 hover:text-cta-orange transition-colors">AI Vectorization</a></li>
                <li><a href="#vector-export" className="text-sm text-text-primary/70 hover:text-cta-orange transition-colors">Export Formats</a></li>
              </ul>
            </div>

            {/* 3D Studio */}
            <div>
              <h3 className="text-xs font-semibold text-accent-purple uppercase tracking-wider mb-3 flex items-center gap-2">
                <Cuboid size={12} />
                3D Studio
              </h3>
              <ul className="space-y-2">
                <li><a href="#3d-viewport" className="text-sm text-text-primary/70 hover:text-accent-purple transition-colors">Viewport Controls</a></li>
                <li><a href="#3d-import" className="text-sm text-text-primary/70 hover:text-accent-purple transition-colors">Import Formats</a></li>
                <li><a href="#3d-ai" className="text-sm text-text-primary/70 hover:text-accent-purple transition-colors">AI Scene Editing</a></li>
                <li><a href="#3d-materials" className="text-sm text-text-primary/70 hover:text-accent-purple transition-colors">Materials</a></li>
              </ul>
            </div>

            {/* Tex Factory */}
            <div>
              <h3 className="text-xs font-semibold text-accent-teal uppercase tracking-wider mb-3 flex items-center gap-2">
                <Palette size={12} />
                Tex Factory
              </h3>
              <ul className="space-y-2">
                <li><a href="#tex-matcap" className="text-sm text-text-primary/70 hover:text-accent-teal transition-colors">MatCap Generation</a></li>
                <li><a href="#tex-pbr" className="text-sm text-text-primary/70 hover:text-accent-teal transition-colors">PBR Textures</a></li>
                <li><a href="#tex-preview" className="text-sm text-text-primary/70 hover:text-accent-teal transition-colors">3D Preview</a></li>
              </ul>
            </div>

            {/* API Reference */}
            <div>
              <h3 className="text-xs font-semibold text-accent-green uppercase tracking-wider mb-3 flex items-center gap-2">
                <Terminal size={12} />
                API Reference
              </h3>
              <ul className="space-y-2">
                <li><a href="#api-endpoints" className="text-sm text-text-primary/70 hover:text-accent-green transition-colors">REST Endpoints</a></li>
                <li><a href="#api-cli" className="text-sm text-text-primary/70 hover:text-accent-green transition-colors">CLI Usage</a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 max-w-4xl mx-auto px-6 py-12">
          {/* Overview */}
          <section id="overview" className="mb-16">
            <h1 className="text-4xl font-sans font-bold text-charcoal mb-6">Bisect Documentation</h1>
            <p className="text-lg text-text-primary/70 mb-8">
              Bisect is a unified creative platform that connects three powerful studios: Vector graphics editing,
              3D scene manipulation, and AI-powered texture generation. This documentation covers all features
              and workflows across each studio.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <Link href="#vector-canvas" className="p-4 rounded-xl bg-cta-orange/10 border border-cta-orange/20 hover:bg-cta-orange/20 transition-colors">
                <PenTool className="text-cta-orange mb-2" size={24} />
                <h3 className="font-semibold text-charcoal">Vector Studio</h3>
                <p className="text-sm text-text-primary/60">SVG editing &amp; AI vectorization</p>
              </Link>

              <Link href="#3d-viewport" className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/20 hover:bg-accent-purple/20 transition-colors">
                <Cuboid className="text-accent-purple mb-2" size={24} />
                <h3 className="font-semibold text-charcoal">3D Studio</h3>
                <p className="text-sm text-text-primary/60">Scene editing &amp; materials</p>
              </Link>

              <Link href="#tex-matcap" className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/20 hover:bg-accent-teal/20 transition-colors">
                <Palette className="text-accent-teal mb-2" size={24} />
                <h3 className="font-semibold text-charcoal">Tex Factory</h3>
                <p className="text-sm text-text-primary/60">MatCap &amp; PBR generation</p>
              </Link>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start" className="mb-16">
            <h2 className="text-2xl font-sans font-bold text-charcoal mb-4 flex items-center gap-2">
              <Zap className="text-cta-orange" size={24} />
              Quick Start
            </h2>
            <div className="bg-white rounded-xl border border-charcoal/10 p-6">
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-cta-orange/20 text-cta-orange font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <h4 className="font-semibold text-charcoal">Choose a Studio</h4>
                    <p className="text-sm text-text-primary/60">Select Vector, 3D, or Tex Factory based on your creative needs.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-cta-orange/20 text-cta-orange font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <h4 className="font-semibold text-charcoal">Import or Create</h4>
                    <p className="text-sm text-text-primary/60">Upload existing assets or start from scratch with built-in tools.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-cta-orange/20 text-cta-orange font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <h4 className="font-semibold text-charcoal">Use AI Features</h4>
                    <p className="text-sm text-text-primary/60">Leverage Gemini, GPT-4o, and Claude for intelligent assistance.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-cta-orange/20 text-cta-orange font-bold flex items-center justify-center flex-shrink-0">4</span>
                  <div>
                    <h4 className="font-semibold text-charcoal">Export</h4>
                    <p className="text-sm text-text-primary/60">Download production-ready assets in multiple formats.</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Vector Studio Section */}
          <section id="vector-canvas" className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cta-orange/20 flex items-center justify-center">
                <PenTool className="text-cta-orange" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-sans font-bold text-charcoal">Vector Studio</h2>
                <p className="text-sm text-text-primary/60">Canvas-based SVG editing with AI assistance</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Canvas & Tools */}
              <div className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Canvas &amp; Tools</h3>
                <p className="text-text-primary/70 mb-4">
                  The Vector Studio uses an HTML5 Canvas rendering engine with real-time SVG path generation.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-charcoal/5 rounded-lg">
                    <h4 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                      <MousePointer size={16} className="text-cta-orange" />
                      Selection Tool
                    </h4>
                    <p className="text-sm text-text-primary/60">Click to select paths. Shift+click for multi-select. Drag to move.</p>
                  </div>
                  <div className="p-4 bg-charcoal/5 rounded-lg">
                    <h4 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                      <PenTool size={16} className="text-cta-orange" />
                      Pen Tool
                    </h4>
                    <p className="text-sm text-text-primary/60">Click to add points. Drag to create B&eacute;zier curves. Double-click to close path.</p>
                  </div>
                  <div className="p-4 bg-charcoal/5 rounded-lg">
                    <h4 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                      <Move size={16} className="text-cta-orange" />
                      Pan &amp; Zoom
                    </h4>
                    <p className="text-sm text-text-primary/60">Scroll to zoom. Space+drag to pan. Fit to view with Home key.</p>
                  </div>
                  <div className="p-4 bg-charcoal/5 rounded-lg">
                    <h4 className="font-medium text-charcoal mb-2 flex items-center gap-2">
                      <Layers size={16} className="text-cta-orange" />
                      Layers Panel
                    </h4>
                    <p className="text-sm text-text-primary/60">Organize paths in layers. Drag to reorder. Toggle visibility.</p>
                  </div>
                </div>

                <h4 className="font-medium text-charcoal mt-6 mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-charcoal/10 rounded">V</kbd> Selection</div>
                  <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-charcoal/10 rounded">P</kbd> Pen</div>
                  <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-charcoal/10 rounded">Ctrl+Z</kbd> Undo</div>
                  <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-charcoal/10 rounded">Ctrl+S</kbd> Save</div>
                </div>
              </div>

              {/* AI Vectorization */}
              <div id="vector-ai" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Wand2 size={20} className="text-accent-teal" />
                  AI Vectorization
                </h3>
                <p className="text-text-primary/70 mb-4">
                  Convert raster images (PNG, JPG, WebP) to clean SVG paths using Gemini AI.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent-teal mt-1 flex-shrink-0" size={16} />
                    <div>
                      <strong className="text-charcoal">Logo Mode:</strong>
                      <span className="text-text-primary/60 ml-1">Optimized for clean geometric shapes with minimal colors.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent-teal mt-1 flex-shrink-0" size={16} />
                    <div>
                      <strong className="text-charcoal">Icon Mode:</strong>
                      <span className="text-text-primary/60 ml-1">Simple shapes with consistent stroke width, normalized to square viewBox.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent-teal mt-1 flex-shrink-0" size={16} />
                    <div>
                      <strong className="text-charcoal">Illustration Mode:</strong>
                      <span className="text-text-primary/60 ml-1">Detailed vector art with varied line weights and richer color palette.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Formats */}
              <div id="vector-export" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Download size={20} className="text-cta-orange" />
                  Export Formats
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-cta-orange font-mono">.svg</code>
                    <p className="text-sm text-text-primary/60 mt-1">Standard SVG with optimized paths</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-cta-orange font-mono">.png</code>
                    <p className="text-sm text-text-primary/60 mt-1">Rasterized at 1x, 2x, 4x resolution</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-cta-orange font-mono">.tsx</code>
                    <p className="text-sm text-text-primary/60 mt-1">React component with TypeScript</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-cta-orange font-mono">.vue</code>
                    <p className="text-sm text-text-primary/60 mt-1">Vue 3 SFC component</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3D Studio Section */}
          <section id="3d-viewport" className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                <Cuboid className="text-accent-purple" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-sans font-bold text-charcoal">3D Studio</h2>
                <p className="text-sm text-text-primary/60">Three.js-powered 3D scene editing with AI</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Viewport Controls */}
              <div className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Viewport Controls</h3>
                <p className="text-text-primary/70 mb-4">
                  Navigate the 3D viewport using mouse and keyboard controls.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-charcoal/5 rounded-lg text-center">
                    <div className="font-mono text-accent-purple mb-2">Left Click + Drag</div>
                    <p className="text-sm text-text-primary/60">Orbit camera around scene</p>
                  </div>
                  <div className="p-4 bg-charcoal/5 rounded-lg text-center">
                    <div className="font-mono text-accent-purple mb-2">Right Click + Drag</div>
                    <p className="text-sm text-text-primary/60">Pan camera</p>
                  </div>
                  <div className="p-4 bg-charcoal/5 rounded-lg text-center">
                    <div className="font-mono text-accent-purple mb-2">Scroll Wheel</div>
                    <p className="text-sm text-text-primary/60">Zoom in/out</p>
                  </div>
                </div>
              </div>

              {/* Import Formats */}
              <div id="3d-import" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-accent-purple" />
                  Import Formats
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 border border-accent-purple/20 rounded-lg bg-accent-purple/5">
                    <code className="text-accent-purple font-mono">.gltf / .glb</code>
                    <p className="text-sm text-text-primary/60 mt-1">Recommended. Full PBR material support.</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-accent-purple font-mono">.obj</code>
                    <p className="text-sm text-text-primary/60 mt-1">With .mtl material file</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-accent-purple font-mono">.fbx</code>
                    <p className="text-sm text-text-primary/60 mt-1">Autodesk format (experimental)</p>
                  </div>
                  <div className="p-3 border border-charcoal/10 rounded-lg">
                    <code className="text-accent-purple font-mono">.spline</code>
                    <p className="text-sm text-text-primary/60 mt-1">Spline.design project files</p>
                  </div>
                </div>
              </div>

              {/* AI Scene Editing */}
              <div id="3d-ai" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Wand2 size={20} className="text-accent-purple" />
                  AI Scene Editing
                </h3>
                <p className="text-text-primary/70 mb-4">
                  Use natural language commands to modify your 3D scene. Powered by GPT-4o vision.
                </p>

                <div className="bg-charcoal rounded-lg p-4 font-mono text-sm text-white/80 mb-4">
                  <div className="text-accent-purple">&gt; &quot;Make the sphere metallic blue&quot;</div>
                  <div className="text-white/40 mt-2">Applying StandardMaterial with color #2563eb and metalness 0.8...</div>
                  <div className="text-accent-green mt-1">Done.</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-accent-purple" />
                    <span>Color changes: &quot;Make X red/blue/green&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-accent-purple" />
                    <span>Material changes: &quot;Make X metallic/glass/matte&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-accent-purple" />
                    <span>Transforms: &quot;Move X up/left/forward&quot;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-accent-purple" />
                    <span>Visibility: &quot;Hide/show X&quot;</span>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div id="3d-materials" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Layers size={20} className="text-accent-purple" />
                  Material Library
                </h3>
                <p className="text-text-primary/70 mb-4">
                  600+ built-in material presets organized by category.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Metals', 'Wood', 'Stone', 'Fabric', 'Glass', 'Plastic', 'Ceramic', 'Organic'].map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-accent-purple/10 text-accent-purple text-sm rounded-full">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tex Factory Section */}
          <section id="tex-matcap" className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-teal/20 flex items-center justify-center">
                <Palette className="text-accent-teal" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-sans font-bold text-charcoal">Tex Factory</h2>
                <p className="text-sm text-text-primary/60">AI-powered MatCap and PBR texture generation</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* MatCap Generation */}
              <div className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">MatCap Generation</h3>
                <p className="text-text-primary/70 mb-4">
                  Generate Material Capture textures from text prompts. MatCaps encode lighting and material
                  properties in a single spherical texture.
                </p>

                <div className="bg-charcoal/5 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-charcoal mb-2">Example Prompts</h4>
                  <ul className="space-y-1 text-sm text-text-primary/60">
                    <li>&bull; &quot;Chrome metal with soft highlights&quot;</li>
                    <li>&bull; &quot;Matte clay with subtle ambient occlusion&quot;</li>
                    <li>&bull; &quot;Iridescent pearl finish&quot;</li>
                    <li>&bull; &quot;Brushed copper with warm tones&quot;</li>
                  </ul>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-accent-teal/10 text-accent-teal rounded-full">1K Resolution</span>
                  <span className="px-3 py-1 bg-accent-teal/10 text-accent-teal rounded-full">2K Upscale</span>
                  <span className="px-3 py-1 bg-accent-teal/10 text-accent-teal rounded-full">PNG Export</span>
                </div>
              </div>

              {/* PBR Textures */}
              <div id="tex-pbr" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">PBR Texture Sets</h3>
                <p className="text-text-primary/70 mb-4">
                  Generate complete PBR texture sets from a single prompt. Includes auto-generated maps.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border border-charcoal/10 rounded-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-400 mx-auto mb-2"></div>
                    <h4 className="font-medium text-charcoal">Albedo</h4>
                    <p className="text-xs text-text-primary/60">Base color map via Gemini</p>
                  </div>
                  <div className="p-4 border border-charcoal/10 rounded-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 mx-auto mb-2"></div>
                    <h4 className="font-medium text-charcoal">Normal</h4>
                    <p className="text-xs text-text-primary/60">Auto-generated with Sobel</p>
                  </div>
                  <div className="p-4 border border-charcoal/10 rounded-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mx-auto mb-2"></div>
                    <h4 className="font-medium text-charcoal">Roughness</h4>
                    <p className="text-xs text-text-primary/60">Luminance extraction</p>
                  </div>
                </div>
              </div>

              {/* 3D Preview */}
              <div id="tex-preview" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Real-Time 3D Preview</h3>
                <p className="text-text-primary/70 mb-4">
                  Preview generated textures on 3D geometry in real-time.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-charcoal/10 text-charcoal text-sm rounded-full">Sphere</span>
                  <span className="px-3 py-1 bg-charcoal/10 text-charcoal text-sm rounded-full">Cube</span>
                  <span className="px-3 py-1 bg-charcoal/10 text-charcoal text-sm rounded-full">Torus</span>
                  <span className="px-3 py-1 bg-charcoal/10 text-charcoal text-sm rounded-full">Plane</span>
                </div>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="api-endpoints" className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <Terminal className="text-accent-green" size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-sans font-bold text-charcoal">API Reference</h2>
                <p className="text-sm text-text-primary/60">REST API and CLI documentation</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* REST Endpoints */}
              <div className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">REST Endpoints</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-charcoal rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-accent-green text-white text-xs font-mono rounded">POST</span>
                      <code className="text-white font-mono">/api/vectorize</code>
                    </div>
                    <p className="text-white/60 text-sm">Convert raster image to SVG</p>
                  </div>

                  <div className="p-4 bg-charcoal rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-accent-green text-white text-xs font-mono rounded">POST</span>
                      <code className="text-white font-mono">/api/optimize</code>
                    </div>
                    <p className="text-white/60 text-sm">Optimize and compress SVG</p>
                  </div>

                  <div className="p-4 bg-charcoal rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-accent-green text-white text-xs font-mono rounded">POST</span>
                      <code className="text-white font-mono">/api/texture</code>
                    </div>
                    <p className="text-white/60 text-sm">Generate MatCap or PBR texture</p>
                  </div>
                </div>
              </div>

              {/* CLI */}
              <div id="api-cli" className="bg-white rounded-xl border border-charcoal/10 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">CLI Usage</h3>

                <div className="bg-charcoal rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-white/40"># Install globally</div>
                  <div className="text-white">npm install -g @bisect/cli</div>
                  <div className="text-white/40 mt-4"># Vectorize an image</div>
                  <div className="text-white">bisect convert input.png -o output.svg</div>
                  <div className="text-white/40 mt-4"># Batch convert directory</div>
                  <div className="text-white">bisect convert ./images/*.png --output ./svg</div>
                  <div className="text-white/40 mt-4"># Watch mode</div>
                  <div className="text-white">bisect watch ./assets --output ./dist</div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation to studios */}
          <section className="border-t border-charcoal/10 pt-12">
            <h3 className="text-lg font-semibold text-charcoal mb-6 text-center">Ready to Start?</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/studio/svg-canvas"
                className="px-6 py-3 bg-cta-orange text-white rounded-xl font-medium hover:bg-cta-orange-hover transition-colors flex items-center gap-2"
              >
                <PenTool size={16} />
                Vector Studio
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/studio/3d-canvas"
                className="px-6 py-3 bg-accent-purple text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Cuboid size={16} />
                3D Studio
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/studio/tex-factory"
                className="px-6 py-3 bg-accent-teal text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors flex items-center gap-2"
              >
                <Palette size={16} />
                Tex Factory
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
