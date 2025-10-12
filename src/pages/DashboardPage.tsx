// src/pages/DashboardPage.tsx
// Подключены все виджеты дашборда + стартовые загрузки и live-пуллинг баланса.

import { useEffect } from "react"
import { useDashboardStore } from "../store/dashboardStore"

import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import DashboardActivityChart from "../components/dashboard/DashboardActivityChart"
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"

const DashboardPage = () => {
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)
  const stopLive = useDashboardStore((s) => s.stopLive)

  // Параметры по умолчанию из стора
  const activityPeriod = useDashboardStore((s) => s.activityPeriod)
  const summaryPeriod = useDashboardStore((s) => s.summaryPeriod)
  const summaryCurrency = useDashboardStore((s) => s.summaryCurrency)
  const topPeriod = useDashboardStore((s) => s.topCategoriesPeriod)
  const frequentPeriod = useDashboardStore((s) => s.frequentPeriod)

  // Методы загрузки (компоненты тоже дергают их сами; TTL защитит от дублей)
  const loadActivity = useDashboardStore((s) => s.loadActivity)
  const loadSummary = useDashboardStore((s) => s.loadSummary)
  const loadTopCategories = useDashboardStore((s) => s.loadTopCategories)
  const loadTopPartners = useDashboardStore((s) => s.loadTopPartners)
  const loadRecentGroups = useDashboardStore((s) => s.loadRecentGroups)
  const loadEvents = useDashboardStore((s) => s.loadEvents)

  useEffect(() => {
    init()
    // первичная загрузка всего (безопасно: в сторе TTL и флаги)
    void loadActivity(activityPeriod)
    void loadSummary(summaryPeriod, summaryCurrency)
    void loadTopCategories(topPeriod)
    void loadTopPartners(frequentPeriod)
    void loadRecentGroups(10)
    void loadEvents(20)

    startLive(30_000)
    return () => stopLive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Баланс по всем активным группам */}
      <DashboardBalanceCard />

      {/* Верхние метрики: активность и сводка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DashboardActivityChart />
        <DashboardSummaryCard />
      </div>

      {/* Топ категорий за период */}
      <TopCategoriesCard />

      {/* Частые партнёры + Недавние группы */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TopPartnersCarousel />
        <RecentGroupsCarousel />
      </div>

      {/* Лента событий */}
      <DashboardEventsFeed />
    </div>
  )
}

export default DashboardPage
