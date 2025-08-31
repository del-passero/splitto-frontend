// src/components/group/GroupBalanceTabSmart.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CardSection from "../CardSection";

/* ==================== Типы, экспорт для GroupBalanceTab ==================== */
export type SimpleUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};
export type MyDebt = { user: SimpleUser; amount: number }; // amount >0 — «мне должны», <0 — «я должен»
export type AllDebt = { from: SimpleUser; to: SimpleUser; amount: number };

type Props = {
  myBalance: number;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;
  currency: string | null;

  // для long-press действий
  onRepay?: (user: SimpleUser, amount: number) => void;
  onRemind?: (user: SimpleUser, amount: number) => void;
};

/* ==================== Утиль ==================== */
const ZERO_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string | null) => (code && ZERO_DEC.has(code) ? 0 : 2);

const fmtMoney = (n: number, code: string | null, loc: string) => {
  const d = decimalsByCode(code);
  try {
    const nf = new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
    return `${nf.format(n)} ${code ?? ""}`;
  } catch {
    return `${n.toFixed(d)} ${code ?? ""}`;
  }
};

const userName = (u?: SimpleUser) => {
  if (!u) return "";
  const composed = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return composed || u.username || `#${u.id}`;
};

function SmallAvatar({ user, size = 24 }: { user: SimpleUser; size?: number }) {
  const name = userName(user);
  const initials =
    (name || user.username || "")
      .trim()
      .split(/\s+/)
      .map((s) => s.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  const bg = "#6b8afd";
  if (user.photo_url) {
    return (
      <img
        src={user.photo_url}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full text-white grid place-items-center shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: Math.max(10, Math.floor(size * 0.45)) }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

/* Простой long-press */
function useLongPress(cb: () => void, delay = 420) {
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const onPointerDown = () => {
    clear();
    timer.current = window.setTimeout(cb, delay);
  };
  const onPointerUp = clear;
  const onPointerLeave = clear;
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    clear();
    cb();
  };
  return { onPointerDown, onPointerUp, onPointerLeave, onContextMenu };
}

/* Бегущая строка (маркировка), чтобы длинные имена не обрезались */
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="inline-block whitespace-nowrap animate-[splitto-marquee_12s_linear_infinite] will-change-transform">
        {children}
        <span className="mx-6 opacity-0">—</span>
        {children}
      </div>
    </div>
  );
}

