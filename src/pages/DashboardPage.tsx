// src/pages/DashboardPage.tsx
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard"
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel"
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel"
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed"

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

  // флаги «что-то уже пришло», чтобы не падать на пустых данных
  const hasAnyData = useMemo(
    () =>
      !!(balance || topCategories || topPartners || recentGroups || events),
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
