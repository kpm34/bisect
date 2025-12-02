'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pencil, Home, LayoutDashboard, Video } from 'lucide-react';

/**
 * Minimal top navigation bar for 3D Canvas Editor
 * Provides quick access to Home, Dashboard, Vector Studio, and Video Studio
 */
export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/studio/svg-canvas', label: 'Vector Studio', icon: Pencil },
    { href: '/studio/video-studio', label: 'Video Studio', icon: Video },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center px-3 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800/50 z-50">
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
