// src/components/SafeSection.tsx
import React from "react"

type Props = {
  title?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void | Promise<void>

  /** Правый слот в заголовке (синонимы: controls | right) */
  right?: React.ReactNode
  controls?: React.ReactNode

  /** Растянуть на всю ширину контейнера */
  fullWidth?: boolean

  /** Поддерживаем и render-prop, и обычные узлы */
  children?: React.ReactNode | (() => React.ReactNode)
}

export default function SafeSection({
  title,
  loading,
  error,
  onRetry,
  right,
  controls,
  fullWidth,
  children,
}: Props) {
  const headerRight = right ?? controls ?? null
  const content =
    typeof children === "function" ? (children as () => React.ReactNode)() : (children as React.ReactNode)

  return (
    <div
      className={[
        "rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)]",
        fullWidth ? "w-full" : "",
      ].join(" ")}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm opacity-70">{title}</div>
          {headerRight ? <div className="ml-2">{headerRight}</div> : null}
        </div>
      )}

      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2">
          <div className="text-red-400 text-sm truncate">{error}</div>
          {onRetry ? (
            <button
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm shrink-0"
              onClick={() => onRetry()}
            >
              Повторить
            </button>
          ) : null}
        </div>
      ) : loading ? (
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        <>{content}</>
      )}
    </div>
  )
}
