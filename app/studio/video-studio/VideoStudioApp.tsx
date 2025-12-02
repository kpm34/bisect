'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import VideoPreview from './components/VideoPreview';
import Timeline from './components/Timeline';
import { useWaveformGeneration } from './hooks/useWaveformGeneration';

// Resize handle component
const ResizeHandle: React.FC<{
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}> = ({ direction, onResize, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
  }, [direction]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      className={`
        ${direction === 'horizontal' ? 'w-2 cursor-col-resize group' : 'h-2 cursor-row-resize group'}
        ${isDragging ? 'bg-blue-500' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'}
        transition-colors flex-shrink-0 z-10 relative
        ${className}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator line */}
      <div className={`
        absolute
        ${direction === 'horizontal'
          ? 'w-0.5 h-8 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'h-0.5 w-8 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}
        ${isDragging ? 'bg-blue-400' : 'bg-[#3a3a3a] group-hover:bg-[#4a4a4a]'}
        rounded-full transition-colors
      `} />
      {/* Grip dots */}
      <div className={`
        absolute flex gap-0.5
        ${direction === 'horizontal'
          ? 'flex-col left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'flex-row left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}
      `}>
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-300' : 'bg-[#4a4a4a] group-hover:bg-[#5a5a5a]'}`} />
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-300' : 'bg-[#4a4a4a] group-hover:bg-[#5a5a5a]'}`} />
        <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-300' : 'bg-[#4a4a4a] group-hover:bg-[#5a5a5a]'}`} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Auto-generate waveforms for audio/video clips
  useWaveformGeneration();

  // Resizable panel sizes
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [timelineHeight, setTimelineHeight] = useState(280);

  // Min/max constraints
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 500;
  const MIN_TIMELINE_HEIGHT = 150;
  const MAX_TIMELINE_HEIGHT = 500;

  const handleLeftSidebarResize = useCallback((delta: number) => {
    setLeftSidebarWidth(prev => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, prev + delta)));
  }, []);

  const handleRightSidebarResize = useCallback((delta: number) => {
    setRightSidebarWidth(prev => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, prev - delta)));
  }, []);

  const handleTimelineResize = useCallback((delta: number) => {
    setTimelineHeight(prev => Math.min(MAX_TIMELINE_HEIGHT, Math.max(MIN_TIMELINE_HEIGHT, prev - delta)));
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden select-none">
      {/* Header */}
      <Header />

      {/* Main Workspace - Upper Section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Assets & Tools */}
        {leftSidebarOpen && (
          <>
            <div
              className="flex-shrink-0 border-r border-[#2a2a2a] bg-[#141414] overflow-hidden"
              style={{ width: leftSidebarWidth }}
            >
              <LeftSidebar />
            </div>
            <ResizeHandle
              direction="horizontal"
              onResize={handleLeftSidebarResize}
            />
          </>
        )}

        {/* Center: Video Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-[#0a0a0a] relative flex items-center justify-center p-4">
            <VideoPreview />
          </div>
        </div>

        {/* Right Sidebar: AI & Properties */}
        {rightSidebarOpen && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={handleRightSidebarResize}
            />
            <div
              className="flex-shrink-0 border-l border-[#2a2a2a] bg-[#141414] overflow-hidden"
              style={{ width: rightSidebarWidth }}
            >
              <RightSidebar />
            </div>
          </>
        )}
      </div>

      {/* Timeline Resize Handle */}
      <ResizeHandle
        direction="vertical"
        onResize={handleTimelineResize}
        className="border-t border-[#2a2a2a]"
      />

      {/* Bottom: Timeline - Full Width */}
      <div
        className="flex-shrink-0 border-t border-[#2a2a2a] bg-[#141414] overflow-hidden"
        style={{ height: timelineHeight }}
      >
        <Timeline />
      </div>
    </div>
  );
};

export default App;