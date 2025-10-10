// src/pages/DashboardPage.tsx
// Главная страница с реальным блоком «Мой баланс», обёрнутым в SafeSection.

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
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)] min-h-screen">
      <h1 className="text-lg font-bold mb-3">{t("home_title", { defaultValue: "Главная" })}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error_generic", { defaultValue: "Ошибка загрузки" })}: {String(error)}
        </div>
      )}

      {/* 1) Мой баланс (full-width) */}
      <SafeSection title={t("home_balance", { defaultValue: "Мой баланс" })} className="mb-4">
        <DashboardBalanceCard />
      </SafeSection>

      {/* Остальные секции пока заглушки — вернём позже по одной */}
      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading", { defaultValue: "Загрузка…" })}</div>
      )}
    </div>
  )
}
