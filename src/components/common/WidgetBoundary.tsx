// src/components/common/WidgetBoundary.tsx
import React from "react"

type Props = {
  name: string
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: any
  info?: any
  // трюк для «перемонтирования» дочернего виджета по Retry:
  remountKey: number
}

export default class WidgetBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, remountKey: 0 }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    this.setState({ info })
    // опционально: отправь в свой логгер
    // console.error(`[WidgetBoundary:${this.props.name}]`, error, info)
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: undefined, info: undefined, remountKey: s.remountKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-red-400 text-sm">
              Виджет «{this.props.name}» временно недоступен. Попробуй обновить или нажми «Повторить».
            </div>
            <button
              onClick={this.handleRetry}
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm"
            >
              Повторить
            </button>
          </div>
        </div>
      )
    }
    return <div key={this.state.remountKey}>{this.props.children}</div>
  }
}
