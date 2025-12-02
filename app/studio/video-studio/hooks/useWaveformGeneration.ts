'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { TrackType } from '../types';
import { generateWaveform } from '@/lib/video/waveform';

/**
 * Hook that automatically generates waveforms for audio/video clips
 * that don't have waveform data yet.
 */
export function useWaveformGeneration() {
  const tracks = useStore((state) => state.tracks);
  const setClipWaveform = useStore((state) => state.setClipWaveform);
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Find clips that need waveform generation
    const clipsToProcess: { trackId: string; clipId: string; src: string }[] = [];

    for (const track of tracks) {
      // Only process video and audio tracks
      if (track.type !== TrackType.VIDEO && track.type !== TrackType.AUDIO) {
        continue;
      }

      for (const clip of track.clips) {
        // Skip if already has waveform or no source
        if (clip.waveformData || !clip.src) {
          continue;
        }

        // Skip if already processing
        if (processingRef.current.has(clip.id)) {
          continue;
        }

        clipsToProcess.push({
          trackId: track.id,
          clipId: clip.id,
          src: clip.src,
        });
      }
    }

    // Process each clip
    for (const { trackId, clipId, src } of clipsToProcess) {
      processingRef.current.add(clipId);

      generateWaveform(src, 50)
        .then((data) => {
          // Convert Float32Array to regular array for storage
          const samples = Array.from(data.samples);
          setClipWaveform(trackId, clipId, samples);
        })
        .catch((error) => {
          console.warn(`Failed to generate waveform for clip ${clipId}:`, error);
        })
        .finally(() => {
          processingRef.current.delete(clipId);
        });
    }
  }, [tracks, setClipWaveform]);
}
