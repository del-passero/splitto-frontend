// src/components/group/GroupTransactionsTab.tsx

import { useState } from "react"
import FiltersRow from "../FiltersRow"
import GroupFAB from "./GroupFAB"
import EmptyTransactions from "../EmptyTransactions"
import { useTranslation } from "react-i18next"

import CreateTransactionModal from "../transactions/CreateTransactionModal"
import TransactionCard from "../transactions/TransactionCard"

// строго относительный путь на стор
import { useGroupsStore } from "../../store/groupsStore"

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
  const [openCreate, setOpenCreate] = useState(false)

  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? [])

  const handleAddClick = () => {
    onAddTransaction && onAddTransaction()
    setOpenCreate(true)
  }

  const filtered = transactions

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <FiltersRow search={search} setSearch={setSearch}/>
      {loading ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-3 py-4">
          {filtered.map((tx: any) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}
      <GroupFAB onClick={handleAddClick} />
      <CreateTransactionModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        groups={groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
        }))}
      />
    </div>
  )
}

export default GroupTransactionsTab
