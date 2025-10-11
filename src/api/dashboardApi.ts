// src/api/dashboardApi.ts
// Совместимо со стором: getDashboardFrequentUsers, getDashboardRecentGroups,
// getDashboardTopCategories, getDashboardEvents(filter, limit), и экспортом типов.
// Для совместимости также экспортируются алиасы getTopPartners/getRecentGroups/getTopCategories.

export type PeriodShort = "day" | "week" | "month" | "year";
export type PeriodActivity = "week" | "month" | "year";

/* ===== Types ===== */
export type BalanceEntry = { currency: string; i_owe: number; owed_to_me: number };
export type BalanceResponse = { items: BalanceEntry[]; last_used: string[] };

export type ActivityPoint = { date: string; amount: number };
export type ActivityResponse = { period: PeriodActivity; points: ActivityPoint[] };

export type TopCategory = { id: number; name: string; total: number; color?: string };
export type TopCategoriesResponse = { period: PeriodActivity; items: TopCategory[] };

export type SummaryResponse = {
  period: PeriodShort;
  currency: string;
  spent: number;
  avg_check: number;
  my_share: number;
};

export type GroupPreview = {
  id: number;
  title: string;
  avatar_url?: string | null;
  last_activity_at?: string;
};

export type RecentGroupsResponse = { items: GroupPreview[] };

export type FrequentUser = {
  id: number;
  first_name: string;
  photo_url?: string | null;
  tx_count: number;
};
export type FrequentUsersResponse = { period: PeriodShort | PeriodActivity; items: FrequentUser[] };

export type EventItem = { id: string | number; type: "tx" | "edit" | "group" | "user"; text: string; date: string };
export type EventsResponse = { items: EventItem[] };

/* ===== Base ===== */
const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api";

function tgInitData(): string {
  // @ts-ignore
  const tg = typeof window !== "undefined" ? window?.Telegram?.WebApp : undefined;
  return String(tg?.initData || "");
}

async function http<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(path, API_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)));
      else url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Telegram-Init-Data": tgInitData() },
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

const num = (x: any): number => (typeof x === "number" ? x : Number(x ?? 0));

/* ===== Endpoints (точные имена под стор) ===== */

// 1) Баланс
export async function getDashboardBalance(): Promise<BalanceResponse> {
  const raw = await http<any>("/dashboard/balance");
  const items: BalanceEntry[] = (raw?.items ?? []).map((r: any) => ({
    currency: String(r.currency),
    i_owe: num(r.i_owe),
    owed_to_me: num(r.owed_to_me),
  }));
  const last_used: string[] = Array.isArray(raw?.last_used) ? raw.last_used.map(String) : items.map((i) => i.currency);
  return { items, last_used };
}

// 2) Активность
export async function getDashboardActivity(period: PeriodActivity): Promise<ActivityResponse> {
  const raw = await http<any>("/dashboard/activity", { period });
  const points: ActivityPoint[] = (raw?.points ?? raw ?? []).map((p: any) => ({
    date: String(p.date),
    amount: num(p.amount ?? p.total),
  }));
  const p = (raw?.period as PeriodActivity) || period || "month";
  return { period: p, points };
}

// 3) Топ категорий
export async function getDashboardTopCategories(period: PeriodActivity): Promise<TopCategoriesResponse> {
  const raw = await http<any>("/dashboard/top_categories", { period });
  const items: TopCategory[] = (raw?.items ?? raw ?? []).map((c: any, i: number) => ({
    id: Number(c.id ?? i),
    name: String(c.name),
    total: num(c.total),
    color: c.color ? String(c.color) : undefined,
  }));
  const p = (raw?.period as PeriodActivity) || period || "month";
  return { period: p, items };
}

// 4) Summary
export async function getDashboardSummary(period: PeriodShort, currency: string): Promise<SummaryResponse> {
  const raw = await http<any>("/dashboard/summary", { period, currency });
  return {
    period: (raw?.period as PeriodShort) || period,
    currency: String(raw?.currency || currency),
    spent: num(raw?.spent),
    avg_check: num(raw?.avg_check ?? raw?.avg),
    my_share: num(raw?.my_share ?? raw?.myShare),
  };
}

// 5) Последние активные группы
export async function getDashboardRecentGroups(): Promise<RecentGroupsResponse> {
  const raw = await http<any>("/dashboard/recent_groups");
  const items: GroupPreview[] = (raw?.items ?? raw ?? []).map((g: any) => ({
    id: Number(g.id),
    title: String(g.title),
    avatar_url: g.avatar_url ?? null,
    last_activity_at: g.last_activity_at ? String(g.last_activity_at) : undefined,
  }));
  return { items };
}

// 6) Часто делю расходы (партнёры)
export async function getDashboardFrequentUsers(period: PeriodShort | PeriodActivity): Promise<FrequentUsersResponse> {
  const raw = await http<any>("/dashboard/frequent_users", { period });
  const items: FrequentUser[] = (raw?.items ?? raw ?? []).map((u: any) => ({
    id: Number(u.id),
    first_name: String(u.first_name ?? u.name ?? ""),
    photo_url: u.photo_url ?? null,
    tx_count: Number(u.tx_count ?? u.count ?? 0),
  }));
  const p = (raw?.period as PeriodShort | PeriodActivity) || period;
  return { period: p, items };
}

// 7) Лента событий
export async function getDashboardEvents(
  filter: "all" | "tx" | "edit" | "group" | "user",
  limit = 20
): Promise<EventsResponse> {
  const raw = await http<any>("/dashboard/events", { filter, limit });
  const items: EventItem[] = (raw?.items ?? raw ?? []).map((e: any, i: number) => ({
    id: e.id ?? i,
    type: (e.type as EventItem["type"]) || "tx",
    text: String(e.text ?? ""),
    date: String(e.date ?? new Date().toISOString()),
  }));
  return { items };
}

/* ===== Алиасы под «другие» названия (чтобы не падало, если где-то уже так импортировано) ===== */
export const getTopCategories = (period: PeriodActivity) => getDashboardTopCategories(period);
export const getRecentGroups = () => getDashboardRecentGroups();
export const getTopPartners = (period: "week" | "month" | "year" = "month") =>
  getDashboardFrequentUsers(period);
