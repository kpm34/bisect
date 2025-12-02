'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Undo, Redo, Download, Settings, Video, ArrowLeft, Cuboid, Save } from 'lucide-react';

const Header: React.FC = () => {
  const router = useRouter();

  const handleSaveAsAsset = () => {
    // TODO: Implement save to asset library
    console.log('Save as asset clicked');
  };

  return (
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
        <button className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors" title="Undo">
          <Undo className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors" title="Redo">
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
          onClick={handleSaveAsAsset}
          className="flex items-center px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors text-sm"
          title="Save to Asset Library"
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Asset
        </button>

        <button className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        <button className="flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </header>
  );
};

export default Header;
