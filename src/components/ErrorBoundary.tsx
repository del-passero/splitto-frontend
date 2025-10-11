// src/components/ErrorBoundary.tsx
import React from "react"

type Props = { children: React.ReactNode; fallback?: React.ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() { /* можно логировать */ }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="px-2 py-2 text-[var(--tg-hint-color)]">Раздел временно недоступен</div>
      )
    }
    return this.props.children
  }
}
