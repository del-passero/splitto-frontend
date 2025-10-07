// src/types/dashboard.ts
// Типы данных для Dashboard API Splitto

export interface DashboardBalance {
  /** Сколько я должен (отрицательные значения) */
  i_owe: Record<string, string>
  /** Сколько мне должны (положительные значения) */
  they_owe_me: Record<string, string>
  /** Две последние использованные валюты */
  last_currencies: string[]
}

export interface ActivityBucket {
  date: string
  count: number
}

export interface DashboardActivity {
  period: "week" | "month" | "year"
  buckets: ActivityBucket[]
}

export interface TopCategoryItem {
  category_id: number
  name: string | null
  sum: string
  currency: string
  icon?: string | null
  color?: string | null
}

export interface TopCategories {
  period: "week" | "month" | "year"
  items: TopCategoryItem[]
  total: number
}

export interface DashboardSummary {
  period: "day" | "week" | "month" | "year"
  currency: string
  spent: string
  avg_check: string
  my_share: string
}

export interface RecentGroupCard {
  id: number
  name: string
  avatar_url?: string | null
  my_balance_by_currency: Record<string, string>
  last_event_at: string | null
}

export interface TopPartnerUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

export interface TopPartner {
  user: TopPartnerUser
  joint_expense_count: number
  period: "week" | "month" | "year"
}

export interface DashboardEventFeedItem {
  id: number
  type: string
  created_at: string
  title: string
  subtitle?: string | null
  icon: string
  entity: Record<string, any>
}

export interface DashboardEventFeed {
  items: DashboardEventFeedItem[]
}
