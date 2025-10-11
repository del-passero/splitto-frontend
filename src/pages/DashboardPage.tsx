// src/pages/DashboardPage.tsx
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
    // один вызов при маунте
    hydrateIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      {error && <div className="mb-3 text-red-500">Ошибка: {String(error)}</div>}

      <div className="mb-4">
        {/* Заголовок выводим внутри карточки — тут SafeSection без title */}
        <SafeSection>
          {/* ВАЖНО: без боковых паддингов, как просили */}
          <CardSection noPadding>
            <DashboardBalanceCard />
          </CardSection>
        </SafeSection>
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">Загрузка...</div>}
    </div>
  )
}
