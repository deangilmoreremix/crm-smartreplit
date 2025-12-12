import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  appName: string;
  appUrl?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RemoteAppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Remote app error in ${this.props.appName}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleOpenInNewTab = () => {
    if (this.props.appUrl) {
      window.open(this.props.appUrl, '_blank');
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full h-64 flex items-center justify-center border-red-200 bg-red-50">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-800 mb-2">
              {this.props.appName} Unavailable
            </CardTitle>
            <p className="text-red-600 mb-4 max-w-md mx-auto">
              The {this.props.appName} could not be loaded. This might be due to network issues or the remote service being temporarily unavailable.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              {this.props.appUrl && (
                <Button
                  onClick={this.handleOpenInNewTab}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-red-700 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default RemoteAppErrorBoundary;
