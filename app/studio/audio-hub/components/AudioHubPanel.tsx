'use client';

/**
 * Audio Hub Panel
 *
 * Main panel for browsing music/SFX library, AI generation, and timeline
 * Designed as an orchestrator panel, not a full DAW
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Sparkles,
  Mic,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Plus,
  Clock,
  Wand2,
  Library,
  ListMusic,
  Layers,
  ChevronDown,
  ChevronRight,
  Download,
  Heart,
  MoreHorizontal,
} from 'lucide-react';
import type {
  AudioTrack,
  AudioCategory,
  MusicGenre,
  MusicMood,
  SFXCategory,
  AudioLibraryFilter,
} from '@/lib/core/audio/types';
import {
  MUSIC_CATEGORIES,
  SFX_CATEGORIES,
  MOOD_ICONS,
  formatDuration,
} from '@/lib/core/audio/audio-library';

// ============== TYPES ==============

type ViewMode = 'library' | 'ai-generate' | 'timeline';
type LibraryTab = 'music' | 'sfx' | 'voiceover' | 'uploads';

interface AudioHubPanelProps {
  onTrackSelect?: (track: AudioTrack) => void;
  onAddToTimeline?: (track: AudioTrack) => void;
  projectDuration?: number;
}

// ============== MOCK DATA ==============

const MOCK_TRACKS: AudioTrack[] = [
  {
    id: '1',
    name: 'Corporate Inspiration',
    category: 'music',
    source: 'library',
    url: '/audio/corporate-inspiration.mp3',
    duration: 120,
    fileSize: 2400000,
    format: 'mp3',
    sampleRate: 44100,
    tags: ['corporate', 'uplifting', 'business'],
    bpm: 120,
    genre: 'corporate',
    mood: 'inspiring',
    license: { type: 'royalty-free', commercial: true, attribution: false, modifications: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Epic Cinematic',
    category: 'music',
    source: 'library',
    url: '/audio/epic-cinematic.mp3',
    duration: 180,
    fileSize: 3600000,
    format: 'mp3',
    sampleRate: 44100,
    tags: ['cinematic', 'epic', 'dramatic'],
    bpm: 90,
    genre: 'cinematic',
    mood: 'inspiring',
    license: { type: 'royalty-free', commercial: true, attribution: false, modifications: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Logo Whoosh',
    category: 'sfx',
    source: 'library',
    url: '/audio/logo-whoosh.mp3',
    duration: 2,
    fileSize: 40000,
    format: 'mp3',
    sampleRate: 44100,
    tags: ['whoosh', 'logo', 'transition'],
    sfxCategory: 'transitions',
    license: { type: 'royalty-free', commercial: true, attribution: false, modifications: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'UI Click',
    category: 'sfx',
    source: 'library',
    url: '/audio/ui-click.mp3',
    duration: 0.3,
    fileSize: 6000,
    format: 'mp3',
    sampleRate: 44100,
    tags: ['click', 'button', 'ui'],
    sfxCategory: 'ui',
    license: { type: 'royalty-free', commercial: true, attribution: false, modifications: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============== WAVEFORM COMPONENT ==============

function Waveform({ data, progress = 0, height = 40 }: { data?: number[]; progress?: number; height?: number }) {
  const bars = data || Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.2);

  return (
    <div className="flex items-center gap-[2px] h-full" style={{ height }}>
      {bars.map((value, i) => {
        const isPlayed = (i / bars.length) * 100 < progress;
        return (
          <div
            key={i}
            className={`w-[2px] rounded-full transition-colors ${
              isPlayed ? 'bg-blue-500' : 'bg-zinc-600'
            }`}
            style={{ height: `${value * 100}%` }}
          />
        );
      })}
    </div>
  );
}

// ============== TRACK ITEM ==============

function TrackItem({
  track,
  isPlaying,
  onPlay,
  onPause,
  onSelect,
  onAddToTimeline,
}: {
  track: AudioTrack;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSelect: () => void;
  onAddToTimeline?: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      {/* Play/Pause Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          isPlaying ? onPause() : onPlay();
        }}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-blue-500 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{track.name}</span>
          {track.source === 'ai-generated' && (
            <Sparkles size={12} className="text-purple-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatDuration(track.duration)}</span>
          {track.bpm && <span>{track.bpm} BPM</span>}
          {track.genre && <span className="capitalize">{track.genre}</span>}
          {track.sfxCategory && <span className="capitalize">{track.sfxCategory}</span>}
        </div>
      </div>

      {/* Waveform Preview */}
      <div className="hidden sm:block w-24 h-8">
        <Waveform data={track.waveformData} height={32} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTimeline?.();
          }}
          className="p-1.5 rounded hover:bg-zinc-700"
          title="Add to timeline"
        >
          <Plus size={14} />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-700" title="Favorite">
          <Heart size={14} />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-700" title="Download">
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}

// ============== CATEGORY SIDEBAR ==============

