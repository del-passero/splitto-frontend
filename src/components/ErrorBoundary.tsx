// src/components/ErrorBoundary.tsx
import React from "react"

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // минимальный лог — можно отправлять в Sentry/логгер
    console.error("UI crashed:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Что-то пошло не так 😕</h2>
          <p>Попробуйте обновить страницу. Если не поможет — очистите кэш приложения.</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error ?? "")}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
