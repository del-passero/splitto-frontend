// src/components/transactions/TransactionCard.tsx
// Карточка транзакции (плейсхолдер-версия для списка). Локализация названия категории.

import { Calendar, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TransactionOut } from "../../types/transaction";

type Props = {
  tx: TransactionOut;
};

export default function TransactionCard({ tx }: Props) {
  const { t, i18n } = useTranslation();
  const isExpense = tx.type === "expense";

  const lang = i18n.language.split("-")[0].toLowerCase();
  const catName =
    (tx.category?.name_i18n &&
      (tx.category.name_i18n as Record<string, string>)[lang]) ||
    (tx.category?.name_i18n &&
      (tx.category.name_i18n as Record<string, string>).en) ||
    (tx.category?.name_i18n &&
      (tx.category.name_i18n as Record<string, string>).ru) ||
    (tx.category?.key?.replace(/_/g, " ") ?? "—");

  return (
    <div className="rounded-2xl bg-[var(--tg-card-bg,white)] dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-xl">
            {isExpense ? (tx?.category?.icon || "💸") : "🔁"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                {t(isExpense ? "tx_modal.expense" : "tx_modal.transfer")}
              </span>
              {isExpense && (
                <span className="text-sm text-[var(--tg-hint-color)]">
                  {String(catName)}
                </span>
              )}
            </div>
            {tx.comment && <div className="text-[15px] mt-1">{tx.comment}</div>}
            <div className="flex items-center gap-2 text-sm text-[var(--tg-hint-color)] mt-1">
              <Calendar size={16} />
              <span>{new Date(tx.date).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-right min-w-[96px]">
          <div className="text-lg font-semibold flex items-center justify-end gap-1">
            <Coins size={16} className="opacity-60" />
            <span>
              {tx.amount} {tx.currency ?? ""}
            </span>
          </div>
          {isExpense && tx.paid_by != null && (
            <div className="text-xs text-[var(--tg-hint-color)] mt-1">
              {t("tx_modal.paid_by")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
