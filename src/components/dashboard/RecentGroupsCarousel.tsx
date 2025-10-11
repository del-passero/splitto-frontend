// src/components/dashboard/RecentGroupsCarousel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../../store/dashboardStore";
import SafeSection from "../SafeSection";
import GroupCard from "../GroupCard";

export default function RecentGroupsCarousel() {
  const groups = useDashboardStore((s) => s.groups);
  const loading = useDashboardStore((s) => s.loading.groups);
  const error = useDashboardStore((s) => s.error.groups);
  const refresh = useDashboardStore((s) => s.refreshAll);
  const nav = useNavigate();

  return (
    <SafeSection fullWidth title="Последние активные группы" loading={loading} error={error || null} onRetry={() => refresh()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g as any} onClick={() => nav(`/groups/${g.id}`)} />
        ))}
      </div>
    </SafeSection>
  );
}
