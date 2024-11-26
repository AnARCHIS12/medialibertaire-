import React, { Component, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600 w-12 h-12" />
            </div>
            <h1 className="text-xl font-bold text-center mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-gray-600 text-center mb-4">
              Nous nous excusons pour ce désagrément. Veuillez recharger la page ou réessayer plus tard.
            </p>
            {this.state.error && (
              <div className="bg-gray-50 p-3 rounded-md mb-4 overflow-auto">
                <pre className="text-sm text-gray-700">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
