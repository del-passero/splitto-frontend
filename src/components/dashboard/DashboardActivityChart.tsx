// src/components/dashboard/DashboardActivityChart.tsx
import React from "react"
import { useDashboardStore } from "../../store/dashboardStore"

type Period = "day" | "week" | "month" | "year"
const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
]

// dd.mm из "YYYY-MM-DD" без Date()
function ddmm(s: unknown): string {
  if (typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return `${s.slice(8, 10)}.${s.slice(5, 7)}`
  }
  return String(s ?? "")
}

export default function DashboardActivityChart() {
  const {
    activity,
    activityPeriod,
    loading,
    error,
    loadActivity,
    setActivityPeriod,
  } = useDashboardStore((s) => ({
    activity: s.activity,
    activityPeriod: s.activityPeriod,
    loading: s.loading,
    error: s.error,
    loadActivity: s.loadActivity,
    setActivityPeriod: s.setActivityPeriod,
  }))

  React.useEffect(() => {
    void loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const raw = activity?.buckets
  const buckets = Array.isArray(raw)
    ? raw.map((b: any) => ({
        date: ddmm(b?.date),
        count: Number(b?.count) || 0,
      }))
    : []

  const max = buckets.reduce((m, b) => (b.count > m ? b.count : m), 1)
  const n = buckets.length
  const labelStep = n <= 6 ? 1 : Math.ceil(n / 6)

  const isLoading = !!loading.activity
  const errMsg = error.activity || ""
  const isError = !isLoading && !!errMsg

  // Карточка-обёртка без сторонних компонентов
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.06)",
        padding: 16,
        color: "white",
      }}
    >
      {/* header */}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ opacity: 0.9, fontWeight: 600 }}>Активность</div>
        <div style={{ display: "flex", gap: 6 }}>
          {PERIODS.map((p) => {
            const active = activityPeriod === p.key
            return (
              <button
                key={p.key}
                onClick={() => setActivityPeriod(p.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 8,
                  padding: "6px 8px",
                  fontSize: 12,
                  background: active
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.08)",
                  color: "white",
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* loading */}
      {isLoading && (
        <div
          style={{
            height: 176,
            width: "100%",
            paddingLeft: 12,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(10, (i % 10) * 8)}%`,
                  background: "rgba(255,255,255,0.2)",
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {!isLoading && isError && (
        <div
          style={{
            height: 176,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div style={{ opacity: 0.85 }}>Виджет «Активность» временно недоступен.</div>
          <div style={{ opacity: 0.6, fontSize: 13 }}>{errMsg}</div>
          <button
            onClick={() => loadActivity()}
            style={{
              marginTop: 4,
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* empty */}
      {!isLoading && !isError && buckets.length === 0 && (
        <div
          style={{
            height: 176,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.7,
          }}
        >
          Нет данных за выбранный период
        </div>
      )}

      {/* chart */}
      {!isLoading && !isError && buckets.length > 0 && (
        <div style={{ position: "relative" }}>
          {/* горизонтальная сетка */}
          <div style={{ position: "absolute", inset: 0 }}>
            {[0, 25, 50, 75, 100].map((p) => (
              <div
                key={p}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: `${p}%`,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>

          {/* столбики */}
          <div style={{ height: 176, width: "100%", paddingLeft: 12 }}>
            <div
              role="list"
              style={{
                margin: 0,
                padding: 0,
                display: "flex",
                height: "100%",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              {buckets.map((b, i) => {
                const h = Math.max(4, Math.round((b.count / max) * 100))
                return (
                  <div
                    role="listitem"
                    key={`bar-${i}`}
                    title={`${b.date}: ${b.count}`}
                    aria-label={`${b.date}: ${b.count}`}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${h}%`,
                        background: "rgba(255,255,255,0.75)",
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* подписи */}
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
              fontSize: 10,
              color: "rgba(255,255,255,0.7)",
              gap: 0,
            }}
          >
            {buckets.map((b, i) => (
              <div key={`lbl-${i}`} style={{ textAlign: "center" }}>
                {i % labelStep === 0 ? b.date : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
