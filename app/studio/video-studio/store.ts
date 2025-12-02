import { create } from 'zustand';
import { ProjectState, AIState, Track, Clip, ChatMessage, TrackType, Transition, TransitionType, ClipTransform, ClipAppearance, ClipPlayback, ClipAudio, ClipCamera, Marker, Keyframe, KeyframeProperty, ClipKeyframes, AudioMixerTrack, ClipboardItem } from './types';
import { INITIAL_TRACKS, DEFAULT_TRANSITION, DEFAULT_CLIP_TRANSFORM, DEFAULT_CLIP_APPEARANCE, DEFAULT_CLIP_PLAYBACK, DEFAULT_CLIP_AUDIO, DEFAULT_CLIP_CAMERA } from './constants';
import { v4 as uuidv4 } from 'uuid';

// History system for undo/redo
interface HistoryEntry {
  id: string;
  description: string;
  tracks: Track[];
  selectedClipIds: string[];
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;
}

// Phase 1 & 2 state types
interface EditorSettingsState {
  snappingEnabled: boolean;
  snapToPlayhead: boolean;
  snapToClips: boolean;
  snapThreshold: number; // pixels
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  frameRate: number; // for frame-by-frame navigation
}

interface MarkerState {
  markers: Marker[];
}

interface ClipboardState {
  clipboard: ClipboardItem | null;
}

interface KeyframeState {
  clipKeyframes: Record<string, ClipKeyframes>; // clipId -> keyframes
  selectedKeyframeIds: string[];
}

interface AudioMixerState {
  mixerTracks: AudioMixerTrack[];
  masterVolume: number;
}

interface AppState extends ProjectState, AIState, HistoryState, EditorSettingsState, MarkerState, ClipboardState, KeyframeState, AudioMixerState {
  // Actions
  setTime: (time: number) => void;
  setDuration: (duration: number) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  addClip: (trackId: string, clip: Clip) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setZoomLevel: (level: number) => void;
  addMessage: (message: ChatMessage) => void;
  setGenerating: (isGenerating: boolean) => void;
  resetProject: () => void;

  // Clip selection actions
  selectClip: (clipId: string, multiSelect?: boolean) => void;
  deselectClip: (clipId: string) => void;
  clearSelection: () => void;
  selectAllClips: () => void;

  // Clip management actions
  deleteClip: (trackId: string, clipId: string) => void;
  deleteSelectedClips: () => void;
  duplicateClip: (trackId: string, clipId: string) => void;
  splitClipAtPlayhead: (trackId: string, clipId: string) => void;
  moveClip: (fromTrackId: string, toTrackId: string, clipId: string, newStart: number) => void;

  // Transition actions
  addTransitionToClip: (trackId: string, clipId: string, transitionType: TransitionType, position: 'in' | 'out') => void;
  updateTransition: (trackId: string, clipId: string, position: 'in' | 'out', updates: Partial<Transition>) => void;
  removeTransition: (trackId: string, clipId: string, position: 'in' | 'out') => void;

  // Clip resize actions
  resizeClipStart: (trackId: string, clipId: string, newStart: number, newDuration: number) => void;
  resizeClipEnd: (trackId: string, clipId: string, newDuration: number) => void;
  trimClip: (trackId: string, clipId: string, trimStart: number, trimEnd: number) => void;

  // Clip property actions
  updateClipTransform: (trackId: string, clipId: string, transform: Partial<ClipTransform>) => void;
  updateClipAppearance: (trackId: string, clipId: string, appearance: Partial<ClipAppearance>) => void;
  updateClipPlayback: (trackId: string, clipId: string, playback: Partial<ClipPlayback>) => void;
  updateClipAudio: (trackId: string, clipId: string, audio: Partial<ClipAudio>) => void;
  updateClipCamera: (trackId: string, clipId: string, camera: Partial<ClipCamera>) => void;
  resetClipTransform: (trackId: string, clipId: string) => void;

  // Color preset action
  updateClipColorPreset: (trackId: string, clipId: string, presetId: string | undefined) => void;

