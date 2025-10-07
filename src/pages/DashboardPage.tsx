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
      <h1 className="text-lg font-bold mb-3">{t("home_title")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error_generic", { defaultValue: "Ошибка загрузки" })}: {error}
        </div>
      )}

      <div className="mb-4">
        <SafeSection title="Баланс">
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title="Топ категории">
          <TopCategoriesCard />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title="Партнёры">
          <TopPartnersCarousel />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title="Последние группы">
          <RecentGroupsCarousel />
        </SafeSection>
      </div>

      <div className="mb-4">
        <SafeSection title="Лента событий">
          <DashboardEventsFeed />
        </SafeSection>
      </div>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
      )}

      {!loading && !hasAnyData && (
        <div className="text-[var(--tg-hint-color)]">
          {t("nothing_yet", { defaultValue: "Пока нет данных" })}
        </div>
      )}
    </div>
  )
}
