// src/pages/DashboardPage.tsx
import React, { useEffect } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import { useDashboardStore } from "../store/dashboardStore";

import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard";
import DashboardActivityChart from "../components/dashboard/DashboardActivityChart";
import TopCategoriesCard from "../components/dashboard/TopCategoriesCard";
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard";
import RecentGroupsCarousel from "../components/dashboard/RecentGroupsCarousel";
import TopPartnersCarousel from "../components/dashboard/TopPartnersCarousel";
import DashboardEventsFeed from "../components/dashboard/DashboardEventsFeed";

export default function DashboardPage() {
  const init = useDashboardStore((s) => s.init);
  const startLive = useDashboardStore((s) => s.startLive);
  const stopLive = useDashboardStore((s) => s.stopLive);

  useEffect(() => {
    init().catch(() => void 0);
    startLive();
    return () => stopLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-full p-3 pb-20 space-y-3">
        {/* 1. Мой баланс (full-width) */}
        <DashboardBalanceCard />

        {/* 2. Активность + Топ категорий */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DashboardActivityChart />
          <TopCategoriesCard />
        </div>

        {/* 3. Сводка (3 столбца) */}
        <DashboardSummaryCard />

        {/* 4. Последние активные группы (full-width) */}
        <RecentGroupsCarousel />

        {/* 5. Часто делю расходы (full-width) */}
        <TopPartnersCarousel />

        {/* 6. Лента событий (full-width) */}
        <DashboardEventsFeed />
      </div>
    </ErrorBoundary>
  );
}
