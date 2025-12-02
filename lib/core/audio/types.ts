/**
 * Audio Hub Types
 *
 * Types for music library, SFX, AI audio generation, and video sync
 * Designed as an orchestrator (connecting to Suno, ElevenLabs, etc.)
 * NOT a full DAW - focused on creative workflow integration
 */

// ============== AUDIO TRACK TYPES ==============

export type AudioCategory = 'music' | 'sfx' | 'voiceover' | 'ambient' | 'foley';

export type AudioSource =
  | 'library'      // Built-in/licensed library
  | 'ai-generated' // AI-generated (Suno, ElevenLabs)
  | 'user-upload'  // User uploaded
  | 'recorded';    // Recorded in-app

export type MusicGenre =
  | 'cinematic'
  | 'corporate'
  | 'electronic'
  | 'ambient'
  | 'upbeat'
  | 'dramatic'
  | 'minimal'
  | 'orchestral'
  | 'acoustic'
  | 'lofi'
  | 'epic'
  | 'playful';

export type MusicMood =
  | 'happy'
  | 'sad'
  | 'energetic'
  | 'calm'
  | 'tense'
  | 'inspiring'
  | 'mysterious'
  | 'romantic'
  | 'aggressive'
  | 'peaceful';

export type SFXCategory =
  | 'ui'           // Clicks, hovers, notifications
  | 'transitions'  // Whooshes, swipes, reveals
  | 'impacts'      // Hits, punches, drops
  | 'risers'       // Build-ups, tension
  | 'nature'       // Wind, rain, birds
  | 'mechanical'   // Machines, robots, tech
  | 'magic'        // Sparkles, spells, fantasy
  | 'foley'        // Footsteps, cloth, objects
  | 'voices'       // Crowds, reactions
  | 'musical';     // Stingers, accents

// ============== AUDIO TRACK ==============

export interface AudioTrack {
  id: string;
  name: string;
  category: AudioCategory;
  source: AudioSource;

  // File info
  url: string;
  duration: number; // seconds
  fileSize: number; // bytes
  format: 'mp3' | 'wav' | 'ogg' | 'aac';
  sampleRate: number;

  // Metadata
  tags: string[];
  bpm?: number; // For music
  key?: string; // Musical key (C, Am, etc.)
  genre?: MusicGenre;
  mood?: MusicMood;
  sfxCategory?: SFXCategory;

  // Licensing
  license: AudioLicense;
  attribution?: string;

  // Waveform for visualization
  waveformData?: number[]; // Normalized amplitude values

