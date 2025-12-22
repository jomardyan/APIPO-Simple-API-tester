import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Send to main process for logging
    if (window.quickApi?.onAppError) {
      window.quickApi.onAppError(`Component error: ${error?.message || error}`);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <div
              className="brand-mark"
              style={{ width: 64, height: 64, fontSize: 20 }}
            >
              !
            </div>
            <div>
              <h2 className="section-title">Something went wrong</h2>
              <p className="muted">
                The application encountered an unexpected error. Your data is
                safe.
              </p>
              {this.state.error && (
                <details style={{ marginTop: 16 }}>
                  <summary style={{ cursor: "pointer", color: "var(--muted)" }}>
                    Error details
                  </summary>
                  <pre
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: "var(--code-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      overflow: "auto",
                      color: "var(--danger)",
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <button className="primary" onClick={this.handleReset}>
                  Try Again
                </button>
                <button
                  className="ghost"
                  onClick={() => window.location.reload()}
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