/* ==================== Основной компонент ==================== */
export default function GroupBalanceTabSmart({
  myBalance,
  myDebts,
  allDebts,
  loading,
  onFabClick,
  currency,
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];

  const [tab, setTab] = useState<"mine" | "all">("mine");

  /* --------- модалка действий (long-press) --------- */
  const [actionOpen, setActionOpen] = useState(false);
  const [actionKind, setActionKind] = useState<"repay" | "remind">("repay");
  const actionUserRef = useRef<SimpleUser | null>(null);
  const actionAmountRef = useRef<number>(0);

  const openActions = (kind: "repay" | "remind", user: SimpleUser, amount: number) => {
    actionUserRef.current = user;
    actionAmountRef.current = Math.abs(amount);
    setActionKind(kind);
    setActionOpen(true);
  };

  /* --------- заголовки --------- */
  const headerMine = useMemo(() => {
    if (myBalance < 0) {
      return `${locale === "ru" ? "Ты должен" : locale === "es" ? "Debes" : "You owe"} ${fmtMoney(
        Math.abs(myBalance),
        currency,
        locale
      )}`;
    }
    if (myBalance > 0) {
      return `${locale === "ru" ? "Тебе должны" : locale === "es" ? "Te deben" : "You are owed"} ${fmtMoney(
        Math.abs(myBalance),
        currency,
        locale
      )}`;
    }
    return locale === "ru" ? "Всё по нулям" : locale === "es" ? "Todo en cero" : "All settled";
  }, [myBalance, currency, locale]);

  /* --------- Разметка строки --------- */
  const RowMine = ({ it }: { it: MyDebt }) => {
    // amount >0 => «мне должны», <0 => «я должен»
    const isIOwe = it.amount < 0;
    const label = isIOwe
      ? locale === "ru"
        ? "Ты должен"
        : locale === "es"
        ? "Debes"
        : "You owe"
      : locale === "ru"
      ? "Тебе должны"
      : locale === "es"
      ? "Te deben"
      : "You are owed";

    const lp = useLongPress(() => openActions(isIOwe ? "repay" : "remind", it.user, it.amount));

    return (
      <div className="px-3" {...lp}>
        <div className="flex items-center min-h-[72px]">
          <SmallAvatar user={it.user} size={24} />
          <div className="flex-1 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] ml-2">
            <div className="flex items-center h-[72px] gap-2">
              <div className="min-w-0 max-w-full">
                <Marquee>
                  <span className="opacity-80 mr-2">{label}</span>
                  <span className="font-medium">{userName(it.user)}</span>
                </Marquee>
              </div>
              <div className="ml-auto font-semibold shrink-0">
                {fmtMoney(Math.abs(it.amount), currency, locale)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RowAll = ({ it }: { it: AllDebt }) => {
    const owes = t("tx_modal.owes") || t("tx_modal.owes_label") || (locale === "ru" ? "должен" : "owes");
    const lp = useLongPress(() => {
      // если текущий пользователь совпадает с должником/кредитором — показываем релевантное действие
      // по-умолчанию просто показываем «напомнить» (заглушка)
      openActions("remind", it.from, it.amount);
    });

    return (
      <div className="px-3" {...(lp as any)}>
        <div className="flex items-center min-h-[72px]">
          <SmallAvatar user={it.from} size={24} />
          <div className="flex-1 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)] ml-2">
            <div className="flex items-center h-[72px] gap-2">
              <div className="min-w-0 max-w-full">
                <Marquee>
                  <span className="font-medium">{userName(it.from)}</span>
                  <span className="opacity-80 mx-2">{owes}</span>
                  <SmallAvatar user={it.to} size={24} />
                  <span className="ml-2 font-medium">{userName(it.to)}</span>
                </Marquee>
              </div>
              <div className="ml-auto font-semibold shrink-0">
                {fmtMoney(Math.abs(it.amount), currency, locale)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ==================== RENDER ==================== */
  return (
    <>
      {/* keyframes для бегущей строки */}
      <style>{`
        @keyframes splitto-marquee { 
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Микро-табы */}
      <div className="px-3 mt-2 mb-2">
        <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-3 h-9 text-[13px] ${tab === "mine" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${tab === "all" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"}`}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      {/* Контент вкладок, все внутри CardSection как просили */}
      {tab === "mine" ? (
        <CardSection className="py-0">
          {/* Заголовок + отдельный бордер по всей ширине секции */}
          <div className="px-3 py-2 font-semibold">{headerMine}</div>
          <div className="h-px bg-[var(--tg-secondary-bg-color,#e7e7e7)]" />

          {loading ? (
            <div className="px-3 py-4 opacity-60">{t("loading")}</div>
          ) : myDebts.length === 0 ? (
            <div className="px-3 py-4 opacity-60">{t("group_balance_no_debts")}</div>
          ) : (
            myDebts.map((it, idx) => <RowMine key={idx} it={it} />)
          )}
        </CardSection>
      ) : (
        <CardSection className="py-0">
          {loading ? (
            <div className="px-3 py-4 opacity-60">{t("loading")}</div>
          ) : allDebts.length === 0 ? (
            <div className="px-3 py-4 opacity-60">{t("group_balance_no_debts_all")}</div>
          ) : (
            allDebts.map((it, idx) => <RowAll key={idx} it={it} />)
          )}
        </CardSection>
      )}

      {/* FAB (если нужен) */}
      <div className="fixed right-5 bottom-20 md:bottom-24">
        <button
          type="button"
          onClick={onFabClick}
          className="w-12 h-12 rounded-full bg-[var(--tg-accent-color,#40A7E3)] text-white shadow-lg active:scale-95 transition"
          aria-label="Add"
        >
          +
        </button>
      </div>

      {/* Центрированная модалка действий (long-press) */}
      {actionOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[var(--tg-bg-color,#000)]/60">
          <div className="w-[min(440px,92vw)] rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] p-3 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)]">
            <div className="text-[15px] mb-3">
              {actionKind === "repay"
                ? (t("repay_debt") || "Погасить долг")
                : (t("remind_debt") || "Напомнить о долге")}
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 h-10 rounded-xl bg-[var(--tg-secondary-bg-color,#e6e6e6)]"
                onClick={() => setActionOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="flex-1 h-10 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white"
                onClick={() => {
                  const u = actionUserRef.current!;
                  const amt = actionAmountRef.current || 0;
                  setActionOpen(false);
                  if (actionKind === "repay") {
                    onRepay ? onRepay(u, amt) : alert(t("debts_reserved") || "Долги — скоро!");
                  } else {
                    onRemind ? onRemind(u, amt) : alert(t("debts_reserved") || "Долги — скоро!");
                  }
                }}
              >
                {actionKind === "repay" ? (t("repay_debt") || "Погасить долг") : (t("remind_debt") || "Напомнить о долге")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
