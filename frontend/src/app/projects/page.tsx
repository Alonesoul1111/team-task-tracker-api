'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useProjects, useCreateProject } from '@/hooks/use-data';
import { useTasks } from '@/hooks/use-tasks';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuthStore } from '@/store/auth';
import { 
  FolderGit, 
  Plus, 
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('project-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ search: debouncedSearch || undefined });
  const { data: tasksData } = useTasks({ limit: 100 });
  const createProject = useCreateProject();

  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      toast.error('Project name is required');
      return;
    }

    try {
      await createProject.mutateAsync({ name: projectName, description: projectDesc });
      toast.success('Project created successfully');
      setProjectName('');
      setProjectDesc('');
      setIsCreateOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-[0.875rem]">Manage and track projects for your team.</p>
        </div>

        {/* Create Project Button (ADMIN & MANAGER only) */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="card p-4 mb-6 grid grid-cols-1 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            id="project-search-input"
            type="text"
            placeholder="Search projects... (Cmd+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-[0.875rem]">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)] text-[0.875rem]">
          No projects found. Add a project to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const doneTasks = projectTasks.filter(t => t.status === 'DONE');
            const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

            return (
              <div key={project.id} className="card p-6 flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-[var(--brand-soft)] text-[var(--brand)] rounded-[10px] group-hover:scale-110 transition-transform">
                      <FolderGit className="h-5 w-5" />
                    </div>
                    <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] mb-1.5 leading-snug group-hover:text-[var(--brand)] transition-colors">{project.name}</h3>
                  <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-6 line-clamp-3 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                  <div className="flex justify-between items-center text-[0.75rem] text-[var(--text-secondary)]">
                    <span>Progress</span>
                    <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
                  </div>

                  <div className="w-full bg-[rgba(255,255,255,0.05)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--brand)] h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[0.6875rem] text-[var(--text-muted)]">
                    <span>{projectTasks.length} Total Tasks</span>
                    <span>{doneTasks.length} Resolved</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden ring-1 ring-white/5 mx-4">
            
            {/* Header - Sticky */}
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
              <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span className="h-7 w-7 rounded-[6px] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)]">
                  <FolderGit className="h-4 w-4" />
                </span>
                Create Project
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="p-1.5 rounded-[var(--radius-btn)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <form id="create-project-form" onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Project Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Mobile App v2"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Summarize project scope and targets..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="flex justify-end gap-3 p-5 border-t border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)] mt-auto">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-project-form"
                disabled={createProject.isPending}
                className="btn-primary"
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
