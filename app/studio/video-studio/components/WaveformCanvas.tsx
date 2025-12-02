'use client';

import React, { useRef, useEffect, memo } from 'react';

interface WaveformCanvasProps {
  samples: Float32Array | number[];
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

/**
 * Renders audio waveform visualization on a canvas
 * Optimized with memo and efficient canvas rendering
 */
export const WaveformCanvas = memo(function WaveformCanvas({
  samples,
  width,
  height,
  color = '#4ade80', // Green-400
  backgroundColor = 'transparent',
  className = '',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (with device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    if (backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Convert to regular array if needed
    const sampleArray = samples instanceof Float32Array ? Array.from(samples) : samples;

    if (sampleArray.length === 0) return;

    // Calculate bar width based on available space
    const barWidth = Math.max(1, width / sampleArray.length);
    const halfHeight = height / 2;

    // Draw waveform as mirrored bars
    ctx.fillStyle = color;

    for (let i = 0; i < sampleArray.length; i++) {
      const amplitude = sampleArray[i];
      const barHeight = amplitude * halfHeight * 0.9; // 90% of half height max

      const x = i * barWidth;
      const y = halfHeight - barHeight;

      // Draw mirrored bar (top and bottom from center)
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 1), barHeight * 2);
    }
  }, [samples, width, height, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={className}
    />
  );
});

/**
 * Simplified waveform for timeline clips - renders as a bar chart
 */
export const WaveformBars = memo(function WaveformBars({
  samples,
  width,
  height,
  color = 'rgba(74, 222, 128, 0.6)', // Green with transparency
  className = '',
}: Omit<WaveformCanvasProps, 'backgroundColor'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const sampleArray = samples instanceof Float32Array ? Array.from(samples) : samples;

    if (sampleArray.length === 0) return;

    // Calculate how many samples to show based on width
    const samplesPerPixel = Math.ceil(sampleArray.length / width);
    const barCount = Math.min(sampleArray.length, width);

    ctx.fillStyle = color;

    for (let i = 0; i < barCount; i++) {
      // Average samples in this pixel
      const startIdx = Math.floor((i / barCount) * sampleArray.length);
      const endIdx = Math.floor(((i + 1) / barCount) * sampleArray.length);

      let max = 0;
      for (let j = startIdx; j < endIdx; j++) {
        if (sampleArray[j] > max) max = sampleArray[j];
      }

      const barHeight = max * height * 0.95;
      const y = (height - barHeight) / 2;

      ctx.fillRect(i, y, 1, barHeight);
    }
  }, [samples, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`pointer-events-none ${className}`}
    />
  );
});

export default WaveformCanvas;
