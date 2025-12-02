'use client';

/**
 * EventsPanel - Spline-style Events and Actions system
 *
 * Triggers: Start, Mouse (click/hover/up/down), Keyboard, Scroll, Collision, State Change
 * Actions: Transform, Color, Visibility, Animation, Destroy, Custom
 */

import React, { useState, useMemo } from 'react';
import { useSelection, SceneObject, SceneVariable } from '../r3f/SceneSelectionContext';
import {
  Play,
  MousePointer2,
  Keyboard,
  MoveVertical,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Palette,
  Move,
  RotateCcw,
  Maximize2,
  Volume2,
  Shuffle,
  Target,
  Timer,
  ArrowUp,
  ArrowDown,
  Hand,
  Circle
} from 'lucide-react';

// ============== TYPE DEFINITIONS ==============

type TriggerType =
  | 'start'
  | 'mouseClick'
  | 'mouseHover'
  | 'mouseDown'
  | 'mouseUp'
  | 'keyDown'
  | 'keyUp'
  | 'scroll'
  | 'collision'
  | 'stateChange'
  | 'timerComplete'
  | 'lookAt'
  | 'follow';

type ActionType =
  | 'move'
  | 'rotate'
  | 'scale'
  | 'setColor'
  | 'randomColor'
  | 'show'
  | 'hide'
  | 'toggle'
  | 'destroy'
  | 'playAnimation'
  | 'stopAnimation'
  | 'playSound'
  | 'setState'
  | 'resetTransform'
  | 'applyForce'
  | 'lookAt'
  | 'follow'
  | 'stopLookAt'
  | 'stopFollow'
  | 'setVariable'
  | 'toggleVariable'
  | 'incrementVariable';

// Condition operators for conditional actions
type ConditionOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'isTrue' | 'isFalse';

interface EventTrigger {
  type: TriggerType;
  key?: string; // For keyboard events
  targetState?: string; // For state change
  delay?: number; // Delay before action (ms)
}

interface EventAction {
  type: ActionType;
  value?: any; // Action-specific value
  duration?: number; // Animation duration (ms)
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
  relative?: boolean; // Relative vs absolute transform
  // Conditional execution
  condition?: {
    variable: string;
    operator: ConditionOperator;
    compareValue?: any;
  };
  // Sound-specific
  soundUrl?: string;
  volume?: number;
  // Target-specific (for lookAt, follow)
  targetId?: string;
  smooth?: number;
}

interface SceneEvent {
  id: string;
  name: string;
  enabled: boolean;
  trigger: EventTrigger;
  actions: EventAction[];
}

// ============== TRIGGER CONFIG ==============

const TRIGGER_GROUPS = [
  {
    label: 'Start',
    triggers: [
      { type: 'start' as TriggerType, label: 'Start', icon: Play, description: 'When scene loads' },
    ]
  },
  {
    label: 'Mouse',
    triggers: [
      { type: 'mouseClick' as TriggerType, label: 'Mouse Click', icon: MousePointer2, description: 'On click' },
      { type: 'mouseHover' as TriggerType, label: 'Mouse Hover', icon: Hand, description: 'On hover' },
      { type: 'mouseDown' as TriggerType, label: 'Mouse Down', icon: ArrowDown, description: 'On press' },
      { type: 'mouseUp' as TriggerType, label: 'Mouse Up', icon: ArrowUp, description: 'On release' },
    ]
  },
  {
    label: 'Keyboard',
    triggers: [
      { type: 'keyDown' as TriggerType, label: 'Key Down', icon: Keyboard, description: 'On key press' },
      { type: 'keyUp' as TriggerType, label: 'Key Up', icon: Keyboard, description: 'On key release' },
    ]
  },
  {
    label: 'Interaction',
    triggers: [
      { type: 'scroll' as TriggerType, label: 'Scroll', icon: MoveVertical, description: 'On scroll' },
      { type: 'lookAt' as TriggerType, label: 'Look At', icon: Eye, description: 'When camera looks at' },
      { type: 'follow' as TriggerType, label: 'Follow', icon: Target, description: 'Follow cursor/object' },
    ]
  },
  {
    label: 'Physics',
    triggers: [
      { type: 'collision' as TriggerType, label: 'Collision', icon: Zap, description: 'On collision' },
    ]
  },
  {
    label: 'State',
    triggers: [
      { type: 'stateChange' as TriggerType, label: 'State Change', icon: RefreshCw, description: 'On state change' },
      { type: 'timerComplete' as TriggerType, label: 'Timer Complete', icon: Timer, description: 'After delay' },
    ]
  },
];

