import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            The application encountered an unexpected error. This might be due to outdated cached data.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                Reset Data & Fix
            </button>
            
            <button 
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 rounded-xl font-bold transition border border-gray-700"
            >
                Reload Page
            </button>
          </div>

          <div className="mt-12 w-full max-w-2xl">
            <details className="text-left">
                <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-400 transition select-none">
                    Show Error Details (For Developer)
                </summary>
                <div className="mt-4 bg-black/50 p-4 rounded-lg overflow-auto max-h-64 border border-gray-800">
                    <p className="text-red-400 font-mono text-xs mb-2 font-bold">{this.state.error && this.state.error.toString()}</p>
                    <pre className="text-gray-600 font-mono text-[10px] whitespace-pre-wrap">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;