/**
 * Audio Waveform Generation
 *
 * Uses Web Audio API to analyze audio and generate waveform data
 * for visualization in the timeline.
 */

export interface WaveformData {
  samples: Float32Array;
  duration: number;
  sampleRate: number;
}

/**
 * Generate waveform data from an audio/video URL
 *
 * @param url - URL of the audio/video file
 * @param samplesPerSecond - Number of samples per second (default 50)
 * @returns Normalized amplitude data for visualization
 */
export async function generateWaveform(
  url: string,
  samplesPerSecond: number = 50
): Promise<WaveformData> {
  const audioContext = new AudioContext();

  try {
    // Fetch the audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const duration = audioBuffer.duration;
    const totalSamples = Math.ceil(duration * samplesPerSecond);
    const samples = new Float32Array(totalSamples);

    // Get audio channel data (use first channel for stereo)
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / totalSamples);

    // Downsample and normalize
    for (let i = 0; i < totalSamples; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);

      // Find max absolute value in this chunk (RMS would be more accurate but slower)
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }

      samples[i] = max;
    }

    return {
      samples,
      duration,
      sampleRate: samplesPerSecond,
    };
  } finally {
    await audioContext.close();
  }
}

/**
 * Generate waveform from a video element (extracts audio)
 * Useful when the video is already loaded in the browser
 */
export async function generateWaveformFromElement(
  videoElement: HTMLVideoElement,
  samplesPerSecond: number = 50
): Promise<WaveformData | null> {
  // Create audio context and connect video element
  const audioContext = new AudioContext();

  try {
    const source = audioContext.createMediaElementSource(videoElement);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const duration = videoElement.duration;
    const totalSamples = Math.ceil(duration * samplesPerSecond);
    const samples = new Float32Array(totalSamples);

    // For element-based analysis, we'd need to play through the video
    // This is less accurate but faster - return null to use URL-based method
    return null;
  } finally {
    await audioContext.close();
  }
}

/**
 * Serialize waveform data for storage
 */
export function serializeWaveform(data: WaveformData): string {
  return JSON.stringify({
    samples: Array.from(data.samples),
    duration: data.duration,
    sampleRate: data.sampleRate,
  });
}

/**
 * Deserialize waveform data from storage
 */
export function deserializeWaveform(json: string): WaveformData {
  const parsed = JSON.parse(json);
  return {
    samples: new Float32Array(parsed.samples),
    duration: parsed.duration,
    sampleRate: parsed.sampleRate,
  };
}

/**
 * Get samples for a specific time range (for rendering a clip segment)
 */
export function getWaveformSlice(
  data: WaveformData,
  startTime: number,
  endTime: number
): Float32Array {
  const startSample = Math.floor(startTime * data.sampleRate);
  const endSample = Math.ceil(endTime * data.sampleRate);

  return data.samples.slice(
    Math.max(0, startSample),
    Math.min(data.samples.length, endSample)
  );
}
