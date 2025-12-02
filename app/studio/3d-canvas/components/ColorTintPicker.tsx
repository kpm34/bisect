'use client';

/**
 * ColorTintPicker - Progressive color selection for material tinting
 *
 * Features:
 * - Basic color palette with interactive swatches
 * - Fine-tune mode appears when color is selected (progressive disclosure)
 * - HSL sliders for saturation/lightness adjustment
 * - Full HexColorPicker for neutral colors (black, white, grey)
 * - Styled for Bisect's dark UI theme
 */

import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Pipette, X, Palette } from 'lucide-react';

// Bisect color palette - curated for material tinting
const MATERIAL_COLOR_PALETTE = [
  '#FFFFFF', // White
  '#E5E5E5', // Light Grey
  '#808080', // Grey
  '#404040', // Dark Grey
  '#000000', // Black
  '#8B4513', // Saddle Brown (leather)
  '#D2691E', // Chocolate
  '#CD853F', // Peru (tan)
  '#B8860B', // Dark Goldenrod
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#B87333', // Copper
  '#CC0000', // Red
  '#0033A0', // Blue
];

// Helper functions for HSL conversion
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface ColorTintPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ColorTintPicker({ value, onChange, label = 'Tint Color', disabled }: ColorTintPickerProps) {
  const [fineTuneColor, setFineTuneColor] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState<string>(value);

  // Track HSL for sliders
  const hsl = hexToHSL(tempColor);
  const [saturation, setSaturation] = useState(hsl.s);
  const [lightness, setLightness] = useState(hsl.l);

  // Update when value changes externally
  useEffect(() => {
    setTempColor(value);
    const newHsl = hexToHSL(value);
    setSaturation(newHsl.s);
    setLightness(newHsl.l);
  }, [value]);

  // Check if color is neutral (black, white, grey)
  const isNeutral = (color: string) => {
    const hslVal = hexToHSL(color);
    return hslVal.s < 10; // Low saturation = neutral
  };

  // Handle swatch click
  const handleSwatchClick = (color: string) => {
    onChange(color);
    setTempColor(color);
    setFineTuneColor(color);
    const newHsl = hexToHSL(color);
    setSaturation(newHsl.s);
    setLightness(newHsl.l);
  };

  // Handle slider changes
  const handleSaturationChange = (newSat: number) => {
    setSaturation(newSat);
    const hslVal = hexToHSL(tempColor);
    const newColor = hslToHex(hslVal.h, newSat, lightness);
    setTempColor(newColor);
    onChange(newColor);
  };

  const handleLightnessChange = (newLight: number) => {
    setLightness(newLight);
    const hslVal = hexToHSL(tempColor);
    const newColor = hslToHex(hslVal.h, saturation, newLight);
    setTempColor(newColor);
    onChange(newColor);
  };

  if (disabled) {
    return (
      <div className="opacity-50 pointer-events-none">
        <div className="text-xs text-zinc-500 mb-2">{label}</div>
        <div className="text-xs text-zinc-600">Select an object to adjust color</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Label */}
      <div className="flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>

      {/* Fine-Tune Panel - Progressive Disclosure */}
      {fineTuneColor && (
        <div className="bg-zinc-800/80 rounded-xl p-3 border border-zinc-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pipette className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-zinc-200">Fine-Tune</span>
            </div>
            <button
              onClick={() => setFineTuneColor(null)}
              className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {isNeutral(fineTuneColor) ? (
            // Full color picker for neutrals
            <div className="space-y-3">
              <HexColorPicker
                color={tempColor}
                onChange={(newColor) => {
                  setTempColor(newColor);
                  onChange(newColor);
                }}
                style={{ width: '100%', height: '120px' }}
              />
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-zinc-600"
                  style={{ backgroundColor: tempColor }}
                />
                <input
                  type="text"
                  value={tempColor.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      setTempColor(val);
                      onChange(val);
                    }
                  }}
                  className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 font-mono text-xs focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          ) : (
            // Saturation/Lightness sliders for colored swatches
            <div className="space-y-3">
              {/* Current Color Preview */}
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-zinc-600"
                  style={{
                    backgroundColor: tempColor,
                    boxShadow: `0 0 12px ${tempColor}40`
                  }}
                />
                <div className="flex-1">
                  <div className="text-xs text-zinc-400 mb-0.5">Current</div>
                  <div className="font-mono text-sm text-zinc-200">{tempColor.toUpperCase()}</div>
                </div>
              </div>

              {/* Saturation Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">Saturation</label>
                  <span className="text-xs font-mono text-zinc-500">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation}
                  onChange={(e) => handleSaturationChange(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  style={{
                    background: `linear-gradient(to right,
                      ${hslToHex(hexToHSL(tempColor).h, 0, lightness)},
                      ${hslToHex(hexToHSL(tempColor).h, 100, lightness)})`
                  }}
                />
              </div>

              {/* Lightness Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">Lightness</label>
                  <span className="text-xs font-mono text-zinc-500">{lightness}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={lightness}
                  onChange={(e) => handleLightnessChange(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  style={{
                    background: `linear-gradient(to right, #000000, ${hslToHex(hexToHSL(tempColor).h, saturation, 50)}, #ffffff)`
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setFineTuneColor(null)}
            className="w-full mt-3 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Color Palette Grid */}
      <div className="grid grid-cols-7 gap-1.5 p-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
        {MATERIAL_COLOR_PALETTE.map((color) => {
          const isSelected = value.toUpperCase() === color.toUpperCase();
          return (
            <button
              key={color}
              onClick={() => handleSwatchClick(color)}
              className={`
                relative aspect-square rounded-lg transition-all duration-200 group
                ${isSelected
                  ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-zinc-900 scale-110 z-10'
                  : 'hover:scale-105 hover:z-10'
                }
              `}
              style={{
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 12px ${color}60` : undefined
              }}
              title={`${color} - Click to apply and fine-tune`}
            >
              {/* Pipette icon on hover */}
              <Pipette
                className={`
                  absolute top-0.5 right-0.5 w-2.5 h-2.5
                  ${color === '#FFFFFF' || color === '#E5E5E5' || color === '#FFD700' ? 'text-zinc-600' : 'text-white/70'}
                  opacity-0 group-hover:opacity-100 transition-opacity
                `}
              />
              {/* Checkmark for selected */}
              {isSelected && (
                <div className={`absolute inset-0 flex items-center justify-center ${
                  color === '#FFFFFF' || color === '#E5E5E5' || color === '#FFD700' ? 'text-zinc-800' : 'text-white'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hex Input */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-zinc-700 flex-shrink-0"
          style={{
            backgroundColor: value,
            boxShadow: `0 0 8px ${value}30`
          }}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              onChange(val);
              setTempColor(val);
            }
          }}
          className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 font-mono text-xs focus:outline-none focus:border-orange-500/50 transition-colors"
          placeholder="#FFFFFF"
        />
      </div>
    </div>
  );
}
