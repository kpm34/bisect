'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Plus, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from '../shared/UserMenu';
import { NewProjectModal } from './NewProjectModal';
import { createProject } from '@/lib/services/supabase/projects';
import { createClient } from '@/utils/supabase/client';

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

type ProjectType = '3d' | 'svg' | 'texture';

export function DashboardShell({ children, className = '' }: DashboardShellProps) {
  const pathname = usePathname() ?? '/dashboard';
  const router = useRouter();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreateProject(data: { name: string; type: ProjectType }) {
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const project = await createProject({
        name: data.name,
        type: data.type,
        user_id: user?.id,
        thumbnail_url: null,
        description: null,
        is_public: false,
        tags: [],
      });

      if (project) {
        // Navigate to the appropriate studio based on project type
        const studioPath = data.type === '3d' ? '3d-canvas'
          : data.type === 'svg' ? 'svg-canvas'
          : 'tex-factory';
        router.push(`/studio/${studioPath}?project=${project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={`flex h-screen bg-ash-grey-100 text-ash-grey-900 overflow-hidden ${className}`}>
      {/* Sidebar */}
      <Sidebar currentPath={pathname} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-ash-grey-200 flex items-center px-6 justify-between bg-white shrink-0">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-grey-400" />
              <input
                type="text"
                placeholder="Search projects, assets..."
                className="w-full pl-10 pr-4 py-2 bg-ash-grey-50 border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent placeholder:text-ash-grey-400"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-ash-grey-100 border border-ash-grey-200 rounded text-ash-grey-500">
                K
              </kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Creating...' : 'New Project'}</span>
            </button>

            <button className="p-2 hover:bg-ash-grey-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-ash-grey-600" />
            </button>

            <div className="h-6 w-px bg-ash-grey-200 mx-1" />

            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-ash-grey-50">
          {children}
        </main>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
