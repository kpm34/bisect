'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Cuboid, PenTool, Sparkles, ArrowRight } from 'lucide-react';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
  isPrimary?: boolean;
}

function QuickActionCard({ icon: Icon, label, description, href, color, isPrimary }: QuickActionProps) {
  const router = useRouter();

  if (isPrimary) {
    return (
      <button
        onClick={() => router.push(href)}
        className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all text-left group shadow-lg shadow-orange-500/25"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/20 shrink-0">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">
              {label}
            </h3>
            <p className="text-sm text-white/80 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-ash-grey-200 hover:border-ash-grey-300 hover:shadow-md transition-all text-left group"
    >
      <div
        className="p-3 rounded-lg shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-ash-grey-400 uppercase tracking-wider">Extension</span>
        </div>
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
  // Primary action - 3D Editor
  const primaryAction: QuickActionProps = {
    icon: Cuboid,
    label: 'Open 3D Editor',
    description: 'Edit scenes, apply materials, and export production-ready assets',
    href: '/studio/3d-canvas',
    color: '#f97316',
    isPrimary: true
  };

  // Extension actions
  const extensionActions: QuickActionProps[] = [
    {
      icon: Sparkles,
      label: 'Texture Generator',
      description: 'Create PBR materials with AI',
      href: '/studio/tex-factory',
      color: '#8b5cf6'
    },
    {
      icon: PenTool,
      label: 'Vector Editor',
      description: 'Create and edit vector graphics',
      href: '/studio/svg-canvas',
      color: '#10b981'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary CTA - 3D Editor */}
      <QuickActionCard {...primaryAction} />

      {/* Extensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extensionActions.map((action) => (
          <QuickActionCard key={action.href} {...action} />
        ))}
      </div>
    </div>
  );
}
