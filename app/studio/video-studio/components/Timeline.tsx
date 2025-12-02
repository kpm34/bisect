'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store';
import { TrackType, Track, TransitionType } from '../types';
import {
  ZoomIn, ZoomOut, Scissors, Trash2, Copy, Plus,
  Lock, Unlock, Volume2, VolumeX, MoreVertical, X,
  ArrowRightLeft, Layers, ChevronsLeftRight, SkipBack, SkipForward
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ALL_TRANSITIONS } from '../constants';

const RULER_HEIGHT = 24;
const TRACK_HEIGHT = 60;
const LEFT_GUTTER = 140; // Width of track headers (increased for controls)
const RESIZE_HANDLE_WIDTH = 8; // Width of resize handles in pixels

const Timeline: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<{
    clipId: string;
    trackId: string;
    startX: number;
    originalStart: number;
  } | null>(null);
  const [resizingClip, setResizingClip] = useState<{
    clipId: string;
    trackId: string;
    edge: 'start' | 'end';
    startX: number;
    originalStart: number;
    originalDuration: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    clipId: string;
    trackId: string;
  } | null>(null);
  const [transitionDropZone, setTransitionDropZone] = useState<{
    clipId: string;
    trackId: string;
    position: 'in' | 'out';
  } | null>(null);

  const {
    tracks,
    duration,
    currentTime,
    zoomLevel,
    selectedClipIds,
    setTime,
    setZoomLevel,
    selectClip,
    clearSelection,
    deleteSelectedClips,
    deleteClip,
    duplicateClip,
    splitClipAtPlayhead,
    moveClip,
    addTrack,
    removeTrack,
    updateTrack,
    addTransitionToClip,
    removeTransition,
    resizeClipStart,
    resizeClipEnd,
    trimClip,
  } = useStore();

  // Convert time to pixels
  const timeToPx = (time: number) => time * zoomLevel;
  const pxToTime = (px: number) => px / zoomLevel;

  // Handle timeline background click (for scrubbing and deselection)
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks directly on the timeline background
    if ((e.target as HTMLElement).closest('.clip-element')) {
      return;
    }

    // Deselect all clips
    clearSelection();
    setContextMenu(null);

    // Basic scrubbing
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const newTime = pxToTime(Math.max(0, clickX));
    setTime(newTime);
  };

  // Handle clip click for selection
  const handleClipClick = (e: React.MouseEvent, clipId: string, trackId: string) => {
    e.stopPropagation();
    setContextMenu(null);
    const multiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    selectClip(clipId, multiSelect);
  };

  // Handle clip right-click for context menu
  const handleClipContextMenu = (e: React.MouseEvent, clipId: string, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Select the clip if not already selected
    if (!selectedClipIds.includes(clipId)) {
      selectClip(clipId, false);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      clipId,
      trackId,
    });
  };

  // Handle clip drag start
  const handleClipDragStart = (e: React.MouseEvent, clipId: string, trackId: string, clipStart: number) => {
    if (e.button !== 0) return; // Only left click
    if (resizingClip) return; // Don't start drag if resizing
    e.stopPropagation();

    // Select the clip if not selected
    if (!selectedClipIds.includes(clipId)) {
      selectClip(clipId, false);
    }

    setDraggingClip({
      clipId,
      trackId,
      startX: e.clientX,
      originalStart: clipStart,
    });
  };

  // Handle resize start
  const handleResizeStart = (
    e: React.MouseEvent,
    clipId: string,
    trackId: string,
    edge: 'start' | 'end',
    clipStart: number,
    clipDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Select the clip if not selected
    if (!selectedClipIds.includes(clipId)) {
      selectClip(clipId, false);
    }

    setResizingClip({
      clipId,
      trackId,
      edge,
      startX: e.clientX,
      originalStart: clipStart,
      originalDuration: clipDuration,
    });
  };

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingClip) {
      const deltaX = e.clientX - draggingClip.startX;
      const deltaTime = pxToTime(deltaX);
      const newStart = Math.max(0, draggingClip.originalStart + deltaTime);
      moveClip(draggingClip.trackId, draggingClip.trackId, draggingClip.clipId, newStart);
    }
  }, [draggingClip, moveClip, pxToTime]);

  // Handle mouse move during resize
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingClip) return;

    const deltaX = e.clientX - resizingClip.startX;
    const deltaTime = pxToTime(deltaX);

    if (resizingClip.edge === 'start') {
      // Resizing from start: move start point and adjust duration
      const newStart = Math.max(0, resizingClip.originalStart + deltaTime);
      const newDuration = resizingClip.originalDuration - deltaTime;

      if (newDuration >= 0.1) { // Minimum duration
        resizeClipStart(resizingClip.trackId, resizingClip.clipId, newStart, newDuration);
      }
    } else {
      // Resizing from end: just adjust duration
      const newDuration = Math.max(0.1, resizingClip.originalDuration + deltaTime);
      resizeClipEnd(resizingClip.trackId, resizingClip.clipId, newDuration);
    }
  }, [resizingClip, pxToTime, resizeClipStart, resizeClipEnd]);

  // Handle mouse up to end drag or resize
  const handleMouseUp = useCallback(() => {
    setDraggingClip(null);
    setResizingClip(null);
  }, []);

  // Attach mouse listeners for dragging
  useEffect(() => {
    if (draggingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip, handleMouseMove, handleMouseUp]);

  // Attach mouse listeners for resizing
  useEffect(() => {
    if (resizingClip) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingClip, handleResizeMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected clips
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipIds.length > 0) {
        e.preventDefault();
        deleteSelectedClips();
      }
      // Select all (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        useStore.getState().selectAllClips();
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        clearSelection();
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipIds, deleteSelectedClips, clearSelection]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel(zoomLevel * delta);
    }
  };

  // Add new track
  const handleAddTrack = (type: TrackType) => {
    const newTrack: Track = {
      id: uuidv4(),
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} Track`,
      type,
      clips: [],
      isMuted: false,
      isLocked: false,
    };
    addTrack(newTrack);
  };

  // Get clip at playhead for split
  const getClipAtPlayhead = () => {
    for (const track of tracks) {
      for (const clip of track.clips) {
        if (currentTime > clip.start && currentTime < clip.start + clip.duration) {
          return { trackId: track.id, clipId: clip.id };
        }
      }
    }
    return null;
  };

  // Handle split at playhead
  const handleSplit = () => {
    const clipAtPlayhead = getClipAtPlayhead();
    if (clipAtPlayhead) {
      splitClipAtPlayhead(clipAtPlayhead.trackId, clipAtPlayhead.clipId);
    }
  };

  return (
    <div className="flex flex-col h-full select-none" onWheel={handleWheel}>
      {/* Timeline Controls */}
      <div className="h-9 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-4">
        <div className="flex items-center space-x-4 text-gray-400 text-sm">
          <span className="font-mono text-xs">{new Date(currentTime * 1000).toISOString().substr(14, 8)}</span>
          {selectedClipIds.length > 0 && (
            <span className="text-[10px] bg-[#2a2a2a] text-gray-300 px-2 py-0.5 rounded">
              {selectedClipIds.length} clip{selectedClipIds.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-1 hover:text-white text-gray-500"
            onClick={() => setZoomLevel(zoomLevel * 0.8)}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoomLevel)}%</span>
          <button
            className="p-1 hover:text-white text-gray-500"
            onClick={() => setZoomLevel(zoomLevel * 1.2)}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className={`flex items-center space-x-1 cursor-pointer text-gray-500 ${
              getClipAtPlayhead() ? 'hover:text-white' : 'opacity-40 cursor-not-allowed'
            }`}
            onClick={handleSplit}
            disabled={!getClipAtPlayhead()}
            title="Split clip at playhead (S)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-xs">Split</span>
          </button>
          <button
            className={`flex items-center space-x-1 cursor-pointer text-gray-500 ${
              selectedClipIds.length > 0 ? 'hover:text-red-400' : 'opacity-40 cursor-not-allowed'
            }`}
            onClick={deleteSelectedClips}
            disabled={selectedClipIds.length === 0}
            title="Delete selected clips (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs">Delete</span>
          </button>
          {/* Add Track Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center space-x-1 cursor-pointer hover:text-white text-gray-500"
              title="Add Track"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs">Add Track</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
              <button
                className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
                onClick={() => handleAddTrack(TrackType.VIDEO)}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Video Track</span>
              </button>
              <button
                className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
                onClick={() => handleAddTrack(TrackType.AUDIO)}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Audio Track</span>
              </button>
              <button
                className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
                onClick={() => handleAddTrack(TrackType.TEXT)}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Text Track</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Track Headers (Left Fixed) */}
        <div className="w-[120px] flex-shrink-0 bg-[#141414] border-r border-[#2a2a2a] z-10 pt-[24px]">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`h-[60px] border-b border-[#2a2a2a] flex items-center px-2 group ${
                track.isLocked ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-300 truncate block">{track.name}</span>
                <div className="flex items-center space-x-1 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      track.type === TrackType.VIDEO
                        ? 'bg-blue-500'
                        : track.type === TrackType.AUDIO
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                    }`}
                  />
                  <span className="text-[10px] uppercase text-gray-600">{track.type}</span>
                </div>
              </div>
              {/* Track Controls */}
              <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {track.type === TrackType.AUDIO && (
                  <button
                    className={`p-1 rounded hover:bg-[#2a2a2a] ${
                      track.isMuted ? 'text-red-400' : 'text-gray-500'
                    }`}
                    onClick={() => updateTrack(track.id, { isMuted: !track.isMuted })}
                    title={track.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                )}
                <button
                  className={`p-1 rounded hover:bg-[#2a2a2a] ${
                    track.isLocked ? 'text-yellow-400' : 'text-gray-500'
                  }`}
                  onClick={() => updateTrack(track.id, { isLocked: !track.isLocked })}
                  title={track.isLocked ? 'Unlock' : 'Lock'}
                >
                  {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
                <button
                  className="p-1 rounded hover:bg-[#2a2a2a] text-gray-500 hover:text-red-400"
                  onClick={() => removeTrack(track.id)}
                  title="Remove Track"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Tracks */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0a0a0a] relative custom-scrollbar"
        >
          <div
            className="relative min-w-full"
            style={{ width: `${timeToPx(duration) + 500}px` }}
            onMouseDown={handleTimelineClick}
          >
            {/* Ruler */}
            <div className="h-[24px] border-b border-[#2a2a2a] bg-[#141414] sticky top-0 z-10 flex items-end">
              {Array.from({ length: Math.ceil(duration / 5) + 2 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 border-l border-[#3a3a3a] h-2 text-[10px] pl-1 text-gray-600"
                  style={{ left: timeToPx(i * 5) }}
                >
                  {i * 5}s
                </div>
              ))}
            </div>

            {/* Tracks */}
            <div className="relative">
              {/* Playhead Line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-yellow-500 z-30 pointer-events-none"
                style={{ left: timeToPx(currentTime), height: tracks.length * TRACK_HEIGHT }}
              >
                <div className="w-2.5 h-2.5 bg-yellow-500 -ml-1 rotate-45 transform -mt-1" />
              </div>

              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`h-[60px] border-b border-[#2a2a2a] relative ${
                    track.isLocked ? 'bg-[#0a0a0a]/30' : 'bg-[#0a0a0a]/50'
                  }`}
                >
                  {track.clips.map((clip) => {
                    const isSelected = selectedClipIds.includes(clip.id);
                    const isDragging = draggingClip?.clipId === clip.id;
                    const hasTransitionIn = !!clip.transitionIn;
                    const hasTransitionOut = !!clip.transitionOut;

                    // Get transition icon based on type (using simple Unicode symbols)
                    const getTransitionIcon = (type: TransitionType) => {
                      const icons: Record<TransitionType, string> = {
                        [TransitionType.CUT]: '×',
                        [TransitionType.FADE]: '◐',
                        [TransitionType.CROSSFADE]: '⇄',
                        [TransitionType.BLUR]: '○',
                        [TransitionType.GLITCH]: '▦',
                        [TransitionType.SLIDE_LEFT]: '←',
                        [TransitionType.SLIDE_RIGHT]: '→',
                        [TransitionType.SLIDE_UP]: '↑',
                        [TransitionType.SLIDE_DOWN]: '↓',
                        [TransitionType.ZOOM_IN]: '+',
                        [TransitionType.ZOOM_OUT]: '−',
                        [TransitionType.WIPE_LEFT]: '◄',
                        [TransitionType.WIPE_RIGHT]: '►',
                        [TransitionType.DISSOLVE]: '~',
                        [TransitionType.FLASH]: '★',
                        [TransitionType.PIXELATE]: '▣',
                      };
                      return icons[type] || '•';
                    };

                    return (
                      <div
                        key={clip.id}
                        className={`clip-element absolute top-1.5 bottom-1.5 rounded overflow-hidden transition-shadow ${
                          track.type === TrackType.VIDEO
                            ? 'bg-blue-600/30'
                            : track.type === TrackType.AUDIO
                            ? 'bg-green-600/30'
                            : 'bg-purple-600/30'
                        } ${
                          isSelected
                            ? 'ring-1 ring-white/60 border-white/40'
                            : 'border border-white/10 hover:border-white/30'
                        } ${isDragging ? 'opacity-75 shadow-lg' : ''} ${
                          track.isLocked ? 'pointer-events-none opacity-50' : 'cursor-grab active:cursor-grabbing'
                        }`}
                        style={{
                          left: timeToPx(clip.start),
                          width: Math.max(timeToPx(clip.duration), 30),
                        }}
                        onClick={(e) => handleClipClick(e, clip.id, track.id)}
                        onContextMenu={(e) => handleClipContextMenu(e, clip.id, track.id)}
                        onMouseDown={(e) => {
                          if (!track.isLocked) {
                            handleClipDragStart(e, clip.id, track.id, clip.start);
                          }
                        }}
                      >
                        <div className="px-2 py-1 text-xs truncate flex items-center justify-between h-full">
                          <span className="text-white/80 font-medium drop-shadow-md">{clip.name}</span>
                          {track.type === TrackType.TEXT && (
                            <span className="text-white/50 text-[10px] truncate ml-2">"{clip.content}"</span>
                          )}
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
                        )}

                        {/* Transition In Indicator */}
                        {hasTransitionIn && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#7c3aed]/60 to-transparent flex items-center justify-center group/trans"
                            title={`In: ${clip.transitionIn!.name}`}
                          >
                            <span className="text-[10px] opacity-80 group-hover/trans:opacity-100 transition-opacity">
                              {getTransitionIcon(clip.transitionIn!.type)}
                            </span>
                          </div>
                        )}

                        {/* Transition Out Indicator */}
                        {hasTransitionOut && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#7c3aed]/60 to-transparent flex items-center justify-center group/trans"
                            title={`Out: ${clip.transitionOut!.name}`}
                          >
                            <span className="text-[10px] opacity-80 group-hover/trans:opacity-100 transition-opacity">
                              {getTransitionIcon(clip.transitionOut!.type)}
                            </span>
                          </div>
                        )}

                        {/* Transition badge when both exist */}
                        {(hasTransitionIn || hasTransitionOut) && (
                          <div className="absolute bottom-0.5 right-0.5">
                            <Layers className="w-2.5 h-2.5 text-[#a78bfa] opacity-60" />
                          </div>
                        )}

                        {/* Resize Handles (visible on hover) */}
                        {!track.isLocked && (
                          <>
                            {/* Left resize handle */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-2 cursor-w-resize transition-all group/resize-left ${
                                resizingClip?.clipId === clip.id && resizingClip?.edge === 'start'
                                  ? 'bg-blue-500/50'
                                  : 'hover:bg-white/30 opacity-0 hover:opacity-100'
                              }`}
                              onMouseDown={(e) => handleResizeStart(e, clip.id, track.id, 'start', clip.start, clip.duration)}
                            >
                              <div className="absolute inset-y-0 left-0 w-1 bg-white/50 opacity-0 group-hover/resize-left:opacity-100" />
                            </div>
                            {/* Right resize handle */}
                            <div
                              className={`absolute right-0 top-0 bottom-0 w-2 cursor-e-resize transition-all group/resize-right ${
                                resizingClip?.clipId === clip.id && resizingClip?.edge === 'end'
                                  ? 'bg-blue-500/50'
                                  : 'hover:bg-white/30 opacity-0 hover:opacity-100'
                              }`}
                              onMouseDown={(e) => handleResizeStart(e, clip.id, track.id, 'end', clip.start, clip.duration)}
                            >
                              <div className="absolute inset-y-0 right-0 w-1 bg-white/50 opacity-0 group-hover/resize-right:opacity-100" />
                            </div>
                          </>
                        )}

                        {/* Transition Drop Zones (visible on hover when no transition exists) */}
                        {!track.isLocked && (
                          <>
                            {/* Left transition zone (for transition IN) */}
                            {!hasTransitionIn && (
                              <div
                                className="absolute left-0 top-0 bottom-0 w-6 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group/trans-in"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setTransitionDropZone({ clipId: clip.id, trackId: track.id, position: 'in' });
                                }}
                                onDragLeave={() => setTransitionDropZone(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                    if (data.transitionType) {
                                      addTransitionToClip(track.id, clip.id, data.transitionType, 'in');
                                    }
                                  } catch {}
                                  setTransitionDropZone(null);
                                }}
                              >
                                <div className={`absolute inset-0 rounded-l flex items-center justify-center ${
                                  transitionDropZone?.clipId === clip.id && transitionDropZone?.position === 'in'
                                    ? 'bg-purple-500/40 border-2 border-dashed border-purple-400'
                                    : 'bg-gradient-to-r from-purple-500/20 to-transparent'
                                }`}>
                                  <Plus className="w-3 h-3 text-white/60" />
                                </div>
                              </div>
                            )}
                            {/* Right transition zone (for transition OUT) */}
                            {!hasTransitionOut && (
                              <div
                                className="absolute right-0 top-0 bottom-0 w-6 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group/trans-out"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setTransitionDropZone({ clipId: clip.id, trackId: track.id, position: 'out' });
                                }}
                                onDragLeave={() => setTransitionDropZone(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                    if (data.transitionType) {
                                      addTransitionToClip(track.id, clip.id, data.transitionType, 'out');
                                    }
                                  } catch {}
                                  setTransitionDropZone(null);
                                }}
                              >
                                <div className={`absolute inset-0 rounded-r flex items-center justify-center ${
                                  transitionDropZone?.clipId === clip.id && transitionDropZone?.position === 'out'
                                    ? 'bg-purple-500/40 border-2 border-dashed border-purple-400'
                                    : 'bg-gradient-to-l from-purple-500/20 to-transparent'
                                }`}>
                                  <Plus className="w-3 h-3 text-white/60" />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const track = tracks.find(t => t.id === contextMenu.trackId);
        const clip = track?.clips.find(c => c.id === contextMenu.clipId);
        const hasTransitionIn = !!clip?.transitionIn;
        const hasTransitionOut = !!clip?.transitionOut;

        // Check if playhead is within this clip
        const isPlayheadInClip = clip && currentTime > clip.start && currentTime < clip.start + clip.duration;

        return (
          <div
            className="fixed bg-[#1a1a1a] border border-[#2a2a2a] rounded shadow-xl z-50 py-1 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit Section */}
            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider">Edit</div>

            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
              onClick={() => {
                duplicateClip(contextMenu.trackId, contextMenu.clipId);
                setContextMenu(null);
              }}
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate</span>
              <span className="ml-auto text-[10px] text-gray-600">Cmd+D</span>
            </button>

            {/* Split options */}
            <button
              className={`w-full px-3 py-2 text-xs text-left flex items-center space-x-2 ${
                isPlayheadInClip ? 'hover:bg-[#2a2a2a]' : 'opacity-40 cursor-not-allowed'
              }`}
              onClick={() => {
                if (isPlayheadInClip) {
                  splitClipAtPlayhead(contextMenu.trackId, contextMenu.clipId);
                  setContextMenu(null);
                }
              }}
              disabled={!isPlayheadInClip}
            >
              <Scissors className="w-3 h-3" />
              <span>Split at Playhead</span>
              <span className="ml-auto text-[10px] text-gray-600">S</span>
            </button>

            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
              onClick={() => {
                // Split at midpoint of clip
                if (clip) {
                  const midpoint = clip.start + clip.duration / 2;
                  setTime(midpoint);
                  setTimeout(() => {
                    splitClipAtPlayhead(contextMenu.trackId, contextMenu.clipId);
                  }, 10);
                }
                setContextMenu(null);
              }}
            >
              <ChevronsLeftRight className="w-3 h-3" />
              <span>Split at Center</span>
            </button>

            <div className="border-t border-[#2a2a2a] my-1" />

            {/* Trim Section */}
            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider">Trim</div>

            <button
              className={`w-full px-3 py-2 text-xs text-left flex items-center space-x-2 ${
                isPlayheadInClip ? 'hover:bg-[#2a2a2a]' : 'opacity-40 cursor-not-allowed'
              }`}
              onClick={() => {
                if (clip && isPlayheadInClip) {
                  // Trim from start to playhead
                  const trimAmount = currentTime - clip.start;
                  trimClip(contextMenu.trackId, contextMenu.clipId, trimAmount, 0);
                }
                setContextMenu(null);
              }}
              disabled={!isPlayheadInClip}
            >
              <SkipForward className="w-3 h-3" />
              <span>Trim Start to Playhead</span>
            </button>

            <button
              className={`w-full px-3 py-2 text-xs text-left flex items-center space-x-2 ${
                isPlayheadInClip ? 'hover:bg-[#2a2a2a]' : 'opacity-40 cursor-not-allowed'
              }`}
              onClick={() => {
                if (clip && isPlayheadInClip) {
                  // Trim from playhead to end
                  const trimAmount = (clip.start + clip.duration) - currentTime;
                  trimClip(contextMenu.trackId, contextMenu.clipId, 0, trimAmount);
                }
                setContextMenu(null);
              }}
              disabled={!isPlayheadInClip}
            >
              <SkipBack className="w-3 h-3" />
              <span>Trim End to Playhead</span>
            </button>

            {/* Transition Section */}
            <div className="border-t border-[#2a2a2a] my-1" />
            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider flex items-center space-x-1">
              <Layers className="w-2.5 h-2.5" />
              <span>Transitions</span>
            </div>

            {/* Quick Transition Options */}
            <div className="relative group/trans">
              <button
                className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Add Fade In</span>
                </div>
                {hasTransitionIn && <span className="text-[10px] text-blue-400">Applied</span>}
              </button>
              <div
                className="absolute left-0 top-0 w-full h-full cursor-pointer"
                onClick={() => {
                  addTransitionToClip(contextMenu.trackId, contextMenu.clipId, TransitionType.FADE, 'in');
                  setContextMenu(null);
                }}
              />
            </div>

            <div className="relative group/trans">
              <button
                className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Add Fade Out</span>
                </div>
                {hasTransitionOut && <span className="text-[10px] text-blue-400">Applied</span>}
              </button>
              <div
                className="absolute left-0 top-0 w-full h-full cursor-pointer"
                onClick={() => {
                  addTransitionToClip(contextMenu.trackId, contextMenu.clipId, TransitionType.FADE, 'out');
                  setContextMenu(null);
                }}
              />
            </div>

            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
              onClick={() => {
                addTransitionToClip(contextMenu.trackId, contextMenu.clipId, TransitionType.CROSSFADE, 'out');
                setContextMenu(null);
              }}
            >
              <span className="text-[10px]">🔀</span>
              <span>Add Cross Fade</span>
            </button>

            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
              onClick={() => {
                addTransitionToClip(contextMenu.trackId, contextMenu.clipId, TransitionType.GLITCH, 'out');
                setContextMenu(null);
              }}
            >
              <span className="text-[10px]">📺</span>
              <span>Add Glitch</span>
            </button>

            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2"
              onClick={() => {
                addTransitionToClip(contextMenu.trackId, contextMenu.clipId, TransitionType.BLUR, 'out');
                setContextMenu(null);
              }}
            >
              <span className="text-[10px]">🌫️</span>
              <span>Add Blur</span>
            </button>

            {/* Remove Transitions */}
            {(hasTransitionIn || hasTransitionOut) && (
              <>
                <div className="border-t border-[#2a2a2a] my-1" />
                {hasTransitionIn && (
                  <button
                    className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2 text-orange-400"
                    onClick={() => {
                      removeTransition(contextMenu.trackId, contextMenu.clipId, 'in');
                      setContextMenu(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                    <span>Remove In Transition</span>
                  </button>
                )}
                {hasTransitionOut && (
                  <button
                    className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2 text-orange-400"
                    onClick={() => {
                      removeTransition(contextMenu.trackId, contextMenu.clipId, 'out');
                      setContextMenu(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                    <span>Remove Out Transition</span>
                  </button>
                )}
              </>
            )}

            <div className="border-t border-[#2a2a2a] my-1" />
            <button
              className="w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a2a] flex items-center space-x-2 text-red-400 hover:text-red-300"
              onClick={() => {
                deleteClip(contextMenu.trackId, contextMenu.clipId);
                setContextMenu(null);
              }}
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default Timeline;