// src/store/dashboardStore.ts
// Zustand store для кэширования данных дашборда

import { create } from "zustand"
import {
  getDashboardBalance,
  getDashboardActivity,
  getTopCategories,
  getDashboardSummary,
  getRecentGroups,
  getTopPartners,
  getDashboardEvents,
} from "../api/dashboardApi"
import type {
  DashboardBalance,
  DashboardActivity,
  TopCategories,
  DashboardSummary,
  RecentGroupCard,
  TopPartner,
  DashboardEventFeed,
} from "../types/dashboard"

interface DashboardState {
  loading: boolean
  error?: string | null
  balance?: DashboardBalance
  activity?: DashboardActivity
  topCategories?: TopCategories
  summary?: DashboardSummary
  recentGroups?: RecentGroupCard[]
  topPartners?: TopPartner[]
  events?: DashboardEventFeed

  fetchAll: (currency: string, period?: "week" | "month" | "year") => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  loading: false,
  error: null,

  async fetchAll(currency: string, period: "week" | "month" | "year" = "month") {
    try {
      set({ loading: true, error: null })
      const [balance, activity, topCategories, summary, recentGroups, topPartners, events] = await Promise.all([
        getDashboardBalance(),
        getDashboardActivity(period),
        getTopCategories(period, currency),
        getDashboardSummary("month", currency),
        getRecentGroups(10),
        getTopPartners(period, 20),
        getDashboardEvents(20),
      ])
      set({
        loading: false,
        balance,
        activity,
        topCategories,
        summary,
        recentGroups,
        topPartners,
        events,
      })
    } catch (e: any) {
      console.error("Dashboard fetchAll error:", e)
      set({ loading: false, error: e?.message || "Failed to load dashboard" })
    }
  },
}))
