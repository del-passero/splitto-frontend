// src/pages/DashboardPage.tsx

import { useEffect } from "react"
import { useDashboardStore } from "../store/dashboardStore"

import MainLayout from "../layouts/MainLayout"

import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardActivityChart from "../components/dashboard/DashboardActivityChart"
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"

const DashboardPage = () => {
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)
  const stopLive = useDashboardStore((s) => s.stopLive)

  useEffect(() => {
    startLive()
    void init()
    return () => {
      try {
        stopLive && stopLive()
      } catch {
        /* no-op */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <MainLayout>
      <div className="space-y-1">
        <DashboardBalanceCard />
        <RecentGroupsCarousel />
        <DashboardActivityChart />
        <DashboardSummaryCard />
        <TopCategoriesCard />
        <TopPartnersCarousel />
        <DashboardEventsFeed />
      </div>
    </MainLayout>
  )
}

export default DashboardPage
