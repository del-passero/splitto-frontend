// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

// ВРЕМЕННО отключено всё, кроме Баланса, чтобы изолировать источник падения.
export default function DashboardPage() {
  const { t } = useTranslation()
  const { hydrateIfNeeded, loading, error } = useDashboardStore((s) => ({
    hydrateIfNeeded: s.hydrateIfNeeded,
    loading: !!s.loading?.global,
    error: s.error,
  }))

  useEffect(() => {
    hydrateIfNeeded()
  }, [hydrateIfNeeded])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      <h1 className="text-lg font-bold mb-3">{t("home_title")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error_generic", { defaultValue: "Ошибка загрузки" })}: {String(error)}
        </div>
      )}

      <div className="mb-4">
        <SafeSection title="Баланс">
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
      )}
    </div>
  )
}