  // Waveform action
  setClipWaveform: (trackId: string, clipId: string, waveformData: number[]) => void;

  // History actions
  pushHistory: (description: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Phase 1: Editor settings actions
  toggleSnapping: () => void;
  setSnapSettings: (settings: Partial<EditorSettingsState>) => void;
  toggleLoop: () => void;
  setLoopRange: (start: number, end: number) => void;
  setFrameRate: (fps: number) => void;

  // Phase 1: Frame navigation actions
  stepFrame: (direction: 1 | -1) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  jumpToNextClip: () => void;
  jumpToPrevClip: () => void;

  // Phase 1: Marker actions
  addMarker: (time?: number, label?: string, color?: string) => void;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<Marker>) => void;
  jumpToMarker: (markerId: string) => void;
  jumpToNextMarker: () => void;
  jumpToPrevMarker: () => void;
  clearMarkers: () => void;

  // Phase 1: Clipboard actions
  copySelectedClips: () => void;
  cutSelectedClips: () => void;
  pasteClips: (trackId?: string) => void;

  // Phase 1: Zoom actions
  zoomToFit: () => void;
  zoomToSelection: () => void;

  // Phase 1: Ripple edit actions
  rippleDelete: (trackId: string, clipId: string) => void;

  // Phase 2: Keyframe actions
  addKeyframe: (clipId: string, property: KeyframeProperty, time: number, value: number) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  selectKeyframe: (keyframeId: string, multiSelect?: boolean) => void;
  clearKeyframeSelection: () => void;
  getInterpolatedValue: (clipId: string, property: KeyframeProperty, time: number) => number | null;

  // Phase 2: Audio mixer actions
  updateMixerTrack: (trackId: string, updates: Partial<AudioMixerTrack>) => void;
  setMasterVolume: (volume: number) => void;
  soloTrack: (trackId: string) => void;
  unsoloAllTracks: () => void;
  resetMixer: () => void;

  // Phase 2: Speed ramping actions
  setClipSpeedRamp: (trackId: string, clipId: string, startSpeed: number, endSpeed: number) => void;

  // Snapping helper (used by Timeline component)
  getSnapPoint: (time: number, excludeClipId?: string) => number;
}

// Helper to deep clone tracks for history
const cloneTracks = (tracks: Track[]): Track[] =>
  JSON.parse(JSON.stringify(tracks));

