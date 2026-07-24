// Console Page — primary page housing the Architect Console
import { useState } from 'react';
import { Console } from '../components/ArchitectConsole/Console';
import { ProjectSidebar } from '../components/Sidebar/ProjectSidebar';
import { useConsoleStore } from '../store/useConsoleStore';
import { saveArtifact } from '../lib/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function ConsolePage() {
  const { sidebarOpen, currentProjectId } = useConsoleStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingArtifact, setPendingArtifact] = useState<{ content: string; type: string } | null>(null);

  const handleSaveArtifact = (content: string, type: string) => {
    if (!currentProjectId) {
      toast.error('Select a project first to save artifacts');
      return;
    }
    setPendingArtifact({ content, type });
    setShowSaveModal(true);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main console */}
      <div className={cn(
        'flex-1 min-w-0 transition-all',
        sidebarOpen ? 'mr-0' : ''
      )}>
        <Console onSaveArtifact={handleSaveArtifact} />
      </div>

      {/* Right sidebar */}
      {sidebarOpen && (
        <div className="w-72 flex-shrink-0 animate-slide-in-right">
          <ProjectSidebar />
        </div>
      )}

      {/* Save Artifact Modal */}
      {showSaveModal && pendingArtifact && (
        <SaveArtifactModal
          content={pendingArtifact.content}
          type={pendingArtifact.type}
          projectId={currentProjectId!}
          onClose={() => { setShowSaveModal(false); setPendingArtifact(null); }}
          onSave={async (title, tags) => {
            try {
              await saveArtifact({
                project_id: currentProjectId!,
                title,
                artifact_type: pendingArtifact.type,
                content: pendingArtifact.content,
                tags,
              });
              toast.success('Artifact saved to project');
              setShowSaveModal(false);
              setPendingArtifact(null);
            } catch {
              toast.error('Failed to save artifact');
            }
          }}
        />
      )}
    </div>
  );
}

function SaveArtifactModal({
  content, type, projectId, onClose, onSave
}: {
  content: string;
  type: string;
  projectId: string;
  onClose: () => void;
  onSave: (title: string, tags: string[]) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Enter a title');
      return;
    }
    setSaving(true);
    await onSave(title.trim(), tags.split(',').map(t => t.trim()).filter(Boolean));
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-800 border border-white/10 rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Save Artifact</h3>
        <p className="text-sm text-muted-lighter mb-5">
          Save this content to the current project as a <strong className="text-slate-300">{type}</strong>.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-lighter mb-1.5 font-medium">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. CCaaS Architecture Document v1.0"
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:border-accent/50 outline-none transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-muted-lighter mb-1.5 font-medium">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. architecture, phase-1, approved"
              className="w-full bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted focus:border-accent/50 outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-lighter hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-5 py-2 bg-accent hover:bg-accent-glow text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Artifact'}
          </button>
        </div>
      </div>
    </div>
  );
}
