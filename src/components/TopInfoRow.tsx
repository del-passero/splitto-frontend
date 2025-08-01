// src/components/TopInfoRow.tsx

import { useTranslation } from "react-i18next"

type Props = { count: number }

const TopInfoRow = ({ count }: Props) => {
  const { t } = useTranslation()
  return (
    <div
      className="
        text-base font-bold
        text-[var(--tg-link-color)]
        px-4 pt-3 pb-1
        text-left
        select-none
      "
      style={{
        lineHeight: "1.2"
      }}
    >
      {t("groups_top_info", { count })}
    </div>
  )
}

export default TopInfoRow
