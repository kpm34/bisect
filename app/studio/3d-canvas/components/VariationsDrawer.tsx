'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import type { MaterialPreset } from '@/lib/services/supabase/types';

interface VariationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug: string | null; // e.g., 'gold', 'silver', 'copper'
  categoryName: string;
  onApplyPreset: (preset: MaterialPreset) => void;
  selectedPresetId?: string | null;
}

export function VariationsDrawer({
  isOpen,
  onClose,
  categorySlug,
  categoryName,
  onApplyPreset,
  selectedPresetId,
}: VariationsDrawerProps) {
  const [presets, setPresets] = useState<MaterialPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch presets for this category (e.g., all gold variations)
  useEffect(() => {
    async function fetchPresets() {
      if (!categorySlug) {
        setPresets([]);
        return;
      }

      setIsLoading(true);
      try {
        const { getCategoryWithPresets } = await import('@/lib/services/supabase/materials');
        const result = await getCategoryWithPresets(categorySlug);
        if (result && result.presets) {
          setPresets(result.presets);
        } else {
          setPresets([]);
        }
      } catch (error) {
        console.error('Failed to fetch presets:', error);
        setPresets([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && categorySlug) {
      fetchPresets();
    }
  }, [isOpen, categorySlug]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      // Delay adding listener to prevent immediate close
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  return (
    <div
      ref={drawerRef}
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 shadow-lg rounded-t-xl transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ zIndex: 100 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <h4 className="text-sm font-medium text-zinc-800 capitalize">
          {categoryName} Variations
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Variations Grid */}
      <div
        className="p-4 overflow-y-auto"
        style={{ maxHeight: '160px' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : presets.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {presets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className={`group relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                      : 'border-zinc-200 hover:border-zinc-400 hover:scale-105'
                  }`}
                  title={preset.name}
                >
                  {preset.preview_url ? (
                    <img
                      src={preset.preview_url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: preset.color || '#cccccc',
                      }}
                    />
                  )}

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Hover label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] text-center truncate">
                      {preset.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-zinc-500">No variations available</p>
            <p className="text-xs text-zinc-400 mt-1">More coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VariationsDrawer;
