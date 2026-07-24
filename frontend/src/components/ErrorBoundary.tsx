// ErrorBoundary — catches render errors and shows a recovery UI instead of blank screen
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'app'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 my-2">
          <p className="text-sm font-medium text-red-400">Render error in {this.props.label ?? 'component'}</p>
          <p className="text-xs text-red-400/70 mt-1 font-mono">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
