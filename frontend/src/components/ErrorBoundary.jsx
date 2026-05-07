import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error',
      errorStack: error?.stack || '',
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep detailed error in console for debugging production incidents.
    console.error('Application render error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-800 mb-2">Unexpected application error</h1>
            <p className="text-sm text-slate-500 mb-5">
              The page encountered an issue. Reset session data and continue from the login page.
            </p>
            {this.state.errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left">
                <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
                <p className="text-xs text-red-700 break-words">{this.state.errorMessage}</p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Reset Session and Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
