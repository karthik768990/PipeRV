"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 bg-red-950/20 rounded-lg border border-red-900/50 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-sm font-semibold text-red-400 mb-1">
            {this.props.moduleName ? `Failed to load ${this.props.moduleName}` : "Something went wrong"}
          </h3>
          <p className="text-xs text-red-400/70 mb-4 max-w-xs break-words">
            {this.state.error?.message || "An unexpected error occurred in this module."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-red-900/50 hover:bg-red-800/80 rounded-md transition-colors border border-red-800"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
