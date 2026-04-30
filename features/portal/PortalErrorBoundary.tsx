"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface PortalErrorBoundaryProps {
  children: ReactNode;
}

interface PortalErrorBoundaryState {
  hasError: boolean;
}

export default class PortalErrorBoundary extends Component<PortalErrorBoundaryProps, PortalErrorBoundaryState> {
  state: PortalErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PortalErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keep the boundary user-facing and lightweight for now.
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section">
          <div className="max-w-xl mx-auto card p-8 text-center">
            <h2 className="font-display text-2xl text-glow mb-3">Mission interrupted</h2>
            <p className="text-comet mb-6">Something went wrong while opening this birthday portal.</p>
            <button type="button" className="btn-primary" onClick={() => this.setState({ hasError: false })}>
              Replay Portal
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}