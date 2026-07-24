// Project Sidebar — shows project context, decisions, RAID
import { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle, Clock, Target, Tag, X, Layers, Shield, Zap
} from 'lucide-react';
import { useConsoleStore, useProjectStore } from '../../store/useConsoleStore';
import { getProjects, getProject, createProject } from '../../lib/api';
import type { Project } from '../../types';
import { cn, formatRelativeTime } from '../../lib/utils';

export function ProjectSidebar() {
  const { currentProjectId, setProjectId, sidebarOpen, setSidebarOpen } = useConsoleStore();
  const { projects, setProjects, activeProject, setActiveProject } = useProjectStore();
  const [showProjectList, setShowProjectList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    context: true,
    decisions: false,
    assumptions: false,
    raid: false,
    artifacts: false,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      loadProject(currentProjectId);
    } else {
      setActiveProject(null);
    }
  }, [currentProjectId]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      // ignore
    }
  };

  const loadProject = async (id: string) => {
    setLoading(true);
    try {
      const data = await getProject(id);
      setActiveProject(data);
    } catch {
      setActiveProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const name = prompt('Project name:');
    if (!name?.trim()) return;
    const client = prompt('Client name (optional):') || '';
    try {
      const project = await createProject({ name: name.trim() });
      setProjects([project, ...projects]);
      setProjectId(project.id);
    } catch {
      // ignore
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(s => ({ ...s, [section]: !s[section] }));
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-surface-700 border border-white/10 border-r-0 rounded-l-lg flex items-center justify-center text-muted-lighter hover:text-white hover:bg-surface-600 transition-all"
      >
        <ChevronRight size={12} />
      </button>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-900 border-l border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-accent" />
          <span className="text-sm font-semibold text-white">Project</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded hover:bg-white/5 text-muted-lighter hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Project selector */}
      <div className="px-3 py-3 border-b border-white/5">
        <button
          onClick={() => setShowProjectList(!showProjectList)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-800 hover:bg-surface-700 border border-white/10 rounded-xl transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen size={14} className="text-accent flex-shrink-0" />
            <span className="text-sm text-slate-300 truncate">
              {activeProject ? activeProject.name : 'No project selected'}
            </span>
          </div>
          <ChevronDown size={12} className={cn('text-muted-lighter flex-shrink-0 transition-transform', showProjectList && 'rotate-180')} />
        </button>

        {showProjectList && (
          <div className="mt-2 bg-surface-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <button
              onClick={() => { setProjectId(null); setShowProjectList(false); }}
              className="w-full px-3 py-2 text-left text-xs text-muted-lighter hover:bg-white/5 hover:text-slate-300 transition-colors"
            >
              No project (general mode)
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setProjectId(p.id); setShowProjectList(false); }}
                className={cn(
                  'w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors flex items-center justify-between',
                  currentProjectId === p.id && 'bg-accent/10'
                )}
              >
                <div>
                  <p className={cn('text-sm font-medium', currentProjectId === p.id ? 'text-accent-light' : 'text-slate-300')}>
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-lighter">{formatRelativeTime(p.updated_at)}</p>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  p.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted-lighter'
                )}>
                  {p.status}
                </span>
              </button>
            ))}
            <button
              onClick={() => { setShowProjectList(false); handleCreateProject(); }}
              className="w-full px-3 py-2.5 text-left text-xs text-accent hover:bg-accent/5 border-t border-white/5 flex items-center gap-2 transition-colors"
            >
              <Plus size={12} />
              New project
            </button>
          </div>
        )}
      </div>

      {/* Project content */}
      <div className="flex-1 overflow-y-auto">
        {!activeProject ? (
          <div className="px-4 py-8 text-center">
            <FolderOpen size={32} className="text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-lighter">Select a project to see context, decisions, and RAID log</p>
            <button
              onClick={handleCreateProject}
              className="mt-4 px-4 py-2 bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded-xl text-xs text-accent font-medium transition-all"
            >
              <Plus size={12} className="inline mr-1" />
              Create project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Context */}
            <SidebarSection
              title="Context"
              icon={<Target size={13} className="text-blue-400" />}
              expanded={expandedSections.context}
              onToggle={() => toggleSection('context')}
              count={null}
            >
              <ContextPanel project={activeProject} />
            </SidebarSection>

            {/* Key Decisions */}
            <SidebarSection
              title="Decisions"
              icon={<CheckCircle size={13} className="text-green-400" />}
              expanded={expandedSections.decisions}
              onToggle={() => toggleSection('decisions')}
              count={activeProject.decisions.length}
            >
              {activeProject.decisions.length === 0 ? (
                <p className="text-xs text-muted px-3 py-2">No decisions recorded</p>
              ) : (
                activeProject.decisions.slice(-5).map(d => (
                  <div key={d.id} className="px-3 py-2 text-xs border-b border-white/5 last:border-0">
                    <p className="font-medium text-slate-300">{d.title}</p>
                    <p className="text-muted-lighter mt-0.5 line-clamp-2">{d.description}</p>
                    <span className={cn(
                      'inline-block mt-1 px-1.5 py-0.5 rounded text-xs',
                      d.status === 'accepted' ? 'bg-green-400/10 text-green-400' : 'bg-muted/10 text-muted-lighter'
                    )}>
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </SidebarSection>

            {/* Assumptions */}
            <SidebarSection
              title="Assumptions"
              icon={<Zap size={13} className="text-amber-400" />}
              expanded={expandedSections.assumptions}
              onToggle={() => toggleSection('assumptions')}
              count={activeProject.assumptions.filter(a => !a.validated).length}
            >
              {activeProject.assumptions.length === 0 ? (
                <p className="text-xs text-muted px-3 py-2">No assumptions logged</p>
              ) : (
                activeProject.assumptions.slice(-5).map(a => (
                  <div key={a.id} className="px-3 py-2 text-xs border-b border-white/5 last:border-0 flex items-start gap-2">
                    <span className={a.validated ? 'text-success' : 'text-amber-400'}>
                      {a.validated ? '✅' : '❓'}
                    </span>
                    <p className="text-slate-400 leading-relaxed">{a.text}</p>
                  </div>
                ))
              )}
            </SidebarSection>

            {/* RAID */}
            <SidebarSection
              title="RAID Log"
              icon={<AlertTriangle size={13} className="text-red-400" />}
              expanded={expandedSections.raid}
              onToggle={() => toggleSection('raid')}
              count={activeProject.raid_items.filter(r => r.status === 'open').length}
            >
              {activeProject.raid_items.length === 0 ? (
                <p className="text-xs text-muted px-3 py-2">No RAID items</p>
              ) : (
                activeProject.raid_items.slice(-6).map(r => (
                  <div key={r.id} className="px-3 py-2 text-xs border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded uppercase text-xs font-semibold',
                        r.category === 'risk' ? 'bg-red-400/10 text-red-400' :
                        r.category === 'assumption' ? 'bg-amber-400/10 text-amber-400' :
                        r.category === 'issue' ? 'bg-orange-400/10 text-orange-400' :
                        'bg-blue-400/10 text-blue-400'
                      )}>
                        {r.category[0].toUpperCase()}
                      </span>
                      <span className={cn(
                        'font-medium',
                        r.severity === 'high' ? 'text-red-400' :
                        r.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'
                      )}>
                        {r.title}
                      </span>
                    </div>
                    <p className="text-muted-lighter line-clamp-2">{r.description}</p>
                  </div>
                ))
              )}
            </SidebarSection>

            {/* Artifacts */}
            <SidebarSection
              title="Artifacts"
              icon={<Shield size={13} className="text-indigo-400" />}
              expanded={expandedSections.artifacts}
              onToggle={() => toggleSection('artifacts')}
              count={activeProject.artifacts.length}
            >
              {activeProject.artifacts.length === 0 ? (
                <p className="text-xs text-muted px-3 py-2">No artifacts saved</p>
              ) : (
                activeProject.artifacts.slice(-5).map(a => (
                  <div key={a.id} className="px-3 py-2 text-xs border-b border-white/5 last:border-0">
                    <p className="font-medium text-slate-300">{a.title}</p>
                    <p className="text-muted-lighter mt-0.5">{a.artifact_type} • {a.version}</p>
                  </div>
                ))
              )}
            </SidebarSection>
          </div>
        )}
      </div>

      {/* Footer */}
      {activeProject && (
        <div className="px-4 py-3 border-t border-white/5">
          <button
            onClick={() => loadProject(currentProjectId!)}
            className="w-full text-xs text-muted-lighter hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Clock size={11} />
            Updated {formatRelativeTime(activeProject.updated_at)}
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarSection({
  title, icon, expanded, onToggle, count, children
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count: number | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          {count !== null && count > 0 && (
            <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded-full font-medium">
              {count}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown size={12} className="text-muted" /> : <ChevronRight size={12} className="text-muted" />}
      </button>
      {expanded && <div className="bg-surface-950/30">{children}</div>}
    </div>
  );
}

function ContextPanel({ project }: { project: Project }) {
  const ctx = project.context;
  return (
    <div className="px-3 py-2 space-y-2 text-xs">
      {ctx.client_name && <InfoRow label="Client" value={ctx.client_name} />}
      {ctx.engagement_name && <InfoRow label="Engagement" value={ctx.engagement_name} />}
      {ctx.industry && <InfoRow label="Industry" value={ctx.industry} />}
      {ctx.d365_modules?.length > 0 && (
        <div>
          <p className="text-muted-lighter mb-1">D365 Modules</p>
          <div className="flex flex-wrap gap-1">
            {ctx.d365_modules.map(m => (
              <span key={m} className="px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded-full text-xs">{m}</span>
            ))}
          </div>
        </div>
      )}
      {ctx.current_state && (
        <div>
          <p className="text-muted-lighter mb-0.5">Current State</p>
          <p className="text-slate-400 leading-relaxed">{ctx.current_state}</p>
        </div>
      )}
      {ctx.desired_state && (
        <div>
          <p className="text-muted-lighter mb-0.5">Desired State</p>
          <p className="text-slate-400 leading-relaxed">{ctx.desired_state}</p>
        </div>
      )}
      {ctx.key_challenges?.length > 0 && (
        <div>
          <p className="text-muted-lighter mb-1">Key Challenges</p>
          <ul className="space-y-0.5">
            {ctx.key_challenges.map((c, i) => (
              <li key={i} className="text-slate-400 flex items-start gap-1">
                <span className="text-danger mt-0.5">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-lighter flex-shrink-0">{label}</span>
      <span className="text-slate-300 truncate">{value}</span>
    </div>
  );
}
