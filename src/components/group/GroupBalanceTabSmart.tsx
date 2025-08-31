// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useRef, useState } from "react";
import CardSection from "../CardSection";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

export type SimpleUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

export type MyDebt = { user: SimpleUser; amount: number }; // >0 «мне должны», <0 «я должен»
export type AllDebt = { from: SimpleUser; to: SimpleUser; amount: number };

export type Props = {
  myBalance: number;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;
  currency: string | null;
  onAction: (kind: ActionKind, payload: { otherId: number; amount: number }) => void;
};

export type ActionKind = "repay" | "remind";

const avatar = (u?: SimpleUser, size = 20) =>
  u?.photo_url
    ? <img src={u.photo_url} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
    : <span className="inline-block rounded-full bg-[var(--tg-link-color)]" style={{ width: size, height: size }} />;

const userName = (u?: SimpleUser) => {
  const fn = (u?.first_name || "").trim();
  const ln = (u?.last_name || "").trim();
  return (fn || ln) ? `${fn}${ln ? ` ${ln}` : ""}` : (u?.username || `#${u?.id ?? "?"}`);
};

export default function GroupBalanceTabSmart({
  myBalance, myDebts, allDebts, loading, currency, onAction,
}: Props) {
  const { t, i18n } = useTranslation();
  const loc = (i18n.language || "ru").split("-")[0];
  const d = useMemo(() => (currency && new Set(["JPY", "KRW", "VND"]).has(currency) ? 0 : 2), [currency]);
  const fmt = (n: number) => {
    try {
      const nf = new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
      return `${nf.format(Math.abs(n))}${currency ? ` ${currency}` : ""}`;
    } catch {
      return `${Math.abs(n).toFixed(d)}${currency ? ` ${currency}` : ""}`;
    }
  };

  const [tab, setTab] = useState<"mine" | "all">("mine");

  // centered action modal (long press)
  const [sheet, setSheet] = useState<{ open: boolean; user?: SimpleUser; amount?: number; kind?: "owe" | "owed" }>({ open: false });

  const longPressTimer = useRef<any>(null);
  const startLP = (cb: () => void) => () => { clearTimeout(longPressTimer.current); longPressTimer.current = setTimeout(cb, 380); };
  const cancelLP = () => { clearTimeout(longPressTimer.current); };

  const openActions = (kind: "owe" | "owed", user: SimpleUser, amount: number) => {
    setSheet({ open: true, user, amount, kind });
  };

  const closeSheet = () => setSheet({ open: false });

  const renderMineRow = (it: MyDebt, idx: number) => {
    const isIOwe = it.amount < 0;
    const label = isIOwe ? t("balance.you_owe") : t("balance.you_are_owed");
    const sum = fmt(it.amount);
    const u = it.user;

    return (
      <div
        key={idx}
        className="relative px-3"
        onMouseDown={startLP(() => openActions(isIOwe ? "owe" : "owed", u, Math.abs(it.amount)))}
        onMouseUp={cancelLP}
        onMouseLeave={cancelLP}
        onTouchStart={startLP(() => openActions(isIOwe ? "owe" : "owed", u, Math.abs(it.amount)))}
        onTouchEnd={cancelLP}
      >
        <div className="flex items-center gap-2 h-14"> {/* удвоенная высота */}
          <span className="shrink-0 text-[13px]">{label}</span>
          <span className="shrink-0">{avatar(u, 20)}</span>
          <span className="min-w-0 grow truncate text-[13px]">{userName(u)}</span>
          <span className="shrink-0 text-[13px] font-semibold">{sum}</span>
        </div>

        {/* разделитель: от правого края до первой аватарки */}
        <div className="absolute left-[52px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)]/20" />
      </div>
    );
  };

  const renderAllRow = (it: AllDebt, idx: number) => {
    return (
      <div
        key={idx}
        className="px-3 relative"
        onMouseDown={startLP(() => openActions("owe", it.from, it.amount))}
        onMouseUp={cancelLP}
        onMouseLeave={cancelLP}
        onTouchStart={startLP(() => openActions("owe", it.from, it.amount))}
        onTouchEnd={cancelLP}
      >
        <div className="flex items-center gap-2 h-14">{/* удвоенная высота */}
          {/* должник */}
          <span className="shrink-0">{avatar(it.from, 20)}</span>
          <span className="min-w-0 max-w-[30%] truncate text-[13px]">{userName(it.from)}</span>

          {/* коннектор и стрелка */}
          <span className="shrink-0 text-[13px]">{t("tx_modal.owes")}</span>
          <ChevronRight size={16} className="opacity-60 shrink-0" />

          {/* кредитор */}
          <span className="shrink-0">{avatar(it.to, 20)}</span>
          <span className="min-w-0 grow truncate text-[13px]">{userName(it.to)}</span>

          {/* сумма справа */}
          <span className="shrink-0 text-[13px] font-semibold">{fmt(it.amount)}</span>
        </div>

        {/* разделитель: от правого края до первой аватарки */}
        <div className="absolute left-[32px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)]/20" />
      </div>
    );
  };

  return (
    <div className="px-0">
      {/* переключатель по центру */}
      <div className="px-3">
        <CardSection className="py-2">
          <div className="flex justify-center">
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
        </CardSection>
      </div>

      {/* карточки */}
      <div className="-mx-3">
        <CardSection className="py-0">
          {/* особая сплошная линия под заголовком «Тебе должны/Ты должен» — во всей секции */}
          <div className="px-3 pt-2 pb-1">
            <div className="text-[13px] opacity-70">
              {myBalance > 0 ? t("group_balance_you_get", { sum: "" }).replace(/\s+$/, "") :
               myBalance < 0 ? t("group_balance_you_owe", { sum: "" }).replace(/\s+$/, "") :
               t("group_balance_zero")}
            </div>
          </div>
          <div className="h-px bg-[var(--tg-hint-color)]/30 w-full" />

          {loading ? (
            <div className="px-3 py-4 text-[13px] opacity-70">{t("loading")}</div>
          ) : (
            <>
              {tab === "mine" ? (
                myDebts.length ? myDebts.map(renderMineRow) : (
                  <div className="px-3 py-4 text-[13px] opacity-70">{t("group_balance_no_debts")}</div>
                )
              ) : (
                allDebts.length ? allDebts.map(renderAllRow) : (
                  <div className="px-3 py-4 text-[13px] opacity-70">{t("group_balance_no_debts_all")}</div>
                )
              )}
            </>
          )}
        </CardSection>
      </div>

      {/* centered action sheet (по длинному тапу) */}
      {sheet.open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50" onClick={closeSheet}>
          <div className="w-[min(92vw,360px)] rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-xl p-3"
               onClick={(e) => e.stopPropagation()}>
            <div className="text-[14px] font-semibold mb-2 truncate">{userName(sheet.user)}</div>
            <div className="flex flex-col gap-2">
              {sheet.kind === "owe" && (
                <button
                  className="h-10 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white text-[14px] font-bold"
                  onClick={() => { 
                    if (sheet.user && sheet.amount) onAction("repay", { otherId: sheet.user.id, amount: Math.abs(sheet.amount) });
                    closeSheet();
                  }}
                >
                  {t("repay_debt")}
                </button>
              )}
              <button
                className="h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[14px]"
                onClick={() => { alert(t("debts_reserved")); closeSheet(); }}
              >
                {t("remind_debt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
