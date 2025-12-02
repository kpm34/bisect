/**
 * Audio Library
 *
 * Built-in music and SFX library with categories and search
 * Designed for quick access to common creative audio needs
 */

import type {
  AudioTrack,
  AudioLibraryCategory,
  AudioLibraryFilter,
  AudioLibrarySort,
  MusicGenre,
  MusicMood,
  SFXCategory,
} from './types';

// ============== LIBRARY CATEGORIES ==============

export const MUSIC_CATEGORIES: AudioLibraryCategory[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: 'film',
    description: 'Epic, emotional, and dramatic scores',
    trackCount: 0,
    subcategories: [
      { id: 'cinematic-epic', name: 'Epic', icon: 'mountain', description: 'Grand orchestral pieces', trackCount: 0 },
      { id: 'cinematic-emotional', name: 'Emotional', icon: 'heart', description: 'Moving, sentimental tracks', trackCount: 0 },
      { id: 'cinematic-tension', name: 'Tension', icon: 'alert-triangle', description: 'Suspenseful, dramatic', trackCount: 0 },
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    icon: 'briefcase',
    description: 'Professional, uplifting business music',
    trackCount: 0,
    subcategories: [
      { id: 'corporate-inspiring', name: 'Inspiring', icon: 'trending-up', description: 'Motivational, uplifting', trackCount: 0 },
      { id: 'corporate-tech', name: 'Tech', icon: 'cpu', description: 'Modern, innovative feel', trackCount: 0 },
      { id: 'corporate-minimal', name: 'Minimal', icon: 'minus', description: 'Clean, understated', trackCount: 0 },
    ],
  },
  {
    id: 'electronic',
    name: 'Electronic',
    icon: 'zap',
    description: 'Synth-based, modern electronic music',
    trackCount: 0,
    subcategories: [
      { id: 'electronic-edm', name: 'EDM', icon: 'music', description: 'High energy dance', trackCount: 0 },
      { id: 'electronic-ambient', name: 'Ambient', icon: 'cloud', description: 'Atmospheric, spacey', trackCount: 0 },
      { id: 'electronic-synthwave', name: 'Synthwave', icon: 'sun', description: '80s retro vibes', trackCount: 0 },
    ],
  },
  {
    id: 'acoustic',
    name: 'Acoustic',
    icon: 'music',
    description: 'Natural, organic instrument sounds',
    trackCount: 0,
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    icon: 'headphones',
    description: 'Chill, relaxed beats',
    trackCount: 0,
  },
];

export const SFX_CATEGORIES: AudioLibraryCategory[] = [
  {
    id: 'sfx-ui',
    name: 'UI Sounds',
    icon: 'mouse-pointer',
    description: 'Clicks, hovers, notifications',
    trackCount: 0,
    subcategories: [
      { id: 'sfx-ui-clicks', name: 'Clicks', icon: 'mouse-pointer', description: 'Button clicks, taps', trackCount: 0 },
      { id: 'sfx-ui-notifications', name: 'Notifications', icon: 'bell', description: 'Alerts, pings', trackCount: 0 },
      { id: 'sfx-ui-success', name: 'Success', icon: 'check', description: 'Completion sounds', trackCount: 0 },
      { id: 'sfx-ui-error', name: 'Error', icon: 'x', description: 'Error, warning sounds', trackCount: 0 },
    ],
  },
  {
    id: 'sfx-transitions',
    name: 'Transitions',
    icon: 'arrow-right',
    description: 'Whooshes, swipes, reveals',
    trackCount: 0,
    subcategories: [
      { id: 'sfx-whooshes', name: 'Whooshes', icon: 'wind', description: 'Fast movement sounds', trackCount: 0 },
      { id: 'sfx-swipes', name: 'Swipes', icon: 'move', description: 'Swipe, slide sounds', trackCount: 0 },
      { id: 'sfx-reveals', name: 'Reveals', icon: 'eye', description: 'Dramatic reveals', trackCount: 0 },
    ],
  },
  {
    id: 'sfx-impacts',
    name: 'Impacts',
    icon: 'target',
    description: 'Hits, punches, drops',
    trackCount: 0,
  },
  {
    id: 'sfx-risers',
    name: 'Risers & Build-ups',
    icon: 'trending-up',
    description: 'Tension builders, crescendos',
    trackCount: 0,
  },
  {
    id: 'sfx-magic',
    name: 'Magic & Fantasy',
    icon: 'sparkles',
    description: 'Sparkles, spells, enchantment',
    trackCount: 0,
  },
  {
    id: 'sfx-tech',
    name: 'Tech & Sci-Fi',
    icon: 'cpu',
    description: 'Futuristic, mechanical sounds',
    trackCount: 0,
  },
];

// ============== GENRE/MOOD MAPPINGS ==============

export const GENRE_MOODS: Record<MusicGenre, MusicMood[]> = {
  cinematic: ['inspiring', 'sad', 'tense', 'mysterious'],
  corporate: ['happy', 'inspiring', 'calm'],
  electronic: ['energetic', 'calm', 'mysterious'],
  ambient: ['calm', 'peaceful', 'mysterious'],
  upbeat: ['happy', 'energetic'],
  dramatic: ['tense', 'sad', 'aggressive'],
  minimal: ['calm', 'peaceful'],
  orchestral: ['inspiring', 'sad', 'tense', 'romantic'],
  acoustic: ['happy', 'calm', 'peaceful', 'romantic'],
  lofi: ['calm', 'peaceful'],
  epic: ['inspiring', 'energetic', 'aggressive'],
  playful: ['happy', 'energetic'],
};

