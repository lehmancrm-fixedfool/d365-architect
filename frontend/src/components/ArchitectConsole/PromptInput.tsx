// Prompt Input — the primary input for the Architect Console
import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Send, Square, Mic, ChevronDown, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  onSubmit: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'Design Contact Center', prompt: 'Design a D365 Contact Center architecture for an enterprise customer with voice, digital, and chat channels including AI routing.' },
  { label: 'Voice Routing', prompt: 'How does voice routing work in D365 Contact Center? Walk me through the complete flow from inbound call to agent.' },
  { label: 'Copilot Studio Bot', prompt: 'Design a customer-facing Copilot Studio bot that integrates with D365 Customer Service for case creation and status tracking.' },
  { label: 'Dataverse Schema', prompt: 'Design a Dataverse schema for a customer service module that extends the out-of-box contact and case entities.' },
  { label: 'Challenge This', prompt: 'Challenge my thinking on using Dynamics 365 Contact Center vs. a third-party CCaaS solution like Genesys or Five9.' },
  { label: 'What Am I Missing?', prompt: 'What are the most commonly overlooked aspects of a D365 Contact Center implementation?' },
  { label: 'Security Architecture', prompt: 'What does a zero-trust security architecture look like for a D365 Customer Service deployment?' },
  { label: 'Licensing Guide', prompt: 'Explain the licensing model for D365 Contact Center — what\'s included, what costs extra, and common gotchas.' },
];

export function PromptInput({ onSubmit, onStop, isStreaming, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 240) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    setValue('');
    setShowQuickPrompts(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setValue(prompt);
    setShowQuickPrompts(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Quick prompts panel */}
      {showQuickPrompts && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-10">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Quick Prompts</span>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(qp.prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-200 group-hover:text-white">{qp.label}</p>
                <p className="text-xs text-muted-lighter mt-0.5 truncate">{qp.prompt.slice(0, 80)}...</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className={cn(
        'relative flex flex-col bg-surface-700 border rounded-2xl transition-all',
        'focus-within:border-accent/50 focus-within:shadow-lg focus-within:shadow-accent/10',
        isStreaming ? 'border-accent/30' : 'border-white/10'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask anything — architecture design, how-to questions, generate artifacts, troubleshoot issues..."
          className={cn(
            'w-full bg-transparent px-5 pt-4 pb-2 text-slate-100 placeholder-muted-light',
            'text-sm leading-relaxed resize-none outline-none',
            'min-h-[56px] max-h-[240px]'
          )}
          rows={1}
        />

        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                showQuickPrompts
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  : 'text-muted-lighter hover:text-slate-300 hover:bg-white/5'
              )}
            >
              <Lightbulb size={12} />
              Quick prompts
              <ChevronDown size={10} className={cn('transition-transform', showQuickPrompts && 'rotate-180')} />
            </button>

            <span className="text-xs text-muted">
              {value.length > 0 && `${value.length} chars`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted hidden sm:block">⌘↵ to send</span>

            {isStreaming ? (
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 rounded-xl text-sm font-medium transition-all"
              >
                <Square size={14} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || disabled}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  value.trim() && !disabled
                    ? 'bg-accent hover:bg-accent-glow text-white shadow-lg shadow-accent/25'
                    : 'bg-surface-500 text-muted cursor-not-allowed'
                )}
              >
                <Send size={14} />
                Run
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
