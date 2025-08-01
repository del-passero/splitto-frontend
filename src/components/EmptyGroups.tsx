// src/components/EmptyGroups.tsx

import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"

type Props = {
  notFound?: boolean
}

const EmptyGroups = ({ notFound = false }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 opacity-60">
        <Users size={56} className="text-[var(--tg-link-color)]" />
      </div>
      <div className="text-lg font-semibold mb-2 text-[var(--tg-text-color)]">
        {notFound ? t("groups_not_found") : t("empty_groups")}
      </div>
      <div className="text-sm text-[var(--tg-hint-color)] mb-4 text-center">
        {!notFound && t("empty_groups_hint")}
      </div>
    </div>
  )
}

export default EmptyGroups
