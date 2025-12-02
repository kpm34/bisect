'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Film, Monitor, Smartphone, Tv, Check, AlertCircle } from 'lucide-react';
import { getEncoder, downloadBlob, ExportFormat, ExportQuality, ExportProgress } from '@/lib/video/encoder';
import { useStore } from '../store';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUALITY_OPTIONS: { id: ExportQuality; name: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'social', name: 'Social', desc: '720p - Instagram, TikTok', icon: <Smartphone className="w-5 h-5" /> },
  { id: 'hd', name: 'HD', desc: '1080p - YouTube, Vimeo', icon: <Monitor className="w-5 h-5" /> },
  { id: '4k', name: '4K', desc: '2160p - Professional', icon: <Tv className="w-5 h-5" /> },
];

const FORMAT_OPTIONS: { id: ExportFormat; name: string; desc: string }[] = [
  { id: 'mp4', name: 'MP4', desc: 'Best compatibility' },
  { id: 'webm', name: 'WebM', desc: 'Smaller file size' },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { tracks, duration, projectName } = useStore();

  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [quality, setQuality] = useState<ExportQuality>('hd');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const encoderRef = useRef(getEncoder());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProgress(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (encoderRef.current) {
        encoderRef.current.cancel();
      }
    };
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress({ stage: 'loading', progress: 0, message: 'Initializing...' });

    try {
      const encoder = encoderRef.current;

      const blob = await encoder.exportTimeline(
        tracks,
        duration,
        { format, quality, fps: 30 },
        (prog) => setProgress(prog)
      );

      // Generate filename
      const name = projectName || 'Untitled';
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${name}_${quality}_${timestamp}.${format}`;

      // Download the file
      downloadBlob(blob, filename);

      setProgress({ stage: 'complete', progress: 100, message: 'Export complete!' });

      // Close after a brief delay to show completion
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      setProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Export failed. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    if (isExporting) {
      encoderRef.current.cancel();
      setIsExporting(false);
      setProgress(null);
    } else {
      onClose();
    }
  };

  // Count clips for info
  const clipCount = tracks.reduce((acc, track) => acc + track.clips.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Export Video</h2>
              <p className="text-xs text-gray-500">{clipCount} clips, {Math.round(duration)}s</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => !isExporting && setQuality(opt.id)}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    quality === opt.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={quality === opt.id ? 'text-orange-500' : 'text-gray-400'}>
                      {opt.icon}
                    </div>
                    <span className={`text-sm font-medium ${quality === opt.id ? 'text-white' : 'text-gray-300'}`}>
                      {opt.name}
                    </span>
                    <span className="text-[10px] text-gray-500 text-center leading-tight">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => !isExporting && setFormat(opt.id)}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    format === opt.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-sm font-medium ${format === opt.id ? 'text-white' : 'text-gray-300'}`}>
                        {opt.name}
                      </span>
                      <p className="text-[10px] text-gray-500">{opt.desc}</p>
                    </div>
                    {format === opt.id && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={`${progress.stage === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                  {progress.message}
                </span>
                {progress.stage !== 'error' && progress.stage !== 'complete' && (
                  <span className="text-gray-500">{progress.progress}%</span>
                )}
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    progress.stage === 'error'
                      ? 'bg-red-500'
                      : progress.stage === 'complete'
                      ? 'bg-green-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.timeRemaining !== undefined && progress.timeRemaining > 0 && (
                <p className="text-xs text-gray-500 text-right">
                  ~{Math.ceil(progress.timeRemaining / 60)} min remaining
                </p>
              )}
            </div>
          )}

          {/* Error Alert */}
          {progress?.stage === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{progress.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#2a2a2a]">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            {isExporting ? 'Cancel' : 'Close'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || clipCount === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
              isExporting || clipCount === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
