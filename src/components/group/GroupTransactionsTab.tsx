// src/components/group/GroupTransactionsTab.tsx

import { useState } from "react"
import FiltersRow from "../FiltersRow"
import GroupFAB from "./GroupFAB"
import EmptyTransactions from "../EmptyTransactions"
import { useTranslation } from "react-i18next"

type Props = {
  loading: boolean
  transactions: any[]
  onAddTransaction: () => void
}

const GroupTransactionsTab = ({
  loading,
  transactions,
  onAddTransaction,
}: Props) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <FiltersRow search={search} setSearch={setSearch}/>
      {loading ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-3 py-4">
          {/* Заглушка вместо TransactionCard/TransactionsList */}
          <div className="bg-[var(--tg-card-bg)] rounded-xl px-5 py-6 text-center text-[var(--tg-hint-color)] shadow">
            {t("group_transactions_placeholder")}
          </div>
        </div>
      )}
      <GroupFAB onClick={onAddTransaction} />
    </div>
  )
}

export default GroupTransactionsTab
