'use client';

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Calendar, Box } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  thumbnail?: string;
  updatedAt: Date;
  sceneCount?: number;
  onClick?: () => void;
}

export function ProjectCard({
  id,
  name,
  thumbnail,
  updatedAt,
  sceneCount = 0,
  onClick
}: ProjectCardProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: updatedAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  }).format(updatedAt);

  return (
    <Link
      href={`/project/${id}`}
      className="group block bg-white rounded-xl border border-ash-grey-200 overflow-hidden hover:border-ash-grey-300 hover:shadow-md transition-all"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-ash-grey-100 relative overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="w-12 h-12 text-ash-grey-300" />
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

        {/* More options button */}
        <button
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Open context menu
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-ash-grey-600" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-ash-grey-900 truncate group-hover:text-cta-orange transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-ash-grey-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
          {sceneCount > 0 && (
            <span className="flex items-center gap-1">
              <Box className="w-3 h-3" />
              {sceneCount} scene{sceneCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