// ============== ACTION CONFIG ==============

const ACTION_GROUPS = [
  {
    label: 'Transform',
    actions: [
      { type: 'move' as ActionType, label: 'Move', icon: Move, description: 'Change position' },
      { type: 'rotate' as ActionType, label: 'Rotate', icon: RotateCcw, description: 'Change rotation' },
      { type: 'scale' as ActionType, label: 'Scale', icon: Maximize2, description: 'Change scale' },
      { type: 'resetTransform' as ActionType, label: 'Reset', icon: RefreshCw, description: 'Reset to original' },
    ]
  },
  {
    label: 'Appearance',
    actions: [
      { type: 'setColor' as ActionType, label: 'Set Color', icon: Palette, description: 'Set specific color' },
      { type: 'randomColor' as ActionType, label: 'Random Color', icon: Shuffle, description: 'Random color' },
      { type: 'show' as ActionType, label: 'Show', icon: Eye, description: 'Make visible' },
      { type: 'hide' as ActionType, label: 'Hide', icon: EyeOff, description: 'Make invisible' },
      { type: 'toggle' as ActionType, label: 'Toggle', icon: Circle, description: 'Toggle visibility' },
    ]
  },
  {
    label: 'Animation',
    actions: [
      { type: 'playAnimation' as ActionType, label: 'Play', icon: Play, description: 'Play animation' },
      { type: 'stopAnimation' as ActionType, label: 'Stop', icon: RefreshCw, description: 'Stop animation' },
    ]
  },
  {
    label: 'Physics',
    actions: [
      { type: 'applyForce' as ActionType, label: 'Apply Force', icon: Zap, description: 'Push object' },
      { type: 'destroy' as ActionType, label: 'Destroy', icon: Trash2, description: 'Remove object' },
    ]
  },
  {
    label: 'Behaviors',
    actions: [
      { type: 'lookAt' as ActionType, label: 'Look At', icon: Eye, description: 'Face target' },
      { type: 'follow' as ActionType, label: 'Follow', icon: Target, description: 'Follow target' },
      { type: 'stopLookAt' as ActionType, label: 'Stop Look At', icon: EyeOff, description: 'Stop facing' },
      { type: 'stopFollow' as ActionType, label: 'Stop Follow', icon: RefreshCw, description: 'Stop following' },
    ]
  },
  {
    label: 'Audio',
    actions: [
      { type: 'playSound' as ActionType, label: 'Play Sound', icon: Volume2, description: 'Play audio file' },
    ]
  },
  {
    label: 'Variables',
    actions: [
      { type: 'setVariable' as ActionType, label: 'Set Variable', icon: RefreshCw, description: 'Set variable value' },
      { type: 'toggleVariable' as ActionType, label: 'Toggle Variable', icon: Circle, description: 'Toggle boolean' },
      { type: 'incrementVariable' as ActionType, label: 'Increment', icon: Plus, description: 'Add to number' },
    ]
  },
  {
    label: 'State',
    actions: [
      { type: 'setState' as ActionType, label: 'Set State', icon: RefreshCw, description: 'Change object state' },
    ]
  },
];

// ============== HELPER FUNCTIONS ==============

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getTriggerConfig(type: TriggerType) {
  for (const group of TRIGGER_GROUPS) {
    const trigger = group.triggers.find(t => t.type === type);
    if (trigger) return trigger;
  }
  return null;
}

function getActionConfig(type: ActionType) {
  for (const group of ACTION_GROUPS) {
    const action = group.actions.find(a => a.type === type);
    if (action) return action;
  }
  return null;
}

// ============== COMPONENTS ==============

interface TriggerSelectorProps {
  onSelect: (type: TriggerType) => void;
  onClose: () => void;
}