export const useStore = create<AppState>((set, get) => ({
  // Project State
  currentTime: 0,
  duration: 60, // Default 60s
  isPlaying: false,
  tracks: INITIAL_TRACKS,
  selectedClipIds: [],
  zoomLevel: 20, // px per second
  projectName: 'Untitled Project',

  // History State
  past: [],
  future: [],
  maxHistory: 50,

  // Phase 1: Editor Settings State
  snappingEnabled: true,
  snapToPlayhead: true,
  snapToClips: true,
  snapThreshold: 10, // pixels
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 10,
  frameRate: 30,

  // Phase 1: Marker State
  markers: [],

  // Phase 1: Clipboard State
  clipboard: null,

  // Phase 2: Keyframe State
  clipKeyframes: {},
  selectedKeyframeIds: [],

  // Phase 2: Audio Mixer State
  mixerTracks: [],
  masterVolume: 100,

  // AI State
  messages: [
    {
      id: 'welcome',
      role: 'model',
      text: 'Hi! I can help you edit your video. Try asking me to "Generate captions" or "Create a rough cut".',
      timestamp: Date.now(),
    },
  ],
  isGenerating: false,

  // Actions
  setTime: (time) => set({ currentTime: Math.max(0, time) }),
  setDuration: (duration) => set({ duration }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),

  addClip: (trackId, clip) => {
    get().pushHistory('Add clip');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    }));
  },

  updateClip: (trackId, clipId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
            }
          : t
      ),
    })),

  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),

  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      // Also deselect any clips from the removed track
      selectedClipIds: state.selectedClipIds.filter((clipId) => {
        const track = state.tracks.find((t) => t.id === trackId);
        return !track?.clips.some((c) => c.id === clipId);
      }),
    })),

  updateTrack: (trackId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    })),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(1, Math.min(200, level)) }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setGenerating: (isGenerating) => set({ isGenerating }),

  resetProject: () => set({
    currentTime: 0,
    isPlaying: false,
    tracks: INITIAL_TRACKS,
    selectedClipIds: [],
    messages: [],
  }),

  // Clip selection actions
  selectClip: (clipId, multiSelect = false) =>
    set((state) => {
      if (multiSelect) {
        // Toggle selection in multi-select mode
        if (state.selectedClipIds.includes(clipId)) {
          return { selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId) };
        }
        return { selectedClipIds: [...state.selectedClipIds, clipId] };
      }
      // Single select mode
      return { selectedClipIds: [clipId] };
    }),

  deselectClip: (clipId) =>
    set((state) => ({
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    })),

  clearSelection: () => set({ selectedClipIds: [] }),

  selectAllClips: () =>
    set((state) => ({
      selectedClipIds: state.tracks.flatMap((t) => t.clips.map((c) => c.id)),
    })),

  // Clip management actions (with history)
  deleteClip: (trackId, clipId) => {
    get().pushHistory('Delete clip');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t
      ),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    }));
  },

  deleteSelectedClips: () => {
    get().pushHistory('Delete clips');
    set((state) => {
      const selectedIds = new Set(state.selectedClipIds);
      return {
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => !selectedIds.has(c.id)),
        })),
        selectedClipIds: [],
      };
    });
  },

  duplicateClip: (trackId, clipId) => {
    get().pushHistory('Duplicate clip');
    set((state) => {
      const track = state.tracks.find((t) => t.id === trackId);
      const clip = track?.clips.find((c) => c.id === clipId);
      if (!clip) return state;

      const newClip: Clip = {
        ...clip,
        id: uuidv4(),
        name: `${clip.name} (copy)`,
        start: clip.start + clip.duration + 0.1, // Place after original
      };

      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
        ),
        selectedClipIds: [newClip.id], // Select the new clip
      };
    });
  },

  splitClipAtPlayhead: (trackId, clipId) => {
    const state = get();
    const { currentTime } = state;
    const track = state.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);

    if (!clip) return;

    // Check if playhead is within the clip
    const clipEnd = clip.start + clip.duration;
    if (currentTime <= clip.start || currentTime >= clipEnd) {
      return; // Playhead not within clip
    }

    get().pushHistory('Split clip');

    const splitPoint = currentTime - clip.start;

    // First part: from original start to playhead
    const firstPart: Clip = {
      ...clip,
      duration: splitPoint,
    };

    // Second part: from playhead to end
    const secondPart: Clip = {
      ...clip,
      id: uuidv4(),
      name: `${clip.name} (2)`,
      start: currentTime,
      duration: clip.duration - splitPoint,
      offset: clip.offset + splitPoint,
    };

    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? firstPart : c
              ).concat(secondPart),
            }
          : t
      ),
      selectedClipIds: [firstPart.id, secondPart.id],
    }));
  },

  moveClip: (fromTrackId, toTrackId, clipId, newStart) => {
    const state = get();
    const fromTrack = state.tracks.find((t) => t.id === fromTrackId);
    const clip = fromTrack?.clips.find((c) => c.id === clipId);

    if (!clip) return;

    get().pushHistory('Move clip');

    const movedClip: Clip = {
      ...clip,
      start: Math.max(0, newStart),
    };

    if (fromTrackId === toTrackId) {
      // Moving within same track
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === fromTrackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId ? movedClip : c
                ),
              }
            : t
        ),
      }));
    } else {
      // Moving to different track
      set((state) => ({
        tracks: state.tracks.map((t) => {
          if (t.id === fromTrackId) {
            return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
          }
          if (t.id === toTrackId) {
            return { ...t, clips: [...t.clips, movedClip] };
          }
          return t;
        }),
      }));
    }
  },

  // Transition actions (with history)
  addTransitionToClip: (trackId, clipId, transitionType, position) => {
    get().pushHistory('Add transition');
    set((state) => {
      const transitionNames: Record<TransitionType, string> = {
        [TransitionType.CUT]: 'Cut',
        [TransitionType.FADE]: 'Fade',
        [TransitionType.CROSSFADE]: 'Cross Fade',
        [TransitionType.BLUR]: 'Blur',
        [TransitionType.GLITCH]: 'Glitch',
        [TransitionType.SLIDE_LEFT]: 'Slide Left',
        [TransitionType.SLIDE_RIGHT]: 'Slide Right',
        [TransitionType.SLIDE_UP]: 'Slide Up',
        [TransitionType.SLIDE_DOWN]: 'Slide Down',
        [TransitionType.ZOOM_IN]: 'Zoom In',
        [TransitionType.ZOOM_OUT]: 'Zoom Out',
        [TransitionType.WIPE_LEFT]: 'Wipe Left',
        [TransitionType.WIPE_RIGHT]: 'Wipe Right',
        [TransitionType.DISSOLVE]: 'Dissolve',
        [TransitionType.FLASH]: 'Flash',
        [TransitionType.PIXELATE]: 'Pixelate',
      };

      const newTransition: Transition = {
        id: uuidv4(),
        type: transitionType,
        name: transitionNames[transitionType],
        ...DEFAULT_TRANSITION,
      };

      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === clipId
                    ? {
                        ...c,
                        [position === 'in' ? 'transitionIn' : 'transitionOut']: newTransition,
                      }
                    : c
                ),
              }
            : t
        ),
      };
    });
  },

  updateTransition: (trackId, clipId, position, updates) => {
    get().pushHistory('Update transition');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) => {
                if (c.id !== clipId) return c;
                const transitionKey = position === 'in' ? 'transitionIn' : 'transitionOut';
                const currentTransition = c[transitionKey];
                if (!currentTransition) return c;
                return {
                  ...c,
                  [transitionKey]: { ...currentTransition, ...updates },
                };
              }),
            }
          : t
      ),
    }));
  },

  removeTransition: (trackId, clipId, position) => {
    get().pushHistory('Remove transition');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      [position === 'in' ? 'transitionIn' : 'transitionOut']: undefined,
                    }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  // Clip resize actions (with history)
  resizeClipStart: (trackId, clipId, newStart, newDuration) => {
    get().pushHistory('Resize clip');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      start: Math.max(0, newStart),
                      duration: Math.max(0.1, newDuration),
                      offset: c.offset + (c.start - newStart), // Adjust offset when trimming from start
                    }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  resizeClipEnd: (trackId, clipId, newDuration) => {
    get().pushHistory('Resize clip');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? { ...c, duration: Math.max(0.1, newDuration) }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  trimClip: (trackId, clipId, trimStart, trimEnd) => {
    get().pushHistory('Trim clip');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) => {
                if (c.id !== clipId) return c;
                const newStart = c.start + trimStart;
                const newDuration = c.duration - trimStart - trimEnd;
                return {
                  ...c,
                  start: newStart,
                  duration: Math.max(0.1, newDuration),
                  offset: c.offset + trimStart,
                };
              }),
            }
          : t
      ),
    }));
  },

  // Clip property actions
  updateClipTransform: (trackId, clipId, transform) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      transform: { ...(c.transform || DEFAULT_CLIP_TRANSFORM), ...transform },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  updateClipAppearance: (trackId, clipId, appearance) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      appearance: { ...(c.appearance || DEFAULT_CLIP_APPEARANCE), ...appearance },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  updateClipPlayback: (trackId, clipId, playback) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      playback: { ...(c.playback || DEFAULT_CLIP_PLAYBACK), ...playback },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  updateClipAudio: (trackId, clipId, audio) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      audio: { ...(c.audio || DEFAULT_CLIP_AUDIO), ...audio },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  updateClipCamera: (trackId, clipId, camera) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      camera: { ...(c.camera || DEFAULT_CLIP_CAMERA), ...camera },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  resetClipTransform: (trackId, clipId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      transform: { ...DEFAULT_CLIP_TRANSFORM },
                      appearance: { ...DEFAULT_CLIP_APPEARANCE },
                      playback: { ...DEFAULT_CLIP_PLAYBACK },
                      audio: { ...DEFAULT_CLIP_AUDIO },
                      camera: { ...DEFAULT_CLIP_CAMERA },
                    }
                  : c
              ),
            }
          : t
      ),
    })),

  // Color preset action
  updateClipColorPreset: (trackId, clipId, presetId) => {
    get().pushHistory('Apply color preset');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      colorPreset: presetId,
                    }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  // Waveform action (no history - this is computed/cached data)
  setClipWaveform: (trackId, clipId, waveformData) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      waveformData,
                    }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  // History actions
  pushHistory: (description) =>
    set((state) => {
      const entry: HistoryEntry = {
        id: uuidv4(),
        description,
        tracks: cloneTracks(state.tracks),
        selectedClipIds: [...state.selectedClipIds],
      };

      // Limit history size
      const newPast = [...state.past, entry].slice(-state.maxHistory);

      return {
        past: newPast,
        future: [], // Clear redo stack on new action
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;

      const previousEntry = state.past[state.past.length - 1];
      const currentEntry: HistoryEntry = {
        id: uuidv4(),
        description: 'Current state',
        tracks: cloneTracks(state.tracks),
        selectedClipIds: [...state.selectedClipIds],
      };

      return {
        tracks: cloneTracks(previousEntry.tracks),
        selectedClipIds: [...previousEntry.selectedClipIds],
        past: state.past.slice(0, -1),
        future: [currentEntry, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;

      const nextEntry = state.future[0];
      const currentEntry: HistoryEntry = {
        id: uuidv4(),
        description: 'Current state',
        tracks: cloneTracks(state.tracks),
        selectedClipIds: [...state.selectedClipIds],
      };

      return {
        tracks: cloneTracks(nextEntry.tracks),
        selectedClipIds: [...nextEntry.selectedClipIds],
        past: [...state.past, currentEntry],
        future: state.future.slice(1),
      };
    }),

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clearHistory: () => set({ past: [], future: [] }),

  // ============== PHASE 1: EDITOR SETTINGS ==============

  toggleSnapping: () => set((state) => ({ snappingEnabled: !state.snappingEnabled })),

  setSnapSettings: (settings) => set((state) => ({ ...state, ...settings })),

  toggleLoop: () => set((state) => ({ loopEnabled: !state.loopEnabled })),

  setLoopRange: (start, end) => set({ loopStart: start, loopEnd: end }),

  setFrameRate: (fps) => set({ frameRate: Math.max(1, Math.min(120, fps)) }),

  // ============== PHASE 1: FRAME NAVIGATION ==============

  stepFrame: (direction) => {
    const state = get();
    const frameTime = 1 / state.frameRate;
    const newTime = state.currentTime + (direction * frameTime);
    set({ currentTime: Math.max(0, Math.min(newTime, state.duration)) });
  },

  jumpToStart: () => set({ currentTime: 0 }),

  jumpToEnd: () => set((state) => ({ currentTime: state.duration })),

  jumpToNextClip: () => {
    const state = get();
    const allClipStarts = state.tracks
      .flatMap((t) => t.clips.map((c) => c.start))
      .filter((start) => start > state.currentTime + 0.001)
      .sort((a, b) => a - b);

    if (allClipStarts.length > 0) {
      set({ currentTime: allClipStarts[0] });
    }
  },

  jumpToPrevClip: () => {
    const state = get();
    const allClipStarts = state.tracks
      .flatMap((t) => t.clips.map((c) => c.start))
      .filter((start) => start < state.currentTime - 0.001)
      .sort((a, b) => b - a);

    if (allClipStarts.length > 0) {
      set({ currentTime: allClipStarts[0] });
    }
  },

  // ============== PHASE 1: MARKERS ==============

  addMarker: (time, label, color) => {
    const state = get();
    const markerTime = time ?? state.currentTime;
    const existingCount = state.markers.length;
    const newMarker: Marker = {
      id: uuidv4(),
      time: markerTime,
      label: label ?? `Marker ${existingCount + 1}`,
      color: color ?? '#FFD700', // Gold color
    };
    set((state) => ({ markers: [...state.markers, newMarker].sort((a, b) => a.time - b.time) }));
  },

  removeMarker: (markerId) =>
    set((state) => ({ markers: state.markers.filter((m) => m.id !== markerId) })),

  updateMarker: (markerId, updates) =>
    set((state) => ({
      markers: state.markers.map((m) => (m.id === markerId ? { ...m, ...updates } : m)),
    })),

  jumpToMarker: (markerId) => {
    const marker = get().markers.find((m) => m.id === markerId);
    if (marker) {
      set({ currentTime: marker.time });
    }
  },

  jumpToNextMarker: () => {
    const state = get();
    const nextMarker = state.markers.find((m) => m.time > state.currentTime + 0.001);
    if (nextMarker) {
      set({ currentTime: nextMarker.time });
    }
  },

  jumpToPrevMarker: () => {
    const state = get();
    const prevMarkers = state.markers.filter((m) => m.time < state.currentTime - 0.001);
    if (prevMarkers.length > 0) {
      set({ currentTime: prevMarkers[prevMarkers.length - 1].time });
    }
  },

  clearMarkers: () => set({ markers: [] }),

  // ============== PHASE 1: CLIPBOARD ==============

  copySelectedClips: () => {
    const state = get();
    if (state.selectedClipIds.length === 0) return;

    // Find all selected clips
    const selectedClips: Clip[] = [];
    let sourceTrackId = '';

    for (const track of state.tracks) {
      for (const clip of track.clips) {
        if (state.selectedClipIds.includes(clip.id)) {
          selectedClips.push({ ...clip });
          if (!sourceTrackId) sourceTrackId = track.id;
        }
      }
    }

    if (selectedClips.length === 1) {
      set({ clipboard: { type: 'clip', data: selectedClips[0], sourceTrackId } });
    } else if (selectedClips.length > 1) {
      set({ clipboard: { type: 'clips', data: selectedClips, sourceTrackId } });
    }
  },

  cutSelectedClips: () => {
    get().copySelectedClips();
    get().deleteSelectedClips();
  },

  pasteClips: (targetTrackId) => {
    const state = get();
    if (!state.clipboard) return;

    get().pushHistory('Paste clips');

    const trackId = targetTrackId ?? state.clipboard.sourceTrackId;
    const currentTime = state.currentTime;

    if (state.clipboard.type === 'clip') {
      const clip = state.clipboard.data as Clip;
      const newClip: Clip = {
        ...clip,
        id: uuidv4(),
        name: `${clip.name} (pasted)`,
        start: currentTime,
      };
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
        ),
        selectedClipIds: [newClip.id],
      }));
    } else {
      const clips = state.clipboard.data as Clip[];
      // Find the earliest start time to calculate relative positions
      const minStart = Math.min(...clips.map((c) => c.start));
      const newClips: Clip[] = clips.map((clip) => ({
        ...clip,
        id: uuidv4(),
        name: `${clip.name} (pasted)`,
        start: currentTime + (clip.start - minStart),
      }));

      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, ...newClips] } : t
        ),
        selectedClipIds: newClips.map((c) => c.id),
      }));
    }
  },

  // ============== PHASE 1: ZOOM ==============

  zoomToFit: () => {
    const state = get();
    // Find the extent of all clips
    let maxEnd = 0;
    for (const track of state.tracks) {
      for (const clip of track.clips) {
        maxEnd = Math.max(maxEnd, clip.start + clip.duration);
      }
    }
    if (maxEnd === 0) maxEnd = state.duration;

    // Assume timeline width ~1200px, calculate zoom to fit
    const timelineWidth = 1200;
    const newZoom = timelineWidth / (maxEnd * 1.1); // 10% padding
    set({ zoomLevel: Math.max(5, Math.min(200, newZoom)) });
  },

  zoomToSelection: () => {
    const state = get();
    if (state.selectedClipIds.length === 0) return;

    let minStart = Infinity;
    let maxEnd = 0;

    for (const track of state.tracks) {
      for (const clip of track.clips) {
        if (state.selectedClipIds.includes(clip.id)) {
          minStart = Math.min(minStart, clip.start);
          maxEnd = Math.max(maxEnd, clip.start + clip.duration);
        }
      }
    }

    if (minStart === Infinity) return;

    const selectionDuration = maxEnd - minStart;
    const timelineWidth = 1200;
    const newZoom = timelineWidth / (selectionDuration * 1.2); // 20% padding
    set({
      zoomLevel: Math.max(5, Math.min(200, newZoom)),
      currentTime: minStart, // Jump to selection start
    });
  },

  // ============== PHASE 1: RIPPLE EDIT ==============

  rippleDelete: (trackId, clipId) => {
    const state = get();
    const track = state.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;

    get().pushHistory('Ripple delete');

    const clipEnd = clip.start + clip.duration;
    const gapDuration = clip.duration;

    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          clips: t.clips
            .filter((c) => c.id !== clipId)
            .map((c) => {
              // Shift clips that come after the deleted clip
              if (c.start >= clipEnd) {
                return { ...c, start: c.start - gapDuration };
              }
              return c;
            }),
        };
      }),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    }));
  },

  // ============== PHASE 2: KEYFRAMES ==============

  addKeyframe: (clipId, property, time, value) => {
    const newKeyframe: Keyframe = {
      id: uuidv4(),
      time,
      property,
      value,
      easing: 'ease-in-out',
    };

    set((state) => {
      const clipKf = state.clipKeyframes[clipId] || {};
      const propertyKfs = clipKf[property] || [];

      // Remove existing keyframe at same time if any
      const filtered = propertyKfs.filter((kf) => Math.abs(kf.time - time) > 0.001);

      return {
        clipKeyframes: {
          ...state.clipKeyframes,
          [clipId]: {
            ...clipKf,
            [property]: [...filtered, newKeyframe].sort((a, b) => a.time - b.time),
          },
        },
      };
    });
  },

  removeKeyframe: (clipId, keyframeId) => {
    set((state) => {
      const clipKf = state.clipKeyframes[clipId];
      if (!clipKf) return state;

      const newClipKf: ClipKeyframes = {};
      for (const [prop, kfs] of Object.entries(clipKf)) {
        newClipKf[prop] = kfs.filter((kf) => kf.id !== keyframeId);
      }

      return {
        clipKeyframes: {
          ...state.clipKeyframes,
          [clipId]: newClipKf,
        },
        selectedKeyframeIds: state.selectedKeyframeIds.filter((id) => id !== keyframeId),
      };
    });
  },

  updateKeyframe: (clipId, keyframeId, updates) => {
    set((state) => {
      const clipKf = state.clipKeyframes[clipId];
      if (!clipKf) return state;

      const newClipKf: ClipKeyframes = {};
      for (const [prop, kfs] of Object.entries(clipKf)) {
        newClipKf[prop] = kfs.map((kf) =>
          kf.id === keyframeId ? { ...kf, ...updates } : kf
        );
      }

      return {
        clipKeyframes: {
          ...state.clipKeyframes,
          [clipId]: newClipKf,
        },
      };
    });
  },

  selectKeyframe: (keyframeId, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        if (state.selectedKeyframeIds.includes(keyframeId)) {
          return { selectedKeyframeIds: state.selectedKeyframeIds.filter((id) => id !== keyframeId) };
        }
        return { selectedKeyframeIds: [...state.selectedKeyframeIds, keyframeId] };
      }
      return { selectedKeyframeIds: [keyframeId] };
    });
  },

  clearKeyframeSelection: () => set({ selectedKeyframeIds: [] }),

  getInterpolatedValue: (clipId, property, time) => {
    const state = get();
    const clipKf = state.clipKeyframes[clipId];
    if (!clipKf) return null;

    const keyframes = clipKf[property];
    if (!keyframes || keyframes.length === 0) return null;

    // Find surrounding keyframes
    const before = keyframes.filter((kf) => kf.time <= time);
    const after = keyframes.filter((kf) => kf.time > time);

    if (before.length === 0) return keyframes[0].value;
    if (after.length === 0) return before[before.length - 1].value;

    const kf1 = before[before.length - 1];
    const kf2 = after[0];

    // Linear interpolation (could be extended for different easing)
    const t = (time - kf1.time) / (kf2.time - kf1.time);

    // Apply easing
    let easedT = t;
    switch (kf2.easing) {
      case 'ease-in':
        easedT = t * t;
        break;
      case 'ease-out':
        easedT = t * (2 - t);
        break;
      case 'ease-in-out':
        easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        break;
      case 'bezier':
        // Use bezier handles if available, otherwise fallback to linear
        if (kf2.bezierHandles) {
          // Cubic bezier approximation
          const { x1, y1, x2, y2 } = kf2.bezierHandles;
          // Simple approximation - for full accuracy would need bezier solving
          easedT = 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
        }
        break;
    }

    return kf1.value + (kf2.value - kf1.value) * easedT;
  },

  // ============== PHASE 2: AUDIO MIXER ==============

  updateMixerTrack: (trackId, updates) => {
    set((state) => {
      const existingTrack = state.mixerTracks.find((t) => t.trackId === trackId);
      if (existingTrack) {
        return {
          mixerTracks: state.mixerTracks.map((t) =>
            t.trackId === trackId ? { ...t, ...updates } : t
          ),
        };
      }
      // Create new mixer track with defaults
      const newMixerTrack: AudioMixerTrack = {
        trackId,
        volume: 100,
        pan: 0,
        muted: false,
        solo: false,
        eqLow: 0,
        eqMid: 0,
        eqHigh: 0,
        ...updates,
      };
      return { mixerTracks: [...state.mixerTracks, newMixerTrack] };
    });
  },

  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(200, volume)) }),

  soloTrack: (trackId) => {
    set((state) => ({
      mixerTracks: state.mixerTracks.map((t) => ({
        ...t,
        solo: t.trackId === trackId ? !t.solo : t.solo,
      })),
    }));
  },

  unsoloAllTracks: () => {
    set((state) => ({
      mixerTracks: state.mixerTracks.map((t) => ({ ...t, solo: false })),
    }));
  },

  resetMixer: () => {
    set((state) => ({
      mixerTracks: state.mixerTracks.map((t) => ({
        ...t,
        volume: 100,
        pan: 0,
        muted: false,
        solo: false,
        eqLow: 0,
        eqMid: 0,
        eqHigh: 0,
      })),
      masterVolume: 100,
    }));
  },

  // ============== PHASE 2: SPEED RAMPING ==============

  setClipSpeedRamp: (trackId, clipId, startSpeed, endSpeed) => {
    get().pushHistory('Set speed ramp');
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      playback: {
                        ...(c.playback || { playbackRate: 1, reverse: false }),
                        playbackRate: startSpeed, // Store start speed as base
                        // Store end speed in a custom property (extend type if needed)
                      },
                    }
                  : c
              ),
            }
          : t
      ),
    }));
  },

  // ============== SNAPPING HELPER ==============

  getSnapPoint: (time, excludeClipId) => {
    const state = get();
    if (!state.snappingEnabled) return time;

    const snapPoints: number[] = [];

    // Add playhead position
    if (state.snapToPlayhead) {
      snapPoints.push(state.currentTime);
    }

    // Add clip edges
    if (state.snapToClips) {
      for (const track of state.tracks) {
        for (const clip of track.clips) {
          if (clip.id === excludeClipId) continue;
          snapPoints.push(clip.start);
          snapPoints.push(clip.start + clip.duration);
        }
      }
    }

    // Add markers
    for (const marker of state.markers) {
      snapPoints.push(marker.time);
    }

    // Find closest snap point within threshold
    const threshold = state.snapThreshold / state.zoomLevel; // Convert to time
    let closestPoint = time;
    let minDistance = Infinity;

    for (const point of snapPoints) {
      const distance = Math.abs(time - point);
      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    return closestPoint;
  },
}));