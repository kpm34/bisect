'use client';

import React from 'react';
import { useSelection } from '../r3f/SceneSelectionContext';
import { Sun, Zap, Aperture, Eye } from 'lucide-react';

export default function EffectsControls() {
    const { effects, setEffects } = useSelection();

    const toggleEffect = (key: keyof typeof effects) => {
        setEffects({ ...effects, [key]: !effects[key] });
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Sun size={16} className="text-amber-500" />
                    Bloom (Glow)
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Enable soft glow</span>
                    <button
                        onClick={() => toggleEffect('bloom')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${effects.bloom ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${effects.bloom ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-purple-500" />
                    Glitch
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Digital distortion</span>
                    <button
                        onClick={() => toggleEffect('glitch')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${effects.glitch ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${effects.glitch ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Aperture size={16} className="text-green-500" />
                    Noise (Grain)
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Film grain texture</span>
                    <button
                        onClick={() => toggleEffect('noise')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${effects.noise ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${effects.noise ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye size={16} className="text-blue-500" />
                    Vignette
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Darken corners</span>
                    <button
                        onClick={() => toggleEffect('vignette')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${effects.vignette ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${effects.vignette ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
