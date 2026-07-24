// Projects Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, Clock, Tag, Cpu, AlertTriangle,
  CheckCircle, FileText, ChevronRight, Trash2, Edit3
} from 'lucide-react';
import { getProjects, createProject, deleteProject } from '../lib/api';
import { useProjectStore } from '../store/useConsoleStore';
import type { Project } from '../types';
import { cn, formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

export function ProjectsPage() {
  const { projects, setProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-muted-lighter mt-1">
            Manage engagement projects, context, and artifacts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-glow text-white text-sm font-medium rounded-xl shadow-lg shadow-accent/20 transition-all"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3 text-muted-lighter">
          <div className="animate-spin w-5 h-5 border-2 border-accent/50 border-t-accent rounded-full" />
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <EmptyProjects onCreate={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/projects/${project.id}`)}
              onDelete={() => handleDelete(project.id, project.name)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            const project = await createProject(data);
            setProjects([project, ...projects]);
            setShowCreateModal(false);
            toast.success('Project created');
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const openRisks = project.raid_items.filter(r => r.category === 'risk' && r.status === 'open');
  const unvalidatedAssumptions = project.assumptions.filter(a => !a.validated);

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer bg-surface-800 hover:bg-surface-700 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FolderOpen size={18} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors">
                {project.name}
              </h3>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                project.status === 'active' ? 'bg-success/10 text-success' :
                project.status === 'on-hold' ? 'bg-amber-400/10 text-amber-400' :
                'bg-muted/10 text-muted-lighter'
              )}>
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-muted-lighter mt-1 line-clamp-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {project.context.client_name && (
                <span className="text-xs text-muted-lighter">
                  <span className="text-muted">Client:</span> {project.context.client_name}
                </span>
              )}
              <span className="text-xs text-muted-lighter flex items-center gap-1">
                <Clock size={11} />
                {formatRelativeTime(project.updated_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {/* Stats */}
          <div className="flex items-center gap-3 mr-2">
            {openRisks.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-danger">
                <AlertTriangle size={11} />
                {openRisks.length} risks
              </span>
            )}
            {project.decisions.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={11} />
                {project.decisions.length} decisions
              </span>
            )}
            {project.artifacts.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-indigo-400">
                <FileText size={11} />
                {project.artifacts.length} artifacts
              </span>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-danger/20 text-muted-lighter hover:text-danger transition-all"
          >
            <Trash2 size={14} />
          </button>
          <ChevronRight size={16} className="text-muted-lighter group-hover:text-slate-400 transition-colors" />
        </div>
      </div>

      {/* D365 module tags */}
      {project.context.d365_modules?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pl-14">
          {project.context.d365_modules.slice(0, 4).map(m => (
            <span key={m} className="text-xs px-2.5 py-1 bg-blue-400/10 border border-blue-400/20 text-blue-400 rounded-full">
              {m}
            </span>
          ))}
          {project.context.d365_modules.length > 4 && (
            <span className="text-xs px-2.5 py-1 bg-surface-600 border border-white/5 text-muted-lighter rounded-full">
              +{project.context.d365_modules.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-700 border border-white/10 flex items-center justify-center mb-6">
        <FolderOpen size={28} className="text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
      <p className="text-sm text-muted-lighter max-w-sm mb-8">
        Create a project to organize your engagement context, decisions, RAID log, and generated artifacts.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-glow text-white text-sm font-medium rounded-xl shadow-lg shadow-accent/20 transition-all"
      >
        <Plus size={16} />
        Create first project
      </button>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; tags?: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Enter a project name');
      return;
    }
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-800 border border-white/10 rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-5">Create Project</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-lighter mb-1.5 font-medium">Project Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. EY Contact Center Migration"
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:border-accent/50 outline-none transition-colors"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-lighter mb-1.5 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief project description..."
              rows={3}
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:border-accent/50 outline-none transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-lighter hover:text-slate-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2 bg-accent hover:bg-accent-glow text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
