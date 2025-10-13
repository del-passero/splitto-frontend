// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
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

const DashboardPage = () => {
  const { t } = useTranslation()

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
      {/* 1) Баланс */}
      <CardSection noPadding>
        <DashboardBalanceCard />
      </CardSection>

      {/* 2) Недавние группы */}
      <WidgetBoundary name={t("dashboard.recent_groups") || "Последние активные группы"}>
        <RecentGroupsCarousel />
      </WidgetBoundary>

      {/* 3) Активность + Сводка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WidgetBoundary name={t("dashboard.activity") || "Активность"}>
          <DashboardActivityChart />
        </WidgetBoundary>
        <WidgetBoundary name={t("dashboard.spent") || "Сводка"}>
          <DashboardSummaryCard />
        </WidgetBoundary>
      </div>

      {/* 4) Топ категорий */}
      <WidgetBoundary name={t("dashboard.top_categories") || "Топ категорий"}>
        <TopCategoriesCard />
      </WidgetBoundary>

      {/* 5) Часто делю расходы + Недавние группы (карусель партнёров и др.) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WidgetBoundary name={t("dashboard.top_partners") || "Часто делю расходы"}>
          <TopPartnersCarousel />
        </WidgetBoundary>
        <WidgetBoundary name={t("dashboard.recent_groups") || "Последние активные группы"}>
          <RecentGroupsCarousel />
        </WidgetBoundary>
      </div>

      {/* 6) Лента событий */}
      <WidgetBoundary name={t("dashboard.events_feed") || "Лента событий"}>
        <DashboardEventsFeed />
      </WidgetBoundary>
    </MainLayout>
  )
}

export default DashboardPage
