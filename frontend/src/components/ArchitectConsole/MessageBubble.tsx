// Message Bubble — renders a single conversation message
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { ChatMessage, ArtifactSuggestion } from '../../types';
import { ARTIFACT_TYPE_META } from '../../types';
import { MermaidDiagram } from './MermaidDiagram';
import { IntentBadge } from './IntentBadge';
import { ErrorBoundary } from '../ErrorBoundary';
import { cn, copyToClipboard, downloadMarkdown, formatRelativeTime } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  message: ChatMessage;
  onFollowUp?: (prompt: string, mode?: string) => void;
  onSaveArtifact?: (content: string, type: string) => void;
}

// Safe string extraction from ReactMarkdown children
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  return '';
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const lang = className?.replace('language-', '') ?? '';

  if (lang === 'mermaid') {
    return (
      <ErrorBoundary label="MermaidDiagram" fallback={
        <pre className="bg-surface-900/80 border border-white/10 rounded-lg p-4 overflow-auto my-3">
          <code className="text-sm font-mono text-slate-300">{children}</code>
        </pre>
      }>
        <MermaidDiagram source={children} className="my-4" />
      </ErrorBoundary>
    );
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border border-white/10 rounded-t-lg">
        <span className="text-xs text-muted-lighter font-mono">{lang || 'code'}</span>
        <button
          onClick={() => { copyToClipboard(children); toast.success('Copied'); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-muted-lighter hover:text-white transition-all"
        >
          <Copy size={12} />
        </button>
      </div>
      <pre className="bg-surface-900/80 border border-t-0 border-white/10 rounded-b-lg p-4 overflow-auto">
        <code className="text-sm font-mono text-slate-300">{children}</code>
      </pre>
    </div>
  );
}

// react-markdown v9 code component — detects block vs inline via parent node type
function MarkdownCode({
  children,
  className,
  node,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  node?: { type: string; tagName?: string; position?: unknown };
  [key: string]: unknown;
}) {
  const text = extractText(children);
  // Block code: parent is <pre>, inline code: parent is inline text
  const isBlock = node?.tagName === 'code' && className?.startsWith('language-');

  if (isBlock) {
    return <CodeBlock className={className}>{text}</CodeBlock>;
  }
  return (
    <code className={cn('text-accent-light bg-surface-900 px-1.5 py-0.5 rounded text-xs font-mono', className)}>
      {children}
    </code>
  );
}

export function MessageBubble({ message, onFollowUp, onSaveArtifact }: Props) {
  const [showFollowUps, setShowFollowUps] = useState(true);

  const handleCopy = useCallback(() => {
    copyToClipboard(message.content);
    toast.success('Copied to clipboard');
  }, [message.content]);

  const handleDownload = useCallback(() => {
    const filename = `d365-architect-response.md`;
    downloadMarkdown(message.content, filename);
    toast.success('Downloaded');
  }, [message.content]);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] px-5 py-3.5 bg-accent/20 border border-accent/30 rounded-2xl rounded-tr-md">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs text-accent/60 mt-1.5 text-right">{formatRelativeTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="animate-slide-up space-y-3">
      {/* Intent badge */}
      {message.intent && message.mode && (
        <IntentBadge intent={message.intent} mode={message.mode} />
      )}

      {/* Content */}
      <div className="bg-surface-800/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-5">
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-3 text-muted-lighter">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Architect thinking...</span>
            </div>
          ) : (
            <ErrorBoundary label="MarkdownRenderer" fallback={
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{message.content}</pre>
            }>
              <div className="prose prose-sm prose-invert max-w-none
                prose-headings:text-white prose-headings:font-semibold
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-strong:text-white prose-strong:font-semibold
                prose-code:text-accent-light prose-code:bg-surface-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-blockquote:border-accent/50 prose-blockquote:text-slate-400
                prose-li:text-slate-300
                prose-table:text-sm
                prose-th:text-slate-200 prose-th:font-semibold
                prose-td:text-slate-300
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Block code — has className like "language-python"
                    pre({ children }) {
                      // Let the code component handle rendering
                      return <>{children}</>;
                    },
                    code({ children, className, node, ...rest }) {
                      const text = extractText(children);
                      const hasLang = className?.startsWith('language-');

                      if (hasLang) {
                        // Block code fence
                        return <CodeBlock className={className}>{text}</CodeBlock>;
                      }
                      // Inline code
                      return (
                        <code
                          className={cn('text-accent-light bg-surface-900/80 px-1.5 py-0.5 rounded text-xs font-mono', className)}
                        >
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return <th className="px-4 py-2.5 bg-surface-700 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider border-b border-white/10">{children}</th>;
                    },
                    td({ children }) {
                      return <td className="px-4 py-2.5 text-sm text-slate-300 border-b border-white/5">{children}</td>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </ErrorBoundary>
          )}

          {/* Streaming cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-accent animate-typing ml-0.5 -mb-1 rounded-full" />
          )}
        </div>

        {/* Artifact suggestions */}
        {!message.isStreaming && message.artifactSuggestions && message.artifactSuggestions.length > 0 && (
          <div className="border-t border-white/5 px-6 py-4 bg-indigo-500/5">
            <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2.5">Generate Artifacts</p>
            <div className="flex flex-wrap gap-2">
              {message.artifactSuggestions.map((s: ArtifactSuggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSaveArtifact?.(message.content, s.type)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 hover:text-indigo-200 transition-all"
                >
                  <span>{ARTIFACT_TYPE_META[s.type]?.icon ?? '📄'}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!message.isStreaming && (
          <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-muted-lighter hover:text-slate-300 transition-colors text-xs"
              >
                <Copy size={12} />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-muted-lighter hover:text-slate-300 transition-colors text-xs"
              >
                <Download size={12} />
                Download
              </button>
            </div>
            <span className="text-xs text-muted">{formatRelativeTime(message.timestamp)}</span>
          </div>
        )}
      </div>

      {/* Follow-up suggestions */}
      {!message.isStreaming && message.followUps && message.followUps.length > 0 && (
        <div>
          <button
            onClick={() => setShowFollowUps(!showFollowUps)}
            className="flex items-center gap-1.5 text-xs text-muted-lighter hover:text-slate-300 transition-colors mb-2"
          >
            {showFollowUps ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Follow-up suggestions
          </button>
          {showFollowUps && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              {message.followUps.map((f, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp?.(f.prompt, f.mode !== 'DEFAULT' ? f.mode : undefined)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-700 hover:bg-surface-600 border border-white/10 hover:border-white/20 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
