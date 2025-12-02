'use client';

/**
 * VariablesPanel - Scene Variables Management
 *
 * Allows creating, editing, and deleting scene-wide variables
 * that can be used in event conditions and actions.
 */

import React, { useState } from 'react';
import { useSelection, SceneVariable, SceneVariableType } from '../r3f/SceneSelectionContext';
import {
  Plus,
  Trash2,
  Hash,
  ToggleLeft,
  Type,
  ChevronDown,
  ChevronRight,
  Variable,
  RefreshCw,
  Play,
  Zap,
} from 'lucide-react';
import {
  executeVariableAction,
  getActionsForType,
  getActionLabel,
  type VariableAction,
} from '../utils/variable-runtime';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

interface VariableEditorProps {
  variable: SceneVariable;
  onUpdate: (updated: SceneVariable) => void;
  onRemove: () => void;
}

function VariableEditor({ variable, onUpdate, onRemove }: VariableEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const getTypeIcon = (type: SceneVariableType) => {
    switch (type) {
      case 'boolean': return ToggleLeft;
      case 'number': return Hash;
      case 'string': return Type;
    }
  };

  const TypeIcon = getTypeIcon(variable.type);

  return (
    <div className="bg-[#222] rounded-lg border border-gray-700 overflow-hidden">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
        <TypeIcon size={14} className="text-purple-400" />
        <span className="flex-1 text-sm font-medium text-gray-200">
          {variable.name}
        </span>
        <span className="text-xs text-gray-500 px-2 py-0.5 bg-[#1a1a1a] rounded">
          {variable.type === 'boolean'
            ? (variable.value ? 'true' : 'false')
            : String(variable.value)}
        </span>
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

      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-gray-800">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name</label>
            <input
              type="text"
              value={variable.name}
              onChange={(e) => onUpdate({ ...variable, name: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="Variable name"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={variable.type}
              onChange={(e) => {
                const newType = e.target.value as SceneVariableType;
                let newValue: boolean | number | string;
                switch (newType) {
                  case 'boolean':
                    newValue = false;
                    break;
                  case 'number':
                    newValue = 0;
                    break;
                  case 'string':
                    newValue = '';
                    break;
                }
                onUpdate({
                  ...variable,
                  type: newType,
                  value: newValue,
                  defaultValue: newValue,
                });
              }}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
            >
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
              <option value="string">String</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Current Value</label>
            {variable.type === 'boolean' ? (
              <button
                onClick={() => onUpdate({ ...variable, value: !variable.value })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  variable.value
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-[#1a1a1a] border-gray-700 text-gray-400'
                }`}
              >
                <span>{variable.value ? 'true' : 'false'}</span>
                <ToggleLeft size={18} className={variable.value ? 'rotate-180' : ''} />
              </button>
            ) : variable.type === 'number' ? (
              <input
                type="number"
                value={variable.value as number}
                onChange={(e) => onUpdate({ ...variable, value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
            ) : (
              <input
                type="text"
                value={variable.value as string}
                onChange={(e) => onUpdate({ ...variable, value: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                placeholder="Enter value"
              />
            )}
          </div>

          {/* Default Value */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Default Value (on reset)</label>
            {variable.type === 'boolean' ? (
              <button
                onClick={() => onUpdate({ ...variable, defaultValue: !variable.defaultValue })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  variable.defaultValue
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-[#1a1a1a] border-gray-700 text-gray-400'
                }`}
              >
                <span>{variable.defaultValue ? 'true' : 'false'}</span>
                <ToggleLeft size={18} className={variable.defaultValue ? 'rotate-180' : ''} />
              </button>
            ) : variable.type === 'number' ? (
              <input
                type="number"
                value={variable.defaultValue as number}
                onChange={(e) => onUpdate({ ...variable, defaultValue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              />
            ) : (
              <input
                type="text"
                value={variable.defaultValue as string}
                onChange={(e) => onUpdate({ ...variable, defaultValue: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                placeholder="Enter default value"
              />
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quick Actions</label>
            <div className="flex flex-wrap gap-1">
              {getActionsForType(variable.type).map((action) => (
                <QuickActionButton
                  key={action}
                  action={action}
                  variable={variable}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickActionButtonProps {
  action: VariableAction;
  variable: SceneVariable;
  onUpdate: (updated: SceneVariable) => void;
}

function QuickActionButton({ action, variable, onUpdate }: QuickActionButtonProps) {
  const [inputValue, setInputValue] = useState<string>('1');
  const [showInput, setShowInput] = useState(false);

  // Actions that require additional input
  const needsInput = ['increment', 'decrement', 'multiply', 'divide', 'append', 'prepend'].includes(action);

  const handleExecute = () => {
    let value: boolean | number | string | undefined;

    if (needsInput) {
      if (variable.type === 'number') {
        value = parseFloat(inputValue) || 1;
      } else {
        value = inputValue;
      }
    }

    const newValue = executeVariableAction(variable, {
      action,
      variableId: variable.id,
      value,
    });

    onUpdate({ ...variable, value: newValue });
    setShowInput(false);
  };

  if (needsInput && showInput) {
    return (
      <div className="flex items-center gap-1 bg-[#1a1a1a] rounded px-2 py-1 border border-purple-500/30">
        <input
          type={variable.type === 'number' ? 'number' : 'text'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-12 bg-transparent text-xs text-gray-200 outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleExecute();
            if (e.key === 'Escape') setShowInput(false);
          }}
        />
        <button
          onClick={handleExecute}
          className="p-0.5 text-purple-400 hover:text-purple-300"
        >
          <Play size={10} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => needsInput ? setShowInput(true) : handleExecute()}
      className="flex items-center gap-1 px-2 py-1 text-xs bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-gray-100 rounded border border-gray-700 hover:border-gray-600 transition-colors"
      title={getActionLabel(action)}
    >
      <Zap size={10} className="text-purple-400" />
      {action === 'reset' ? 'Reset' :
       action === 'toggle' ? 'Toggle' :
       action === 'set' ? 'Set' :
       action}
    </button>
  );
}

export default function VariablesPanel() {
  const { sceneVariables, addVariable, updateVariable, removeVariable, setSceneVariables } = useSelection();
  const [showNewVariable, setShowNewVariable] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<SceneVariableType>('boolean');

  const handleAddVariable = () => {
    if (!newVarName.trim()) return;

    let defaultValue: boolean | number | string;
    switch (newVarType) {
      case 'boolean':
        defaultValue = false;
        break;
      case 'number':
        defaultValue = 0;
        break;
      case 'string':
        defaultValue = '';
        break;
    }

    addVariable(newVarName.trim(), newVarType, defaultValue);
    setNewVarName('');
    setShowNewVariable(false);
  };

  const handleUpdateVariable = (id: string, updated: SceneVariable) => {
    setSceneVariables(sceneVariables.map(v => v.id === id ? updated : v));
  };

  const handleRemoveVariable = (id: string) => {
    removeVariable(id);
  };

  const resetAllVariables = () => {
    setSceneVariables(sceneVariables.map(v => ({ ...v, value: v.defaultValue })));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-300">
          Variables
          <span className="ml-2 text-xs text-gray-500">
            {sceneVariables.length} variable{sceneVariables.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sceneVariables.length > 0 && (
            <button
              onClick={resetAllVariables}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded transition-colors"
              title="Reset all to default"
            >
              <RefreshCw size={12} />
            </button>
          )}
          <button
            onClick={() => setShowNewVariable(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>

      {/* New Variable Form */}
      {showNewVariable && (
        <div className="bg-[#1a1a1a] rounded-lg border border-purple-500/30 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable name"
              className="flex-1 bg-[#111] border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddVariable();
                if (e.key === 'Escape') setShowNewVariable(false);
              }}
            />
            <select
              value={newVarType}
              onChange={(e) => setNewVarType(e.target.value as SceneVariableType)}
              className="bg-[#111] border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200"
            >
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
              <option value="string">String</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewVariable(false)}
              className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVariable}
              disabled={!newVarName.trim()}
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      <div className="space-y-2">
        {sceneVariables.length === 0 && !showNewVariable && (
          <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
            <Variable className="mx-auto mb-2 text-gray-600" size={24} />
            <p className="text-sm text-gray-500 mb-2">No variables yet</p>
            <p className="text-xs text-gray-600">
              Variables store data that can be used in event conditions
            </p>
          </div>
        )}

        {sceneVariables.map((variable) => (
          <VariableEditor
            key={variable.id}
            variable={variable}
            onUpdate={(updated) => handleUpdateVariable(variable.id, updated)}
            onRemove={() => handleRemoveVariable(variable.id)}
          />
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Tip:</strong> Use variables in event conditions
          to create dynamic, state-based interactions.
        </p>
      </div>
    </div>
  );
}
