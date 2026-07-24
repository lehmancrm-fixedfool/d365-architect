// Top Bar — global navigation and command palette trigger
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, FolderOpen, FileText, Settings, Command,
  ChevronRight, Cpu, Boxes, Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Console', icon: Brain },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/artifacts', label: 'Artifacts', icon: FileText },
  { path: '/knowledge', label: 'Knowledge', icon: Boxes },
];

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [systemStatus] = useState<'ok' | 'error'>('ok');

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl z-20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center shadow-lg shadow-accent/30">
          <Cpu size={16} className="text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white tracking-tight">D365</span>
          <span className="text-xs font-medium text-accent">Architect OS</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-accent font-medium">v1.0</span>
      </div>

      {/* Nav */}
      <nav className="flex items-center">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all mx-0.5',
              location.pathname === path
                ? 'bg-white/10 text-white'
                : 'text-muted-lighter hover:text-slate-300 hover:bg-white/5'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            systemStatus === 'ok' ? 'bg-success animate-pulse-slow' : 'bg-danger'
          )} />
          <span className="text-xs text-muted-lighter">
            {systemStatus === 'ok' ? 'claude-sonnet-4-6' : 'Offline'}
          </span>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl hover:bg-white/5 text-muted-lighter hover:text-slate-300 transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
