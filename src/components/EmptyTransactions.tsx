// src/components/EmptyTransactions.tsx

import { Coins } from "lucide-react"
import { useTranslation } from "react-i18next"

type Props = {
  notFound?: boolean
}

const EmptyTransactions = ({ notFound = false }: Props) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 opacity-60">
        <Coins size={56} className="text-[var(--tg-link-color)]" />
      </div>
      <div className="text-lg font-semibold mb-2 text-[var(--tg-text-color)]">
        {notFound ? t("group_transactions_not_found") : t("group_transactions_empty")}
      </div>
    </div>
  )
}

export default EmptyTransactions
