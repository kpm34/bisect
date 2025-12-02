import { CaptionStyle, Track, TrackType, Transition, TransitionType, ClipTransform, ClipAppearance, ClipPlayback, ClipAudio, ClipCamera } from './types';

export const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#7c3aed',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
};

export const DEFAULT_CAPTION_STYLES: CaptionStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#ffffff',
    animation: 'fade',
  },
  {
    id: 'cascade',
    name: 'Cascade',
    fontFamily: 'Roboto',
    fontSize: 28,
    color: '#fbbf24',
    animation: 'slide_up',
  },
  {
    id: 'guinea',
    name: 'Guinea',
    fontFamily: 'Montserrat',
    fontSize: 32,
    color: '#ffffff',
    backgroundColor: '#7c3aed',
    animation: 'pop',
  },
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    name: 'Main Video',
    type: TrackType.VIDEO,
    clips: [],
    isMuted: false,
    isLocked: false,
  },
  {
    id: 'track-2',
    name: 'Audio',
    type: TrackType.AUDIO,
    clips: [],
    isMuted: false,
    isLocked: false,
  },
  {
    id: 'track-3',
    name: 'Captions',
    type: TrackType.TEXT,
    clips: [],
    isMuted: false,
    isLocked: false,
  },
];

export const SAMPLE_VIDEOS = [
  { name: 'Nature Walk', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { name: 'City Traffic', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
];

// Transition presets organized by category
export const TRANSITION_CATEGORIES = {
  basic: {
    name: 'Basic',
    transitions: [
      { type: TransitionType.CUT, name: 'Cut', icon: '✂️', description: 'Instant cut between clips' },
      { type: TransitionType.FADE, name: 'Fade', icon: '🌑', description: 'Fade to/from black' },
      { type: TransitionType.CROSSFADE, name: 'Cross Fade', icon: '🔀', description: 'Smooth blend between clips' },
      { type: TransitionType.DISSOLVE, name: 'Dissolve', icon: '💨', description: 'Gradual dissolve effect' },
    ],
  },
  motion: {
    name: 'Motion',
    transitions: [
      { type: TransitionType.SLIDE_LEFT, name: 'Slide Left', icon: '⬅️', description: 'Slide from right to left' },
      { type: TransitionType.SLIDE_RIGHT, name: 'Slide Right', icon: '➡️', description: 'Slide from left to right' },
      { type: TransitionType.SLIDE_UP, name: 'Slide Up', icon: '⬆️', description: 'Slide from bottom to top' },
      { type: TransitionType.SLIDE_DOWN, name: 'Slide Down', icon: '⬇️', description: 'Slide from top to bottom' },
      { type: TransitionType.ZOOM_IN, name: 'Zoom In', icon: '🔍', description: 'Zoom into next clip' },
      { type: TransitionType.ZOOM_OUT, name: 'Zoom Out', icon: '🔎', description: 'Zoom out to next clip' },
    ],
  },
  wipe: {
    name: 'Wipe',
    transitions: [
      { type: TransitionType.WIPE_LEFT, name: 'Wipe Left', icon: '◀️', description: 'Wipe reveal from right' },
      { type: TransitionType.WIPE_RIGHT, name: 'Wipe Right', icon: '▶️', description: 'Wipe reveal from left' },
    ],
  },
  stylized: {
    name: 'Stylized',
    transitions: [
      { type: TransitionType.BLUR, name: 'Blur', icon: '🌫️', description: 'Blur transition effect' },
      { type: TransitionType.GLITCH, name: 'Glitch', icon: '📺', description: 'Digital glitch effect' },
      { type: TransitionType.FLASH, name: 'Flash', icon: '⚡', description: 'Bright flash transition' },
      { type: TransitionType.PIXELATE, name: 'Pixelate', icon: '🎮', description: 'Retro pixel effect' },
    ],
  },
};

// Default transition settings
export const DEFAULT_TRANSITION: Omit<Transition, 'id' | 'type' | 'name'> = {
  duration: 0.5,
  easing: 'ease-in-out',
};

// Get all transitions as a flat array
export const ALL_TRANSITIONS = Object.values(TRANSITION_CATEGORIES).flatMap(
  (category) => category.transitions
);

// Default clip transform (centered, 100% scale)
export const DEFAULT_CLIP_TRANSFORM: ClipTransform = {
  x: 960,
  y: 540,
  scaleX: 100,
  scaleY: 100,
  scaleMode: 'uniform',
  anchorX: 0.5,
  anchorY: 0.5,
  rotation: 0,
};

// Default clip appearance
export const DEFAULT_CLIP_APPEARANCE: ClipAppearance = {
  opacity: 100,
  blendMode: 'normal',
};

// Default clip playback
export const DEFAULT_CLIP_PLAYBACK: ClipPlayback = {
  playbackRate: 1,
  reverse: false,
};

// Default clip audio
export const DEFAULT_CLIP_AUDIO: ClipAudio = {
  volume: 100,
  muted: false,
  fadeIn: 0,
  fadeOut: 0,
};

// Layout presets
export const LAYOUT_PRESETS = {
  center: { x: 960, y: 540, scaleX: 100, scaleY: 100 },
  topLeft: { x: 480, y: 270, scaleX: 50, scaleY: 50 },
  topRight: { x: 1440, y: 270, scaleX: 50, scaleY: 50 },
  bottomLeft: { x: 480, y: 810, scaleX: 50, scaleY: 50 },
  bottomRight: { x: 1440, y: 810, scaleX: 50, scaleY: 50 },
  fillScreen: { x: 960, y: 540, scaleX: 100, scaleY: 100 },
};

// Position alignment presets
export const POSITION_ALIGNMENTS = {
  horizontal: {
    left: 0,
    center: 960,
    right: 1920,
  },
  vertical: {
    top: 0,
    center: 540,
    bottom: 1080,
  },
};

// Default clip camera (Ken Burns effect)
export const DEFAULT_CLIP_CAMERA: ClipCamera = {
  enabled: false,
  start: {
    zoom: 100,
    panX: 0,
    panY: 0,
  },
  end: {
    zoom: 100,
    panX: 0,
    panY: 0,
  },
  easing: 'ease-in-out',
  focusX: 0.5,
  focusY: 0.5,
};

// Camera presets (Ken Burns effects)
export const CAMERA_PRESETS = {
  none: {
    name: 'None',
    icon: '⭕',
    start: { zoom: 100, panX: 0, panY: 0 },
    end: { zoom: 100, panX: 0, panY: 0 },
  },
  zoomIn: {
    name: 'Zoom In',
    icon: '🔍',
    start: { zoom: 100, panX: 0, panY: 0 },
    end: { zoom: 130, panX: 0, panY: 0 },
  },
  zoomOut: {
    name: 'Zoom Out',
    icon: '🔎',
    start: { zoom: 130, panX: 0, panY: 0 },
    end: { zoom: 100, panX: 0, panY: 0 },
  },
  panLeft: {
    name: 'Pan Left',
    icon: '⬅️',
    start: { zoom: 120, panX: 20, panY: 0 },
    end: { zoom: 120, panX: -20, panY: 0 },
  },
  panRight: {
    name: 'Pan Right',
    icon: '➡️',
    start: { zoom: 120, panX: -20, panY: 0 },
    end: { zoom: 120, panX: 20, panY: 0 },
  },
  panUp: {
    name: 'Pan Up',
    icon: '⬆️',
    start: { zoom: 120, panX: 0, panY: 20 },
    end: { zoom: 120, panX: 0, panY: -20 },
  },
  panDown: {
    name: 'Pan Down',
    icon: '⬇️',
    start: { zoom: 120, panX: 0, panY: -20 },
    end: { zoom: 120, panX: 0, panY: 20 },
  },
  zoomPanTL: {
    name: 'Zoom to Top-Left',
    icon: '↖️',
    start: { zoom: 100, panX: 0, panY: 0 },
    end: { zoom: 140, panX: -25, panY: -25 },
  },
  zoomPanBR: {
    name: 'Zoom to Bottom-Right',
    icon: '↘️',
    start: { zoom: 100, panX: 0, panY: 0 },
    end: { zoom: 140, panX: 25, panY: 25 },
  },
};