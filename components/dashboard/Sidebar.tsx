'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  FolderOpen,
  Layers,
  Palette,
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  children?: FolderItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/dashboard/assets', label: 'Asset Library', icon: Layers },
  { href: '/dashboard/materials', label: 'Materials', icon: Palette },
];

// Placeholder folders - will be replaced with data from Supabase
const mockFolders: FolderItem[] = [
  { id: '1', name: 'Work', color: '#6366f1' },
  { id: '2', name: 'Personal', color: '#10b981' },
  { id: '3', name: 'Archive', color: '#6b7280' },
];

export function Sidebar({ currentPath }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-60'} h-full bg-white border-r border-ash-grey-200 flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-ash-grey-200">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-ash-grey-900 hover:opacity-80 transition-opacity">
          <Image src="/assets/bisect_logo.png" alt="Bisect" width={36} height={36} className="w-9 h-9 shrink-0" />
          {!isCollapsed && <span>Bisect</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main Nav Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.href ||
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-cta-orange/10 text-cta-orange font-medium'
                    : 'text-ash-grey-600 hover:text-ash-grey-900 hover:bg-ash-grey-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        {!isCollapsed && (
          <>
            <div className="h-px bg-ash-grey-200 my-4" />

            {/* Folders Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-medium text-ash-grey-500 uppercase tracking-wider">
                Folders
              </div>
              <div className="space-y-1">
                {mockFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => toggleFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ash-grey-600 hover:text-ash-grey-900 hover:bg-ash-grey-100 transition-colors"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                    <Folder
                      className="w-4 h-4 shrink-0"
                      style={{ color: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-ash-grey-200 p-3">
        {!isCollapsed && (
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPath === '/dashboard/settings'
                ? 'bg-cta-orange/10 text-cta-orange font-medium'
                : 'text-ash-grey-600 hover:text-ash-grey-900 hover:bg-ash-grey-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm text-ash-grey-500 hover:text-ash-grey-700 hover:bg-ash-grey-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
