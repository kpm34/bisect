'use client';

/**
 * VideoTexturePanel - Apply videos as textures or scene backgrounds
 *
 * Features:
 * - Upload video files
 * - Apply video as material texture on selected object
 * - Set video as scene background
 * - Playback controls (play/pause, loop)
 * - Video from Video Studio integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, Upload, Play, Pause, RotateCcw,
  X, ImageIcon, Layers, Volume2, VolumeX,
  ExternalLink, Trash2, Check
} from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import * as THREE from 'three';

interface VideoItem {
  id: string;
  name: string;
  url: string;
  file?: File;
  thumbnail?: string;
}

interface VideoTexturePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSetBackground?: (videoUrl: string | null) => void;
}

export function VideoTexturePanel({ isOpen, onClose, onSetBackground }: VideoTexturePanelProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState<'texture' | 'background'>('texture');
  const [currentBackgroundVideo, setCurrentBackgroundVideo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoTextureMapRef = useRef<Map<string, THREE.VideoTexture>>(new Map());

  const { selectedObject } = useSelection();

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      videoTextureMapRef.current.forEach((texture) => {
        texture.dispose();
        if (texture.image instanceof HTMLVideoElement) {
          texture.image.pause();
          texture.image.src = '';
        }
      });
      videoTextureMapRef.current.clear();
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('video/')) {
        console.warn('Not a video file:', file.name);
        return;
      }

      const url = URL.createObjectURL(file);
      const id = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileName = file.name;

      // Generate thumbnail
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.muted = true;

      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second for thumbnail
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

          const newVideo: VideoItem = {
            id,
            name: fileName,
            url,
            file,
            thumbnail
          };

          setVideos(prev => [...prev, newVideo]);
        }
        video.remove();
      };
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Create video texture
  const createVideoTexture = useCallback((videoUrl: string): THREE.VideoTexture => {
    // Check if texture already exists
    if (videoTextureMapRef.current.has(videoUrl)) {
      return videoTextureMapRef.current.get(videoUrl)!;
    }

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = isLooping;
    video.muted = isMuted;
    video.playsInline = true;

    if (isPlaying) {
      video.play().catch(console.error);
    }

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;

    videoTextureMapRef.current.set(videoUrl, texture);
    return texture;
  }, [isPlaying, isLooping, isMuted]);

  // Apply video as texture to selected object
  const applyAsTexture = useCallback((video: VideoItem) => {
    if (!selectedObject) {
      console.warn('⚠️ No object selected');
      return;
    }

    const texture = createVideoTexture(video.url);

    selectedObject.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach((mat: any) => {
          // Apply video as map texture
          mat.map = texture;
          mat.needsUpdate = true;
        });
      }
    });

    setSelectedVideoId(video.id);
    console.log(`✅ Applied video "${video.name}" as texture to "${selectedObject.name}"`);
  }, [selectedObject, createVideoTexture]);

  // Set video as background
  const applyAsBackground = useCallback((video: VideoItem) => {
    setCurrentBackgroundVideo(video.url);
    onSetBackground?.(video.url);
    setSelectedVideoId(video.id);
    console.log(`✅ Set video "${video.name}" as scene background`);
  }, [onSetBackground]);

  // Clear background
  const clearBackground = useCallback(() => {
    setCurrentBackgroundVideo(null);
    onSetBackground?.(null);
    setSelectedVideoId(null);
  }, [onSetBackground]);

  // Remove video from library
  const removeVideo = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      // Cleanup texture if exists
      if (videoTextureMapRef.current.has(video.url)) {
        const texture = videoTextureMapRef.current.get(video.url)!;
        texture.dispose();
        if (texture.image instanceof HTMLVideoElement) {
          texture.image.pause();
          texture.image.src = '';
        }
        videoTextureMapRef.current.delete(video.url);
      }

      // Revoke object URL
      URL.revokeObjectURL(video.url);

      setVideos(prev => prev.filter(v => v.id !== videoId));

      if (selectedVideoId === videoId) {
        setSelectedVideoId(null);
      }
    }
  }, [videos, selectedVideoId]);

  // Toggle playback for all video textures
  const togglePlayback = useCallback(() => {
    const newState = !isPlaying;
    setIsPlaying(newState);

    videoTextureMapRef.current.forEach((texture) => {
      const video = texture.image as HTMLVideoElement;
      if (newState) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    });
  }, [isPlaying]);

  // Toggle loop for all video textures
  const toggleLoop = useCallback(() => {
    const newState = !isLooping;
    setIsLooping(newState);

    videoTextureMapRef.current.forEach((texture) => {
      const video = texture.image as HTMLVideoElement;
      video.loop = newState;
    });
  }, [isLooping]);

  // Toggle mute for all video textures
  const toggleMute = useCallback(() => {
    const newState = !isMuted;
    setIsMuted(newState);

    videoTextureMapRef.current.forEach((texture) => {
      const video = texture.image as HTMLVideoElement;
      video.muted = newState;
    });
  }, [isMuted]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[90vw] max-w-[420px] sm:w-[420px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-white">Video Textures</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('texture')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'texture'
                ? 'text-white border-b-2 border-pink-500 bg-zinc-900/50'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4" />
              As Texture
            </div>
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'background'
                ? 'text-white border-b-2 border-pink-500 bg-zinc-900/50'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" />
              As Background
            </div>
          </button>
        </div>

        {/* Playback Controls */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Playback Controls
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayback}
                className={`p-2 rounded-lg transition-colors ${
                  isPlaying ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400'
                }`}
                title={isPlaying ? 'Pause all' : 'Play all'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleLoop}
                className={`p-2 rounded-lg transition-colors ${
                  isLooping ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400'
                }`}
                title={isLooping ? 'Disable loop' : 'Enable loop'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted ? 'bg-zinc-800 text-zinc-400' : 'bg-pink-500/20 text-pink-400'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Selection Status */}
        {activeTab === 'texture' && !selectedObject && (
          <div className="mx-4 mt-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
            <p className="text-sm text-amber-200">
              Select an object in the scene to apply video textures
            </p>
          </div>
        )}

        {activeTab === 'background' && currentBackgroundVideo && (
          <div className="mx-4 mt-4 p-3 bg-pink-900/20 border border-pink-600/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-pink-200">
              Video background active
            </p>
            <button
              onClick={clearBackground}
              className="text-xs text-pink-400 hover:text-pink-300"
            >
              Clear
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-pink-500 hover:bg-pink-500/5 transition-colors text-zinc-400 hover:text-pink-400"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Video</span>
          </button>
        </div>

        {/* Video Studio Link */}
        <div className="px-4 pb-2">
          <a
            href="/studio/video-studio"
            className="flex items-center justify-center gap-2 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white text-sm"
          >
            <Video className="w-4 h-4" />
            <span>Open Video Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No videos uploaded</p>
              <p className="text-zinc-600 text-sm mt-1">
                Upload a video to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video) => {
                const isSelected = selectedVideoId === video.id;

                return (
                  <div
                    key={video.id}
                    className={`relative group rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-zinc-800 relative">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}

                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                      </div>

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVideo(video.id);
                        }}
                        className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    {/* Info & Actions */}
                    <div className="p-3">
                      <h3 className="text-xs font-medium text-white truncate mb-2">
                        {video.name}
                      </h3>
                      <button
                        onClick={() => {
                          if (activeTab === 'texture') {
                            applyAsTexture(video);
                          } else {
                            applyAsBackground(video);
                          }
                        }}
                        disabled={activeTab === 'texture' && !selectedObject}
                        className={`w-full py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          activeTab === 'texture' && !selectedObject
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
                        }`}
                      >
                        {activeTab === 'texture' ? 'Apply as Texture' : 'Set as Background'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 text-center">
            {videos.length} video{videos.length !== 1 ? 's' : ''} • Supports MP4, WebM, MOV
          </p>
        </div>
      </div>
    </>
  );
}

export default VideoTexturePanel;
