// Architect Console — Primary UI component
import { useRef, useEffect, useCallback, useState } from 'react';
import { Settings2, Trash2, Zap, Brain } from 'lucide-react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { PromptInput } from './PromptInput';
import { ModeSelector } from './ModeSelector';
import { MessageBubble } from './MessageBubble';
import { ErrorBoundary } from '../ErrorBoundary';
import { streamConsole } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  onSaveArtifact?: (content: string, type: string) => void;
}

export function Console({ onSaveArtifact }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const {
    messages,
    currentMode,
    currentProjectId,
    includeProjectContext,
    includeConversationHistory,
    explainLevel,
    activeArtifactType,
    isStreaming,
    addUserMessage,
    addAssistantMessage,
    appendToMessage,
    setIntent,
    setDiagram,
    setArtifactSuggestions,
    setFollowUps,
    setStreaming,
    finishMessage,
    clearMessages,
    toggleProjectContext,
    toggleConversationHistory,
    setExplainLevel,
    getConversationHistory,
  } = useConsoleStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (message: string) => {
    if (isStreaming) return;

    abortControllerRef.current = new AbortController();

    addUserMessage(message);
    const assistantMsg = addAssistantMessage();
    setStreaming(true);

    const history = getConversationHistory();

    await streamConsole({
      message,
      mode: currentMode === 'AUTO' ? undefined : currentMode,
      projectId: currentProjectId ?? undefined,
      includeProjectContext,
      includeConversationHistory,
      conversationHistory: history,
      artifactType: activeArtifactType ?? undefined,
      explainLevel: explainLevel === 'default' ? undefined : explainLevel,
      signal: abortControllerRef.current.signal,
      onEvent: (event) => {
        switch (event.type) {
          case 'intent':
            setIntent(assistantMsg.id, event.data as Parameters<typeof setIntent>[1]);
            break;
          case 'chunk':
            appendToMessage(assistantMsg.id, event.data as string);
            break;
          case 'diagram':
            setDiagram(assistantMsg.id, event.data as string);
            break;
          case 'artifact_suggestions':
            setArtifactSuggestions(assistantMsg.id, event.data as Parameters<typeof setArtifactSuggestions>[1]);
            break;
          case 'follow_ups':
            setFollowUps(assistantMsg.id, event.data as Parameters<typeof setFollowUps>[1]);
            break;
        }
      },
      onError: (err) => {
        toast.error(`Error: ${err.message}`);
        finishMessage(assistantMsg.id);
      },
      onDone: () => {
        finishMessage(assistantMsg.id);
      },
    });
  }, [
    isStreaming, currentMode, currentProjectId, includeProjectContext,
    includeConversationHistory, explainLevel, activeArtifactType,
    addUserMessage, addAssistantMessage, appendToMessage, setIntent,
    setDiagram, setArtifactSuggestions, setFollowUps, setStreaming,
    finishMessage, getConversationHistory,
  ]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isStreaming) {
      finishMessage(lastMsg.id);
    }
  }, [messages, finishMessage]);

  const handleFollowUp = useCallback((prompt: string, mode?: string) => {
    if (mode) {
      useConsoleStore.getState().setMode(mode as import('../../types').Mode);
    }
    handleSubmit(prompt);
  }, [handleSubmit]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Console toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
            <span className="text-sm font-semibold text-white">Architect Console</span>
          </div>
          <ModeSelector />
        </div>

        <div className="flex items-center gap-2">
          {/* Explain level */}
          <select
            value={explainLevel}
            onChange={e => setExplainLevel(e.target.value as typeof explainLevel)}
            className="text-xs bg-surface-700 border border-white/10 text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-accent/50"
          >
            <option value="default">Default audience</option>
            <option value="executive">Executive</option>
            <option value="developer">Developer</option>
            <option value="simple">Simple</option>
          </select>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSettings ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-muted-lighter hover:text-slate-300'
            )}
          >
            <Settings2 size={15} />
          </button>

          {/* Clear */}
          {messages.length > 0 && (
            <button
              onClick={() => { if (confirm('Clear conversation?')) clearMessages(); }}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-lighter hover:text-slate-300 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-white/5 px-4 py-3 bg-surface-900/30 flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={toggleProjectContext}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative',
                includeProjectContext ? 'bg-accent' : 'bg-surface-500'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                includeProjectContext ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </button>
            <span className="text-xs text-slate-400">Project context</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={toggleConversationHistory}
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative',
                includeConversationHistory ? 'bg-accent' : 'bg-surface-500'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                includeConversationHistory ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </button>
            <span className="text-xs text-slate-400">Conversation history</span>
          </label>
          <div className="text-xs text-muted">
            <Zap size={12} className="inline mr-1 text-accent" />
            Intent auto-detection is {currentMode === 'AUTO' ? 'on' : 'off (mode locked)'}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {isEmpty ? (
          <EmptyState onQuickPrompt={handleSubmit} />
        ) : (
          messages.map(msg => (
            <ErrorBoundary key={msg.id} label={`Message-${msg.id}`}>
            <MessageBubble
              key={msg.id}
              message={msg}
              onFollowUp={handleFollowUp}
              onSaveArtifact={onSaveArtifact}
            />
            </ErrorBoundary>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-6 pb-6 pt-4 border-t border-white/5 bg-surface-900/30">
        <PromptInput
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isStreaming}
        />
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-xs text-muted">
            Shift+Enter for new line • Enter to send
          </span>
        </div>
      </div>
    </div>
  );
}

// Empty state with quick-start prompts
function EmptyState({ onQuickPrompt }: { onQuickPrompt: (prompt: string) => void }) {
  const STARTERS = [
    { icon: '🏗️', label: 'Design architecture', prompt: 'Design a D365 Contact Center architecture for an enterprise with omnichannel routing, AI-powered IVR, and supervisor analytics.' },
    { icon: '🔍', label: 'Troubleshoot issue', prompt: 'Voice calls are not routing to the right queue in D365 Contact Center. Help me diagnose the issue.' },
    { icon: '📄', label: 'Generate document', prompt: 'Generate an executive summary for a D365 Customer Service implementation project.' },
    { icon: '💡', label: 'Explore capabilities', prompt: 'What are the latest AI capabilities in D365 Contact Center and how can they reduce agent handle time?' },
    { icon: '⚖️', label: 'Decision support', prompt: 'Help me decide between Copilot Studio and a custom bot framework for a complex customer service chatbot.' },
    { icon: '📚', label: 'Learn something', prompt: 'Teach me how Unified Routing works in D365 Contact Center — the complete end-to-end flow.' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <Brain size={28} className="text-accent" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Architect Console</h2>
      <p className="text-sm text-muted-lighter max-w-md mb-8">
        Your AI-powered architecture assistant. Ask anything, design solutions, generate artifacts, troubleshoot issues.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
        {STARTERS.map((s, i) => (
          <button
            key={i}
            onClick={() => onQuickPrompt(s.prompt)}
            className="flex items-center gap-3 px-4 py-3.5 bg-surface-800 hover:bg-surface-700 border border-white/5 hover:border-white/10 rounded-xl text-left transition-all group"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
