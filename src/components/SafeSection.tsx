// src/components/common/SafeSection.tsx
import React from "react"

type Renderable = React.ReactNode | (() => React.ReactNode)

function renderMaybe(v?: Renderable) {
  return typeof v === "function" ? (v as () => React.ReactNode)() : v ?? null
}

type Props = {
  title?: string
  children?: Renderable
  controls?: Renderable
  right?: Renderable
  loading?: boolean
  error?: string | null
  onRetry?: () => void | Promise<void>
  fullWidth?: boolean
  className?: string
}

export default function SafeSection({
  title,
  children,
  controls,
  right,
  loading = false,
  error = null,
  onRetry,
  fullWidth = false,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "rounded-2xl shadow p-3 bg-[var(--tg-card-bg,#1f1f1f)]",
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {(title || controls || right) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            {title ? <div className="text-sm opacity-70 truncate">{title}</div> : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {renderMaybe(controls)}
            {renderMaybe(right)}
          </div>
        </div>
      )}

      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2">
          <div className="text-red-400 text-sm truncate">{error}</div>
          {onRetry && (
            <button
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm shrink-0"
              onClick={() => void onRetry()}
            >
              Повторить
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="text-sm opacity-80">Загрузка…</div>
      ) : (
        renderMaybe(children)
      )}
    </div>
  )
}
