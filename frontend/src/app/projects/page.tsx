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
  Calendar,
  X,
  FileText
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
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Projects</h1>
          <p className="text-slate-400 mt-1">Manage and track projects for your team.</p>
        </div>

        {/* Create Project Button (ADMIN & MANAGER only) */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            New Project
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="glass-panel p-4 rounded-2xl mb-6 grid grid-cols-1 gap-4 border border-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            id="project-search-input"
            type="text"
            placeholder="Search projects... (Cmd+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border text-center text-slate-500 border-slate-900">
          No projects found. Add a project to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const doneTasks = projectTasks.filter(t => t.status === 'DONE');
            const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

            return (
              <div key={project.id} className="glass-card p-6 rounded-2xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <FolderGit className="h-6 w-6" />
                    </div>
                    <span className="text-3xs font-semibold text-slate-500 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-2 leading-snug">{project.name}</h3>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-900/60">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-200">{progress}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="flex justify-between text-2xs text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-950/90 rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5">
            
            {/* Header - Sticky */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800/60 bg-slate-900/40">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FolderGit className="h-4 w-4" />
                </span>
                Create Project
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <form id="create-project-form" onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Mobile App v2"
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Summarize project scope and targets..."
                    rows={4}
                    className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all resize-none shadow-inner"
                  />
                </div>
              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-800/60 bg-slate-900/40 mt-auto">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-project-form"
                disabled={createProject.isPending}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
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
