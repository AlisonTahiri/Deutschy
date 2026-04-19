import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Uncaught render error:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ minHeight: '50vh' }}>
                    <h2 className="text-xl font-bold">Something went wrong</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {this.state.error.message}
                    </p>
                    <button
                        className="px-4 py-2 rounded-xl font-semibold text-sm border border-(--border-card) bg-(--bg-card)"
                        onClick={() => this.setState({ error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
