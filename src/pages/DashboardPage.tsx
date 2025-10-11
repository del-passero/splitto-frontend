// src/pages/DashboardPage.tsx
// Страница: секция с заголовком мы рендерим внутри карточки (по требованию),
// CardSection используем без горизонтальных отступов (через px-0 + внутренний -mx-2)

import { useEffect } from "react"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"
import CardSection from "../components/CardSection"

export default function DashboardPage() {
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const loading = useDashboardStore((s) => !!s.loading?.global)
  const error = useDashboardStore((s) => s.error)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hydrateIfNeeded()
  }, [])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      {/* Внешний заголовок страницы — "Главная" отрисовывается где-то выше в общем layout, поэтому тут без h1 */}

      {error && (
        <div className="mb-3 text-red-500">
          Ошибка: {String(error)}
        </div>
      )}

      <div className="mb-4">
        {/* SafeSection без собственного title — заголовок внутри карточки */}
        <SafeSection>
          {/* Карточка edge-to-edge: CardSection без горизонтальных паддингов */}
          <CardSection className="px-0">
            <DashboardBalanceCard />
          </CardSection>
        </SafeSection>
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">Загрузка...</div>}
    </div>
  )
}
