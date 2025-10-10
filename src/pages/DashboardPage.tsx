// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

export default function DashboardPage() {
  const { t } = useTranslation()

  // Не тянем сюда loading/error — чтобы не пересоздавать объект и не дёргать useEffect
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const loading = useDashboardStore((s) => !!s.loading?.global)
  const error = useDashboardStore((s) => s.error)

  useEffect(() => {
    // вызываем ровно один раз на маунт — без зависимости на ссылку функции
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
        {/* Заголовок секции по ключу */}
        <SafeSection title={t("group_header_my_balance")}>
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>}
    </div>
  )
}
