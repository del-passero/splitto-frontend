// src/components/FiltersRow.tsx

import FilterButton from "./FilterButton"
import SearchBar from "./SearchBar"
import SortButton from "./SortButton"
import { useTranslation } from "react-i18next"

type Props = {
  search: string
  setSearch: (value: string) => void
}

const FiltersRow = ({ search, setSearch }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 w-full">
      <FilterButton onClick={() => {}} />
      <div className="flex-1">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("search_group_placeholder") || ""}
        />
      </div>
      <SortButton onClick={() => {}} />
    </div>
  )
}

export default FiltersRow
