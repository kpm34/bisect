'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Download } from 'lucide-react';

const showcaseItems = [
  { category: 'Fashion & Apparel', title: 'Denim Fabric', prompt: 'Blue denim fabric texture', image: '/assets/examples/blue_denim_fabric_texture_albedo.png', type: 'MatCap' },
  { category: 'Architecture', title: 'Mahogany Wood', prompt: 'Polished mahogany wood texture', image: '/assets/examples/polished_mahogany_wood_texture_albedo.png', type: 'MatCap' },
  { category: 'Automotive', title: 'Carbon Fiber', prompt: 'Carbon fiber hexagonal pattern', image: '/assets/examples/carbon_fiber_hexagonal_pattern_albedo.png', type: 'MatCap' },
  { category: 'Industrial', title: 'Chrome Metal', prompt: 'Polished chrome metal finish', image: '/assets/examples/chrome-texture.png', type: 'MatCap' },
  { category: 'Nature & Wildlife', title: 'Tiger Pattern', prompt: 'Realistic tiger fur pattern', image: '/assets/examples/tiger-texture.png', type: 'PBR Albedo' }
];

export default function TextureShowcase() {
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveShowcaseIndex((prev) => (prev + 1) % showcaseItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-sans font-bold text-charcoal mb-4">See It In Action</h2>
        <p className="text-text-primary/70">Generate professional textures for any industry</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Horizontal Feature Showcase */}
        <div className="grid lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-charcoal/10 shadow-xl overflow-hidden">

          {/* Left: Prompt Selector List */}
          <div className="lg:col-span-4 flex flex-col bg-gray-50/50 h-full border-r border-charcoal/5">
            {showcaseItems.map((item, idx) => {
              const isActive = idx === activeShowcaseIndex;

              return (
                <div
                  key={idx}
                  onClick={() => { setActiveShowcaseIndex(idx); setIsAutoPlaying(false); }}
                  className={`p-6 border-b border-charcoal/5 cursor-pointer transition-all hover:bg-white ${isActive ? 'bg-white border-l-4 border-l-cta-orange shadow-sm z-10' : 'border-l-4 border-l-transparent opacity-60 hover:opacity-100'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold text-sm ${isActive ? 'text-charcoal' : 'text-text-primary/70'}`}>{item.category}</h4>
                    {isActive && <ArrowRight size={14} className="text-cta-orange" />}
                  </div>
                  <p className="text-xs font-mono text-text-primary/50 truncate">&ldquo;{item.prompt}&rdquo;</p>
                </div>
              );
            })}
          </div>

          {/* Right: Large Preview Area */}
          <div className="lg:col-span-8 p-8 lg:p-12 flex flex-col items-center justify-center min-h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-100 via-white to-white">

            <div className="relative w-full max-w-md aspect-square">
              {/* Background glow */}
              <div className="absolute inset-0 bg-cta-orange/5 blur-3xl rounded-full transform scale-110"></div>

              <div className="relative z-10 group">
                {/* Main Image Card */}
                <div key={activeShowcaseIndex} className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-charcoal/5 transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                  <img
                    src={showcaseItems[activeShowcaseIndex].image}
                    alt={showcaseItems[activeShowcaseIndex].title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/222/fff?text=Generating...';
                    }}
                  />

                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-charcoal/5 translate-y-2 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-charcoal text-white text-[10px] font-mono uppercase">{showcaseItems[activeShowcaseIndex].type}</span>
                      </div>
                      <Download size={16} className="text-charcoal/40 hover:text-cta-orange cursor-pointer transition-colors" />
                    </div>
                    <p className="font-mono text-xs text-charcoal/60">Prompt used:</p>
                    <p className="text-sm font-medium text-charcoal">&ldquo;{showcaseItems[activeShowcaseIndex].prompt}&rdquo;</p>
                  </div>
                </div>

                {/* Floating '3D Sphere' Badge (Visual flair) */}
                <div key={`badge-${activeShowcaseIndex}`} className="absolute -top-6 -right-6 w-24 h-24 bg-white rounded-full shadow-xl border border-charcoal/5 flex items-center justify-center p-1 animate-[bounce_4s_infinite]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-charcoal/5 relative">
                    <img
                      src={showcaseItems[activeShowcaseIndex].image}
                      className="w-full h-full object-cover opacity-80"
                      style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                      alt=""
                    />
                    <div className="absolute inset-0 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2),inset_4px_4px_10px_rgba(255,255,255,0.5)] rounded-full pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 text-sm text-text-primary/40 text-center max-w-sm">
              *Actual output from our Gemini-powered texture engine.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
