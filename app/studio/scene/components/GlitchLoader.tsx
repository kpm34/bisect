'use client';

import { useEffect, useState, useRef } from 'react';

interface GlitchLoaderProps {
  progress: number;
  fileName?: string;
  fileSize?: string;
}

/**
 * Combined Glitch Text + 3D Rings Loading Animation
 *
 * Features:
 * - 3D rotating rings (from html {.css)
 * - Matrix-style glitch text effect (from Untitled-2.js)
 * - Progress-aware: text reveals as scene loads
 * - Synced with actual loading progress
 */
export default function GlitchLoader({ progress, fileName, fileSize }: GlitchLoaderProps) {
  const [displayText, setDisplayText] = useState('LOADING...');
  const [glitchChars, setGlitchChars] = useState<string[]>([]);
  const animationFrame = useRef<number>();
  const cycleCount = useRef(0);
  const letterIndex = useRef(0);

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+{}|[]\\;\':"<>?,./`~'.split('');
  const TARGET_TEXT = 'LOADING...';
  const LETTERS = TARGET_TEXT.split('');

  useEffect(() => {
    // Initialize with random characters
    setGlitchChars(LETTERS.map(() => '-'));

    const animate = () => {
      const currentProgress = Math.floor((progress / 100) * LETTERS.length);

      setGlitchChars(prev => {
        return prev.map((char, index) => {
          // Already revealed
          if (index < currentProgress) {
            return LETTERS[index];
          }

          // Not yet revealed - show random glitch
          if (LETTERS[index] === ' ') {
            return ' ';
          }

          // Random character with opacity effect
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        });
      });

      if (progress < 100) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        // Reveal all on completion
        setGlitchChars(LETTERS);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [progress]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 backdrop-blur-md z-50">
      <div className="flex flex-col items-center justify-center gap-6 relative">
        {/* Ambient glow effect */}
        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full"></div>
        {/* 3D Rotating Rings Loader */}
        <div className="loader">
          <div className="inner one"></div>
          <div className="inner two"></div>
          <div className="inner three"></div>
        </div>

        {/* Glitch Text */}
        <div className="glitch-text">
          {glitchChars.map((char, index) => {
            const isRevealed = index < Math.floor((progress / 100) * LETTERS.length);
            return (
              <span
                key={index}
                className={isRevealed ? 'revealed' : 'glitching'}
                style={{
                  opacity: isRevealed ? 1 : Math.random() * 0.5 + 0.5,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <div className="text-cyan-400 text-sm font-mono">
          {progress}%
        </div>

        {/* File Info */}
        {fileName && (
          <div className="text-gray-400 text-xs text-center max-w-xs">
            <div className="truncate">{fileName}</div>
            {fileSize && <div className="text-gray-500 mt-1">{fileSize}</div>}
          </div>
        )}
      </div>

      <style jsx>{`
        /* 3D Rotating Rings Loader */
        .loader {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          perspective: 800px;
        }

        .inner {
          position: absolute;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .inner.one {
          left: 0%;
          top: 0%;
          animation: rotate-one 1s linear infinite;
          border-bottom: 3px solid #06b6d4;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }

        .inner.two {
          right: 0%;
          top: 0%;
          animation: rotate-two 1s linear infinite;
          border-right: 3px solid #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .inner.three {
          right: 0%;
          bottom: 0%;
          animation: rotate-three 1s linear infinite;
          border-top: 3px solid #0ea5e9;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }

        @keyframes rotate-one {
          0% {
            transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
          }
        }

        @keyframes rotate-two {
          0% {
            transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
          }
        }

        @keyframes rotate-three {
          0% {
            transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
          }
        }

        /* Glitch Text Effect */
        .glitch-text {
          font-family: 'Source Code Pro', 'Courier New', monospace;
          font-size: 2.5em;
          color: #94a3b8;
          text-shadow: 0 0 20px rgba(6, 182, 212, 0.6), 0 0 10px rgba(59, 130, 246, 0.4);
          letter-spacing: 0.1em;
          display: flex;
        }

        .glitch-text span {
          display: inline-block;
          transition: all 150ms ease-out;
        }

        .glitch-text .revealed {
          color: #06b6d4;
          text-shadow: 0 0 20px rgba(6, 182, 212, 0.8), 0 0 10px rgba(59, 130, 246, 0.6);
          transform: scale(1);
        }

        .glitch-text .glitching {
          color: #64748b;
          transform: scale(0.9);
        }

        /* Scanline Overlay Effect */
        .glitch-text::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: linear-gradient(transparent 0%, rgba(6, 182, 212, 0.1) 50%);
          background-size: 1000px 2px;
          pointer-events: none;
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100px;
          }
        }
      `}</style>
    </div>
  );
}
