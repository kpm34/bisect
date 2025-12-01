'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, PenTool, Palette } from 'lucide-react';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
}

function QuickActionCard({ icon: Icon, label, description, href, color }: QuickActionProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-ash-grey-200 hover:border-ash-grey-300 hover:shadow-md transition-all text-left group"
    >
      <div
        className="p-3 rounded-lg shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <h3 className="font-medium text-ash-grey-900 group-hover:text-cta-orange transition-colors">
          {label}
        </h3>
        <p className="text-sm text-ash-grey-500 mt-0.5">
          {description}
        </p>
      </div>
    </button>
  );
}

export function QuickActions() {
  const actions: QuickActionProps[] = [
    {
      icon: Box,
      label: 'New 3D Scene',
      description: 'Start editing a 3D model',
      href: '/studio/3d-canvas',
      color: '#6366f1'
    },
    {
      icon: PenTool,
      label: 'New SVG',
      description: 'Create vector graphics',
      href: '/studio/svg-canvas',
      color: '#10b981'
    },
    {
      icon: Palette,
      label: 'Generate Texture',
      description: 'Create PBR materials with AI',
      href: '/studio/tex-factory',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => (
        <QuickActionCard key={action.href} {...action} />
      ))}
    </div>
  );
}
