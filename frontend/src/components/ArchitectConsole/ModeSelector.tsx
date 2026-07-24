// Mode Selector — dropdown for choosing architect mode
import { ChevronDown, Wand2 } from 'lucide-react';
import { useConsoleStore } from '../../store/useConsoleStore';
import type { Mode } from '../../types';
import { MODE_COLORS, MODE_ICONS } from '../../types';
import { cn } from '../../lib/utils';
import { useState, useRef, useEffect } from 'react';

const MODES: { value: Mode; label: string; description: string }[] = [
  { value: 'AUTO', label: 'Auto Detect', description: 'Intelligently detect intent' },
  { value: 'ARCHITECTURE', label: 'Architecture', description: 'Design solutions & systems' },
  { value: 'STRATEGY', label: 'Strategy', description: 'Roadmap & business decisions' },
  { value: 'DELIVERY', label: 'Delivery', description: 'Implementation & project planning' },
  { value: 'TROUBLESHOOT', label: 'Troubleshoot', description: 'Debug & diagnose issues' },
  { value: 'INNOVATION', label: 'Innovation', description: 'Emerging capabilities & future-state' },
  { value: 'RESEARCH', label: 'Research', description: 'Deep dives & comparisons' },
  { value: 'ARTIFACT', label: 'Artifact', description: 'Generate deliverables' },
  { value: 'REVIEW', label: 'Review', description: 'Critique architecture & designs' },
  { value: 'DECISION', label: 'Decision', description: 'Evaluate options & recommend' },
  { value: 'EXPLAIN', label: 'Explain', description: 'Learn how something works' },
];

export function ModeSelector() {
  const { currentMode, setMode } = useConsoleStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = MODES.find(m => m.value === currentMode) ?? MODES[0];
  const colorClass = MODE_COLORS[currentMode] || MODE_COLORS.DEFAULT;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
          colorClass
        )}
      >
        <span>{MODE_ICONS[currentMode] || '✨'}</span>
        <span>{current.label}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-surface-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <p className="text-xs text-muted-lighter px-2 py-1 font-medium uppercase tracking-wider">
              Architect Mode
            </p>
          </div>
          <div className="p-1 max-h-80 overflow-y-auto">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => { setMode(mode.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5',
                  currentMode === mode.value && 'bg-white/5'
                )}
              >
                <span className="text-lg leading-none mt-0.5">{MODE_ICONS[mode.value] || '💬'}</span>
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    currentMode === mode.value ? 'text-white' : 'text-slate-300'
                  )}>
                    {mode.label}
                    {mode.value === 'AUTO' && (
                      <Wand2 size={12} className="inline ml-1.5 text-accent" />
                    )}
                  </p>
                  <p className="text-xs text-muted-lighter mt-0.5">{mode.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
