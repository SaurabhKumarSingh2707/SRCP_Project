import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        const isChunkLoadError = error?.name === 'ChunkLoadError' || 
            (error?.message && (
                error.message.includes('Failed to fetch dynamically imported module') ||
                error.message.includes('Importing a module script failed')
            ));

        if (isChunkLoadError) {
            const lastReload = sessionStorage.getItem('chunk_reload');
            const now = Date.now();
            if (!lastReload || (now - parseInt(lastReload, 10)) > 10000) {
                sessionStorage.setItem('chunk_reload', now.toString());
                window.location.reload(true);
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
                    <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-border">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                        <p className="text-slate-600 mb-6 text-sm">
                            We've encountered an unexpected issue. Please try refreshing the page.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3 px-6 rounded-xl transition-all"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
