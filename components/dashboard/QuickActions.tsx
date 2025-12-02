'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Cuboid, PenTool, Sparkles, Video } from 'lucide-react';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
}

function QuickActionCard({ icon: Icon, label, description, href, color, bgColor }: QuickActionProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-start gap-4 p-5 bg-white rounded-xl border border-ash-grey-200 hover:border-ash-grey-300 hover:shadow-md transition-all text-left group h-full"
    >
      <div
        className="p-3 rounded-lg shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex flex-col">
        <h3 className="font-semibold text-ash-grey-900 group-hover:text-cta-orange transition-colors">
          {label}
        </h3>
        <p className="text-sm text-ash-grey-500 mt-1">
          {description}
        </p>
      </div>
    </button>
  );
}

export function QuickActions() {
  const actions: QuickActionProps[] = [
    {
      icon: Cuboid,
      label: '3D Editor',
      description: 'Edit scenes, apply materials, and export assets',
      href: '/studio/3d-canvas',
      color: '#f97316',
      bgColor: '#fff7ed'
    },
    {
      icon: Video,
      label: 'Video Studio',
      description: 'Edit videos, add textures, and export clips',
      href: '/studio/video-studio',
      color: '#ec4899',
      bgColor: '#fdf2f8'
    },
    {
      icon: Sparkles,
      label: 'Texture Generator',
      description: 'Create PBR materials with AI',
      href: '/studio/tex-factory',
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
    {
      icon: PenTool,
      label: 'Vector Editor',
      description: 'Create and edit vector graphics',
      href: '/studio/svg-canvas',
      color: '#10b981',
      bgColor: '#ecfdf5'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <QuickActionCard key={action.href} {...action} />
      ))}
    </div>
  );
}
