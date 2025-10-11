// src/components/dashboard/DashboardEventsFeed.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ReceiptText, PenLine, FolderKanban } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import SafeSection from "../SafeSection";

function itemMatches(i: { type: "tx" | "edit" | "group" | "user" }, filter: "all" | "tx" | "edit" | "group" | "user") {
  return filter === "all" || i.type === filter;
}

export default function DashboardEventsFeed() {
  const nav = useNavigate();
  const filter = useDashboardStore((s) => s.eventsFilter);
  const setFilter = useDashboardStore((s) => s.setEventsFilter);
  const events = useDashboardStore((s) => s.events);
  const loading = useDashboardStore((s) => s.loading.events);
  const error = useDashboardStore((s) => s.error.events);

  const items = useMemo(() => events.filter((i) => itemMatches(i, filter)), [events, filter]);

  return (
    <SafeSection
      fullWidth
      title="Лента событий"
      controls={
        <div className="flex items-center gap-1">
          <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded-full text-xs ${filter === "all" ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`}>Все</button>
          <button onClick={() => setFilter("tx")} className={`p-1 rounded-full ${filter === "tx" ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`} title="Транзакции"><ReceiptText className="w-4 h-4" /></button>
          <button onClick={() => setFilter("edit")} className={`p-1 rounded-full ${filter === "edit" ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`} title="Редактирования"><PenLine className="w-4 h-4" /></button>
          <button onClick={() => setFilter("group")} className={`p-1 rounded-full ${filter === "group" ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`} title="Группы"><FolderKanban className="w-4 h-4" /></button>
          <button onClick={() => setFilter("user")} className={`p-1 rounded-full ${filter === "user" ? "bg-[var(--tg-link-color,#2481cc)] text-white" : "bg-white/10"}`} title="Юзеры"><Users className="w-4 h-4" /></button>
        </div>
      }
      loading={loading}
      error={error || null}
      onRetry={() => setFilter(filter)}
    >
      <div role="button" tabIndex={0} onClick={() => nav("/events")} onKeyDown={(e) => e.key === "Enter" && nav("/events")} className="cursor-pointer">
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between bg-white/5 rounded-xl px-2 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full grid place-items-center bg-white/10 shrink-0">
                  {it.type === "tx" ? <ReceiptText className="w-4 h-4" /> : it.type === "edit" ? <PenLine className="w-4 h-4" /> : it.type === "group" ? <FolderKanban className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </span>
                <div className="truncate">{it.text}</div>
              </div>
              <div className="text-xs opacity-60 shrink-0">{new Date(it.date).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-xs opacity-60 mt-2">Кликабельно: ведёт на «Все события»</div>
    </SafeSection>
  );
}
