'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shell } from '@/components/shared/Shell';

// Type declaration for AI Studio API (optional browser extension)
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// Dynamic imports for WebGL/R3F components to avoid SSR issues
const TexturePreview3D = dynamic(
  () => import('./matcap-&-pbr-genai/components/TexturePreview3D').then(mod => ({ default: mod.TexturePreview3D })),
  { ssr: false, loading: () => <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-500">Loading 3D Preview...</div> }
);
const TextureControlPanel = dynamic(
  () => import('./matcap-&-pbr-genai/components/TextureControlPanel').then(mod => ({ default: mod.TextureControlPanel })),
  { ssr: false }
);

import { GeneratedTextureSet, GenerationConfig, TextureMode, ModelQuality } from './matcap-&-pbr-genai/types';
import { generateTextureImage } from './matcap-&-pbr-genai/services/geminiService';
import { generateNormalMap, generateRoughnessMap } from './matcap-&-pbr-genai/services/imageProcessing';
import { Aperture, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { SaveAssetModal } from '../svg-canvas/components/SaveAssetModal';
import { uploadAsset, dataUrlToBlob } from '@/lib/services/supabase/storage';

// Rate limiting constants
const COOLDOWN_DURATION_MS = 10000; // 10 second cooldown between generations
const CACHE_KEY = 'bisect-texture-cache';
const MAX_CACHE_ENTRIES = 20;

// Simple in-memory + localStorage cache for generated textures
interface CacheEntry {
  texture: GeneratedTextureSet;
  timestamp: number;
}

const getCache = (): Map<string, CacheEntry> => {
  if (typeof window === 'undefined') return new Map();
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const entries = JSON.parse(cached) as [string, CacheEntry][];
      return new Map(entries);
    }
  } catch (e) {
    console.warn('Failed to load texture cache:', e);
  }
  return new Map();
};

