import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kube-migrate] UI error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl glass glow-red p-8 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <span className="text-xl">💥</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-300">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h3>
              <p className="text-sm text-red-400/70 mt-0.5">
                An error occurred while rendering this section.
              </p>
            </div>
          </div>
          {this.state.error && (
            <pre className="code-block text-xs text-red-300/80 max-h-40 overflow-auto rounded-xl p-4 bg-red-500/5 border border-red-500/20">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30 text-red-300 font-semibold text-sm hover:from-red-600/30 hover:to-red-500/20 transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
