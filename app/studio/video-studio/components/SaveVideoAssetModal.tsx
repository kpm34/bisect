'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Loader2, Check, AlertCircle, Video, Clock, Film } from 'lucide-react';
import { useStore } from '../store';

interface SaveVideoAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, tags: string[], metadata: VideoAssetMetadata) => Promise<void>;
  defaultName?: string;
}

export interface VideoAssetMetadata {
  duration: number;
  clipCount: number;
  tracks: number;
  thumbnail?: Blob;
}

export function SaveVideoAssetModal({
  isOpen,
  onClose,
  onSave,
  defaultName = 'Untitled Video',
}: SaveVideoAssetModalProps) {
  const [name, setName] = useState(defaultName);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tracks, duration } = useStore();

  // Calculate video metadata
  const clipCount = tracks.reduce((sum, track) => sum + track.clips.length, 0);
  const trackCount = tracks.length;

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setTags([]);
      setTagInput('');
      setError(null);
      setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultName]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag();
      } else if (name.trim()) {
        handleSubmit();
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (clipCount === 0) {
      setError('No clips to save. Add media to your timeline first.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const metadata: VideoAssetMetadata = {
        duration,
        clipCount,
        tracks: trackCount,
      };

      await onSave(name.trim(), tags, metadata);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Save as Asset
              </h2>
              <p className="text-xs text-zinc-500">
                Save this video project to your library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Video Preview Stats */}
          <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(duration)}</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Film className="w-4 h-4" />
              <span>{clipCount} clip{clipCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Success state */}
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Saved to your library!</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My Video Project"
              disabled={saving || success}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Tags input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Tags (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                disabled={saving || success}
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 text-sm"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim() || saving || success}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-lg text-sm text-white transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={saving || success}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || saving || success || clipCount === 0}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                Save to Library
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
