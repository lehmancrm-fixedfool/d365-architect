// Artifacts Page — browse and manage generated artifacts
import { useEffect, useState } from 'react';
import { FileText, Download, Copy, Search, Filter, ChevronDown, Tag, Calendar } from 'lucide-react';
import { getProjects } from '../lib/api';
import type { Artifact, Project } from '../types';
import { ARTIFACT_TYPE_META } from '../types';
import { cn, copyToClipboard, downloadMarkdown, formatRelativeTime } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

export function ArtifactsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allArtifacts, setAllArtifacts] = useState<Array<Artifact & { projectName: string; projectId: string }>>([]);
  const [filtered, setFiltered] = useState<typeof allArtifacts>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedArtifact, setSelectedArtifact] = useState<typeof allArtifacts[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtifacts();
  }, []);

  useEffect(() => {
    let result = allArtifacts;
    if (search) {
      result = result.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.artifact_type.toLowerCase().includes(search.toLowerCase()) ||
        a.projectName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(a => a.artifact_type === typeFilter);
    }
    setFiltered(result);
  }, [search, typeFilter, allArtifacts]);

  const loadArtifacts = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
      const artifacts = data.flatMap(p =>
        p.artifacts.map(a => ({ ...a, projectName: p.name, projectId: p.id }))
      );
      setAllArtifacts(artifacts.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch {
      toast.error('Failed to load artifacts');
    } finally {
      setLoading(false);
    }
  };

  const artifactTypes = ['all', ...new Set(allArtifacts.map(a => a.artifact_type))];

  return (
    <div className="h-full flex overflow-hidden">
      {/* List panel */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white mb-3">Artifacts</h2>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search artifacts..."
              className="w-full bg-surface-700 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-muted focus:border-accent/50 outline-none transition-colors"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-surface-700 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-accent/50"
          >
            {artifactTypes.map(t => (
              <option key={t} value={t}>
                {t === 'all' ? 'All types' : ARTIFACT_TYPE_META[t]?.label || t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-muted-lighter text-sm">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <FileText size={24} className="text-muted opacity-50 mb-3" />
              <p className="text-xs text-muted-lighter">
                {search || typeFilter !== 'all' ? 'No matching artifacts' : 'No artifacts saved yet'}
              </p>
            </div>
          ) : (
            filtered.map(artifact => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifact(artifact)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/3 transition-colors',
                  selectedArtifact?.id === artifact.id && 'bg-accent/5 border-l-2 border-l-accent'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{ARTIFACT_TYPE_META[artifact.artifact_type]?.icon ?? '📄'}</span>
                  <p className="text-xs font-medium text-slate-200 truncate">{artifact.title}</p>
                </div>
                <p className="text-xs text-muted-lighter">{artifact.projectName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    {ARTIFACT_TYPE_META[artifact.artifact_type]?.label ?? artifact.artifact_type}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-xs text-muted">{formatRelativeTime(artifact.created_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/5 text-center">
          <p className="text-xs text-muted">{filtered.length} artifact{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedArtifact ? (
          <>
            {/* Artifact header */}
            <div className="px-8 py-5 border-b border-white/5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{ARTIFACT_TYPE_META[selectedArtifact.artifact_type]?.icon ?? '📄'}</span>
                  <h2 className="text-lg font-semibold text-white">{selectedArtifact.title}</h2>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedArtifact.status === 'approved' ? 'bg-success/10 text-success' :
                    selectedArtifact.status === 'review' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-surface-600 text-muted-lighter'
                  )}>
                    {selectedArtifact.status}
                  </span>
                </div>
                <p className="text-sm text-muted-lighter">
                  {selectedArtifact.projectName} · v{selectedArtifact.version} · {formatRelativeTime(selectedArtifact.created_at)}
                </p>
                {selectedArtifact.tags?.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {selectedArtifact.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-surface-700 border border-white/10 rounded-full text-muted-lighter">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { copyToClipboard(selectedArtifact.content); toast.success('Copied'); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-700 hover:bg-surface-600 border border-white/10 rounded-xl text-xs text-slate-300 transition-all"
                >
                  <Copy size={12} />
                  Copy
                </button>
                <button
                  onClick={() => downloadMarkdown(selectedArtifact.content, selectedArtifact.title)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-700 hover:bg-surface-600 border border-white/10 rounded-xl text-xs text-slate-300 transition-all"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            </div>

            {/* Artifact content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-3xl">
                <div className="prose prose-sm prose-invert max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-strong:text-white
                  prose-code:text-accent-light prose-code:bg-surface-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-blockquote:border-accent/50 prose-blockquote:text-slate-400
                  prose-li:text-slate-300
                  prose-table:text-sm prose-th:text-slate-200 prose-td:text-slate-300
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedArtifact.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={40} className="text-muted opacity-30 mb-4" />
            <p className="text-sm text-muted-lighter">Select an artifact to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
