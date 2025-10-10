// src/pages/DashboardPage.tsx
// Главная страница (Дашборд): подключённый блок «Мой баланс» + защита от повторных инициализаций.

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

export default function DashboardPage() {
  const { t } = useTranslation()

  // ВАЖНО: берём селекторы по одному, чтобы не создавать новый объект на каждый рендер
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const loading = useDashboardStore((s) => !!s.loading?.global)
  const error = useDashboardStore((s) => s.error)

  // Защита от бесконечного цикла и двойного вызова эффекта (StrictMode)
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    // без зависимостей — запускаем ИСКЛЮЧИТЕЛЬНО на маунт
    hydrateIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading", { defaultValue: "Загрузка…" })}</div>
      )}
    </div>
  )
}