function TriggerSelector({ onSelect, onClose }: TriggerSelectorProps) {
  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
      {TRIGGER_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-[#111] sticky top-0">
            {group.label}
          </div>
          {group.triggers.map((trigger) => {
            const Icon = trigger.icon;
            return (
              <button
                key={trigger.type}
                onClick={() => {
                  onSelect(trigger.type);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors"
              >
                <Icon size={14} className="text-blue-400" />
                <span>{trigger.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface ActionSelectorProps {
  onSelect: (type: ActionType) => void;
  onClose: () => void;
}

function ActionSelector({ onSelect, onClose }: ActionSelectorProps) {
  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
      {ACTION_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-[#111] sticky top-0">
            {group.label}
          </div>
          {group.actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.type}
                onClick={() => {
                  onSelect(action.type);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors"
              >
                <Icon size={14} className="text-green-400" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface ActionEditorProps {
  action: EventAction;
  onChange: (updated: EventAction) => void;
  onRemove: () => void;
  sceneVariables: SceneVariable[];
  sceneObjects: { id: string; name: string }[];
}

function ActionEditor({ action, onChange, onRemove, sceneVariables, sceneObjects }: ActionEditorProps) {
  const config = getActionConfig(action.type);
  if (!config) return null;
  const Icon = config.icon;
  const [showCondition, setShowCondition] = useState(!!action.condition);

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-green-400" />
          <span className="text-sm font-medium text-gray-200">{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowCondition(!showCondition);
              if (showCondition) {
                // Remove condition when hiding
                const { condition, ...rest } = action;
                onChange(rest as EventAction);
              }
            }}
            className={`p-1 text-xs rounded transition-colors ${showCondition ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-yellow-400'}`}
            title="Add condition"
          >
            If
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Conditional execution */}
      {showCondition && (
        <div className="mb-3 p-2 bg-[#111] rounded border border-yellow-900/30">
          <label className="text-xs text-yellow-400 mb-1 block">Run if:</label>
          <div className="flex gap-2 items-center">
            <select
              value={action.condition?.variable || ''}
              onChange={(e) => onChange({
                ...action,
                condition: { ...action.condition, variable: e.target.value, operator: action.condition?.operator || 'equals' }
              })}
              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="">Select variable...</option>
              {sceneVariables.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
            <select
              value={action.condition?.operator || 'equals'}
              onChange={(e) => onChange({
                ...action,
                condition: { ...action.condition, variable: action.condition?.variable || '', operator: e.target.value as ConditionOperator }
              })}
              className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="equals">=</option>
              <option value="notEquals">≠</option>
              <option value="greaterThan">&gt;</option>
              <option value="lessThan">&lt;</option>
              <option value="isTrue">is true</option>
              <option value="isFalse">is false</option>
            </select>
            {!['isTrue', 'isFalse'].includes(action.condition?.operator || '') && (
              <input
                type="text"
                value={action.condition?.compareValue ?? ''}
                onChange={(e) => onChange({
                  ...action,
                  condition: { ...action.condition, variable: action.condition?.variable || '', operator: action.condition?.operator || 'equals', compareValue: e.target.value }
                })}
                placeholder="value"
                className="w-20 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              />
            )}
          </div>
        </div>
      )}

      {/* Action-specific parameters */}
      {(action.type === 'move' || action.type === 'rotate' || action.type === 'scale') && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">X</label>
              <input
                type="number"
                value={action.value?.x ?? 0}
                onChange={(e) => onChange({ ...action, value: { ...action.value, x: parseFloat(e.target.value) || 0 } })}
                className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
                step={action.type === 'rotate' ? 15 : 0.1}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Y</label>
              <input
                type="number"
                value={action.value?.y ?? 0}
                onChange={(e) => onChange({ ...action, value: { ...action.value, y: parseFloat(e.target.value) || 0 } })}
                className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
                step={action.type === 'rotate' ? 15 : 0.1}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Z</label>
              <input
                type="number"
                value={action.value?.z ?? 0}
                onChange={(e) => onChange({ ...action, value: { ...action.value, z: parseFloat(e.target.value) || 0 } })}
                className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
                step={action.type === 'rotate' ? 15 : 0.1}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={action.relative ?? true}
              onChange={(e) => onChange({ ...action, relative: e.target.checked })}
              className="rounded bg-[#111] border-gray-700"
            />
            Relative (add to current)
          </label>
        </div>
      )}

      {action.type === 'setColor' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Color</label>
          <input
            type="color"
            value={action.value || '#ffffff'}
            onChange={(e) => onChange({ ...action, value: e.target.value })}
            className="w-8 h-8 rounded border border-gray-700 cursor-pointer"
          />
          <input
            type="text"
            value={action.value || '#ffffff'}
            onChange={(e) => onChange({ ...action, value: e.target.value })}
            className="flex-1 bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
          />
        </div>
      )}

      {action.type === 'applyForce' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500">Force X</label>
            <input
              type="number"
              value={action.value?.x ?? 0}
              onChange={(e) => onChange({ ...action, value: { ...action.value, x: parseFloat(e.target.value) || 0 } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Force Y</label>
            <input
              type="number"
              value={action.value?.y ?? 5}
              onChange={(e) => onChange({ ...action, value: { ...action.value, y: parseFloat(e.target.value) || 0 } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Force Z</label>
            <input
              type="number"
              value={action.value?.z ?? 0}
              onChange={(e) => onChange({ ...action, value: { ...action.value, z: parseFloat(e.target.value) || 0 } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
        </div>
      )}

      {/* Play Sound */}
      {action.type === 'playSound' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Sound URL</label>
            <input
              type="text"
              value={action.soundUrl || ''}
              onChange={(e) => onChange({ ...action, soundUrl: e.target.value })}
              placeholder="https://example.com/sound.mp3"
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Volume (0-1)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={action.volume ?? 1}
              onChange={(e) => onChange({ ...action, volume: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{action.volume ?? 1}</span>
          </div>
        </div>
      )}

      {/* Look At / Follow */}
      {(action.type === 'lookAt' || action.type === 'follow') && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Target Object</label>
            <select
              value={action.targetId || ''}
              onChange={(e) => onChange({ ...action, targetId: e.target.value })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="">Select target...</option>
              <option value="cursor">Mouse Cursor</option>
              <option value="camera">Camera</option>
              {sceneObjects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Smoothing (0-1)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={action.smooth ?? 0.1}
              onChange={(e) => onChange({ ...action, smooth: parseFloat(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{action.smooth ?? 0.1}</span>
          </div>
        </div>
      )}

      {/* Set Variable */}
      {action.type === 'setVariable' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Variable</label>
            <select
              value={action.value?.variable || ''}
              onChange={(e) => onChange({ ...action, value: { ...action.value, variable: e.target.value } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="">Select variable...</option>
              {sceneVariables.map(v => (
                <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Value</label>
            <input
              type="text"
              value={action.value?.newValue ?? ''}
              onChange={(e) => onChange({ ...action, value: { ...action.value, newValue: e.target.value } })}
              placeholder="New value"
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
        </div>
      )}

      {/* Toggle Variable */}
      {action.type === 'toggleVariable' && (
        <div>
          <label className="text-xs text-gray-500">Boolean Variable</label>
          <select
            value={action.value?.variable || ''}
            onChange={(e) => onChange({ ...action, value: { variable: e.target.value } })}
            className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
          >
            <option value="">Select variable...</option>
            {sceneVariables.filter(v => v.type === 'boolean').map(v => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Increment Variable */}
      {action.type === 'incrementVariable' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Number Variable</label>
            <select
              value={action.value?.variable || ''}
              onChange={(e) => onChange({ ...action, value: { ...action.value, variable: e.target.value } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="">Select variable...</option>
              {sceneVariables.filter(v => v.type === 'number').map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Amount (can be negative)</label>
            <input
              type="number"
              value={action.value?.amount ?? 1}
              onChange={(e) => onChange({ ...action, value: { ...action.value, amount: parseFloat(e.target.value) || 1 } })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            />
          </div>
        </div>
      )}

      {/* Set State */}
      {action.type === 'setState' && (
        <div>
          <label className="text-xs text-gray-500">State Name</label>
          <input
            type="text"
            value={action.value || ''}
            onChange={(e) => onChange({ ...action, value: e.target.value })}
            placeholder="e.g., active, hover, pressed"
            className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
          />
        </div>
      )}

      {/* Duration & Easing for animated actions */}
      {['move', 'rotate', 'scale', 'setColor'].includes(action.type) && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Duration (ms)</label>
            <input
              type="number"
              value={action.duration ?? 300}
              onChange={(e) => onChange({ ...action, duration: parseInt(e.target.value) || 300 })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              min={0}
              step={100}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Easing</label>
            <select
              value={action.easing ?? 'easeOut'}
              onChange={(e) => onChange({ ...action, easing: e.target.value as EventAction['easing'] })}
              className="w-full bg-[#111] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
              <option value="bounce">Bounce</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

interface EventCardProps {
  event: SceneEvent;
  onChange: (updated: SceneEvent) => void;
  onRemove: () => void;
  sceneVariables: SceneVariable[];
  sceneObjects: { id: string; name: string }[];
}

function EventCard({ event, onChange, onRemove, sceneVariables, sceneObjects }: EventCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showTriggerSelector, setShowTriggerSelector] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);

  const triggerConfig = getTriggerConfig(event.trigger.type);
  const TriggerIcon = triggerConfig?.icon || Play;

  const addAction = (type: ActionType) => {
    const newAction: EventAction = {
      type,
      value: type === 'move' || type === 'rotate' ? { x: 0, y: 0, z: 0 } :
             type === 'scale' ? { x: 1, y: 1, z: 1 } :
             type === 'setColor' ? '#ffffff' :
             type === 'applyForce' ? { x: 0, y: 5, z: 0 } :
             undefined,
      duration: 300,
      easing: 'easeOut',
      relative: true,
    };
    onChange({ ...event, actions: [...event.actions, newAction] });
  };

  const updateAction = (index: number, updated: EventAction) => {
    const newActions = [...event.actions];
    newActions[index] = updated;
    onChange({ ...event, actions: newActions });
  };

  const removeAction = (index: number) => {
    onChange({ ...event, actions: event.actions.filter((_, i) => i !== index) });
  };

  return (
    <div className="bg-[#222] rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        <TriggerIcon size={14} className="text-blue-400" />
        <input
          type="text"
          value={event.name}
          onChange={(e) => {
            e.stopPropagation();
            onChange({ ...event, name: e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm font-medium text-gray-200 focus:outline-none"
          placeholder="Event name"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange({ ...event, enabled: !event.enabled });
          }}
          className={`p-1 rounded transition-colors ${event.enabled ? 'text-green-400' : 'text-gray-600'}`}
        >
          {event.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Trigger */}
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Trigger</label>
            <button
              onClick={() => setShowTriggerSelector(!showTriggerSelector)}
              className="w-full flex items-center gap-2 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 hover:border-blue-500 transition-colors"
            >
              <TriggerIcon size={14} className="text-blue-400" />
              <span>{triggerConfig?.label || event.trigger.type}</span>
              <ChevronDown size={14} className="ml-auto text-gray-400" />
            </button>
            {showTriggerSelector && (
              <TriggerSelector
                onSelect={(type) => onChange({ ...event, trigger: { ...event.trigger, type } })}
                onClose={() => setShowTriggerSelector(false)}
              />
            )}
          </div>

          {/* Trigger-specific config */}
          {(event.trigger.type === 'keyDown' || event.trigger.type === 'keyUp') && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Key</label>
              <input
                type="text"
                value={event.trigger.key || ''}
                onChange={(e) => onChange({ ...event, trigger: { ...event.trigger, key: e.target.value.toUpperCase() } })}
                placeholder="Press a key..."
                onKeyDown={(e) => {
                  e.preventDefault();
                  onChange({ ...event, trigger: { ...event.trigger, key: e.key.toUpperCase() } });
                }}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
            </div>
          )}

          {event.trigger.type === 'timerComplete' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Delay (ms)</label>
              <input
                type="number"
                value={event.trigger.delay || 1000}
                onChange={(e) => onChange({ ...event, trigger: { ...event.trigger, delay: parseInt(e.target.value) || 1000 } })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                min={0}
                step={100}
              />
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Actions</label>
              <div className="relative">
                <button
                  onClick={() => setShowActionSelector(!showActionSelector)}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={12} />
                  Add Action
                </button>
                {showActionSelector && (
                  <ActionSelector
                    onSelect={addAction}
                    onClose={() => setShowActionSelector(false)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              {event.actions.length === 0 && (
                <div className="text-xs text-gray-600 text-center py-4 border border-dashed border-gray-700 rounded-lg">
                  No actions yet. Click "Add Action" to begin.
                </div>
              )}
              {event.actions.map((action, index) => (
                <ActionEditor
                  key={index}
                  action={action}
                  onChange={(updated) => updateAction(index, updated)}
                  onRemove={() => removeAction(index)}
                  sceneVariables={sceneVariables}
                  sceneObjects={sceneObjects}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export default function EventsPanel() {
  const { selectedObject, addedObjects, updateObject, sceneVariables } = useSelection();

  // Find the addedObject if selected object is one
  const selectedAddedObject = useMemo(() => {
    if (!selectedObject) return null;
    return addedObjects.find(o => o.id === selectedObject.uuid) || null;
  }, [selectedObject, addedObjects]);

  // Get/set events from userData or addedObject
  const [localEvents, setLocalEvents] = useState<SceneEvent[]>([]);

  // Sync events from selected object
  React.useEffect(() => {
    if (selectedAddedObject) {
      // Convert old format to new format if needed
      const events: SceneEvent[] = (selectedAddedObject as any).sceneEvents ||
        selectedAddedObject.events?.map(e => ({
          id: e.id,
          name: `${e.trigger} → ${e.action}`,
          enabled: true,
          trigger: { type: e.trigger as TriggerType },
          actions: [{
            type: e.action as ActionType,
            value: e.parameters,
          }]
        })) || [];
      setLocalEvents(events);
    } else if (selectedObject?.userData?.events) {
      setLocalEvents(selectedObject.userData.events);
    } else {
      setLocalEvents([]);
    }
  }, [selectedObject, selectedAddedObject]);

  // Save events back to object
  const saveEvents = (events: SceneEvent[]) => {
    setLocalEvents(events);

    if (selectedAddedObject) {
      updateObject(selectedAddedObject.id, {
        events: events.map(e => ({
          id: e.id,
          trigger: e.trigger.type as any,
          action: e.actions[0]?.type as any || 'move',
          parameters: e.actions[0]?.value,
        })),
        // Also store full events for new format
        sceneEvents: events,
      } as any);
    } else if (selectedObject) {
      selectedObject.userData.events = events;
    }
  };

  const addEvent = () => {
    const newEvent: SceneEvent = {
      id: generateId(),
      name: 'New Event',
      enabled: true,
      trigger: { type: 'mouseClick' },
      actions: [],
    };
    saveEvents([...localEvents, newEvent]);
  };

  const updateEvent = (id: string, updated: SceneEvent) => {
    saveEvents(localEvents.map(e => e.id === id ? updated : e));
  };

  const removeEvent = (id: string) => {
    saveEvents(localEvents.filter(e => e.id !== id));
  };

  // Build scene objects list for target selection
  const sceneObjects = useMemo(() => {
    return addedObjects
      .filter(obj => obj.id !== selectedObject?.uuid) // Exclude self
      .map(obj => ({ id: obj.id, name: obj.name }));
  }, [addedObjects, selectedObject]);

  // No object selected
  if (!selectedObject) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 text-sm">
          Select an object to add events
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-300">
          Events
          <span className="ml-2 text-xs text-gray-500">
            {localEvents.length} event{localEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={addEvent}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          <Plus size={12} />
          Add Event
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {localEvents.length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
            <Zap className="mx-auto mb-2 text-gray-600" size={24} />
            <p className="text-sm text-gray-500 mb-2">No events yet</p>
            <p className="text-xs text-gray-600">
              Add events to make this object interactive
            </p>
          </div>
        )}

        {localEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onChange={(updated) => updateEvent(event.id, updated)}
            onRemove={() => removeEvent(event.id)}
            sceneVariables={sceneVariables}
            sceneObjects={sceneObjects}
          />
        ))}
      </div>

      {/* Quick Info */}
      <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Tip:</strong> Events are triggered during scene playback.
          Use Start trigger for animations that begin immediately.
        </p>
      </div>
    </div>
  );
}
