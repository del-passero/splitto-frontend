// src/pages/DashboardPage.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"
import SafeSection from "../components/SafeSection"
import { tSafe } from "../utils/tSafe"

export default function DashboardPage() {
  const { t } = useTranslation()
  const {
    hydrateIfNeeded,
    loading,
    error,
    balance,
    topCategories,
    topPartners,
    recentGroups,
    events,
  } = useDashboardStore((s) => ({
    hydrateIfNeeded: s.hydrateIfNeeded,
    loading: !!s.loading?.global,
    error: s.error,
    balance: s.balance,
    topCategories: s.topCategories,
    topPartners: s.topPartners,
    recentGroups: s.recentGroups,
    events: s.events,
  }))

  useEffect(() => {
    hydrateIfNeeded()
  }, [hydrateIfNeeded])

  const hasAnyData = useMemo(
    () => !!(balance || topCategories || topPartners || recentGroups || events),
    [balance, topCategories, topPartners, recentGroups, events]
  )

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      <h1 className="text-lg font-bold mb-3">{tSafe(t, "home_title", "Главная")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {tSafe(t, "error_generic", "Ошибка загрузки")}: {String(error)}
        </div>
      )}

      <div className="mb-4">
        <SafeSection title={tSafe(t, "balance_title", "Баланс")}>
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title={tSafe(t, "top_categories_title", "Топ категории")}>
          <TopCategoriesCard />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title={tSafe(t, "partners_title", "Партнёры")}>
          <TopPartnersCarousel />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title={tSafe(t, "recent_groups_title", "Последние группы")}>
          <RecentGroupsCarousel />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title={tSafe(t, "events_feed_title", "Лента событий")}>
          <DashboardEventsFeed />
        </SafeSection>
      </div>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{tSafe(t, "loading", "Загрузка…")}</div>
      )}

      {!loading && !hasAnyData && (
        <div className="text-[var(--tg-hint-color)]">
          {tSafe(t, "nothing_yet", "Пока нет данных")}
        </div>
      )}
    </div>
  )
}
