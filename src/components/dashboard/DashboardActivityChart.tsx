// src/components/dashboard/DashboardActivityChart.tsx
import React, { useEffect, useMemo } from "react"
import { useDashboardStore } from "../../store/dashboardStore"
import type { PeriodAll } from "../../types/dashboard"

const PERIODS: PeriodAll[] = ["day", "week", "month", "year"]

export default function DashboardActivityChart() {
  const {
    activity,
    loading,
    error,
    activityPeriod,
    setActivityPeriod,
    loadActivity,
  } = useDashboardStore((s) => ({
    activity: s.activity,
    loading: s.loading.activity,
    error: s.error.activity || "",
    activityPeriod: s.activityPeriod,
    setActivityPeriod: s.setActivityPeriod,
    loadActivity: s.loadActivity,
  }))

  useEffect(() => {
    void loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buckets = activity?.buckets ?? []
  const max = useMemo(() => {
    if (!buckets.length) return 0
    return buckets.reduce((m: number, b: any) => Math.max(m, Number(b?.count ?? 0)), 0)
  }, [buckets])

  const handleRetry = () => {
    void loadActivity(activityPeriod)
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-white/90">Активность</h3>

        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
            {PERIODS.map((p) => {
              const active = p === activityPeriod
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivityPeriod(p)}
                  className={[
                    "px-2.5 py-1.5 text-xs capitalize",
                    active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  {p === "day" ? "день" : p === "week" ? "неделя" : p === "month" ? "месяц" : "год"}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/[0.06]"
            title="Обновить"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-[11rem]">
        {loading ? (
          <SkeletonBars />
        ) : error ? (
          <ErrorView message="Виджет «Активность» временно недоступен." onRetry={handleRetry} />
        ) : buckets.length === 0 ? (
          <EmptyView />
        ) : (
          <Chart buckets={buckets} max={max} />
        )}
      </div>
    </section>
  )
}

function Chart({
  buckets,
  max,
}: {
  buckets: Array<{ date: string; count: number }>
  max: number
}) {
  const step = useMemo(() => Math.max(1, Math.floor(buckets.length / 6)), [buckets.length])

  return (
    <div className="relative">
      {/* ось Y / сетка */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10" />
        <div className="absolute top-0 left-0 right-0 border-t border-white/10" />
        <div className="absolute top-0 left-0 text-[10px] leading-none text-white/50">{max}</div>
        <div className="absolute bottom-0 left-0 text-[10px] leading-none text-white/50">0</div>
      </div>

      {/* бары */}
      <div className="h-44 w-full pl-4">
        <div className="flex h-full items-end gap-[6px]">
          {buckets.map((b: any, i: number) => {
            const v = Number(b?.count ?? 0)
            const h = max > 0 ? (v / max) * 100 : 0
            return (
              <div key={`${b?.date ?? i}`} className="flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-indigo-400/80 ring-1 ring-indigo-300/40"
                  style={{ height: `${Math.max(4, h)}%` }}
                  title={`${b?.date ?? ""}: ${v}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* подписи X */}
      {buckets.length > 0 && (
        <div className="mt-2 flex justify-between pl-4 text-[10px] text-white/60">
          {buckets.map((b: any, i: number) => (
            <span key={`lbl-${b?.date ?? i}`} className="flex-1 text-center">
              {i % step === 0 ? trimDate(b?.date) : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonBars() {
  const n = 18
  return (
    <div className="h-44 w-full pl-4">
      <div className="flex h-full items-end gap-[6px]">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div
              className="w-full animate-pulse rounded-t bg-white/10"
              style={{ height: `${10 + ((i * 7) % 70)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-44 items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-sm text-white/80">{message}</div>
        <button
          onClick={onRetry}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.06]"
        >
          Повторить
        </button>
      </div>
    </div>
  )
}

function EmptyView() {
  return (
    <div className="flex h-44 items-center justify-center text-sm text-white/60">
      Пока нет данных за выбранный период
    </div>
  )
}

function trimDate(s?: string) {
  if (!s) return ""
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? `${m[3]}.${m[2]}` : s
}
