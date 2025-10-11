// src/store/dashboardStore.ts
import { create } from "zustand";
import {
  getDashboardActivity,
  getDashboardBalance,
  getDashboardEvents,
  getDashboardFrequentUsers,
  getDashboardRecentGroups,
  getDashboardSummary,
  getDashboardTopCategories,
  type ActivityPoint,
  type BalanceEntry,
  type EventItem,
  type FrequentUser,
  type GroupPreview,
  type PeriodActivity,
  type PeriodShort,
  type TopCategory,
} from "../api/dashboardApi";

type LoadingState = { balance: boolean; activity: boolean; top: boolean; summary: boolean; groups: boolean; frequent: boolean; events: boolean };
type ErrorState = Partial<Record<keyof LoadingState, string | null>>;

export type DashboardState = {
  balance: BalanceEntry[];
  currenciesRecent: string[];
  balanceActive: string[];

  activityPeriod: PeriodActivity;
  activity: ActivityPoint[];

  topCategoriesPeriod: PeriodActivity;
  topCategories: TopCategory[];

  summaryPeriod: PeriodShort;
  summaryCurrency: string;
  summary: { spent: number; avg_check: number; my_share: number } | null;

  groups: GroupPreview[];
  frequentPeriod: PeriodShort | PeriodActivity;
  frequentUsers: FrequentUser[];

  eventsFilter: "all" | "tx" | "edit" | "group" | "user";
  events: EventItem[];

  loading: LoadingState;
  error: ErrorState;

  init: () => Promise<void>;
  refreshAll: () => Promise<void>;

  setActivityPeriod: (p: PeriodActivity) => void;
  setTopPeriod: (p: PeriodActivity) => void;

  setSummaryPeriod: (p: PeriodShort) => void;
  setSummaryCurrency: (c: string) => void;

  setFrequentPeriod: (p: PeriodShort | PeriodActivity) => void;
  setEventsFilter: (f: "all" | "tx" | "edit" | "group" | "user") => void;
  setBalanceActive: (c: string) => void;

  startLive: () => void;
  stopLive: () => void;

  _intervalId?: number | null;
};

