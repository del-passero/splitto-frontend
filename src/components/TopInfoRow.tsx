// src/components/TopInfoRow.tsx

import { useTranslation } from "react-i18next"

type Props = {
  count: number
  labelKey?: string
}

const TopInfoRow = ({ count, labelKey = "contacts_count" }: Props) => {
  const { t } = useTranslation()
  return (
    <div
      className="
        text-[15px] font-medium
        text-[#3390ec]
        px-4 pt-3 pb-2
        text-left
        select-none
      "
      style={{ lineHeight: "1.2" }}
    >
      {t(labelKey, { count })}
    </div>
  )
}

export default TopInfoRow
