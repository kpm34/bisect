'use client';

/**
 * AudioMixerPanel Component
 *
 * Professional audio mixing panel with volume, pan, EQ, and solo/mute controls
 * for each track in the video editor.
 */

import React from 'react';
import { useStore } from '../store';
import { TrackType } from '../types';
import { Volume2, VolumeX, Headphones, RotateCcw } from 'lucide-react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  vertical?: boolean;
  showValue?: boolean;
  unit?: string;
  className?: string;
}

const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  onChange,
  label,
  vertical = false,
  showValue = true,
  unit = '',
  className = '',
}) => {
  return (
    <div className={`flex ${vertical ? 'flex-col items-center' : 'items-center gap-2'} ${className}`}>
      {!vertical && <span className="text-[10px] text-gray-500 w-8">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`accent-blue-500 ${vertical ? 'h-20 w-1' : 'flex-1'}`}
        style={vertical ? { writingMode: 'vertical-lr', direction: 'rtl' } : {}}
        title={label}
      />
      {showValue && (
        <span className="text-[10px] text-gray-400 w-10 text-right">
          {value}{unit}
        </span>
      )}
    </div>
  );
};

interface TrackMixerProps {
  trackId: string;
  trackName: string;
  trackType: TrackType;
}

const TrackMixer: React.FC<TrackMixerProps> = ({ trackId, trackName, trackType }) => {
  const { mixerTracks, updateMixerTrack, soloTrack } = useStore();

  // Get or create mixer track
  const mixerTrack = mixerTracks.find((t) => t.trackId === trackId) || {
    trackId,
    volume: 100,
    pan: 0,
    muted: false,
    solo: false,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
  };

  const trackColor = trackType === TrackType.VIDEO
    ? 'bg-blue-500'
    : trackType === TrackType.AUDIO
    ? 'bg-green-500'
    : 'bg-purple-500';

  // Check if any track is soloed (other than this one)
  const anySoloed = mixerTracks.some((t) => t.solo);
  const isMutedByOtherSolo = anySoloed && !mixerTrack.solo;

  return (
    <div className={`flex flex-col gap-2 p-2 bg-[#1a1a1a] rounded-lg min-w-[80px] ${
      isMutedByOtherSolo ? 'opacity-50' : ''
    }`}>
      {/* Track Name */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${trackColor}`} />
        <span className="text-[10px] text-gray-300 truncate max-w-[60px]">{trackName}</span>
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1">
        <Slider
          value={mixerTrack.volume}
          min={0}
          max={200}
          onChange={(v) => updateMixerTrack(trackId, { volume: v })}
          label="Vol"
          vertical
          showValue={false}
        />
        <span className="text-[9px] text-gray-500">{mixerTrack.volume}%</span>
      </div>

      {/* Pan Knob */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full text-[8px] text-gray-600">
          <span>L</span>
          <span>R</span>
        </div>
        <Slider
          value={mixerTrack.pan}
          min={-100}
          max={100}
          onChange={(v) => updateMixerTrack(trackId, { pan: v })}
          label="Pan"
          showValue={false}
          className="w-full"
        />
        <span className="text-[9px] text-gray-500">
          {mixerTrack.pan === 0 ? 'C' : mixerTrack.pan < 0 ? `L${Math.abs(mixerTrack.pan)}` : `R${mixerTrack.pan}`}
        </span>
      </div>

      {/* EQ (Simplified 3-band) */}
      <div className="flex flex-col gap-1">
        <span className="text-[8px] text-gray-600 text-center">EQ</span>
        <div className="flex gap-1">
          <div className="flex flex-col items-center">
            <input
              type="range"
              min={-12}
              max={12}
              value={mixerTrack.eqLow}
              onChange={(e) => updateMixerTrack(trackId, { eqLow: Number(e.target.value) })}
              className="w-1 h-8 accent-orange-500"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              title="Low EQ"
            />
            <span className="text-[8px] text-gray-600">L</span>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="range"
              min={-12}
              max={12}
              value={mixerTrack.eqMid}
              onChange={(e) => updateMixerTrack(trackId, { eqMid: Number(e.target.value) })}
              className="w-1 h-8 accent-yellow-500"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              title="Mid EQ"
            />
            <span className="text-[8px] text-gray-600">M</span>
          </div>
          <div className="flex flex-col items-center">
            <input
              type="range"
              min={-12}
              max={12}
              value={mixerTrack.eqHigh}
              onChange={(e) => updateMixerTrack(trackId, { eqHigh: Number(e.target.value) })}
              className="w-1 h-8 accent-cyan-500"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              title="High EQ"
            />
            <span className="text-[8px] text-gray-600">H</span>
          </div>
        </div>
      </div>

      {/* Mute / Solo Buttons */}
      <div className="flex gap-1 justify-center">
        <button
          className={`p-1 rounded text-[10px] ${
            mixerTrack.muted ? 'bg-red-500/30 text-red-400' : 'bg-[#2a2a2a] text-gray-500 hover:text-white'
          }`}
          onClick={() => updateMixerTrack(trackId, { muted: !mixerTrack.muted })}
          title="Mute"
        >
          {mixerTrack.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
        <button
          className={`p-1 rounded text-[10px] ${
            mixerTrack.solo ? 'bg-yellow-500/30 text-yellow-400' : 'bg-[#2a2a2a] text-gray-500 hover:text-white'
          }`}
          onClick={() => soloTrack(trackId)}
          title="Solo"
        >
          <Headphones className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const AudioMixerPanel: React.FC = () => {
  const { tracks, masterVolume, setMasterVolume, resetMixer, unsoloAllTracks } = useStore();

  // Filter to audio and video tracks (tracks with potential audio)
  const audioTracks = tracks.filter((t) => t.type === TrackType.AUDIO || t.type === TrackType.VIDEO);

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-gray-300">Audio Mixer</h3>
        <div className="flex gap-1">
          <button
            className="p-1 rounded bg-[#2a2a2a] text-gray-500 hover:text-white text-[10px]"
            onClick={unsoloAllTracks}
            title="Unsolo All"
          >
            Unsolo
          </button>
          <button
            className="p-1 rounded bg-[#2a2a2a] text-gray-500 hover:text-white"
            onClick={resetMixer}
            title="Reset Mixer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {/* Individual Track Mixers */}
        {audioTracks.map((track) => (
          <TrackMixer
            key={track.id}
            trackId={track.id}
            trackName={track.name}
            trackType={track.type}
          />
        ))}

        {/* Master Fader */}
        <div className="flex flex-col gap-2 p-2 bg-[#1a1a1a] rounded-lg min-w-[80px] border-l-2 border-yellow-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-yellow-400 font-medium">Master</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Slider
              value={masterVolume}
              min={0}
              max={200}
              onChange={setMasterVolume}
              label="Master"
              vertical
              showValue={false}
            />
            <span className="text-[9px] text-yellow-400">{masterVolume}%</span>
          </div>

          {/* VU Meter Placeholder */}
          <div className="flex gap-0.5 h-16 items-end justify-center">
            {[0.3, 0.5, 0.7, 0.6, 0.8, 0.4].map((level, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-sm"
                style={{ height: `${level * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {audioTracks.length === 0 && (
        <div className="text-center text-gray-500 text-xs py-4">
          No audio or video tracks to mix
        </div>
      )}
    </div>
  );
};

export default AudioMixerPanel;
