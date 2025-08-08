// src/types/group_category.ts
// Категории расходов и ответ для списка категорий группы.

export interface ExpenseCategory {
  id: number
  name: string
  icon?: string | null
}

export interface GroupCategoriesList {
  items: ExpenseCategory[]
  total: number
  /** true — для группы явно задан белый список категорий; false — доступны все глобальные */
  restricted: boolean
}
