// src/components/transactions/TransactionCard.tsx
import { ArrowRightLeft, Layers, User, Users, FileText, CalendarClock, Hash, BadgeInfo } from "lucide-react";

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

function Chip({
  icon,
  label,
  value,
  title,
}: {
  icon?: React.ReactNode;
  label?: string; // старался не добавлять новых ключей — метки минимальные
  value: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[var(--tg-secondary-bg-color,#f2f2f2)] text-[var(--tg-text-color)]"
      title={title}
    >
      {icon ? <span className="opacity-80">{icon}</span> : null}
      {label ? <span className="opacity-70">{label}:</span> : null}
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function TransactionCard({ tx }: Props) {
  const isExpense = tx.type === "expense";

  // Заголовок
  const catName = tx.category?.name?.trim() || "";
  const title = isExpense
    ? (catName || "Expense")
    : `${tx.from_name || tx.transfer_from || "From"} → ${
        Array.isArray(tx.to_name) && tx.to_name.length
          ? tx.to_name.join(", ")
          : (Array.isArray(tx.transfer_to) ? tx.transfer_to.join(", ") : (tx.to_name || tx.transfer_to || "To"))
      }`;

  // Дата
  const dateRaw = tx.date || tx.created_at || Date.now();
  const sub = new Date(dateRaw).toLocaleDateString();

  // Сумма/валюта
  const amountNum = Number(tx.amount ?? 0);
  const currency = tx.currency || "";
  const amount = `${amountNum.toFixed(2)} ${currency}`;

  // Мелкие поля
  const hasShares = Array.isArray(tx.shares) && tx.shares.length > 0;
  const sharesCount = hasShares ? tx.shares.length : 0;
  const transferTo = Array.isArray(tx.transfer_to) ? tx.transfer_to : (tx.transfer_to ? [tx.transfer_to] : []);
  const hasReceiptUrl = typeof tx.receipt_url === "string" && tx.receipt_url.trim().length > 0;
  const receiptDataPreview =
    tx.receipt_data && typeof tx.receipt_data === "object"
      ? Object.keys(tx.receipt_data).slice(0, 3).join(", ")
      : "";

  return (
    <div className="relative px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)]">
      {/* Верхняя строка */}
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

      {/* Метаданные (вторая строка, компактные чипы) */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {/* Дата */}
        {dateRaw && (
          <Chip
            icon={<CalendarClock size={14} />}
            value={new Date(dateRaw).toLocaleString()}
            title={new Date(dateRaw).toISOString()}
          />
        )}

        {/* Категория (если имя есть — покажем подпись) */}
        {isExpense && catName && (
          <Chip value={catName} />
        )}

        {/* Paid by */}
        {isExpense && (tx.paid_by_name || tx.paid_by) && (
          <Chip
            icon={<User size={14} />}
            value={tx.paid_by_name || String(tx.paid_by)}
            title="paid_by"
          />
        )}

        {/* Split */}
        {isExpense && tx.split_type && (
          <Chip
            icon={<Layers size={14} />}
            value={tx.split_type}
            title="split_type"
          />
        )}

        {/* Shares */}
        {isExpense && hasShares && (
          <Chip
            icon={<Users size={14} />}
            value={`${sharesCount}`}
            title="shares count"
          />
        )}

        {/* Transfer from/to */}
        {!isExpense && (tx.from_name || tx.transfer_from) && (
          <Chip
            icon={<User size={14} />}
            value={tx.from_name || String(tx.transfer_from)}
            title="transfer_from"
          />
        )}
        {!isExpense && transferTo.length > 0 && (
          <Chip
            icon={<Users size={14} />}
            value={Array.isArray(tx.to_name) && tx.to_name.length ? tx.to_name.join(", ") : transferTo.join(", ")}
            title="transfer_to"
          />
        )}

        {/* Receipt URL */}
        {hasReceiptUrl && (
          <a
            href={tx.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-[var(--tg-secondary-bg-color,#f2f2f2)] text-[var(--tg-text-color)] hover:opacity-90 transition"
            title={tx.receipt_url}
          >
            <FileText size={14} className="opacity-80" />
            <span className="font-medium">PDF</span>
          </a>
        )}

        {/* Receipt data (короткий превью ключей) */}
        {tx.receipt_data && (
          <Chip
            icon={<BadgeInfo size={14} />}
            value={receiptDataPreview ? `{ ${receiptDataPreview}${Object.keys(tx.receipt_data).length > 3 ? ", …" : ""} }` : "{}"}
            title="receipt_data"
          />
        )}

        {/* Технические поля, если есть — показываем компактно */}
        {typeof tx.created_by !== "undefined" && (
          <Chip icon={<Hash size={14} />} value={`created_by:${tx.created_by}`} />
        )}
        {typeof tx.group_id !== "undefined" && (
          <Chip value={`group:${tx.group_id}`} />
        )}
        {tx.created_at && (
          <Chip value={`created:${new Date(tx.created_at).toLocaleString()}`} title={new Date(tx.created_at).toISOString()} />
        )}
        {tx.updated_at && (
          <Chip value={`updated:${new Date(tx.updated_at).toLocaleString()}`} title={new Date(tx.updated_at).toISOString()} />
        )}
        {typeof tx.id !== "undefined" && (
          <Chip value={`#${tx.id}`} />
        )}
      </div>

      {/* Комментарий (если был и мы его ещё не показали в заголовке) */}
      {isExpense && tx.comment && (
        <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">{tx.comment}</div>
      )}
    </div>
  );
}
