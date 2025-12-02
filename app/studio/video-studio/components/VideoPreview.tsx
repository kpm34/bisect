'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from 'lucide-react';
import { useStore } from '../store';
import { TrackType } from '../types';

const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    isPlaying, 
    currentTime, 
    tracks, 
    togglePlay, 
    setTime,
    setDuration 
  } = useStore();

  const [activeCaption, setActiveCaption] = useState<any>(null);

  // Find the active video clip
  const videoTrack = tracks.find(t => t.type === TrackType.VIDEO);
  const currentVideoClip = videoTrack?.clips.find(
    c => currentTime >= c.start && currentTime < c.start + c.duration
  );

  // Find active captions
  useEffect(() => {
    const captionTrack = tracks.find(t => t.type === TrackType.TEXT);
    const caption = captionTrack?.clips.find(
        c => currentTime >= c.start && currentTime < c.start + c.duration
    );
    setActiveCaption(caption);
  }, [currentTime, tracks]);

  // Sync Video Element with Store State
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.log('Playback error', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync Time
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - (currentTime - (currentVideoClip?.start || 0))) > 0.5) {
       // Only seek if significantly different to avoid jitter
       if(currentVideoClip) {
         videoRef.current.currentTime = Math.max(0, currentTime - currentVideoClip.start + currentVideoClip.offset);
       }
    }
  }, [currentTime, currentVideoClip]);

  const handleTimeUpdate = () => {
    if (videoRef.current && isPlaying && currentVideoClip) {
      const newTime = currentVideoClip.start + videoRef.current.currentTime - currentVideoClip.offset;
      setTime(newTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      // In a real app, we'd update the clip duration based on the file
      // setDuration(videoRef.current.duration);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      {/* Aspect Ratio Container */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded overflow-hidden shadow-2xl border border-[#2a2a2a]"
      >
        {currentVideoClip ? (
            <video
            ref={videoRef}
            src={currentVideoClip.src}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col">
                <p>No video clip at this timestamp.</p>
                <p className="text-xs mt-2 text-gray-600">Drag a video from the sidebar to the timeline.</p>
            </div>
        )}

        {/* Caption Overlay */}
        {activeCaption && (
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-12">
                <div
                    className={`px-4 py-2 rounded text-center transition-all duration-300 ${
                        activeCaption.style?.animation === 'pop' ? 'scale-100 animate-bounce' :
                        activeCaption.style?.animation === 'slide_up' ? 'translate-y-0 opacity-100' : ''
                    }`}
                    style={{
                        fontFamily: activeCaption.style?.fontFamily || 'Inter',
                        fontSize: `${activeCaption.style?.fontSize || 24}px`,
                        color: activeCaption.style?.color || 'white',
                        backgroundColor: activeCaption.style?.backgroundColor || 'rgba(0,0,0,0.5)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                >
                    {activeCaption.content}
                </div>
            </div>
        )}

        {/* Floating Controls Overlay (visible on hover) */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
           <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white">{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
              <div className="flex items-center space-x-4">
                  <SkipBack className="w-5 h-5 text-white cursor-pointer hover:text-gray-300" onClick={() => setTime(Math.max(0, currentTime - 5))} />
                  <button onClick={togglePlay} className="p-2 bg-white rounded-full text-black hover:bg-gray-200 transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  <SkipForward className="w-5 h-5 text-white cursor-pointer hover:text-gray-300" onClick={() => setTime(currentTime + 5)} />
              </div>
              <div className="flex items-center space-x-2">
                 <Volume2 className="w-5 h-5 text-white" />
                 <Maximize className="w-5 h-5 text-white cursor-pointer" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;