  // AI generation metadata
  aiGeneration?: {
    provider: 'suno' | 'udio' | 'elevenlabs' | 'other';
    prompt: string;
    generatedAt: string;
    modelVersion?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface AudioLicense {
  type: 'royalty-free' | 'creative-commons' | 'licensed' | 'ai-generated' | 'user-owned';
  commercial: boolean;
  attribution: boolean;
  modifications: boolean;
  licenseUrl?: string;
}

// ============== TIMELINE & SYNC ==============

export interface AudioTimelineTrack {
  id: string;
  audioTrackId: string;
  name: string;

  // Position on timeline
  startTime: number; // seconds from start
  endTime: number;

  // Trim (what part of the audio to use)
  trimStart: number; // seconds into the audio file
  trimEnd: number;

  // Volume automation
  volume: number; // 0-1
  volumeKeyframes?: VolumeKeyframe[];

  // Effects
  fadeIn?: number; // seconds
  fadeOut?: number;
  loop: boolean;

  // Sync to video/3D
  syncTarget?: {
    type: 'video' | '3d-animation' | 'scene-event';
    targetId: string;
    syncPoint: 'start' | 'end' | 'marker';
    offset: number; // seconds offset from sync point
  };

  // Visual
  color: string;
  muted: boolean;
  solo: boolean;
  locked: boolean;
}

export interface VolumeKeyframe {
  time: number; // seconds
  value: number; // 0-1
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AudioTimeline {
  id: string;
  projectId: string;
  name: string;

  // Timeline settings
  duration: number; // Total duration in seconds

  // Tracks
  tracks: AudioTimelineTrack[];

  // Master settings
  masterVolume: number;

  // Markers for sync points
  markers: TimelineMarker[];

  // Beat detection for auto-sync
  beatMarkers?: number[]; // timestamps of detected beats

  // Export settings
  exportFormat: 'mp3' | 'wav' | 'aac';
  exportQuality: 'low' | 'medium' | 'high';
}

export interface TimelineMarker {
  id: string;
  time: number;
  name: string;
  color: string;
  type: 'sync' | 'section' | 'beat' | 'custom';
}

// ============== AI GENERATION ==============

export interface MusicGenerationRequest {
  provider: 'suno' | 'udio';
  prompt: string;

  // Style options
  genre?: MusicGenre;
  mood?: MusicMood;
  tempo?: 'slow' | 'medium' | 'fast';

  // Duration
  duration: number; // seconds (typically 30-120)

  // Advanced
  instrumental: boolean;
  referenceTrackUrl?: string; // For style reference
}

export interface SFXGenerationRequest {
  provider: 'elevenlabs' | 'other';
  prompt: string;

  // Type
  category: SFXCategory;

  // Duration
  duration: number; // seconds (typically 1-10)

  // Options
  variations?: number; // Generate multiple variations
}

export interface VoiceoverGenerationRequest {
  provider: 'elevenlabs' | 'openai';
  text: string;

  // Voice settings
  voiceId?: string;
  voiceStyle?: 'neutral' | 'cheerful' | 'serious' | 'dramatic';

  // Speed and pitch
  speed: number; // 0.5-2.0
  pitch?: number;

  // Language
  language: string;
}

export interface AIGenerationResult {
  success: boolean;
  trackId?: string;
  url?: string;
  error?: string;

  // Provider-specific
  jobId?: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress?: number;
}

// ============== LIBRARY ==============

export interface AudioLibraryCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  trackCount: number;
  subcategories?: AudioLibraryCategory[];
}

export interface AudioLibraryFilter {
  category?: AudioCategory;
  genre?: MusicGenre[];
  mood?: MusicMood[];
  sfxCategory?: SFXCategory[];
  bpmRange?: [number, number];
  durationRange?: [number, number];
  source?: AudioSource[];
  tags?: string[];
  search?: string;
}

export interface AudioLibrarySort {
  field: 'name' | 'duration' | 'bpm' | 'createdAt' | 'popularity';
  direction: 'asc' | 'desc';
}

// ============== AUDIO HUB STATE ==============

export interface AudioHubState {
  // Library
  tracks: AudioTrack[];
  categories: AudioLibraryCategory[];
  filter: AudioLibraryFilter;
  sort: AudioLibrarySort;

  // Timeline
  timeline: AudioTimeline | null;
  selectedTrackId: string | null;
  playhead: number; // Current playback position
  isPlaying: boolean;

  // Preview
  previewTrackId: string | null;
  previewVolume: number;

  // AI Generation
  pendingGenerations: AIGenerationResult[];

  // UI State
  view: 'library' | 'timeline' | 'ai-generate';
  sidebarOpen: boolean;
}

// ============== AUDIO ACTIONS ==============

export type AudioAction =
  | { type: 'ADD_TRACK'; track: AudioTrack }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'UPDATE_TRACK'; trackId: string; updates: Partial<AudioTrack> }
  | { type: 'ADD_TO_TIMELINE'; timelineTrack: AudioTimelineTrack }
  | { type: 'REMOVE_FROM_TIMELINE'; timelineTrackId: string }
  | { type: 'UPDATE_TIMELINE_TRACK'; timelineTrackId: string; updates: Partial<AudioTimelineTrack> }
  | { type: 'SET_PLAYHEAD'; time: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SET_MASTER_VOLUME'; volume: number }
  | { type: 'PREVIEW_TRACK'; trackId: string | null }
  | { type: 'SET_FILTER'; filter: AudioLibraryFilter }
  | { type: 'SET_SORT'; sort: AudioLibrarySort }
  | { type: 'START_AI_GENERATION'; request: MusicGenerationRequest | SFXGenerationRequest }
  | { type: 'AI_GENERATION_UPDATE'; result: AIGenerationResult };

// ============== EXPORT TYPES ==============

export interface AudioExportOptions {
  format: 'mp3' | 'wav' | 'aac' | 'ogg';
  quality: 'low' | 'medium' | 'high'; // 128kbps, 192kbps, 320kbps
  sampleRate: 44100 | 48000;

  // Timeline export
  startTime?: number;
  endTime?: number;

  // Mix options
  normalize: boolean;
  fadeOut?: number;
}

// ============== SYNC TYPES ==============

export interface VideoSyncConfig {
  videoId: string;
  videoDuration: number;

  // Auto-sync options
  syncBeatsTocuts: boolean;
  detectSceneChanges: boolean;

  // Manual sync points
  syncPoints: Array<{
    videoTime: number;
    audioTime: number;
    description?: string;
  }>;
}

export interface SceneEventSync {
  eventId: string;
  eventType: string; // 'mouseClick', 'start', etc.
  audioTrackId: string;
  playMode: 'play' | 'stop' | 'toggle';
  volume?: number;
  fadeIn?: number;
}

// ============== PROVIDER CONFIGS ==============

export interface SunoConfig {
  apiKey: string;
  defaultModel: 'chirp-v3' | 'bark';
  maxDuration: number;
}

export interface ElevenLabsConfig {
  apiKey: string;
  defaultVoiceId?: string;
  modelId: string;
}

export interface AudioProviderConfig {
  suno?: SunoConfig;
  elevenlabs?: ElevenLabsConfig;
  udio?: { apiKey: string };
}
