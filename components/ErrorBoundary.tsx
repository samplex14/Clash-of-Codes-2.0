"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("The Village has been Destroyed:", error, errorInfo);
  }

  private handleRebuild = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="fixed inset-0 bg-[#2a1506] flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-[#4a2810] border-4 border-[#8b6914] rounded-lg p-8 text-center shadow-2xl relative">
          <div className="absolute top-0 left-0 w-4 h-4 bg-[#c9a84c] border border-[#2a1506] -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="absolute top-0 right-0 w-4 h-4 bg-[#c9a84c] border border-[#2a1506] translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#c9a84c] border border-[#2a1506] -translate-x-1/2 translate-y-1/2 rounded-full" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#c9a84c] border border-[#2a1506] translate-x-1/2 translate-y-1/2 rounded-full" />

          <div className="flex justify-center mb-6">
            <ShieldAlert className="w-16 h-16 text-[#e8c96a]" />
          </div>

          <h1 className="text-3xl font-serif font-bold text-[#e8c96a] mb-4 text-shadow-sm">
            The Village has been Destroyed
          </h1>

          <p className="text-[#f5edd8] mb-8 font-medium">
            An unexpected error struck the battlefield. Rally your troops and try again.
          </p>

          <button
            type="button"
            onClick={this.handleRebuild}
            className="px-8 py-3 bg-[#4a7c3f] hover:bg-[#3d6b34] text-white font-bold border-2 border-[#c9a84c] rounded shadow-[0_4px_0_0_#2a4d25] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider"
          >
            Rebuild
          </button>
        </div>
      </div>
    );
  }
}
