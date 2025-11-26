import React from 'react';
import { TextureMode, ModelQuality, GeneratedTextureSet } from '../types';
import { Wand2, Download, Layers, Circle, Box as BoxIcon, Palette, Loader2, Sparkles, CheckCircle2, Donut, Clock, Zap } from 'lucide-react';

interface TextureControlPanelProps {
  isGenerating: boolean;
  isUpscaling?: boolean;
  onGenerate: () => void;
  onUpscale?: () => void;
  geometryType: 'sphere' | 'box' | 'torus' | 'plane';
  setGeometryType: (t: 'sphere' | 'box' | 'torus' | 'plane') => void;
  currentTexture: GeneratedTextureSet | null;

  // Controlled State
  prompt: string;
  setPrompt: (s: string) => void;
  mode: TextureMode;
  setMode: (m: TextureMode) => void;
  quality: ModelQuality;
  setQuality: (q: ModelQuality) => void;

  // Rate limiting
  cooldownRemaining?: number;
  fromCache?: boolean;
}

export function TextureControlPanel({
  isGenerating,
  isUpscaling = false,
  onGenerate,
  onUpscale,
  geometryType,
  setGeometryType,
  currentTexture,
  prompt,
  setPrompt,
  mode,
  setMode,
  quality,
  setQuality,
  cooldownRemaining = 0,
  fromCache = false
}: TextureControlPanelProps) {
  const isOnCooldown = cooldownRemaining > 0;
  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  const handleDownload = (type: 'albedo' | 'normal' | 'roughness') => {
    if (!currentTexture) return;
    const data = type === 'albedo' ? currentTexture.albedo : type === 'normal' ? currentTexture.normal : currentTexture.roughness;
    if (!data) return;

    const link = document.createElement('a');
    link.href = data;
    link.download = `${type}_map_${currentTexture.resolution || '1K'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-96 bg-[#111319] border-r border-white/10 flex flex-col h-full overflow-y-auto shrink-0 z-20">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0891B2] to-[#06b6d4] flex items-center gap-2">
          <Palette className="text-[#0891B2]" />
          Tex Factory
        </h1>
        <p className="text-neutral-400 text-xs mt-1">MatCap &amp; Procedural PBR Generator</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Generation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Generation Mode</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1d24] rounded-lg">
              <button
                type="button"
                onClick={() => setMode(TextureMode.MATCAP)}
                className={`text-sm py-2 rounded-md transition-colors ${mode === TextureMode.MATCAP ? 'bg-[#0891B2]/20 text-[#0891B2] shadow border border-[#0891B2]/30' : 'text-neutral-500 hover:text-white'}`}
              >
                MatCap
              </button>
              <button
                type="button"
                onClick={() => setMode(TextureMode.PBR)}
                className={`text-sm py-2 rounded-md transition-colors ${mode === TextureMode.PBR ? 'bg-[#0891B2]/20 text-[#0891B2] shadow border border-[#0891B2]/30' : 'text-neutral-500 hover:text-white'}`}
              >
                PBR Texture
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === TextureMode.MATCAP ? "e.g., iridescent beetle shell, brushed copper..." : "e.g., cracked desert mud, sci-fi metal plating..."}
              className="w-full bg-[#1a1d24] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-neutral-500 focus:ring-2 focus:ring-[#0891B2] focus:outline-none min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-neutral-300">Quality Model</label>
             <select
               value={quality}
               onChange={(e) => setQuality(e.target.value as ModelQuality)}
               className="w-full bg-[#1a1d24] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
             >
                <option value={ModelQuality.HIGH}>Gemini 3 Pro (High Quality)</option>
                <option value={ModelQuality.FAST}>Gemini 2.5 Flash (Fast)</option>
             </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating || isUpscaling || !prompt.trim() || isOnCooldown}
            className={`w-full font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
              isOnCooldown
                ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                : 'bg-[#0891B2] hover:bg-[#0891B2]/80 disabled:bg-[#1a1d24] disabled:text-neutral-500 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Generating...
              </>
            ) : isOnCooldown ? (
              <>
                <Clock className="w-4 h-4" />
                Wait {cooldownSeconds}s
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Texture
              </>
            )}
          </button>

          {/* Cache indicator */}
          {fromCache && currentTexture && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 mt-2">
              <Zap className="w-3 h-3" />
              Loaded from cache (instant)
            </div>
          )}
        </form>

        {/* View Settings */}
        <div className="space-y-4 pt-6 border-t border-white/10">
           <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Preview Settings</h3>
           <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sphere', icon: Circle },
                { id: 'box', icon: BoxIcon },
                { id: 'torus', icon: Donut },
                { id: 'plane', icon: Layers }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setGeometryType(item.id as any)}
                  className={`p-3 rounded-lg flex items-center justify-center transition-colors ${geometryType === item.id ? 'bg-[#0891B2]/20 text-[#0891B2] border border-[#0891B2]/50' : 'bg-[#1a1d24] text-neutral-500 hover:bg-[#1a1d24]/80'}`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              ))}
           </div>
        </div>

        {/* Action / Downloads */}
        {currentTexture && (
           <div className="space-y-4 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                Downloads
                <span className="text-xs bg-[#1a1d24] text-neutral-300 px-2 py-0.5 rounded">
                    {currentTexture.resolution || '1K'}
                </span>
             </h3>

             {/* Upscale Action */}
             {onUpscale && currentTexture.resolution !== '2K' && (
                <button
                  onClick={onUpscale}
                  disabled={isUpscaling || isOnCooldown}
                  className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    isOnCooldown
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      : 'bg-gradient-to-r from-[#FF6B35]/20 to-[#0891B2]/20 hover:from-[#FF6B35]/30 hover:to-[#0891B2]/30 border border-[#0891B2]/30 text-[#0891B2]'
                  }`}
                >
                   {isUpscaling ? (
                     <>
                       <Loader2 className="animate-spin w-4 h-4" />
                       Upscaling to 2K...
                     </>
                   ) : isOnCooldown ? (
                     <>
                       <Clock className="w-4 h-4" />
                       Wait {cooldownSeconds}s
                     </>
                   ) : (
                     <>
                       <Sparkles className="w-4 h-4" />
                       Enhance Material (Upscale to 2K)
                     </>
                   )}
                </button>
             )}

             {currentTexture.resolution === '2K' && (
                <div className="w-full bg-[#059669]/20 border border-[#059669]/30 text-[#059669] p-2 rounded-lg flex items-center justify-center gap-2 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    High Resolution Active
                </div>
             )}

             <button onClick={() => handleDownload('albedo')} className="w-full flex items-center justify-between p-3 bg-[#1a1d24] hover:bg-[#1a1d24]/80 rounded-lg group transition-colors">
                <span className="text-sm text-neutral-300">{currentTexture.mode === TextureMode.MATCAP ? 'MatCap Image' : 'Albedo Map'}</span>
                <Download className="w-4 h-4 text-neutral-500 group-hover:text-white" />
             </button>

             {currentTexture.mode === TextureMode.PBR && (
               <>
                <button onClick={() => handleDownload('normal')} className="w-full flex items-center justify-between p-3 bg-[#1a1d24] hover:bg-[#1a1d24]/80 rounded-lg group transition-colors">
                    <span className="text-sm text-neutral-300">Normal Map</span>
                    <Download className="w-4 h-4 text-neutral-500 group-hover:text-white" />
                </button>
                <button onClick={() => handleDownload('roughness')} className="w-full flex items-center justify-between p-3 bg-[#1a1d24] hover:bg-[#1a1d24]/80 rounded-lg group transition-colors">
                    <span className="text-sm text-neutral-300">Roughness Map</span>
                    <Download className="w-4 h-4 text-neutral-500 group-hover:text-white" />
                </button>
               </>
             )}
           </div>
        )}
      </div>
    </div>
  );
}
