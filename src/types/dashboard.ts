// src/types/dashboard.ts
// Типы синхронизированы с backend/src/routers/dashboard.py (через schemas.dashboard)

export type PeriodAll = "day" | "week" | "month" | "year"
export type PeriodLTYear = "week" | "month" | "year"

/* /dashboard/balance */
export type DashboardBalance = {
  i_owe: Record<string, string> // "-12.34"
  they_owe_me: Record<string, string> // "+50.00"
  last_currencies: string[] // ["USD","EUR"]
}

/* /dashboard/activity */
export type ActivityBucket = { date: string; count: number }
export type DashboardActivity = { period: PeriodAll; buckets: ActivityBucket[] }

/* /dashboard/top-categories */
export type TopCategoryItem = {
  category_id: number
  name: string
  sum: string
  currency: string
}
export type TopCategoriesOut = {
  period: PeriodLTYear
  items: TopCategoryItem[]
  total: number
}

/* /dashboard/summary */
export type DashboardSummaryOut = {
  period: PeriodAll
  currency: string
  spent: string
  avg_check: string
  my_share: string
}

/* /dashboard/recent-groups */
export type RecentGroupCard = {
  id: number
  name: string
  avatar_url?: string | null
  my_balance_by_currency: Record<string, string>
  last_event_at?: string | null
}

/* /dashboard/top-partners */
export type UserLite = {
  id: number
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  photo_url?: string | null
}
export type TopPartnerItem = {
  user: UserLite
  joint_expense_count: number
  period: PeriodLTYear
}

/* /dashboard/events */
export type EventEntityRef =
  | { kind: "transaction"; id?: number | null }
  | { kind: "group"; id?: number | null }
  | Record<string, unknown>

export type EventFeedItem = {
  id: number
  type: string
  created_at: string
  title: string
  subtitle?: string | null
  icon: string
  entity: EventEntityRef
}

export type EventsFeedOut = { items: EventFeedItem[] }
