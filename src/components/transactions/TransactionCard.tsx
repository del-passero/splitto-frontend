// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers } from "lucide-react";

type Props = {
  tx: any; // LocalTx | TransactionOut
};

function CategoryAvatar({ name, color, icon }: { name?: string; color?: string | null; icon?: string }) {
  const bg = typeof color === "string" && color.trim() ? color : "var(--tg-link-color)";
  const ch = (name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      <span style={{ fontSize: 16 }} aria-hidden>{icon || ch}</span>
    </div>
  );
}

export default function TransactionCard({ tx }: Props) {
  const isExpense = tx.type === "expense";
  const title = isExpense ? (tx.category?.name || "Expense") : `${tx.from_name || "From"} → ${tx.to_name || "To"}`;
  const sub = new Date(tx.date || tx.created_at || Date.now()).toLocaleDateString();

  const amountNum = Number(tx.amount ?? 0); // безопасно приводим Decimal(string) -> number
  const amount = `${amountNum.toFixed(2)} ${tx.currency || ""}`;

  return (
    <div className="relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryAvatar name={tx.category?.name} color={tx.category?.color} icon={tx.category?.icon} />
        ) : (
          <div className="w-10 h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] flex items-center justify-center shrink-0">
            <ArrowRightLeft size={18} className="opacity-80" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">{title}</div>
          <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
            {isExpense ? (tx.comment || "") : ""}
            {!isExpense && <span className="opacity-70">{sub}</span>}
          </div>
        </div>

        <div className="text-[14px] font-semibold shrink-0">{amount}</div>
      </div>
    </div>
  );
}
