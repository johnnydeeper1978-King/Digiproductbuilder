import { Component, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props { children: ReactNode; }
interface State { hasError: boolean; message?: string; }

/** App-level error boundary so a render error shows a state, not a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : undefined };
  }
  render() {
    if (this.state.hasError) {
      return <ErrorState title="Unexpected error" message={this.state.message} onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
