// Intent Badge — shows detected intent and domain
import { Zap } from 'lucide-react';
import type { IntentClassification } from '../../types';
import { MODE_COLORS, MODE_ICONS, DOMAIN_LABELS } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  intent: IntentClassification;
  mode: string;
  className?: string;
}

export function IntentBadge({ intent, mode, className }: Props) {
  const colorClass = MODE_COLORS[mode] || MODE_COLORS.DEFAULT;
  const icon = MODE_ICONS[mode] || '💬';

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        colorClass
      )}>
        <span>{icon}</span>
        {mode}
      </span>

      {intent.domain && intent.domain !== 'general' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-slate-400">
          {DOMAIN_LABELS[intent.domain] || intent.domain}
        </span>
      )}

      {intent.confidence < 0.8 && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
          <Zap size={10} />
          ~{Math.round(intent.confidence * 100)}% confident
        </span>
      )}

      {intent.diagram_needed && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-400/10 text-indigo-400 border border-indigo-400/20">
          📊 Diagram
        </span>
      )}
    </div>
  );
}
