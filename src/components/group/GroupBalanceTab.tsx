// src/components/group/GroupBalanceTab.tsx

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDownCircle, ArrowUpCircle, CheckCircle } from "lucide-react"
import Avatar from "../Avatar"
import GroupFAB from "./GroupFAB"

type User = {
  id: number
  first_name?: string
  username?: string
  photo_url?: string
}

type MyDebt = { user: User; amount: number }
type AllDebt = { from: User; to: User; amount: number }

type Props = {
  myBalance: number
  myDebts: MyDebt[]
  allDebts: AllDebt[]
  loading: boolean
  onFabClick: () => void
}

const GroupBalanceTab = ({
  myBalance,
  myDebts,
  allDebts,
  loading,
  onFabClick,
}: Props) => {
  const { t } = useTranslation()
  const [microTab, setMicroTab] = useState<"mine" | "all">("mine")

  return (
    <div className="relative w-full max-w-xl mx-auto min-h-[320px]">
      {/* Переключатель Wallet-style */}
      <div className="flex justify-center mt-6 mb-6">
        <div className="flex w-full max-w-[320px] h-11 rounded-full border border-[color:var(--tg-accent-color,#40A7E3)] bg-[var(--tg-card-bg)] p-1">
          <button
            type="button"
            className={`
              flex-1 h-9 rounded-full font-bold text-sm transition
              ${
                microTab === "mine"
                  ? "bg-[color:var(--tg-accent-color,#40A7E3)] text-white shadow"
                  : "bg-transparent text-[color:var(--tg-accent-color,#40A7E3)]"
              }
            `}
            onClick={() => setMicroTab("mine")}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            className={`
              flex-1 h-9 rounded-full font-bold text-sm transition
              ${
                microTab === "all"
                  ? "bg-[color:var(--tg-accent-color,#40A7E3)] text-white shadow"
                  : "bg-transparent text-[color:var(--tg-accent-color,#40A7E3)]"
              }
            `}
            onClick={() => setMicroTab("all")}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-[var(--tg-hint-color)]">{t("loading")}</div>
      ) : microTab === "mine" ? (
        <div>
          {/* Итоговый баланс */}
          <div className="flex items-center gap-2 mb-4 font-semibold text-lg">
            {myBalance > 0 ? (
              <>
                <ArrowDownCircle className="text-green-500 w-6 h-6" />
                <span className="text-green-500">{t("group_balance_you_get", { sum: myBalance })}</span>
              </>
            ) : myBalance < 0 ? (
              <>
                <ArrowUpCircle className="text-red-500 w-6 h-6" />
                <span className="text-red-500">{t("group_balance_you_owe", { sum: Math.abs(myBalance) })}</span>
              </>
            ) : (
              <>
                <CheckCircle className="text-[var(--tg-hint-color)] w-6 h-6" />
                <span className="text-[var(--tg-hint-color)]">{t("group_balance_zero")}</span>
              </>
            )}
          </div>
          {/* Детализация по каждому участнику */}
          {myDebts.length === 0 ? (
            <div className="text-[var(--tg-hint-color)] py-6 text-center">{t("group_balance_no_debts")}</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {myDebts.map(d => (
                <li key={d.user.id} className="flex items-center gap-3 bg-[var(--tg-card-bg)] rounded-lg px-4 py-3 shadow-sm">
                  <Avatar
                    src={d.user.photo_url}
                    name={d.user.first_name || d.user.username}
                    size={36}
                  />
                  <span className="font-medium text-[var(--tg-text-color)] truncate max-w-[90px]">
                    {d.user.first_name || d.user.username}
                  </span>
                  <span className={`ml-auto font-semibold ${
                    d.amount > 0 ? "text-green-500" : d.amount < 0 ? "text-red-500" : "text-[var(--tg-hint-color)]"
                  }`}>
                    {d.amount > 0
                      ? t("group_balance_get_from", { sum: d.amount })
                      : d.amount < 0
                        ? t("group_balance_owe_to", { sum: Math.abs(d.amount) })
                        : t("group_balance_no_debt_with")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          {allDebts.length === 0 ? (
            <div className="text-[var(--tg-hint-color)] py-10 text-center">
              {t("group_balance_no_debts_all")}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {allDebts.map((d, idx) => (
                <li key={d.from.id + "-" + d.to.id + "-" + idx} className="flex items-center gap-3 bg-[var(--tg-card-bg)] rounded-lg px-4 py-3 shadow-sm">
                  <Avatar
                    src={d.from.photo_url}
                    name={d.from.first_name || d.from.username}
                    size={30}
                  />
                  <span className="font-medium text-[var(--tg-text-color)] truncate max-w-[90px]">
                    {d.from.first_name || d.from.username}
                  </span>
                  <span className="mx-2 text-[var(--tg-hint-color)]">→</span>
                  <Avatar
                    src={d.to.photo_url}
                    name={d.to.first_name || d.to.username}
                    size={30}
                  />
                  <span className="font-medium text-[var(--tg-text-color)] truncate max-w-[90px]">
                    {d.to.first_name || d.to.username}
                  </span>
                  <span className="ml-auto font-semibold text-[var(--tg-accent-color)]">
                    {d.amount} ₽
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <GroupFAB onClick={onFabClick} />
    </div>
  )
}

export default GroupBalanceTab
