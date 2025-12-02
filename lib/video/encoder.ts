/**
 * Video Encoder - FFmpeg.wasm based video encoding
 *
 * Supports:
 * - MP4 (H.264) encoding
 * - WebM (VP9) encoding
 * - Quality presets: social (720p), hd (1080p), 4k
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Track, Clip } from '@/app/studio/video-studio/types';

export type ExportFormat = 'mp4' | 'webm';
export type ExportQuality = 'social' | 'hd' | '4k';

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  fps?: number;
}

export interface ExportProgress {
  stage: 'loading' | 'processing' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  timeRemaining?: number; // seconds
}

type ProgressCallback = (progress: ExportProgress) => void;

// Quality presets
const QUALITY_PRESETS: Record<ExportQuality, { width: number; height: number; bitrate: string }> = {
  social: { width: 1280, height: 720, bitrate: '2M' },
  hd: { width: 1920, height: 1080, bitrate: '5M' },
  '4k': { width: 3840, height: 2160, bitrate: '20M' },
};

export class VideoEncoder {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private abortController: AbortController | null = null;
  private progressCallback: ProgressCallback | null = null;

  /**
   * Initialize FFmpeg.wasm
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    this.ffmpeg = new FFmpeg();

    // Load FFmpeg core from CDN with SharedArrayBuffer support
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    this.ffmpeg.on('progress', ({ progress, time }) => {
      if (this.progressCallback) {
        this.progressCallback({
          stage: 'encoding',
          progress: Math.round(progress * 100),
          message: `Encoding... ${Math.round(progress * 100)}%`,
          timeRemaining: time > 0 ? Math.round((1 - progress) * time / progress / 1000000) : undefined,
        });
      }
    });

    try {
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to initialize video encoder. Please try again.');
    }
  }

  /**
   * Export a single video clip
   */
  async exportClip(
    clip: Clip,
    options: ExportOptions,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.load();
    }

    this.progressCallback = onProgress || null;
    this.abortController = new AbortController();

    const { format, quality, fps = 30 } = options;
    const preset = QUALITY_PRESETS[quality];

    try {
      onProgress?.({
        stage: 'loading',
        progress: 10,
        message: 'Loading video file...',
      });

      // Fetch the source video
      const videoData = await fetchFile(clip.src);
      await this.ffmpeg!.writeFile('input.mp4', videoData);

      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Processing video...',
      });

      // Build FFmpeg command
      const outputFile = format === 'mp4' ? 'output.mp4' : 'output.webm';
      const args = this.buildFFmpegArgs(format, preset, fps, clip.duration);

      onProgress?.({
        stage: 'encoding',
        progress: 40,
        message: 'Encoding video...',
      });

      await this.ffmpeg!.exec(args);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!',
      });

      // Read output file
      const data = await this.ffmpeg!.readFile(outputFile);
      const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';

      // Cleanup
      await this.ffmpeg!.deleteFile('input.mp4');
      await this.ffmpeg!.deleteFile(outputFile);

      // Convert FileData to Blob - FFmpeg returns Uint8Array for binary files
      if (typeof data === 'string') {
        throw new Error('Unexpected string data from FFmpeg');
      }
      // Create a new Uint8Array to ensure proper ArrayBuffer (not SharedArrayBuffer)
      const uint8Array = new Uint8Array(data);
      return new Blob([uint8Array], { type: mimeType });
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Export failed',
      });
      throw error;
    }
  }

  /**
   * Export timeline with multiple clips (concatenation)
   */
  async exportTimeline(
    tracks: Track[],
    duration: number,
    options: ExportOptions,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.load();
    }

    this.progressCallback = onProgress || null;
    this.abortController = new AbortController();

    const { format, quality, fps = 30 } = options;
    const preset = QUALITY_PRESETS[quality];

    try {
      // Get video clips from video tracks
      const videoClips = tracks
        .filter(t => t.type === 'VIDEO')
        .flatMap(t => t.clips)
        .sort((a, b) => a.start - b.start);

      if (videoClips.length === 0) {
        throw new Error('No video clips to export');
      }

      onProgress?.({
        stage: 'loading',
        progress: 5,
        message: 'Loading video files...',
      });

      // For single clip, export directly
      if (videoClips.length === 1) {
        return this.exportClip(videoClips[0], options, onProgress);
      }

      // For multiple clips, download and concatenate
      const inputFiles: string[] = [];

      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i];
        const inputName = `input_${i}.mp4`;

        onProgress?.({
          stage: 'loading',
          progress: 5 + (20 * (i + 1) / videoClips.length),
          message: `Loading clip ${i + 1} of ${videoClips.length}...`,
        });

        const videoData = await fetchFile(clip.src);
        await this.ffmpeg!.writeFile(inputName, videoData);
        inputFiles.push(inputName);
      }

      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: 'Concatenating clips...',
      });

      // Create concat file
      const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
      await this.ffmpeg!.writeFile('concat.txt', concatContent);

      // Build output args
      const outputFile = format === 'mp4' ? 'output.mp4' : 'output.webm';

      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c:v', format === 'mp4' ? 'libx264' : 'libvpx-vp9',
        '-b:v', preset.bitrate,
        '-vf', `scale=${preset.width}:${preset.height}`,
        '-r', String(fps),
        '-c:a', format === 'mp4' ? 'aac' : 'libopus',
        '-b:a', '128k',
        '-y',
        outputFile,
      ];

      onProgress?.({
        stage: 'encoding',
        progress: 40,
        message: 'Encoding final video...',
      });

      await this.ffmpeg!.exec(args);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!',
      });

      // Read output
      const data = await this.ffmpeg!.readFile(outputFile);
      const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';

      // Cleanup
      for (const file of inputFiles) {
        await this.ffmpeg!.deleteFile(file);
      }
      await this.ffmpeg!.deleteFile('concat.txt');
      await this.ffmpeg!.deleteFile(outputFile);

      // Convert FileData to Blob - FFmpeg returns Uint8Array for binary files
      if (typeof data === 'string') {
        throw new Error('Unexpected string data from FFmpeg');
      }
      // Create a new Uint8Array to ensure proper ArrayBuffer (not SharedArrayBuffer)
      const uint8Array = new Uint8Array(data);
      return new Blob([uint8Array], { type: mimeType });
    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Export failed',
      });
      throw error;
    }
  }

  /**
   * Build FFmpeg arguments for encoding
   */
  private buildFFmpegArgs(
    format: ExportFormat,
    preset: { width: number; height: number; bitrate: string },
    fps: number,
    duration?: number
  ): string[] {
    const outputFile = format === 'mp4' ? 'output.mp4' : 'output.webm';

    const args = [
      '-i', 'input.mp4',
      '-c:v', format === 'mp4' ? 'libx264' : 'libvpx-vp9',
      '-b:v', preset.bitrate,
      '-vf', `scale=${preset.width}:${preset.height}`,
      '-r', String(fps),
      '-c:a', format === 'mp4' ? 'aac' : 'libopus',
      '-b:a', '128k',
    ];

    if (duration) {
      args.push('-t', String(duration));
    }

    args.push('-y', outputFile);

    return args;
  }

  /**
   * Cancel ongoing export
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Cleanup and terminate FFmpeg
   */
  async terminate(): Promise<void> {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.isLoaded = false;
    }
  }
}

// Singleton instance
let encoderInstance: VideoEncoder | null = null;

export function getEncoder(): VideoEncoder {
  if (!encoderInstance) {
    encoderInstance = new VideoEncoder();
  }
  return encoderInstance;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
