'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Box, PenTool, Palette, Upload } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: { name: string; type: ProjectType }) => void;
}

type ProjectType = '3d' | 'svg' | 'texture';

interface ProjectTypeOption {
  type: ProjectType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}

const projectTypes: ProjectTypeOption[] = [
  {
    type: '3d',
    icon: Box,
    label: '3D Scene',
    description: 'Edit 3D models, apply materials',
    color: '#6366f1'
  },
  {
    type: 'svg',
    icon: PenTool,
    label: 'Vector Design',
    description: 'Create logos and graphics',
    color: '#10b981'
  },
  {
    type: 'texture',
    icon: Palette,
    label: 'Texture Pack',
    description: 'Generate PBR materials',
    color: '#f59e0b'
  }
];

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectType>('3d');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setName('');
      setSelectedType('3d');
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), type: selectedType });
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ash-grey-200">
          <h2 id="modal-title" className="text-lg font-semibold text-ash-grey-900">
            New Project
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ash-grey-100 transition-colors"
          >
            <X className="w-5 h-5 text-ash-grey-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-ash-grey-700 mb-2">
              Project Name
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-2.5 bg-ash-grey-50 border border-ash-grey-200 rounded-lg text-ash-grey-900 placeholder:text-ash-grey-400 focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-ash-grey-700 mb-2">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {projectTypes.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelectedType(option.type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedType === option.type
                      ? 'border-cta-orange bg-cta-orange/5'
                      : 'border-ash-grey-200 hover:border-ash-grey-300 bg-white'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <option.icon className="w-5 h-5" style={{ color: option.color }} />
                  </div>
                  <div className="text-sm font-medium text-ash-grey-900">{option.label}</div>
                  <div className="text-xs text-ash-grey-500 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional: Upload existing file */}
          <div className="border-t border-ash-grey-200 pt-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ash-grey-300 rounded-lg text-ash-grey-500 hover:border-ash-grey-400 hover:text-ash-grey-600 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">Or upload an existing file</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ash-grey-600 hover:text-ash-grey-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-cta-orange hover:bg-cta-orange-hover disabled:bg-ash-grey-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
