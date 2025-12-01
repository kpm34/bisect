'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenTool, Box, Image, Layers } from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  className?: string;
  topBar?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
}

export function Shell({ 
  children, 
  className = '',
  topBar,
  leftPanel,
  rightPanel,
  bottomPanel
}: ShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/studio/svg-canvas', label: 'SVG Canvas', icon: PenTool },
    { href: '/studio/tex-factory', label: 'Tex Factory', icon: Image },
    { href: '/studio/3d-canvas', label: '3D Canvas', icon: Box },
  ];

  return (
    <div className={`flex h-screen bg-neutral-950 text-white overflow-hidden ${className}`}>
      {/* Main Content Area - Canvas + Nav */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Global Top Navigation - Only above canvas */}
        <nav className="h-14 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-900/50 backdrop-blur-sm z-50 shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-80 transition-opacity">
              <div className="w-3 h-3 bg-cta-orange rounded-sm rotate-45"></div>
              <span>Bisect</span>
            </Link>

            <div className="h-6 w-px bg-neutral-800 mx-2" />

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

        </nav>

        {/* Canvas Area */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Left Panel Slot */}
          {leftPanel && (
            <div className="z-40 relative h-full pointer-events-none">
              <div className="pointer-events-auto h-full">
                {leftPanel}
              </div>
            </div>
          )}

          {/* Center Content */}
          <div className="flex-1 relative flex flex-col min-w-0">
            {/* Top Bar Slot */}
            {topBar && (
              <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex justify-center pt-4">
                 <div className="pointer-events-auto">
                   {topBar}
                 </div>
              </div>
            )}

            <div className="flex-1 relative">
              {children}
            </div>

            {/* Bottom Panel Slot */}
            {bottomPanel && (
              <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
                <div className="pointer-events-auto w-full">
                  {bottomPanel}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Panel Slot - Full height, separate from nav */}
      {rightPanel && (
        <div className="z-40 h-full relative pointer-events-none shrink-0">
           <div className="pointer-events-auto h-full">
             {rightPanel}
           </div>
        </div>
      )}
    </div>
  );
}

