import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional section name, used in the log line. */
  name?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Per-section error boundary: a render error in one dashboard section shows a
 * small retry card instead of blanking the whole page.
 */
class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Section "${this.props.name ?? 'unknown'}" failed to render:`, error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          data-testid="section-error"
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between gap-4"
        >
          <p className="text-red-800 dark:text-red-200 font-semibold">
            This section failed to load
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;
