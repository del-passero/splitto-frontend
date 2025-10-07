// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"
// (если есть Activity/Summary — подключи здесь же)

export default function DashboardPage() {
  const { t } = useTranslation()
  const { hydrateIfNeeded, loading } = useDashboardStore((s) => ({
    hydrateIfNeeded: s.hydrateIfNeeded,
    loading: !!s.loading?.global,
  }))

  useEffect(() => {
    // без передачи user.id — стор сам решит валюту (summaryCurrency уже по умолчанию)
    hydrateIfNeeded()
  }, [hydrateIfNeeded])

  return (
    <div className="p-3">
      <h1 className="text-lg font-bold mb-3">{t("home_title")}</h1>

      {/* Баланс */}
      <div className="mb-4">
        <DashboardBalanceCard />
      </div>

      {/* Топ категории */}
      <div className="mb-4">
        <TopCategoriesCard />
      </div>

      {/* Партнёры */}
      <div className="mb-4">
        <TopPartnersCarousel />
      </div>

      {/* Последние группы */}
      <div className="mb-4">
        <RecentGroupsCarousel />
      </div>

      {/* Лента событий */}
      <div className="mb-4">
        <DashboardEventsFeed />
      </div>

      {loading && <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>}
    </div>
  )
}

