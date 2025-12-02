'use client';

import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, Code2, FileJson, Braces } from 'lucide-react';
import { useSelection } from '../r3f/SceneSelectionContext';
import {
  generateR3FCode,
  generateR3FSceneCode,
  generateVanillaModuleCode,
  generateVanillaScriptCode,
  generateSceneJSONString,
} from '../utils/code-generators';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  environment: {
    preset: string;
    background: boolean;
    blur: number;
    intensity: number;
  };
}

type ExportFormat =
  | 'r3f-component'
  | 'r3f-scene'
  | 'vanilla-module'
  | 'vanilla-script'
  | 'scene-json';

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'react' | 'vanilla' | 'data';
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'r3f-component',
    label: 'R3F Component',
    description: 'Full React component with Canvas',
    icon: <Code2 className="w-4 h-4" />,
    category: 'react',
  },
  {
    id: 'r3f-scene',
    label: 'R3F Scene Only',
    description: 'Scene contents without Canvas wrapper',
    icon: <Code2 className="w-4 h-4" />,
    category: 'react',
  },
  {
    id: 'vanilla-module',
    label: 'Three.js Module',
    description: 'ES6 module for bundlers',
    icon: <Braces className="w-4 h-4" />,
    category: 'vanilla',
  },
  {
    id: 'vanilla-script',
    label: 'Three.js HTML',
    description: 'Standalone HTML file',
    icon: <Braces className="w-4 h-4" />,
    category: 'vanilla',
  },
  {
    id: 'scene-json',
    label: 'Scene JSON',
    description: 'Data export for custom loaders',
    icon: <FileJson className="w-4 h-4" />,
    category: 'data',
  },
];

export function CodeExportModal({ isOpen, onClose, environment }: CodeExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('r3f-component');
  const [copied, setCopied] = useState(false);
  const { addedObjects, lighting } = useSelection();

  const generatedCode = useMemo(() => {
    const options = {
      objects: addedObjects,
      lighting,
      environment,
    };

    switch (selectedFormat) {
      case 'r3f-component':
        return generateR3FCode({ ...options, includeCanvas: true });
      case 'r3f-scene':
        return generateR3FSceneCode(options);
      case 'vanilla-module':
        return generateVanillaModuleCode(options);
      case 'vanilla-script':
        return generateVanillaScriptCode(options);
      case 'scene-json':
        return generateSceneJSONString(options);
      default:
        return '';
    }
  }, [selectedFormat, addedObjects, lighting, environment]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const extension = getFileExtension(selectedFormat);
    const filename = `bisect-scene.${extension}`;
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const currentFormat = FORMAT_OPTIONS.find(f => f.id === selectedFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Export Code</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {addedObjects.length} object{addedObjects.length !== 1 ? 's' : ''} in scene
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Tabs */}
        <div className="px-6 py-3 border-b border-white/10 bg-black/20">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FORMAT_OPTIONS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedFormat === format.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {format.icon}
                {format.label}
              </button>
            ))}
          </div>
          {currentFormat && (
            <p className="text-xs text-gray-500 mt-2">{currentFormat.description}</p>
          )}
        </div>

        {/* Code Preview */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="relative h-full bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden">
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-xs text-gray-400 font-mono">
                {getFilename(selectedFormat)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="h-[calc(100%-44px)] overflow-auto p-4 text-sm font-mono text-gray-300 leading-relaxed">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Generated by Bisect</span>
            <span>{generatedCode.length.toLocaleString()} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'r3f-component':
    case 'r3f-scene':
      return 'tsx';
    case 'vanilla-module':
      return 'js';
    case 'vanilla-script':
      return 'html';
    case 'scene-json':
      return 'json';
    default:
      return 'txt';
  }
}

function getFilename(format: ExportFormat): string {
  switch (format) {
    case 'r3f-component':
      return 'BisectScene.tsx';
    case 'r3f-scene':
      return 'SceneContents.tsx';
    case 'vanilla-module':
      return 'scene.js';
    case 'vanilla-script':
      return 'index.html';
    case 'scene-json':
      return 'scene.json';
    default:
      return 'export.txt';
  }
}

export default CodeExportModal;
