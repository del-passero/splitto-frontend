import { Layers, Send } from "lucide-react";
import React from "react";

type Props = { tx: any };

const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$", EUR: "€", RUB: "₽", GBP: "£", UAH: "₴", KZT: "₸",
  TRY: "₺", JPY: "¥", CNY: "¥", PLN: "zł", CZK: "Kč", INR: "₹", AED: "د.إ"
};
const DECIMALS_BY_CODE: Record<string, number> = { JPY: 0, KRW: 0, VND: 0 };

function money(n: number, code: string, locale = "ru") {
  const d = DECIMALS_BY_CODE[code] ?? 2;
  const s = SYMBOL_BY_CODE[code] ?? code;
  try {
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)} ${s}`;
  } catch {
    return `${n.toFixed(d)} ${s}`;
  }
}

function toneBg(color?: string | null) {
  if (!color || typeof color !== "string") return undefined;
  const hex = color.replace("#", "");
  const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(h)) return undefined;
  return `#${h}22`; // мягкая подложка
}

function toneBorder(color?: string | null) {
  if (!color || typeof color !== "string") return undefined;
  const hex = color.replace("#", "");
  const h = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(h)) return undefined;
  return `1px solid #${h}44`;
}

const Avatar = ({ tx }: { tx: any }) => {
  if (tx.type === "transfer") {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: "var(--tg-accent-color, #40A7E3)10", border: "1px solid var(--tg-accent-color, #40A7E3)33" }}>
        <Send className="text-[var(--tg-accent-color,#40A7E3)]" size={18} />
      </div>
    );
  }
  const color = tx.category?.color ?? null;
  const icon = tx.category?.icon ?? null;
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
         style={{ background: toneBg(color) ?? "var(--tg-secondary-bg-color,#e7e7e7)33", border: toneBorder(color) }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>
        {icon || <Layers size={16} className="opacity-80" />}
      </span>
    </div>
  );
};

const TitleRow = ({ tx }: { tx: any }) => {
  if (tx.type === "transfer") {
    const from = tx.from_name || "—";
    const to = tx.to_name || "—";
    return (
      <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
        {from} → {to}
      </div>
    );
  }
  const name = tx.comment?.trim() || tx.category?.name || "Expense";
  return (
    <div className="text-[14px] font-semibold text-[var(--tg-text-color)] truncate">
      {name}
    </div>
  );
};

const SubRow = ({ tx }: { tx: any }) => {
  const sub =
    tx.type === "transfer"
      ? (tx.comment?.trim() || "Transfer")
      : (tx.category?.name || "Expense");
  const date = tx.date;
  return (
    <div className="text-[12px] text-[var(--tg-hint-color)] truncate">
      {sub}{date ? ` • ${date}` : ""}
    </div>
  );
};

const Amount = ({ tx }: { tx: any }) => {
  const code = tx.currency || "RUB";
  return (
    <div className="text-right">
      <div className="text-[14px] font-bold text-[var(--tg-text-color)]">
        {money(tx.amount || 0, code)}
      </div>
    </div>
  );
};

export default function TransactionCard({ tx }: Props) {
  return (
    <div className="relative px-3">
      <div className="w-full rounded-2xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] p-3 flex items-center gap-3">
        <Avatar tx={tx} />
        <div className="min-w-0 flex-1">
          <TitleRow tx={tx} />
          <SubRow tx={tx} />
        </div>
        <Amount tx={tx} />
      </div>
    </div>
  );
}