export const MOOD_ICONS: Record<MusicMood, string> = {
  happy: 'smile',
  sad: 'frown',
  energetic: 'zap',
  calm: 'cloud',
  tense: 'alert-triangle',
  inspiring: 'sunrise',
  mysterious: 'moon',
  romantic: 'heart',
  aggressive: 'flame',
  peaceful: 'feather',
};

export const SFX_ICONS: Record<SFXCategory, string> = {
  ui: 'mouse-pointer',
  transitions: 'arrow-right',
  impacts: 'target',
  risers: 'trending-up',
  nature: 'tree',
  mechanical: 'settings',
  magic: 'sparkles',
  foley: 'footprints',
  voices: 'users',
  musical: 'music',
};

// ============== SEARCH & FILTER ==============

export function filterTracks(
  tracks: AudioTrack[],
  filter: AudioLibraryFilter
): AudioTrack[] {
  return tracks.filter((track) => {
    // Category filter
    if (filter.category && track.category !== filter.category) {
      return false;
    }

    // Genre filter (for music)
    if (filter.genre && filter.genre.length > 0) {
      if (!track.genre || !filter.genre.includes(track.genre)) {
        return false;
      }
    }

    // Mood filter (for music)
    if (filter.mood && filter.mood.length > 0) {
      if (!track.mood || !filter.mood.includes(track.mood)) {
        return false;
      }
    }

    // SFX category filter
    if (filter.sfxCategory && filter.sfxCategory.length > 0) {
      if (!track.sfxCategory || !filter.sfxCategory.includes(track.sfxCategory)) {
        return false;
      }
    }

    // BPM range filter
    if (filter.bpmRange && track.bpm) {
      const [minBpm, maxBpm] = filter.bpmRange;
      if (track.bpm < minBpm || track.bpm > maxBpm) {
        return false;
      }
    }

    // Duration range filter
    if (filter.durationRange) {
      const [minDuration, maxDuration] = filter.durationRange;
      if (track.duration < minDuration || track.duration > maxDuration) {
        return false;
      }
    }

    // Source filter
    if (filter.source && filter.source.length > 0) {
      if (!filter.source.includes(track.source)) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some((tag) =>
        track.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesName = track.name.toLowerCase().includes(searchLower);
      const matchesTags = track.tags.some((t) =>
        t.toLowerCase().includes(searchLower)
      );
      const matchesGenre = track.genre?.toLowerCase().includes(searchLower);
      const matchesMood = track.mood?.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesTags && !matchesGenre && !matchesMood) {
        return false;
      }
    }

    return true;
  });
}

export function sortTracks(
  tracks: AudioTrack[],
  sort: AudioLibrarySort
): AudioTrack[] {
  return [...tracks].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'bpm':
        comparison = (a.bpm || 0) - (b.bpm || 0);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'popularity':
        // Would need a popularity field - default to name
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

// ============== WAVEFORM GENERATION ==============

export async function generateWaveformData(
  audioUrl: string,
  samples: number = 100
): Promise<number[]> {
  // This would use Web Audio API to analyze the audio file
  // For now, return mock data - actual implementation would be:
  /*
  const audioContext = new AudioContext();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);

  const waveform: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize
  const max = Math.max(...waveform);
  return waveform.map(v => v / max);
  */

  // Mock waveform for now
  return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.2);
}

// ============== DURATION FORMATTING ==============

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseDuration(formatted: string): number {
  const parts = formatted.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

// ============== SUGGESTED TRACKS ==============

export interface TrackSuggestion {
  trackId: string;
  reason: string;
  confidence: number;
}

export function suggestTracksForScene(
  tracks: AudioTrack[],
  sceneContext: {
    mood?: string;
    duration?: number;
    hasAction?: boolean;
    isProductVideo?: boolean;
    isLogoReveal?: boolean;
  }
): TrackSuggestion[] {
  const suggestions: TrackSuggestion[] = [];

  for (const track of tracks) {
    let confidence = 0;
    const reasons: string[] = [];

    // Duration match
    if (sceneContext.duration && track.duration) {
      const durationDiff = Math.abs(track.duration - sceneContext.duration);
      if (durationDiff < 5) {
        confidence += 0.3;
        reasons.push('Duration matches');
      } else if (durationDiff < 15) {
        confidence += 0.1;
      }
    }

    // Mood match
    if (sceneContext.mood && track.mood) {
      if (track.mood.toLowerCase().includes(sceneContext.mood.toLowerCase())) {
        confidence += 0.4;
        reasons.push(`Mood: ${track.mood}`);
      }
    }

    // Product video
    if (sceneContext.isProductVideo) {
      if (track.genre === 'corporate' || track.genre === 'minimal') {
        confidence += 0.3;
        reasons.push('Good for product videos');
      }
    }

    // Logo reveal
    if (sceneContext.isLogoReveal) {
      if (track.category === 'sfx' && track.sfxCategory === 'transitions') {
        confidence += 0.5;
        reasons.push('Perfect for logo reveals');
      }
    }

    // Action scenes
    if (sceneContext.hasAction) {
      if (track.mood === 'energetic' || track.mood === 'aggressive') {
        confidence += 0.3;
        reasons.push('High energy');
      }
    }

    if (confidence > 0.2) {
      suggestions.push({
        trackId: track.id,
        reason: reasons.join(', '),
        confidence,
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}
