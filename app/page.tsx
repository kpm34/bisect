import Link from 'next/link';
import { Box, Palette, Cuboid } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Unified 3D Creator
          </h1>
          <p className="text-xl text-gray-300">
            Create 3D scenes, vector graphics, and textures with zero learning curve
          </p>
        </header>

        {/* Studios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Vector Studio */}
          <Link
            href="/studio/vector"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="mb-4 inline-block p-3 bg-blue-500/20 rounded-lg">
                <Box className="w-8 h-8 text-blue-400" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Vector Studio</h2>

              <p className="text-gray-400 mb-6">
                Create and edit SVG graphics with 15+ drawing tools, AI-powered editing, and export to any format
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Pen & shape tools</div>
                <div>✓ AI vectorization</div>
                <div>✓ 7 export formats</div>
                <div>✓ 3D-ready outputs</div>
              </div>

              <div className="mt-6 text-blue-400 font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-block">
                Launch Studio →
              </div>
            </div>
          </Link>

          {/* 3D Studio */}
          <Link
            href="/studio/scene"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="mb-4 inline-block p-3 bg-purple-500/20 rounded-lg">
                <Cuboid className="w-8 h-8 text-purple-400" />
              </div>

              <h2 className="text-2xl font-bold mb-3">3D Studio</h2>

              <p className="text-gray-400 mb-6">
                Edit 3D scenes with natural language, apply materials from 600+ presets, and export to any 3D format
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ Universal format support</div>
                <div>✓ AI scene editing</div>
                <div>✓ 600+ material presets</div>
                <div>✓ Real-time preview</div>
              </div>

              <div className="mt-6 text-purple-400 font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-block">
                Launch Studio →
              </div>
            </div>
          </Link>

          {/* Texture Studio */}
          <Link
            href="/studio/textures"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-8 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="mb-4 inline-block p-3 bg-orange-500/20 rounded-lg">
                <Palette className="w-8 h-8 text-orange-400" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Texture Studio</h2>

              <p className="text-gray-400 mb-6">
                Generate MatCap and PBR textures with AI, auto-generate normal and roughness maps, preview in real-time
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div>✓ AI texture generation</div>
                <div>✓ MatCap & PBR modes</div>
                <div>✓ Auto normal maps</div>
                <div>✓ 3D preview</div>
              </div>

              <div className="mt-6 text-orange-400 font-semibold group-hover:translate-x-2 transition-transform duration-300 inline-block">
                Launch Studio →
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-bold mb-12">Powered by Multi-Agent AI</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-3">🤖</div>
              <h4 className="font-semibold mb-2">GPT-4o</h4>
              <p className="text-sm text-gray-400">Scene understanding with vision</p>
            </div>

            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="font-semibold mb-2">Gemini</h4>
              <p className="text-sm text-gray-400">Fast texture & vector generation</p>
            </div>

            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="text-4xl mb-3">🧠</div>
              <h4 className="font-semibold mb-2">Claude</h4>
              <p className="text-sm text-gray-400">Complex reasoning & planning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
