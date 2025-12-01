'use client';

import React from 'react';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { FolderOpen } from 'lucide-react';

// Placeholder data - will be replaced with Supabase data
const mockProjects = [
  {
    id: '1',
    name: 'Product Render',
    thumbnail: undefined,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    sceneCount: 2
  },
  {
    id: '2',
    name: 'Logo Design v2',
    thumbnail: undefined,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    sceneCount: 1
  },
  {
    id: '3',
    name: 'Brand Assets',
    thumbnail: undefined,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    sceneCount: 4
  },
];

export default function DashboardPage() {
  const hasProjects = mockProjects.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ash-grey-900">Welcome back</h1>
        <p className="text-ash-grey-500 mt-1">Pick up where you left off or start something new</p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-ash-grey-600 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <QuickActions />
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-ash-grey-600 uppercase tracking-wider">
            Recent Projects
          </h2>
          {hasProjects && (
            <a
              href="/dashboard/projects"
              className="text-sm text-cta-orange hover:text-cta-orange-hover transition-colors"
            >
              View all
            </a>
          )}
        </div>

        {hasProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                thumbnail={project.thumbnail}
                updatedAt={project.updatedAt}
                sceneCount={project.sceneCount}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-ash-grey-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ash-grey-900 mb-1">No projects yet</h3>
            <p className="text-ash-grey-500 mb-4">Get started by creating your first project</p>
            <button className="px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors">
              Create Project
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
