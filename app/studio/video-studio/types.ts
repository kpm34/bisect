export enum TrackType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  EFFECT = 'EFFECT'
}

export enum TransitionType {
  CUT = 'cut',
  FADE = 'fade',
  CROSSFADE = 'crossfade',
  BLUR = 'blur',
  GLITCH = 'glitch',
  SLIDE_LEFT = 'slide_left',
  SLIDE_RIGHT = 'slide_right',
  SLIDE_UP = 'slide_up',
  SLIDE_DOWN = 'slide_down',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  WIPE_LEFT = 'wipe_left',
  WIPE_RIGHT = 'wipe_right',
  DISSOLVE = 'dissolve',
  FLASH = 'flash',
  PIXELATE = 'pixelate'
}

export interface Transition {
  id: string;
  type: TransitionType;
  name: string;
  duration: number; // Duration in seconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  // Applied between clips - references the clip it's attached to (as out-transition)
  clipId?: string;
}

export interface ClipTransform {
  // Position
  x: number; // X position (0-1920 default center 960)
  y: number; // Y position (0-1080 default center 540)
  // Scale
  scaleX: number; // Scale X (0-200%, default 100)
  scaleY: number; // Scale Y (0-200%, default 100)
  scaleMode: 'uniform' | 'free'; // Lock aspect ratio or free scale
  // Anchor point
  anchorX: number; // 0-1 (0=left, 0.5=center, 1=right)
  anchorY: number; // 0-1 (0=top, 0.5=center, 1=bottom)
  // Rotation
  rotation: number; // Degrees (-360 to 360)
}

export interface ClipAppearance {
  opacity: number; // 0-100%
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
}

export interface ClipPlayback {
  playbackRate: number; // 0.25x to 4x
  reverse: boolean;
}

export interface ClipAudio {
  volume: number; // 0-200%
  muted: boolean;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export interface CameraKeyframe {
  zoom: number; // 100 = 100% (1x), 200 = 200% (2x zoom in)
  panX: number; // -100 to 100 (percentage from center)
  panY: number; // -100 to 100 (percentage from center)
}

export interface ClipCamera {
  enabled: boolean;
  // Start keyframe (at clip start)
  start: CameraKeyframe;
  // End keyframe (at clip end)
  end: CameraKeyframe;
  // Easing for the animation
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  // Focus point (0-1 for both x and y)
  focusX: number;
  focusY: number;
}

export interface Clip {
  id: string;
  name: string;
  start: number; // Start time in timeline (seconds)
  duration: number; // Duration of clip (seconds)
  offset: number; // Start time within the source media (seconds)
  type: TrackType;
  src?: string; // URL for media
  content?: string; // Text content for captions
  style?: CaptionStyle;
  // Transitions
  transitionIn?: Transition; // Transition at the start of this clip
  transitionOut?: Transition; // Transition at the end of this clip
  // Transform properties
  transform?: ClipTransform;
  // Appearance
  appearance?: ClipAppearance;
  // Playback
  playback?: ClipPlayback;
  // Audio
  audio?: ClipAudio;
  // Camera (Ken Burns effect)
  camera?: ClipCamera;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted: boolean;
  isLocked: boolean;
}

export interface ProjectState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  tracks: Track[];
  selectedClipIds: string[]; // Support multi-selection
  zoomLevel: number; // px per second
}

export interface CaptionStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  animation?: 'fade' | 'pop' | 'slide_up' | 'typewriter' | 'none';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface AIState {
  messages: ChatMessage[];
  isGenerating: boolean;
}