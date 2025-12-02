'use client';

/**
 * ClonerPanel Component
 *
 * UI panel for creating and configuring cloners/instancing
 */

import React, { useState, useCallback } from 'react';
import {
  Copy,
  Grid3X3,
  Circle,
  Shuffle,
  Spline,
  Box,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Settings,
} from 'lucide-react';
import type {
  Cloner,
  ClonerMode,
  ClonerConfig,
  LinearClonerConfig,
  RadialClonerConfig,
  GridClonerConfig,
  ScatterClonerConfig,
  SplineClonerConfig,
  ClonerEffector,
  EffectorType,
} from '@/lib/core/cloner/types';

// ============== TYPES ==============

interface ClonerPanelProps {
  cloners: Cloner[];
  selectedClonerId: string | null;
  availableObjects: Array<{ id: string; name: string }>;
  onCreateCloner: (cloner: Cloner) => void;
  onUpdateCloner: (id: string, updates: Partial<Cloner>) => void;
  onDeleteCloner: (id: string) => void;
  onSelectCloner: (id: string | null) => void;
}

// ============== MODE ICONS ==============

const ModeIcons: Record<ClonerMode, React.ElementType> = {
  linear: Copy,
  radial: Circle,
  grid: Grid3X3,
  scatter: Shuffle,
  spline: Spline,
  object: Box,
};

const ModeLabels: Record<ClonerMode, string> = {
  linear: 'Linear',
  radial: 'Radial',
  grid: 'Grid',
  scatter: 'Scatter',
  spline: 'Spline',
  object: 'Object',
};

