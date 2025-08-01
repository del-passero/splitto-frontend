// src/components/FiltersRow.tsx

/**
 * Горизонтальная строка фильтров для страницы групп: фильтр, поиск, сортировка.
 * Все подписи через i18n, поддержка тёмной/светлой темы.
 * 
 * Требует пропсы:
 * - value (строка поиска)
 * - onChange (функция для изменения поиска)
 * - onFilterClick (клик по фильтру)
 * - onSortClick (клик по сортировке)
 * - placeholder (опционально)
 */

import SearchBar from "./SearchBar"
import FilterButton from "./FilterButton"
import SortButton from "./SortButton"

type Props = {
  value: string
  onChange: (v: string) => void
  onFilterClick: () => void
  onSortClick: () => void
  placeholder?: string
}

const FiltersRow = ({
  value,
  onChange,
  onFilterClick,
  onSortClick,
  placeholder
}: Props) => (
  <div className="flex items-center gap-2 w-full mb-3 px-4">
    <FilterButton onClick={onFilterClick} />
    <div className="flex-1">
      <SearchBar value={value} onChange={onChange} placeholder={placeholder} />
    </div>
    <SortButton onClick={onSortClick} />
  </div>
)

export default FiltersRow
