import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearPersistedProgress } from '../store/persistence';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Wired here so a future telemetry hook (Sentry, GlitchTip) drops in
    // without touching call sites.
    console.error('Unhandled error in component tree:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  private handleStartOver = (): void => {
    clearPersistedProgress();
    window.location.hash = '#/';
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-kpmg-light-gray p-6"
      >
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <i
                className="fas fa-exclamation-triangle text-red-500 text-xl"
                aria-hidden="true"
              ></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Something went wrong
              </h1>
              <p className="text-xs text-kpmg-gray">
                The course encountered an unexpected error.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Your progress has been saved. You can try reloading, or start
            fresh if the problem persists.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 overflow-x-auto text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <i className="fas fa-redo" aria-hidden="true"></i>
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={this.handleStartOver}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <span>Start Over</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
