// src/pages/DashboardPage.tsx

import { useEffect } from "react"
import { useDashboardStore } from "../store/dashboardStore"

import MainLayout from "../layouts/MainLayout"
import CardSection from "../components/CardSection"

import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"

import WidgetBoundary from "../components/common/WidgetBoundary"
import DashboardActivityChart from "../components/dashboard/DashboardActivityChart"
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"

const DashboardPage = () => {
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)
  const stopLive = useDashboardStore((s) => s.stopLive)

  const activityPeriod = useDashboardStore((s) => s.activityPeriod)
  const summaryPeriod = useDashboardStore((s) => s.summaryPeriod)
  const summaryCurrency = useDashboardStore((s) => s.summaryCurrency)
  const topPeriod = useDashboardStore((s) => s.topCategoriesPeriod)
  const frequentPeriod = useDashboardStore((s) => s.frequentPeriod)

  const loadActivity = useDashboardStore((s) => s.loadActivity)
  const loadSummary = useDashboardStore((s) => s.loadSummary)
  const loadTopCategories = useDashboardStore((s) => s.loadTopCategories)
  const loadTopPartners = useDashboardStore((s) => s.loadTopPartners)
  const loadRecentGroups = useDashboardStore((s) => s.loadRecentGroups)
  const loadEvents = useDashboardStore((s) => s.loadEvents)

  useEffect(() => {
    init()
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
    <MainLayout>
      {/* ЕДИНЫЙ вертикальный интервал между всеми блоками */}
      <div className="space-y-1">
        {/* Баланс (без внешнего CardSection — он уже внутри компонента) */}
        <DashboardBalanceCard />

        {/* Недавние группы */}
        <CardSection noPadding>
          <RecentGroupsCarousel />
        </CardSection>

        {/* Активность + Сводка */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <WidgetBoundary name="Активность">
            <DashboardActivityChart />
          </WidgetBoundary>
          <WidgetBoundary name="Сводка">
            <DashboardSummaryCard />
          </WidgetBoundary>
        </div>

        {/* Топ категорий */}
        <WidgetBoundary name="Топ категорий">
          <TopCategoriesCard />
        </WidgetBoundary>

        {/* Часто делю расходы + Лента событий */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <WidgetBoundary name="Часто делю расходы">
            <TopPartnersCarousel />
          </WidgetBoundary>
          <WidgetBoundary name="Лента событий">
            <DashboardEventsFeed />
          </WidgetBoundary>
        </div>
      </div>
    </MainLayout>
  )
}

export default DashboardPage