function CategorySidebar({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategorySelect,
}: {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const categories = activeTab === 'music' ? MUSIC_CATEGORIES : SFX_CATEGORIES;

  return (
    <div className="w-48 border-r border-zinc-800 p-3 space-y-4">
      {/* Tabs */}
      <div className="flex flex-col gap-1">
        {[
          { id: 'music', icon: Music, label: 'Music' },
          { id: 'sfx', icon: Sparkles, label: 'SFX' },
          { id: 'voiceover', icon: Mic, label: 'Voiceover' },
          { id: 'uploads', icon: Library, label: 'My Uploads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as LibraryTab)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {(activeTab === 'music' || activeTab === 'sfx') && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-500 px-3 py-1">Categories</div>
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left ${
              selectedCategory === null ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => {
                  if (category.subcategories) {
                    toggleExpand(category.id);
                  } else {
                    onCategorySelect(category.id);
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left ${
                  selectedCategory === category.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                {category.subcategories && (
                  expandedCategories.has(category.id) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )
                )}
                <span className="truncate">{category.name}</span>
              </button>
              {category.subcategories && expandedCategories.has(category.id) && (
                <div className="ml-4 space-y-0.5">
                  {category.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onCategorySelect(sub.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1 rounded text-xs text-left ${
                        selectedCategory === sub.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== AI GENERATE VIEW ==============

function AIGenerateView({ onGenerate }: { onGenerate: (prompt: string, type: 'music' | 'sfx') => void }) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'music' | 'sfx'>('music');
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestions = type === 'music'
    ? [
        'Uplifting corporate music for product video',
        'Cinematic epic trailer music',
        'Chill lo-fi beats for background',
        'Dramatic logo reveal stinger',
      ]
    : [
        'Whoosh sound for logo animation',
        'Soft button click',
        'Success notification sound',
        'Dramatic impact hit',
      ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    onGenerate(prompt, type);
    // Reset after mock delay
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Wand2 size={24} />
        </div>
        <h2 className="text-xl font-semibold">AI Audio Generation</h2>
        <p className="text-sm text-zinc-500">
          Generate custom music or sound effects using AI
        </p>
      </div>

      {/* Type Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setType('music')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
            type === 'music' ? 'bg-blue-500' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <Music size={16} />
          Music
        </button>
        <button
          onClick={() => setType('sfx')}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
            type === 'sfx' ? 'bg-blue-500' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <Sparkles size={16} />
          Sound Effects
        </button>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe the ${type === 'music' ? 'music' : 'sound effect'} you want to generate...`}
          className="w-full h-24 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate {type === 'music' ? 'Music' : 'SFX'}
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-500">Try these prompts:</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setPrompt(suggestion)}
              className="px-3 py-1.5 bg-zinc-800 rounded-full text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== MAIN PANEL ==============

export function AudioHubPanel({
  onTrackSelect,
  onAddToTimeline,
  projectDuration,
}: AudioHubPanelProps) {
  const [view, setView] = useState<ViewMode>('library');
  const [activeTab, setActiveTab] = useState<LibraryTab>('music');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks
  const filteredTracks = MOCK_TRACKS.filter((track) => {
    if (activeTab === 'music' && track.category !== 'music') return false;
    if (activeTab === 'sfx' && track.category !== 'sfx') return false;
    if (activeTab === 'voiceover' && track.category !== 'voiceover') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !track.name.toLowerCase().includes(query) &&
        !track.tags.some((t) => t.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    return true;
  });

  const playTrack = (track: AudioTrack) => {
    // In production, this would use the actual audio URL
    setPlayingTrackId(track.id);
    // audioRef.current?.play();
  };

  const pauseTrack = () => {
    setPlayingTrackId(null);
    // audioRef.current?.pause();
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Music size={20} className="text-blue-400" />
            <h2 className="text-sm font-semibold">Audio Hub</h2>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('library')}
              className={`px-3 py-1.5 rounded text-xs ${
                view === 'library' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
              }`}
            >
              <Library size={14} className="inline mr-1" />
              Library
            </button>
            <button
              onClick={() => setView('ai-generate')}
              className={`px-3 py-1.5 rounded text-xs ${
                view === 'ai-generate' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
              }`}
            >
              <Wand2 size={14} className="inline mr-1" />
              AI Generate
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 rounded text-xs ${
                view === 'timeline' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
              }`}
            >
              <Layers size={14} className="inline mr-1" />
              Timeline
            </button>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded hover:bg-zinc-800"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Content */}
      {view === 'library' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <CategorySidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          {/* Track List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Music size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">No tracks found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTracks.map((track) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      isPlaying={playingTrackId === track.id}
                      onPlay={() => playTrack(track)}
                      onPause={pauseTrack}
                      onSelect={() => onTrackSelect?.(track)}
                      onAddToTimeline={() => onAddToTimeline?.(track)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'ai-generate' && (
        <AIGenerateView
          onGenerate={(prompt, type) => {
            console.log('Generate:', type, prompt);
          }}
        />
      )}

      {view === 'timeline' && (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Timeline view coming soon</p>
            <p className="text-xs mt-1">Sync audio to your video/3D scenes</p>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </div>
  );
}

export default AudioHubPanel;
