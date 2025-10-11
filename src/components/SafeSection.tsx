// src/components/SafeSection.tsx
import React from "react";
type Props = { title?: React.ReactNode; controls?: React.ReactNode; loading?: boolean; error?: string | null; onRetry?: () => void; children?: React.ReactNode; fullWidth?: boolean };
export default function SafeSection({ title, controls, loading, error, onRetry, children, fullWidth }: Props) {
  return (
    <section className={`rounded-2xl p-3 bg-[var(--tg-card-bg,#1c1c1e)] ${fullWidth ? "w-full" : ""}`}>
      {(title || controls) && (
        <div className="flex items-center justify-between mb-2">
          {title ? <h3 className="text-sm font-semibold opacity-80">{title}</h3> : <div />}
          {controls ? <div className="flex gap-2">{controls}</div> : null}
        </div>
      )}
      {loading ? <div className="animate-pulse h-20 bg-white/5 rounded-xl" /> : error ? (
        <div className="text-sm opacity-70">{error}{onRetry && <button className="ml-2 underline" onClick={onRetry}>Повторить</button>}</div>
      ) : children}
    </section>
  );
}
