// src/components/FiltersRow.tsx

import CardSection from "./CardSection"
import FilterButton from "./FilterButton"
import SearchBar from "./SearchBar"
import SortButton from "./SortButton"
import { useTranslation } from "react-i18next"

type Props = {
  search: string
  setSearch: (value: string) => void
  onFilterClick?: () => void
  onSortClick?: () => void
  placeholderKey?: string
  className?: string    
}

const FiltersRow = ({
  search,
  setSearch,
  onFilterClick,
  onSortClick,
  placeholderKey = "search_group_placeholder",
  className = "",
}: Props) => {
  const { t } = useTranslation()
  return (
    <CardSection className="mb-1 px-0 py-0" noPadding>
      <div className="flex items-center h-12 w-full gap-2 px-2">
        <FilterButton onClick={onFilterClick || (() => {})} />
        <div className="w-px h-7 bg-[var(--tg-secondary-bg-color)] mx-1" />
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t(placeholderKey) || ""}
        />
        <div className="w-px h-7 bg-[var(--tg-secondary-bg-color)] mx-1" />
        <SortButton onClick={onSortClick || (() => {})} />
      </div>
    </CardSection>
  )
}

export default FiltersRow
