// Mermaid Diagram Renderer
import { useEffect, useRef, useState } from 'react';
import { Copy, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  source: string;
  className?: string;
}

// Mermaid must be initialised exactly ONCE — multiple calls corrupt internal state in v11+
let mermaidInitialised = false;

async function getMermaid() {
  const mermaid = (await import('mermaid')).default;
  if (!mermaidInitialised) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#1e3a5f',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#3b82f6',
        lineColor: '#60a5fa',
        secondaryColor: '#1e2d4e',
        tertiaryColor: '#0d1424',
        background: '#090e1a',
        mainBkg: '#0d1424',
        nodeBorder: '#3b82f6',
        clusterBkg: '#1a2540',
        titleColor: '#93c5fd',
        edgeLabelBackground: '#1e2d4e',
        fontFamily: 'Inter, sans-serif',
      },
    });
    mermaidInitialised = true;
  }
  return mermaid;
}

export function MermaidDiagram({ source, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!source?.trim() || !containerRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(id, source.trim());

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
        }
        setRendered(true);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to render diagram';
        setError(msg);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [source]);

  const handleCopySource = async () => {
    await copyToClipboard(source);
    toast.success('Diagram source copied');
  };

  const handleDownloadSVG = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svg = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  };

  if (error) {
    return (
      <div className={cn('rounded-xl bg-surface-900 border border-white/10 p-4', className)}>
        <p className="text-xs text-muted-lighter mb-2 font-mono">mermaid — could not render</p>
        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-auto">{source}</pre>
        <p className="mt-2 text-xs text-red-400/70">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-lighter font-medium uppercase tracking-wider">Diagram</span>
        <div className="flex-1 h-px bg-white/5" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-lighter hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-muted-lighter w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-lighter hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-lighter hover:text-white transition-colors"
            title="Reset zoom"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleCopySource}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-lighter hover:text-white transition-colors"
            title="Copy source"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDownloadSVG}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-lighter hover:text-white transition-colors"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Diagram */}
      <div className="overflow-auto rounded-xl bg-surface-900 border border-white/5 p-4">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
        >
          <div ref={containerRef} className="mermaid-container min-h-[100px]">
            {!rendered && !error && (
              <div className="flex items-center justify-center h-24 gap-3 text-muted-lighter">
                <div className="animate-spin w-4 h-4 border-2 border-accent/50 border-t-accent rounded-full" />
                <span className="text-sm">Rendering diagram...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mermaid source */}
      <details className="mt-2">
        <summary className="text-xs text-muted-lighter cursor-pointer hover:text-slate-400 transition-colors">
          View source
        </summary>
        <pre className="mt-2 text-xs font-mono text-slate-400 bg-surface-900 rounded-lg p-3 overflow-auto">
          {source}
        </pre>
      </details>
    </div>
  );
}
