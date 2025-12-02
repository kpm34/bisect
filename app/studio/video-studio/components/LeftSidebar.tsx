'use client';

import React, { useState, useRef } from 'react';
import { LayoutTemplate, Type, Box, Image as ImageIcon, Wand2, Search, Upload, Music, Video } from 'lucide-react';
import { SAMPLE_VIDEOS, SAMPLE_IMAGES, DEFAULT_CAPTION_STYLES } from '../constants';
import { useStore } from '../store';
import { TrackType } from '../types';
import TransitionPanel from './TransitionPanel';

// Simple uuid generator since we can't easily add deps
const generateId = () => Math.random().toString(36).substring(2, 9);

const TABS = [
  { id: 'media', icon: ImageIcon, label: 'Media' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'elements', icon: Box, label: 'Elements' },
  { id: 'effects', icon: Wand2, label: 'Effects' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
];

const LeftSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('media');
  const [userMedia, setUserMedia] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addClip = useStore((state) => state.addClip);
  const tracks = useStore((state) => state.tracks);

  const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
  };

  // Helper to add to first compatible track
  const handleAddToTimeline = (item: any, type: TrackType) => {
    const track = tracks.find(t => t.type === type);
    if (track) {
      addClip(track.id, {
        id: generateId(),
        name: item.name,
        start: 0, // Should find first empty slot ideally
        duration: 10, // Default duration
        offset: 0,
        type: type,
        src: item.url,
        content: item.content,
        style: item.style
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isAudio = file.type.startsWith('audio');
      const type = isAudio ? TrackType.AUDIO : TrackType.VIDEO;
      
      const newMedia = {
        name: file.name,
        url,
        type
      };
      
      setUserMedia(prev => [newMedia, ...prev]);
      
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return (
          <div className="p-3 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search media..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Upload Area */}
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="video/*,audio/*,image/*"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 border border-dashed border-[#2a2a2a] rounded-lg text-gray-500 hover:text-white hover:border-gray-500 hover:bg-[#1a1a1a] transition-all flex flex-col items-center justify-center group"
                >
                    <div className="p-2 bg-[#1a1a1a] rounded-full mb-2 group-hover:bg-[#2a2a2a] transition-colors">
                        <Upload className="w-4 h-4 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-medium">Upload Media</span>
                    <span className="text-[10px] mt-1 text-gray-600">Supports Video & Audio</span>
                </button>
            </div>
            
            {/* User Uploads */}
            {userMedia.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Your Uploads</span>
                        <span className="text-[10px] bg-[#2a2a2a] px-1.5 rounded text-gray-300">{userMedia.length}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {userMedia.map((media, idx) => (
                        <div
                            key={idx}
                            className="group relative aspect-video bg-[#0a0a0a] rounded overflow-hidden cursor-pointer border border-[#2a2a2a] hover:border-gray-500 transition-all"
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...media })}
                            onClick={() => handleAddToTimeline(media, media.type)}
                        >
                            {media.type === TrackType.VIDEO ? (
                                <video src={media.url} className="w-full h-full object-cover" muted />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-gray-500">
                                    <Music className="w-8 h-8 mb-1 opacity-50" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded">+ Add</span>
                            </div>

                            <div className="absolute top-1 left-1 max-w-[90%]">
                                <p className="text-[10px] text-white bg-black/70 px-1 rounded truncate">{media.name}</p>
                            </div>

                            <div className="absolute bottom-1 right-1">
                                {media.type === TrackType.VIDEO ? (
                                    <Video className="w-3 h-3 text-white drop-shadow-md" />
                                ) : (
                                    <Music className="w-3 h-3 text-white drop-shadow-md" />
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Videos */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stock Videos</label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_VIDEOS.map((video, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video bg-[#0a0a0a] rounded overflow-hidden cursor-pointer border border-[#2a2a2a] hover:border-gray-500 transition-all"
                    draggable
                    onDragStart={(e) => handleDragStart(e, { ...video, type: TrackType.VIDEO })}
                    onClick={() => handleAddToTimeline(video, TrackType.VIDEO)}
                  >
                    <video src={video.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded">+ Add</span>
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <p className="text-[10px] text-white bg-black/70 px-1 rounded truncate">{video.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Images */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stock Images</label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_IMAGES.map((image, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video bg-[#0a0a0a] rounded overflow-hidden cursor-pointer border border-[#2a2a2a] hover:border-gray-500 transition-all"
                    draggable
                    onDragStart={(e) => handleDragStart(e, { ...image, type: TrackType.VIDEO })}
                    onClick={() => handleAddToTimeline(image, TrackType.VIDEO)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-white bg-gray-700 px-2 py-1 rounded">+ Add</span>
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <p className="text-[10px] text-white bg-black/70 px-1 rounded truncate">{image.name}</p>
                    </div>
                    <div className="absolute top-1 right-1">
                      <span className="text-[9px] text-white/70 bg-black/50 px-1 rounded">{image.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[#94a3b8]">Caption Styles</h3>
                <div className="space-y-3">
                    {DEFAULT_CAPTION_STYLES.map(style => (
                        <div 
                            key={style.id}
                            className="p-3 bg-[#0f172a] border border-[#334155] rounded-md cursor-pointer hover:border-[#7c3aed] transition-colors"
                            onClick={() => handleAddToTimeline({ 
                                name: 'New Caption', 
                                content: 'Double click to edit', 
                                style 
                            }, TrackType.TEXT)}
                        >
                            <div 
                                style={{ 
                                    fontFamily: style.fontFamily, 
                                    color: style.color, 
                                    fontSize: '16px' // scaled down for preview
                                }}
                                className="text-center"
                            >
                                {style.name} Style
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'effects':
        return <TransitionPanel />;
      default:
        return (
            <div className="p-8 text-center text-[#94a3b8]">
                <p>Coming soon...</p>
            </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Icon Rail */}
      <div className="w-14 flex flex-col items-center py-4 space-y-4 border-r border-[#2a2a2a] bg-[#0a0a0a]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 group ${
              activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className={`w-5 h-5 p-0.5 rounded ${activeTab === tab.id ? 'bg-[#2a2a2a]' : ''}`} />
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#141414]">
        {renderContent()}
      </div>
    </div>
  );
};

export default LeftSidebar;