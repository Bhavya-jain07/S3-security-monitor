import React from 'react';
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl backdrop-blur-sm backdrop-filter border border-red-500/20 bg-gray-900/50 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-400">Component Error</h3>
              <p className="text-sm text-gray-400 mt-1">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;