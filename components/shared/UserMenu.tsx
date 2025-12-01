'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function UserMenu({ className = '', variant = 'light' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
          isDark ? 'hover:bg-neutral-800' : 'hover:bg-ash-grey-100'
        }`}
      >
        {/* Avatar placeholder */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDark ? 'bg-neutral-700' : 'bg-ash-grey-300'
        }`}>
          <User className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-ash-grey-600'}`} />
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${
          isDark ? 'text-neutral-500' : 'text-ash-grey-500'
        } ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-ash-grey-200 py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-ash-grey-100">
            <p className="text-sm font-medium text-ash-grey-900">Guest User</p>
            <p className="text-xs text-ash-grey-500">Sign in to save your work</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-ash-grey-700 hover:bg-ash-grey-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-ash-grey-100 py-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ash-grey-700 hover:bg-ash-grey-50 transition-colors"
              onClick={() => {
                setIsOpen(false);
                // TODO: Implement sign out with Supabase
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