// ============== HELPER COMPONENTS ==============

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-white"
        />
        {unit && <span className="text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}

function Vector3Input({
  label,
  value,
  onChange,
  labels = ['X', 'Y', 'Z'],
}: {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  labels?: [string, string, string];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 w-3">{labels[i]}</span>
              <input
                type="number"
                value={value[i]}
                onChange={(e) => {
                  const newValue = [...value] as [number, number, number];
                  newValue[i] = parseFloat(e.target.value) || 0;
                  onChange(newValue);
                }}
                step={0.1}
                className="w-full px-1 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-zinc-400">{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-zinc-600'
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ============== MODE CONFIG EDITORS ==============

function LinearConfigEditor({
  config,
  onChange,
}: {
  config: LinearClonerConfig;
  onChange: (config: LinearClonerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberInput
        label="Count"
        value={config.count}
        onChange={(count) => onChange({ ...config, count })}
        min={1}
        max={1000}
      />
      <SelectInput
        label="Direction"
        value={config.direction}
        options={[
          { value: 'x', label: 'X Axis' },
          { value: 'y', label: 'Y Axis' },
          { value: 'z', label: 'Z Axis' },
          { value: 'custom', label: 'Custom' },
        ]}
        onChange={(direction) => onChange({ ...config, direction })}
      />
      {config.direction === 'custom' && (
        <Vector3Input
          label="Custom Direction"
          value={config.customDirection || [1, 0, 0]}
          onChange={(customDirection) => onChange({ ...config, customDirection })}
        />
      )}
      <NumberInput
        label="Spacing"
        value={config.spacing}
        onChange={(spacing) => onChange({ ...config, spacing })}
        step={0.1}
        unit="m"
      />
      <Vector3Input
        label="Offset"
        value={config.offset}
        onChange={(offset) => onChange({ ...config, offset })}
      />
      <NumberInput
        label="Scale Progression"
        value={config.scaleProgression ?? 1}
        onChange={(scaleProgression) => onChange({ ...config, scaleProgression })}
        step={0.01}
        min={0.1}
        max={2}
      />
      <Vector3Input
        label="Rotation Progression (°)"
        value={config.rotationProgression || [0, 0, 0]}
        onChange={(rotationProgression) => onChange({ ...config, rotationProgression })}
      />
    </div>
  );
}

function RadialConfigEditor({
  config,
  onChange,
}: {
  config: RadialClonerConfig;
  onChange: (config: RadialClonerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberInput
        label="Count"
        value={config.count}
        onChange={(count) => onChange({ ...config, count })}
        min={1}
        max={360}
      />
      <NumberInput
        label="Radius"
        value={config.radius}
        onChange={(radius) => onChange({ ...config, radius })}
        step={0.1}
        min={0.1}
        unit="m"
      />
      <NumberInput
        label="Start Angle"
        value={config.startAngle}
        onChange={(startAngle) => onChange({ ...config, startAngle })}
        min={0}
        max={360}
        unit="°"
      />
      <NumberInput
        label="End Angle"
        value={config.endAngle}
        onChange={(endAngle) => onChange({ ...config, endAngle })}
        min={0}
        max={360}
        unit="°"
      />
      <SelectInput
        label="Plane"
        value={config.plane}
        options={[
          { value: 'xy', label: 'XY Plane' },
          { value: 'xz', label: 'XZ Plane' },
          { value: 'yz', label: 'YZ Plane' },
        ]}
        onChange={(plane) => onChange({ ...config, plane })}
      />
      <Toggle
        label="Align to Radius"
        checked={config.alignToRadius}
        onChange={(alignToRadius) => onChange({ ...config, alignToRadius })}
      />
      <div className="border-t border-zinc-700 pt-2 mt-2">
        <Toggle
          label="Enable Spiral"
          checked={config.spiral?.enabled || false}
          onChange={(enabled) =>
            onChange({
              ...config,
              spiral: { enabled, heightPerRevolution: 1, radiusGrowth: 0, ...config.spiral },
            })
          }
        />
        {config.spiral?.enabled && (
          <>
            <NumberInput
              label="Height/Rev"
              value={config.spiral.heightPerRevolution}
              onChange={(heightPerRevolution) =>
                onChange({
                  ...config,
                  spiral: { ...config.spiral!, heightPerRevolution },
                })
              }
              step={0.1}
            />
            <NumberInput
              label="Radius Growth"
              value={config.spiral.radiusGrowth}
              onChange={(radiusGrowth) =>
                onChange({
                  ...config,
                  spiral: { ...config.spiral!, radiusGrowth },
                })
              }
              step={0.1}
            />
          </>
        )}
      </div>
    </div>
  );
}

function GridConfigEditor({
  config,
  onChange,
}: {
  config: GridClonerConfig;
  onChange: (config: GridClonerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <NumberInput
          label="X"
          value={config.countX}
          onChange={(countX) => onChange({ ...config, countX })}
          min={1}
          max={50}
        />
        <NumberInput
          label="Y"
          value={config.countY}
          onChange={(countY) => onChange({ ...config, countY })}
          min={1}
          max={50}
        />
        <NumberInput
          label="Z"
          value={config.countZ}
          onChange={(countZ) => onChange({ ...config, countZ })}
          min={1}
          max={50}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumberInput
          label="Sp X"
          value={config.spacingX}
          onChange={(spacingX) => onChange({ ...config, spacingX })}
          step={0.1}
        />
        <NumberInput
          label="Sp Y"
          value={config.spacingY}
          onChange={(spacingY) => onChange({ ...config, spacingY })}
          step={0.1}
        />
        <NumberInput
          label="Sp Z"
          value={config.spacingZ}
          onChange={(spacingZ) => onChange({ ...config, spacingZ })}
          step={0.1}
        />
      </div>
      <Toggle
        label="Centered"
        checked={config.centered}
        onChange={(centered) => onChange({ ...config, centered })}
      />
      <SelectInput
        label="Shape Mask"
        value={config.shape || 'box'}
        options={[
          { value: 'box', label: 'Box' },
          { value: 'sphere', label: 'Sphere' },
          { value: 'cylinder', label: 'Cylinder' },
        ]}
        onChange={(shape) => onChange({ ...config, shape: shape as any })}
      />
      <NumberInput
        label="Scale Variation"
        value={config.scaleVariation ?? 0}
        onChange={(scaleVariation) => onChange({ ...config, scaleVariation })}
        step={0.05}
        min={0}
        max={1}
      />
    </div>
  );
}

function ScatterConfigEditor({
  config,
  onChange,
}: {
  config: ScatterClonerConfig;
  onChange: (config: ScatterClonerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberInput
        label="Count"
        value={config.count}
        onChange={(count) => onChange({ ...config, count })}
        min={1}
        max={1000}
      />
      <NumberInput
        label="Seed"
        value={config.seed}
        onChange={(seed) => onChange({ ...config, seed })}
        min={0}
      />
      <SelectInput
        label="Distribution"
        value={config.distribution}
        options={[
          { value: 'box', label: 'Box' },
          { value: 'sphere', label: 'Sphere' },
        ]}
        onChange={(distribution) => onChange({ ...config, distribution: distribution as any })}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Min Scale"
          value={config.minScale}
          onChange={(minScale) => onChange({ ...config, minScale })}
          step={0.1}
          min={0.1}
        />
        <NumberInput
          label="Max Scale"
          value={config.maxScale}
          onChange={(maxScale) => onChange({ ...config, maxScale })}
          step={0.1}
          min={0.1}
        />
      </div>
      <Toggle
        label="Uniform Scale"
        checked={config.uniformScale}
        onChange={(uniformScale) => onChange({ ...config, uniformScale })}
      />
      <Toggle
        label="Random Rotation"
        checked={config.randomRotation}
        onChange={(randomRotation) => onChange({ ...config, randomRotation })}
      />
      <Toggle
        label="Avoid Overlap"
        checked={config.avoidOverlap || false}
        onChange={(avoidOverlap) => onChange({ ...config, avoidOverlap })}
      />
      {config.avoidOverlap && (
        <NumberInput
          label="Min Distance"
          value={config.minDistance ?? 1}
          onChange={(minDistance) => onChange({ ...config, minDistance })}
          step={0.1}
          min={0.1}
        />
      )}
    </div>
  );
}

function SplineConfigEditor({
  config,
  onChange,
}: {
  config: SplineClonerConfig;
  onChange: (config: SplineClonerConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <NumberInput
        label="Count"
        value={config.count}
        onChange={(count) => onChange({ ...config, count })}
        min={2}
        max={500}
      />
      <SelectInput
        label="Spline Type"
        value={config.splineType}
        options={[
          { value: 'catmullrom', label: 'Catmull-Rom' },
          { value: 'bezier', label: 'Bezier' },
          { value: 'linear', label: 'Linear' },
        ]}
        onChange={(splineType) => onChange({ ...config, splineType })}
      />
      {config.splineType === 'catmullrom' && (
        <NumberInput
          label="Tension"
          value={config.tension ?? 0.5}
          onChange={(tension) => onChange({ ...config, tension })}
          step={0.1}
          min={0}
          max={1}
        />
      )}
      <Toggle
        label="Align to Spline"
        checked={config.alignToSpline}
        onChange={(alignToSpline) => onChange({ ...config, alignToSpline })}
      />
      <Toggle
        label="Even Distribution"
        checked={config.distributeEvenly}
        onChange={(distributeEvenly) => onChange({ ...config, distributeEvenly })}
      />
      <div className="text-xs text-zinc-500 mt-2">
        {config.splinePoints.length} control points
      </div>
    </div>
  );
}

// ============== EFFECTOR EDITOR ==============

function EffectorEditor({
  effector,
  onChange,
  onDelete,
}: {
  effector: ClonerEffector;
  onChange: (effector: ClonerEffector) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-zinc-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Zap size={14} className="text-yellow-500" />
          <span className="text-xs font-medium capitalize">{effector.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange({ ...effector, enabled: !effector.enabled });
            }}
            className="p-1 hover:bg-zinc-700 rounded"
          >
            {effector.enabled ? (
              <Eye size={12} className="text-green-500" />
            ) : (
              <EyeOff size={12} className="text-zinc-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-zinc-700 rounded"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-3 space-y-2 bg-zinc-850">
          <NumberInput
            label="Strength"
            value={effector.strength}
            onChange={(strength) => onChange({ ...effector, strength })}
            step={0.1}
            min={0}
            max={2}
          />
          <div className="text-xs text-zinc-500 mt-2">Affects:</div>
          <div className="flex flex-wrap gap-2">
            {(['position', 'rotation', 'scale', 'visibility'] as const).map((prop) => (
              <button
                key={prop}
                onClick={() =>
                  onChange({
                    ...effector,
                    affects: { ...effector.affects, [prop]: !effector.affects[prop] },
                  })
                }
                className={`px-2 py-0.5 text-[10px] rounded ${
                  effector.affects[prop]
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-700/50 text-zinc-500'
                }`}
              >
                {prop}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== CLONER ITEM ==============

function ClonerItem({
  cloner,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: {
  cloner: Cloner;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Cloner>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(isSelected);
  const Icon = ModeIcons[cloner.config.mode];

  const updateConfig = useCallback(
    (config: ClonerConfig) => {
      onUpdate({ config });
    },
    [onUpdate]
  );

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        isSelected ? 'border-blue-500' : 'border-zinc-700'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-zinc-800 cursor-pointer"
        onClick={() => {
          onSelect();
          setExpanded(!expanded);
        }}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Icon size={14} className="text-blue-400" />
          <span className="text-xs font-medium">{cloner.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ enabled: !cloner.enabled });
            }}
            className="p-1 hover:bg-zinc-700 rounded"
          >
            {cloner.enabled ? (
              <Eye size={12} className="text-green-500" />
            ) : (
              <EyeOff size={12} className="text-zinc-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-zinc-700 rounded"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-4 bg-zinc-850">
          {/* Mode Selector */}
          <div className="grid grid-cols-6 gap-1">
            {(Object.keys(ModeIcons) as ClonerMode[]).map((mode) => {
              const ModeIcon = ModeIcons[mode];
              return (
                <button
                  key={mode}
                  onClick={() => {
                    const newConfig = createDefaultConfig(mode);
                    onUpdate({ config: newConfig });
                  }}
                  className={`p-2 rounded flex flex-col items-center gap-1 ${
                    cloner.config.mode === mode
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  title={ModeLabels[mode]}
                >
                  <ModeIcon size={14} />
                  <span className="text-[8px]">{ModeLabels[mode]}</span>
                </button>
              );
            })}
          </div>

          {/* Mode-specific Config */}
          <div className="border-t border-zinc-700 pt-3">
            {cloner.config.mode === 'linear' && (
              <LinearConfigEditor
                config={cloner.config as LinearClonerConfig}
                onChange={updateConfig}
              />
            )}
            {cloner.config.mode === 'radial' && (
              <RadialConfigEditor
                config={cloner.config as RadialClonerConfig}
                onChange={updateConfig}
              />
            )}
            {cloner.config.mode === 'grid' && (
              <GridConfigEditor
                config={cloner.config as GridClonerConfig}
                onChange={updateConfig}
              />
            )}
            {cloner.config.mode === 'scatter' && (
              <ScatterConfigEditor
                config={cloner.config as ScatterClonerConfig}
                onChange={updateConfig}
              />
            )}
            {cloner.config.mode === 'spline' && (
              <SplineConfigEditor
                config={cloner.config as SplineClonerConfig}
                onChange={updateConfig}
              />
            )}
          </div>

          {/* Options */}
          <div className="border-t border-zinc-700 pt-3 space-y-2">
            <Toggle
              label="Use GPU Instancing"
              checked={cloner.useInstancing}
              onChange={(useInstancing) => onUpdate({ useInstancing })}
            />
          </div>

          {/* Effectors */}
          <div className="border-t border-zinc-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">Effectors</span>
              <button
                onClick={() => {
                  const newEffector = createDefaultEffector('random');
                  onUpdate({
                    effectors: [...(cloner.effectors || []), newEffector],
                  });
                }}
                className="p-1 hover:bg-zinc-700 rounded"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {cloner.effectors?.map((effector, i) => (
                <EffectorEditor
                  key={effector.id}
                  effector={effector}
                  onChange={(updated) => {
                    const newEffectors = [...(cloner.effectors || [])];
                    newEffectors[i] = updated;
                    onUpdate({ effectors: newEffectors });
                  }}
                  onDelete={() => {
                    onUpdate({
                      effectors: cloner.effectors?.filter((_, j) => j !== i),
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== HELPERS ==============

function createDefaultConfig(mode: ClonerMode): ClonerConfig {
  switch (mode) {
    case 'linear':
      return {
        mode: 'linear',
        count: 10,
        direction: 'x',
        spacing: 1,
        offset: [0, 0, 0],
      };
    case 'radial':
      return {
        mode: 'radial',
        count: 8,
        radius: 2,
        startAngle: 0,
        endAngle: 360,
        plane: 'xz',
        alignToRadius: true,
      };
    case 'grid':
      return {
        mode: 'grid',
        countX: 3,
        countY: 3,
        countZ: 1,
        spacingX: 1,
        spacingY: 1,
        spacingZ: 1,
        centered: true,
      };
    case 'scatter':
      return {
        mode: 'scatter',
        count: 50,
        distribution: 'box',
        boundingBox: {
          min: [-5, 0, -5],
          max: [5, 0, 5],
        },
        seed: Math.floor(Math.random() * 10000),
        minScale: 0.8,
        maxScale: 1.2,
        uniformScale: true,
        randomRotation: true,
      };
    case 'spline':
      return {
        mode: 'spline',
        count: 20,
        splinePoints: [
          [0, 0, 0],
          [2, 1, 0],
          [4, 0, 0],
          [6, 1, 0],
        ],
        splineType: 'catmullrom',
        tension: 0.5,
        alignToSpline: true,
        distributeEvenly: true,
      };
    case 'object':
      return {
        mode: 'object',
        sourceObjectId: '',
        target: 'vertices',
        alignToNormal: true,
        scale: 1,
      };
  }
}

function createDefaultEffector(type: EffectorType): ClonerEffector {
  const base = {
    id: `effector-${Date.now()}`,
    name: `${type} effector`,
    enabled: true,
    strength: 1,
    affects: {
      position: true,
      rotation: false,
      scale: false,
      color: false,
      visibility: false,
    },
  };

  switch (type) {
    case 'random':
      return {
        ...base,
        type: 'random',
        seed: Math.floor(Math.random() * 10000),
        positionRange: [0.5, 0.5, 0.5],
        rotationRange: [45, 45, 45],
        scaleRange: [0.8, 1.2],
        uniformScale: true,
      };
    case 'falloff':
      return {
        ...base,
        type: 'falloff',
        shape: 'spherical',
        center: [0, 0, 0],
        radius: 5,
        falloffCurve: 'smooth',
        invert: false,
      };
    case 'noise':
      return {
        ...base,
        type: 'noise',
        noiseType: 'perlin',
        frequency: 1,
        octaves: 3,
        amplitude: 1,
      };
    case 'step':
      return {
        ...base,
        type: 'step',
        stepSize: 2,
        offset: 0,
      };
    case 'target':
      return {
        ...base,
        type: 'target',
        targetPosition: [0, 0, 0],
        influenceRadius: 5,
        attractionStrength: 1,
      };
  }
}

// ============== MAIN PANEL ==============

export function ClonerPanel({
  cloners,
  selectedClonerId,
  availableObjects,
  onCreateCloner,
  onUpdateCloner,
  onDeleteCloner,
  onSelectCloner,
}: ClonerPanelProps) {
  const handleCreateCloner = () => {
    const cloner: Cloner = {
      id: `cloner-${Date.now()}`,
      name: `Cloner ${cloners.length + 1}`,
      sourceObjectId: availableObjects[0]?.id || '',
      config: createDefaultConfig('linear'),
      instances: [],
      enabled: true,
      useInstancing: true,
    };
    onCreateCloner(cloner);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Copy size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold">Cloners</h3>
        </div>
        <button
          onClick={handleCreateCloner}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 rounded"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Cloner List */}
      {cloners.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-xs">
          <Copy size={24} className="mx-auto mb-2 opacity-50" />
          <p>No cloners yet</p>
          <p className="text-[10px] mt-1">Create a cloner to duplicate objects</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cloners.map((cloner) => (
            <ClonerItem
              key={cloner.id}
              cloner={cloner}
              isSelected={cloner.id === selectedClonerId}
              onSelect={() => onSelectCloner(cloner.id)}
              onUpdate={(updates) => onUpdateCloner(cloner.id, updates)}
              onDelete={() => onDeleteCloner(cloner.id)}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="text-[10px] text-zinc-500 space-y-1">
        <p>• Linear: Line of clones along an axis</p>
        <p>• Radial: Circular array of clones</p>
        <p>• Grid: 3D grid of clones</p>
        <p>• Scatter: Random distribution</p>
        <p>• Spline: Along a curved path</p>
      </div>
    </div>
  );
}

export default ClonerPanel;
