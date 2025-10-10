// src/components/SafeSection.tsx
// Простая «подушка безопасности» вокруг секции: локализованный fallback + лог стека.

import React from "react"
import { useTranslation } from "react-i18next"

type Props = {
  title?: string
  children: React.ReactNode
  className?: string
}

type State = { hasError: boolean; error?: any }

export default class SafeSection extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("[SafeSection] Error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      // use hook proxy to keep class component simple
      return <BoundaryFallback title={this.props.title} />
    }
    return <section className={this.props.className}>{this.props.children}</section>
  }
}

function BoundaryFallback({ title }: { title?: string }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl p-3 border border-[color-mix(in_oklab,var(--tg-border-color)_80%,transparent)] bg-[var(--tg-secondary-bg-color)]">
      {title && <div className="text-sm font-semibold mb-1">{title}</div>}
      <div className="text-sm text-[var(--tg-hint-color)]">
        {t("section_failed_to_render", { defaultValue: "Раздел временно недоступен" })}
      </div>
    </div>
  )
}
