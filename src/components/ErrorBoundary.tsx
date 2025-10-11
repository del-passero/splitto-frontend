// src/components/ErrorBoundary.tsx
import React from "react";
type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean };
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("[ErrorBoundary]", error, info); }
  render() { return this.state.hasError ? (this.props.fallback ?? <div className="p-4 text-center opacity-70">Что-то пошло не так</div>) : this.props.children; }
}
