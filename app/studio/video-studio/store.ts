import { create } from 'zustand';
import { ProjectState, AIState, Track, Clip, ChatMessage, TrackType, Transition, TransitionType, ClipTransform, ClipAppearance, ClipPlayback, ClipAudio, ClipCamera } from './types';
import { INITIAL_TRACKS, DEFAULT_TRANSITION, DEFAULT_CLIP_TRANSFORM, DEFAULT_CLIP_APPEARANCE, DEFAULT_CLIP_PLAYBACK, DEFAULT_CLIP_AUDIO, DEFAULT_CLIP_CAMERA } from './constants';
import { v4 as uuidv4 } from 'uuid';

interface AppState extends ProjectState, AIState {
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
}

export const useStore = create<AppState>((set, get) => ({
  // Project State
  currentTime: 0,
  duration: 60, // Default 60s
  isPlaying: false,
  tracks: INITIAL_TRACKS,
  selectedClipIds: [],
  zoomLevel: 20, // px per second

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

  addClip: (trackId, clip) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    })),

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

  // Clip management actions
  deleteClip: (trackId, clipId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t
      ),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    })),

  deleteSelectedClips: () =>
    set((state) => {
      const selectedIds = new Set(state.selectedClipIds);
      return {
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => !selectedIds.has(c.id)),
        })),
        selectedClipIds: [],
      };
    }),

  duplicateClip: (trackId, clipId) =>
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
    }),

  splitClipAtPlayhead: (trackId, clipId) =>
    set((state) => {
      const { currentTime } = state;
      const track = state.tracks.find((t) => t.id === trackId);
      const clip = track?.clips.find((c) => c.id === clipId);

      if (!clip) return state;

      // Check if playhead is within the clip
      const clipEnd = clip.start + clip.duration;
      if (currentTime <= clip.start || currentTime >= clipEnd) {
        return state; // Playhead not within clip
      }

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

      return {
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
      };
    }),

  moveClip: (fromTrackId, toTrackId, clipId, newStart) =>
    set((state) => {
      const fromTrack = state.tracks.find((t) => t.id === fromTrackId);
      const clip = fromTrack?.clips.find((c) => c.id === clipId);

      if (!clip) return state;

      const movedClip: Clip = {
        ...clip,
        start: Math.max(0, newStart),
      };

      if (fromTrackId === toTrackId) {
        // Moving within same track
        return {
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
        };
      }

      // Moving to different track
      return {
        tracks: state.tracks.map((t) => {
          if (t.id === fromTrackId) {
            return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
          }
          if (t.id === toTrackId) {
            return { ...t, clips: [...t.clips, movedClip] };
          }
          return t;
        }),
      };
    }),

  // Transition actions
  addTransitionToClip: (trackId, clipId, transitionType, position) =>
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
    }),

  updateTransition: (trackId, clipId, position, updates) =>
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
    })),

  removeTransition: (trackId, clipId, position) =>
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
    })),

  // Clip resize actions
  resizeClipStart: (trackId, clipId, newStart, newDuration) =>
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
    })),

  resizeClipEnd: (trackId, clipId, newDuration) =>
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
    })),

  trimClip: (trackId, clipId, trimStart, trimEnd) =>
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
    })),

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
}));