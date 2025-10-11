// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"
import CardSection from "../components/CardSection"

export default function DashboardPage() {
  const { t } = useTranslation()

  // читаем поля стора по отдельности, чтобы не триггерить лишние эффекты
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const loading = useDashboardStore((s) => !!s.loading?.global)
  const error = useDashboardStore((s) => s.error)

  useEffect(() => {
    // вызываем один раз при маунте
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hydrateIfNeeded()
  }, [])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      <h1 className="text-lg font-bold mb-3">{t("main")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error", { defaultValue: "Ошибка" })}: {String(error)}
        </div>
      )}

      <div className="mb-4">
        {/* Заголовок секции через i18n */}
        <SafeSection title={t("group_header_my_balance")}>
          {/* Карточка без горизонтальных паддингов, как просили */}
          <CardSection className="px-0">
            <DashboardBalanceCard />
          </CardSection>
        </SafeSection>
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>}
    </div>
  )
}
