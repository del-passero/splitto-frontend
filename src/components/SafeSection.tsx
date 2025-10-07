// src/components/SafeSection.tsx
import { ErrorBoundary } from "./ErrorBoundary"

export default function SafeSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      title={title}
      fallback={
        <div className="p-3 rounded-xl bg-[var(--tg-card-bg)] text-[var(--tg-hint-color)]">
          {title}: ошибка рендера секции. Подробности в консоли.
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
