// src/pages/DashboardPage.tsx
// Меняем ключи локализации: main / group_header_my_balance

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

export default function DashboardPage() {
  const { t } = useTranslation()
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const loading = useDashboardStore((s) => !!s.loading?.global)
  const error = useDashboardStore((s) => s.error)

  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    hydrateIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)] min-h-screen">
      <h1 className="text-lg font-bold mb-3">{t("main")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error")}: {String(error)}
        </div>
      )}

      <SafeSection title={t("group_header_my_balance")} className="mb-4">
        <DashboardBalanceCard />
      </SafeSection>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
      )}
    </div>
  )
}
