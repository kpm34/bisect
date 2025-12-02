'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Undo, Redo, Download, Settings, Video, ArrowLeft, Cuboid, Save } from 'lucide-react';
import { SaveVideoAssetModal, VideoAssetMetadata } from './SaveVideoAssetModal';
import { ExportModal } from './ExportModal';
import { uploadAsset } from '@/lib/services/supabase/storage';
import { useStore } from '../store';

const Header: React.FC = () => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { tracks, duration, undo, redo, canUndo, canRedo, past, future } = useStore();

  // Track history state for button enabling
  const hasUndo = past.length > 0;
  const hasRedo = future.length > 0;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (hasUndo) undo();
      }
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (hasRedo) redo();
      }
      // Cmd/Ctrl + Y = Redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (hasRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUndo, hasRedo, undo, redo]);

  const handleSaveAsAsset = async (name: string, tags: string[], metadata: VideoAssetMetadata) => {
    // For now, we'll save the project data as JSON
    // In a full implementation, this would export actual video
    const projectData = {
      name,
      duration: metadata.duration,
      clipCount: metadata.clipCount,
      trackCount: metadata.tracks,
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        type: track.type,
        clips: track.clips.map(clip => ({
          id: clip.id,
          name: clip.name,
          start: clip.start,
          duration: clip.duration,
          src: clip.src,
          type: clip.type,
        })),
      })),
      createdAt: new Date().toISOString(),
    };

    // Create a blob from the project data
    const projectBlob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });

    // Upload to Supabase
    const result = await uploadAsset({
      name,
      category: 'video',
      file: projectBlob,
      data: {
        duration: metadata.duration,
        clipCount: metadata.clipCount,
        trackCount: metadata.tracks,
        projectType: 'video-studio-project',
      },
      tags,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to save asset');
    }
  };

  return (
    <>
      <header className="h-12 border-b border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between px-4">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center space-x-4">
          {/* Back to Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-5 w-px bg-[#2a2a2a]" />

          {/* Studio Title */}
          <div className="flex items-center text-white font-semibold text-lg">
            <Video className="w-5 h-5 mr-2 text-orange-500" />
            <span>Video Studio</span>
          </div>

          <div className="h-5 w-px bg-[#2a2a2a]" />

          {/* Project Name */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer transition-colors">
              Untitled Project
            </span>
            <span className="text-[10px] text-gray-500">Auto-saved</span>
          </div>
        </div>

        {/* Center: Edit Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={undo}
            disabled={!hasUndo}
            className={`p-2 rounded transition-colors ${
              hasUndo
                ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title={`Undo${hasUndo ? ' (Cmd+Z)' : ''}`}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!hasRedo}
            className={`p-2 rounded transition-colors ${
              hasRedo
                ? 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title={`Redo${hasRedo ? ' (Cmd+Shift+Z)' : ''}`}
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-[#2a2a2a] mx-2" />

          {/* Quick link to 3D Editor */}
          <Link
            href="/studio/3d-canvas"
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors text-sm"
            title="Open 3D Editor"
          >
            <Cuboid className="w-4 h-4" />
            <span>3D Editor</span>
          </Link>
        </div>

        {/* Right: Save & Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors text-sm"
            title="Save to Asset Library"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Asset
          </button>

          <button className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </header>

      <SaveVideoAssetModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveAsAsset}
        defaultName="Untitled Project"
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};

export default Header;
