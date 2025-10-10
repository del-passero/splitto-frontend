// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

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
      <h1 className="text-lg font-bold mb-3">{t("main")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error", { defaultValue: "Ошибка" })}: {String(error)}
        </div>
      )}

      <div className="mb-4">
        {/* Заголовок секции через i18n-ключ, как просили */}
        <SafeSection title={t("group_header_my_balance")}>
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>}
    </div>
  )
}