const saveCache = (cache: Map<string, CacheEntry>) => {
  if (typeof window === 'undefined') return;
  try {
    // Limit cache size
    const entries = Array.from(cache.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, MAX_CACHE_ENTRIES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save texture cache:', e);
  }
};

const getCacheKey = (prompt: string, mode: TextureMode, quality: ModelQuality, resolution: '1K' | '2K') => {
  return `${prompt.trim().toLowerCase()}|${mode}|${quality}|${resolution}`;
};

export default function App() {
  const [hasApiKey, setHasApiKey] = useState(false);

  // Lifted state for "Live Preview" functionality
  const [prompt, setPrompt] = useState('');

  // Save to Library state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<TextureMode>(TextureMode.MATCAP);
  const [quality, setQuality] = useState<ModelQuality>(ModelQuality.HIGH);
  const [geometryType, setGeometryType] = useState<'sphere' | 'box' | 'torus' | 'plane'>('sphere');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [currentTexture, setCurrentTexture] = useState<GeneratedTextureSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rate limiting state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const lastGenerationTime = useRef<number>(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textureCache = useRef<Map<string, CacheEntry>>(new Map());

  // Load cache on mount
  useEffect(() => {
    textureCache.current = getCache();
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1000) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [cooldownRemaining > 0]);

  useEffect(() => {
    const checkKey = async () => {
      const win = window as Window & { aistudio?: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void> } };
      if (win.aistudio) {
        const has = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleKeySelection = async () => {
    const win = window as Window & { aistudio?: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void> } };
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const processMaps = async (albedo: string, mode: TextureMode, resolution: '1K' | '2K') => {
    let normal: string | undefined;
    let roughness: string | undefined;

    if (mode === TextureMode.PBR) {
      // Adjust strength slightly based on resolution for better finish
      const strength = resolution === '2K' ? 3.5 : 2.5; 
      const [nMap, rMap] = await Promise.all([
        generateNormalMap(albedo, strength),
        generateRoughnessMap(albedo, true)
      ]);
      normal = nMap;
      roughness = rMap;
    }
    return { normal, roughness };
  };

  const startCooldown = useCallback(() => {
    lastGenerationTime.current = Date.now();
    setCooldownRemaining(COOLDOWN_DURATION_MS);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check cooldown (skip if using cache)
    const resolution = '1K';
    const cacheKey = getCacheKey(prompt, mode, quality, resolution);
    const cachedEntry = textureCache.current.get(cacheKey);

    // If we have a cached result, use it immediately (no cooldown needed)
    if (cachedEntry) {
      setFromCache(true);
      setCurrentTexture({
        ...cachedEntry.texture,
        id: crypto.randomUUID(), // New ID for React key
        timestamp: Date.now()
      });
      return;
    }

    // Check if still in cooldown
    const timeSinceLastGen = Date.now() - lastGenerationTime.current;
    if (timeSinceLastGen < COOLDOWN_DURATION_MS && lastGenerationTime.current > 0) {
      setError(`Please wait ${Math.ceil((COOLDOWN_DURATION_MS - timeSinceLastGen) / 1000)}s before generating again`);
      return;
    }

    setFromCache(false);
    setIsGenerating(true);
    setError(null);

    try {
      const albedo = await generateTextureImage(prompt, mode, quality, resolution);
      const { normal, roughness } = await processMaps(albedo, mode, resolution);

      const newTexture: GeneratedTextureSet = {
        id: crypto.randomUUID(),
        mode,
        prompt,
        albedo,
        normal,
        roughness,
        timestamp: Date.now(),
        resolution
      };

      setCurrentTexture(newTexture);

      // Cache the result
      textureCache.current.set(cacheKey, {
        texture: newTexture,
        timestamp: Date.now()
      });
      saveCache(textureCache.current);

      // Start cooldown after successful generation
      startCooldown();

    } catch (e: any) {
      const msg = e.message || "Failed to generate texture.";
      // Check for rate limit errors specifically
      if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setError("Rate limit hit. Please wait a moment before trying again.");
        startCooldown(); // Force cooldown on rate limit
      } else {
        setError(msg);
        if (msg.includes("Requested entity was not found") || msg.includes("403")) {
          setHasApiKey(false);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscale = async () => {
    if (!currentTexture || !prompt) return;

    // Check cooldown for upscale too
    const timeSinceLastGen = Date.now() - lastGenerationTime.current;
    if (timeSinceLastGen < COOLDOWN_DURATION_MS && lastGenerationTime.current > 0) {
      setError(`Please wait ${Math.ceil((COOLDOWN_DURATION_MS - timeSinceLastGen) / 1000)}s before upscaling`);
      return;
    }

    // Check cache for 2K version
    const resolution = '2K';
    const cacheKey = getCacheKey(prompt, currentTexture.mode, ModelQuality.HIGH, resolution);
    const cachedEntry = textureCache.current.get(cacheKey);

    if (cachedEntry) {
      setFromCache(true);
      setCurrentTexture({
        ...cachedEntry.texture,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      });
      return;
    }

    setFromCache(false);
    setIsUpscaling(true);
    setError(null);

    try {
      const albedo = await generateTextureImage(prompt, currentTexture.mode, ModelQuality.HIGH, resolution);
      const { normal, roughness } = await processMaps(albedo, currentTexture.mode, resolution);

      const newTexture: GeneratedTextureSet = {
        ...currentTexture,
        id: crypto.randomUUID(),
        albedo,
        normal,
        roughness,
        resolution,
        timestamp: Date.now()
      };

      setCurrentTexture(newTexture);

      // Cache the 2K result
      textureCache.current.set(cacheKey, {
        texture: newTexture,
        timestamp: Date.now()
      });
      saveCache(textureCache.current);

      // Start cooldown
      startCooldown();

    } catch (e: any) {
      const msg = e.message || "Upscale failed";
      if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        setError("Rate limit hit. Please wait a moment before trying again.");
        startCooldown();
      } else {
        setError("Upscale failed: " + msg);
      }
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleSaveToLibrary = async (name: string, tags: string[]) => {
    if (!currentTexture) return;

    setIsSaving(true);
    try {
      // Convert albedo data URL to blob
      const albedoBlob = dataUrlToBlob(currentTexture.albedo);

      // Use albedo as thumbnail (it's already the right format)
      const thumbnailBlob = dataUrlToBlob(currentTexture.albedo);

      // Prepare metadata
      const textureData: Record<string, unknown> = {
        mode: currentTexture.mode,
        prompt: currentTexture.prompt,
        resolution: currentTexture.resolution,
        hasNormal: !!currentTexture.normal,
        hasRoughness: !!currentTexture.roughness,
      };

      // Upload the main albedo/matcap texture
      const result = await uploadAsset({
        name,
        category: currentTexture.mode === TextureMode.MATCAP ? 'material' : 'texture',
        file: albedoBlob,
        thumbnail: thumbnailBlob,
        tags: [...tags, currentTexture.mode.toLowerCase(), currentTexture.resolution || '1K'],
        data: textureData,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsSaveModalOpen(false);
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-neutral-950 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-neutral-950 to-neutral-950 z-0" />
        <div className="z-10 max-w-lg text-center space-y-8">
           <div className="flex justify-center mb-6">
             <div className="relative">
               <div className="absolute inset-0 blur-xl bg-purple-500/30 rounded-full" />
               <Aperture className="w-20 h-20 text-purple-400 relative z-10" />
             </div>
           </div>
           
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
             TextureGen AI
           </h1>
           <p className="text-neutral-400 text-lg leading-relaxed">
             Create professional MatCaps and seamless PBR textures instantly using Gemini 3 Pro.
           </p>

           <div className="pt-8">
             <button 
               onClick={handleKeySelection}
               className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-purple-600 rounded-full hover:bg-purple-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:ring-offset-neutral-900"
             >
               <Sparkles className="w-5 h-5 mr-2" />
               Connect API Key
               <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform" />
             </button>
           </div>
           
           <p className="text-xs text-neutral-600 pt-4">
             Requires a valid Google Cloud Project API Key with Gemini enabled.<br/>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-neutral-400">Billing Information</a>
           </p>
        </div>
      </div>
    );
  }

  return (
    <Shell
      leftPanel={
        <TextureControlPanel
          isGenerating={isGenerating}
          isUpscaling={isUpscaling}
          onGenerate={handleGenerate}
          onUpscale={handleUpscale}
          geometryType={geometryType}
          setGeometryType={setGeometryType}
          currentTexture={currentTexture}
          // Passed state
          prompt={prompt}
          setPrompt={setPrompt}
          mode={mode}
          setMode={setMode}
          quality={quality}
          setQuality={setQuality}
          // Rate limiting
          cooldownRemaining={cooldownRemaining}
          fromCache={fromCache}
          // Save to Library
          onSaveToLibrary={() => setIsSaveModalOpen(true)}
          isSaving={isSaving}
        />
      }
    >
      <div className="flex w-full h-full bg-black text-white font-sans overflow-hidden">
        <div className="flex-1 relative h-full">
          {/* Pass user selected mode if no texture exists yet, to allow previewing lighting setup */}
          <TexturePreview3D
            albedo={currentTexture?.albedo}
            normal={currentTexture?.normal}
            roughness={currentTexture?.roughness}
            mode={currentTexture?.mode || mode}
            geometryType={geometryType}
          />


          {error && (
            <div className="absolute bottom-6 left-6 right-6 mx-auto max-w-lg bg-red-900/90 backdrop-blur-sm border border-red-700 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 z-50">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-300" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-200 hover:text-white hover:bg-red-800/50 p-1 rounded-md transition-colors">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Save to Library Modal */}
      <SaveAssetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveToLibrary}
        defaultName={currentTexture?.prompt || 'My Texture'}
        assetType={currentTexture?.mode === TextureMode.MATCAP ? 'material' : 'texture'}
      />
    </Shell>
  );
}