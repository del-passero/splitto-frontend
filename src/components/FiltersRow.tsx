// src/components/FiltersRow.tsx

/**
 * Компонент для фильтров, поиска и сортировки групп.
 * Использует SearchBar, FilterButton, SortButton (уже реализованы).
 * Визуально — как в Wallet: элементы разделены вертикальными линиями, аккуратные отступы, поддержка темы.
 * Все подписи через i18n.
 */

import SearchBar from "./SearchBar"
import FilterButton from "./FilterButton"
import SortButton from "./SortButton"
import { useTranslation } from "react-i18next"

type Props = {
  // Можно добавить пропсы для onSearch, onFilter, onSort — если понадобится
  className?: string
}

const FiltersRow = ({ className = "" }: Props) => {
  const { t } = useTranslation()
  return (
    <div
      className={
        `flex items-center justify-between gap-1 px-2 py-2 rounded-xl bg-[var(--tg-bg-color)] ${className}`
      }
      style={{
        border: "1px solid var(--tg-secondary-bg-color)",
        marginBottom: 10,
        marginTop: 2,
      }}
    >
      {/* Поиск */}
      <div className="flex-1 min-w-0">
        <SearchBar placeholder={t("search_group_placeholder")} />
      </div>
      {/* Разделитель */}
      <div className="w-px h-6 bg-[var(--tg-secondary-bg-color)] mx-2 opacity-60" />
      {/* Фильтр */}
      <FilterButton />
      {/* Разделитель */}
      <div className="w-px h-6 bg-[var(--tg-secondary-bg-color)] mx-2 opacity-60" />
      {/* Сортировка */}
      <SortButton />
    </div>
  )
}

export default FiltersRow