function pickDefaultActive(recent: string[], available: string[]) {
  const filtered = recent.filter((c) => available.includes(c));
  if (filtered.length >= 2) return filtered.slice(0, 2);
  const rest = available.filter((c) => !filtered.includes(c));
  return [...filtered, ...rest].slice(0, 2);
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  balance: [],
  currenciesRecent: [],
  balanceActive: [],

  activityPeriod: "month",
  activity: [],

  topCategoriesPeriod: "month",
  topCategories: [],

  summaryPeriod: "month",
  summaryCurrency: "USD",
  summary: null,

  groups: [],
  frequentPeriod: "month",
  frequentUsers: [],

  eventsFilter: "all",
  events: [],

  loading: { balance: false, activity: false, top: false, summary: false, groups: false, frequent: false, events: false },
  error: {},

  async init() {
    await get().refreshAll();
  },

  async refreshAll() {
    // Balance
    set((s) => ({ loading: { ...s.loading, balance: true }, error: { ...s.error, balance: null } }));
    try {
      const res = await getDashboardBalance();
      const available = res.items.map((i) => i.currency);
      const recent = res.last_used?.length ? res.last_used : available;
      let active = get().balanceActive;
      if (!active.length) active = pickDefaultActive(recent, available);
      const summaryCurrency = get().summaryCurrency || active[0] || available[0] || "USD";
      set((s) => ({ balance: res.items, currenciesRecent: recent, balanceActive: active, summaryCurrency, loading: { ...s.loading, balance: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, balance: false }, error: { ...s.error, balance: e?.message || "Error" } }));
    }

    // Activity
    const ap = get().activityPeriod;
    set((s) => ({ loading: { ...s.loading, activity: true }, error: { ...s.error, activity: null } }));
    try {
      const res = await getDashboardActivity(ap);
      set((s) => ({ activity: res.points, loading: { ...s.loading, activity: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, activity: false }, error: { ...s.error, activity: e?.message || "Error" } }));
    }

    // Top categories
    const tp = get().topCategoriesPeriod;
    set((s) => ({ loading: { ...s.loading, top: true }, error: { ...s.error, top: null } }));
    try {
      const res = await getDashboardTopCategories(tp);
      set((s) => ({ topCategories: res.items, loading: { ...s.loading, top: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, top: false }, error: { ...s.error, top: e?.message || "Error" } }));
    }

    // Summary
    const sp = get().summaryPeriod;
    const sc = get().summaryCurrency;
    set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: null } }));
    try {
      const res = await getDashboardSummary(sp, sc);
      set((s) => ({ summary: { spent: res.spent, avg_check: res.avg_check, my_share: res.my_share }, loading: { ...s.loading, summary: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, summary: false }, error: { ...s.error, summary: e?.message || "Error" } }));
    }

    // Groups
    set((s) => ({ loading: { ...s.loading, groups: true }, error: { ...s.error, groups: null } }));
    try {
      const res = await getDashboardRecentGroups();
      set((s) => ({ groups: res.items, loading: { ...s.loading, groups: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, groups: false }, error: { ...s.error, groups: e?.message || "Error" } }));
    }

    // Frequent users
    const fp = get().frequentPeriod;
    set((s) => ({ loading: { ...s.loading, frequent: true }, error: { ...s.error, frequent: null } }));
    try {
      const res = await getDashboardFrequentUsers(fp);
      set((s) => ({ frequentUsers: res.items, loading: { ...s.loading, frequent: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, frequent: false }, error: { ...s.error, frequent: e?.message || "Error" } }));
    }

    // Events
    const ef = get().eventsFilter;
    set((s) => ({ loading: { ...s.loading, events: true }, error: { ...s.error, events: null } }));
    try {
      const res = await getDashboardEvents(ef, 20);
      set((s) => ({ events: res.items, loading: { ...s.loading, events: false } }));
    } catch (e: any) {
      set((s) => ({ loading: { ...s.loading, events: false }, error: { ...s.error, events: e?.message || "Error" } }));
    }
  },

  setActivityPeriod(p) {
    set({ activityPeriod: p });
    (async () => {
      set((s) => ({ loading: { ...s.loading, activity: true }, error: { ...s.error, activity: null } }));
      try {
        const res = await getDashboardActivity(p);
        set((s) => ({ activity: res.points, loading: { ...s.loading, activity: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, activity: false }, error: { ...s.error, activity: e?.message || "Error" } }));
      }
    })();
  },

  setTopPeriod(p) {
    set({ topCategoriesPeriod: p });
    (async () => {
      set((s) => ({ loading: { ...s.loading, top: true }, error: { ...s.error, top: null } }));
      try {
        const res = await getDashboardTopCategories(p);
        set((s) => ({ topCategories: res.items, loading: { ...s.loading, top: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, top: false }, error: { ...s.error, top: e?.message || "Error" } }));
      }
    })();
  },

  setSummaryPeriod(p) {
    set({ summaryPeriod: p });
    (async () => {
      set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: null } }));
      try {
        const res = await getDashboardSummary(p, get().summaryCurrency);
        set((s) => ({ summary: { spent: res.spent, avg_check: res.avg_check, my_share: res.my_share }, loading: { ...s.loading, summary: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, summary: false }, error: { ...s.error, summary: e?.message || "Error" } }));
      }
    })();
  },

  setSummaryCurrency(c) {
    set({ summaryCurrency: c });
    (async () => {
      set((s) => ({ loading: { ...s.loading, summary: true }, error: { ...s.error, summary: null } }));
      try {
        const res = await getDashboardSummary(get().summaryPeriod, c);
        set((s) => ({ summary: { spent: res.spent, avg_check: res.avg_check, my_share: res.my_share }, loading: { ...s.loading, summary: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, summary: false }, error: { ...s.error, summary: e?.message || "Error" } }));
      }
    })();
  },

  setFrequentPeriod(p) {
    set({ frequentPeriod: p });
    (async () => {
      set((s) => ({ loading: { ...s.loading, frequent: true }, error: { ...s.error, frequent: null } }));
      try {
        const res = await getDashboardFrequentUsers(p);
        set((s) => ({ frequentUsers: res.items, loading: { ...s.loading, frequent: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, frequent: false }, error: { ...s.error, frequent: e?.message || "Error" } }));
      }
    })();
  },

  setEventsFilter(f) {
    set({ eventsFilter: f });
    (async () => {
      set((s) => ({ loading: { ...s.loading, events: true }, error: { ...s.error, events: null } }));
      try {
        const res = await getDashboardEvents(f, 20);
        set((s) => ({ events: res.items, loading: { ...s.loading, events: false } }));
      } catch (e: any) {
        set((s) => ({ loading: { ...s.loading, events: false }, error: { ...s.error, events: e?.message || "Error" } }));
      }
    })();
  },

  setBalanceActive(c) {
    const { balanceActive, currenciesRecent } = get();
    let next = balanceActive.includes(c) ? balanceActive.filter((x) => x !== c) : [c, ...balanceActive].slice(0, 2);
    next = currenciesRecent.filter((x) => next.includes(x)).slice(0, 2);
    set({ balanceActive: next });
  },

  startLive() {
    if (get()._intervalId) return;
    const id = window.setInterval(() => get().refreshAll().catch(() => void 0), 60000);
    set({ _intervalId: id });
    const handler = () => { if (!document.hidden) get().refreshAll().catch(() => void 0); };
    window.addEventListener("visibilitychange", handler, { passive: true });
    (window as any).__splittoDashboardVisHandler = handler;
  },

  stopLive() {
    const id = get()._intervalId;
    if (id) { clearInterval(id); set({ _intervalId: null }); }
    const handler = (window as any).__splittoDashboardVisHandler as (() => void) | undefined;
    if (handler) window.removeEventListener("visibilitychange", handler);
    (window as any).__splittoDashboardVisHandler = undefined;
  },
}));
