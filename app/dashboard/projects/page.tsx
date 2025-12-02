'use client';

import React, { useEffect, useState } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import {
  FolderOpen,
  Loader2,
  Plus,
  Grid3X3,
  List,
  Search,
  Filter,
  SortDesc,
  Cuboid,
  PenTool,
  Image
} from 'lucide-react';
import type { Project } from '@/lib/services/supabase/types';

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'created' | 'name';
type FilterType = 'all' | '3d' | 'svg' | 'texture';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { getProjects } = await import('@/lib/services/supabase/projects');
        const data = await getProjects();
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

  // Filter and sort projects
  const filteredProjects = projects
    .filter(p => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(query) ||
               p.description?.toLowerCase().includes(query) ||
               p.tags?.some(t => t.toLowerCase().includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      }
    });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '3d': return Cuboid;
      case 'svg': return PenTool;
      case 'texture': return Image;
      default: return FolderOpen;
    }
  };

  const typeStats = {
    all: projects.length,
    '3d': projects.filter(p => p.type === '3d').length,
    svg: projects.filter(p => p.type === 'svg').length,
    texture: projects.filter(p => p.type === 'texture').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ash-grey-900">Projects</h1>
          <p className="text-ash-grey-500 mt-1">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-ash-grey-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-grey-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ash-grey-50 border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ash-grey-400" />
            <div className="flex rounded-lg border border-ash-grey-200 overflow-hidden">
              {(['all', '3d', 'svg', 'texture'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterType === type
                      ? 'bg-cta-orange text-white'
                      : 'bg-white text-ash-grey-600 hover:bg-ash-grey-50'
                  }`}
                >
                  {type === 'all' ? 'All' : type.toUpperCase()}
                  <span className="ml-1 opacity-60">({typeStats[type]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortDesc className="w-4 h-4 text-ash-grey-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 bg-white border border-ash-grey-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta-orange"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex rounded-lg border border-ash-grey-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-ash-grey-100' : 'hover:bg-ash-grey-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-ash-grey-100' : 'hover:bg-ash-grey-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-ash-grey-400 mx-auto mb-3 animate-spin" />
          <p className="text-ash-grey-500">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
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
          <div className="bg-white rounded-xl border border-ash-grey-200 divide-y divide-ash-grey-100">
            {filteredProjects.map((project) => {
              const TypeIcon = getTypeIcon(project.type);
              return (
                <a
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-ash-grey-50 transition-colors"
                >
                  <div className="w-16 h-12 bg-ash-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <TypeIcon className="w-6 h-6 text-ash-grey-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ash-grey-900 truncate">{project.name}</h3>
                    <p className="text-xs text-ash-grey-500 mt-0.5">
                      {project.type.toUpperCase()} · Updated {new Date(project.updated_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-ash-grey-100 rounded text-xs text-ash-grey-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-ash-grey-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-ash-grey-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ash-grey-900 mb-1">
            {searchQuery || filterType !== 'all' ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-ash-grey-500 mb-4">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <button className="px-4 py-2 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg text-sm font-medium transition-colors">
              Create Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
