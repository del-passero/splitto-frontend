// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react"
import { useDashboardStore } from "../store/dashboardStore"

import MainLayout from "../layouts/MainLayout"
import CardSection from "../components/CardSection"

import WidgetBoundary from "../components/common/WidgetBoundary"

import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import DashboardActivityChart from "../components/dashboard/DashboardActivityChart"
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"

import { useGroupsStore } from "../store/groupsStore"
import CreateTransactionModal from "../components/transactions/CreateTransactionModal"

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

  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? [])

  const [createTxOpen, setCreateTxOpen] = useState(false)

  useEffect(() => {
    init()
    // первичная догрузка (TTL в сторе защитит от дублей)
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
      <CardSection noPadding>
        <DashboardBalanceCard onAddTransaction={() => setCreateTxOpen(true)} />
      </CardSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WidgetBoundary name="Активность">
          <DashboardActivityChart />
        </WidgetBoundary>
        <WidgetBoundary name="Сводка">
          <DashboardSummaryCard />
        </WidgetBoundary>
      </div>

      <WidgetBoundary name="Топ категорий">
        <TopCategoriesCard />
      </WidgetBoundary>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WidgetBoundary name="Часто делю расходы">
          <TopPartnersCarousel />
        </WidgetBoundary>
        <WidgetBoundary name="Недавние группы">
          <RecentGroupsCarousel />
        </WidgetBoundary>
      </div>

      <WidgetBoundary name="Лента событий">
        <DashboardEventsFeed />
      </WidgetBoundary>

      {/* Модалка «Добавить транзакцию» */}
      <CreateTransactionModal
        open={createTxOpen}
        onOpenChange={setCreateTxOpen}
        groups={(groups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
        }))}
      />
    </MainLayout>
  )
}

export default DashboardPage
