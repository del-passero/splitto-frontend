// src/types/expense_category.ts
// Типы для категорий расходов (локализуемых)

export type I18nMap = Record<string, string>

export interface ExpenseCategoryOut {
  id: number
  key: string
  parent_id: number | null
  icon: string | null
  color: string | null
  name_i18n: I18nMap // { ru: "...", en: "...", es: "..." }
  is_active: boolean
  created_at: string // ISO
  updated_at: string // ISO
}

// Утилита для выбора локализованного имени на лету
export function categoryName(c: ExpenseCategoryOut, lang: string): string {
  const base = (lang || "en").split("-")[0].toLowerCase()
  return c.name_i18n?.[base] ?? c.name_i18n?.en ?? c.name_i18n?.ru ?? c.key.replace(/_/g, " ")
}
