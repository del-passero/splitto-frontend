// src/components/ErrorBoundary.tsx
import React from "react"

type Props = {
  children: React.ReactNode
  title?: string
  fallback?: React.ReactNode
}

type State = {
  error: Error | null
  info: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // пробрасываем в консоль полный стек, чтобы видеть точное место
    // и в DevTools, и в логах хостинга (если они подхватывают console.error)
    // это ВАЖНО для расшифровки minified errors (в том числе #185)
    // и поиска конкретного компонента.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info)
    this.setState({ info })
  }

  handleReload = () => {
    try {
      // иногда помогает сброс кэша Vite/SPA
      if ("caches" in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
      }
    } catch {}
    window.location.reload()
  }

  render() {
    const { error, info } = this.state
    const { title, fallback } = this.props

    if (!error) return this.props.children

    if (fallback) return <>{fallback}</>

    return (
      <div style={{ padding: 16, color: "var(--tg-text-color)", background: "var(--tg-bg-color)" }}>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>
          {title ? `${title}: ` : ""}Что-то пошло не так 😕
        </h2>
        <p style={{ opacity: 0.8, marginBottom: 12 }}>
          Попробуйте обновить страницу. Если не поможет — очистите кэш приложения.
        </p>

        <details open style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12, lineHeight: 1.4 }}>
          <summary style={{ cursor: "pointer", marginBottom: 8 }}>Диагностика</summary>
          <div><strong>error.message:</strong> {error.message}</div>
          {"stack" in error && error.stack ? (
            <>
              <div style={{ marginTop: 8 }}><strong>error.stack:</strong></div>
              <div>{error.stack}</div>
            </>
          ) : null}
          {info?.componentStack ? (
            <>
              <div style={{ marginTop: 8 }}><strong>componentStack:</strong></div>
              <div>{info.componentStack}</div>
            </>
          ) : null}
        </details>

        <button
          onClick={this.handleReload}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "var(--tg-button-color)",
            color: "var(--tg-button-text-color)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Обновить
        </button>
      </div>
    )
  }
}
