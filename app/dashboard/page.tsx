'use client';

import React, { useEffect, useState } from 'react';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { FolderOpen, Loader2 } from 'lucide-react';
import type { Project } from '@/lib/services/supabase/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { getRecentProjects } = await import('@/lib/services/supabase/projects');
        const data = await getRecentProjects(8);
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const hasProjects = projects.length > 0;

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

        {loading ? (
          <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-ash-grey-400 mx-auto mb-3 animate-spin" />
            <p className="text-ash-grey-500">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : hasProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                thumbnail={project.thumbnail_url || undefined}
                updatedAt={new Date(project.updated_at || project.created_at || Date.now())}
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
