// src/components/group/GroupBalanceTabSmart.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TransactionList from "../transactions/TransactionList";

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number }; // >0 — вам должны, <0 — вы должны
export type AllDebt = { from: User; to: User; amount: number };

type Props = {
  myBalance: number;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;
  currency?: string | null;

  onRepay?: (user: User, amount: number) => void;
  onRemind?: (user: User, amount: number) => void;
};

/* ---------- utils ---------- */
const DECLESS = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (c?: string | null) => (c && DECLESS.has(c) ? 0 : 2);
const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code);
  try {
    return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(d)} ${code || ""}`.trim();
  }
};
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

function MiniAvatar({ url, alt, size = 18 }: { url?: string; alt?: string; size?: number }) {
  return url ? (
    <img src={url} alt={alt || ""} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full inline-block shrink-0" style={{ width: size, height: size, background: "var(--tg-link-color)" }} aria-hidden />
  );
}

/** Автопрокрутка строки при переполнении */
function AutoScrollRow({ children, className = "", gap = 8 }: { children: React.ReactNode; className?: string; gap?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [need, setNeed] = useState(false);
  const [dist, setDist] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const n = el.scrollWidth > el.clientWidth + 2;
      setNeed(n);
      if (n) setDist(el.scrollWidth - el.clientWidth + gap * 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => { ro.disconnect(); window.removeEventListener("resize", check); };
  }, [gap, children]);
  const duration = Math.max(6, Math.min(24, dist / 40));
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <style>{`@keyframes gbs-auto-x{0%{transform:translateX(0)}12%{transform:translateX(0)}88%{transform:translateX(calc(-1*var(--gbs-dist,0px)))}100%{transform:translateX(calc(-1*var(--gbs-dist,0px)))}}`}</style>
      <div
        ref={ref}
        className="whitespace-nowrap flex items-center"
        style={need
          ? {
              columnGap: gap,
              animation: `gbs-auto-x ${duration}s linear infinite`,
              WebkitMaskImage: "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
              // @ts-ignore
              ["--gbs-dist" as any]: `${dist}px`,
            }
          : { columnGap: gap }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- constants для отрисовки ---------- */
const ITEM_VPAD = 4;           // py-4 → карточки в 2 раза выше
const SEP_LEFT_INSET = 36;     // откуда начинать разделитель внутри карточки (от левого края секции до первой аватарки)

/* ---------- main ---------- */
export default function GroupBalanceTabSmart({
  myBalance, myDebts, allDebts, loading, onFabClick, currency, onRepay, onRemind,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<MyDebt | null>(null);

  // модалка-заглушка по центру
  const [stubOpen, setStubOpen] = useState(false);

  const headerText = useMemo(() => {
    if (myBalance > 0) return t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) });
    if (myBalance < 0) return t("group_balance_you_owe", { sum: fmtMoney(Math.abs(myBalance), currency) });
    return t("group_balance_zero");
  }, [myBalance, t, currency]);

  const owesWord = ((t("tx_modal.owes") as string) || "owes").toLowerCase();

  // long-press
  const timer = useRef<number | null>(null);
  const startPress = (d: MyDebt) => { clearPress(); timer.current = window.setTimeout(() => { setSelected(d); setSheetOpen(true); }, 420); };
  const clearPress = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; };

  return (
    <div className="w-full">
      {/* микротабы */}
      <div className="flex justify-center mt-1 mb-2">
        <div className="inline-flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
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

      {/* обёртка «карточки» как на вкладке транзакций */}
      <div className="-mx-3">
        <div className="mx-3">
          <div className="rounded-xl border bg-[var(--tg-card-bg)]" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            {/* Внутренние отступы для заголовка */}
            <div className="px-3 pt-2">
              {loading ? (
                <div className="py-6 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
              ) : tab === "mine" ? (
                <>
                  {/* заголовок */}
                  <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-2">{headerText}</div>
                  {/* разделитель на всю ширину секции */}
                  <div className="-mx-3 h-px bg-[var(--tg-hint-color)] opacity-15" />
                  {/* список */}
                  {myDebts.length === 0 ? (
                    <div className="px-3 py-3 text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts")}</div>
                  ) : (
                    <TransactionList<MyDebt>
                      items={myDebts}
                      keyExtractor={(d) => d.user.id}
                      leftInsetPx={SEP_LEFT_INSET}
                      horizontalPaddingPx={12 /* px-3 */}
                      renderItem={(d) => {
                        const iOwe = d.amount < 0;
                        const amountAbs = Math.abs(d.amount);
                        return (
                          <div
                            className={`py-${ITEM_VPAD}`}
                            onPointerDown={() => startPress(d)}
                            onPointerUp={clearPress}
                            onPointerLeave={clearPress}
                          >
                            <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                              <AutoScrollRow className="min-w-0">
                                <span className="text-[14px] text-[var(--tg-text-color)]">
                                  {iOwe
                                    ? (t("group_balance_owe_to", { sum: "" }) as string).replace(/\s*[:：]\s*$/, "")
                                    : (t("group_balance_get_from", { sum: "" }) as string).replace(/\s*[:：]\s*$/, "")}
                                </span>
                                <MiniAvatar url={d.user.photo_url} alt={firstOnly(d.user)} />
                                <span className="text-[14px] text-[var(--tg-text-color)] font-medium">{firstOnly(d.user)}</span>
                              </AutoScrollRow>
                              <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                                {fmtMoney(amountAbs, currency)}
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* разделитель под шапкой — без текста в табе «Все» */}
                  <div className="-mx-3 h-px bg-[var(--tg-hint-color)] opacity-15" />
                  {allDebts.length === 0 ? (
                    <div className="px-3 py-3 text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
                  ) : (
                    <TransactionList<AllDebt>
                      items={allDebts}
                      keyExtractor={(p, i) => `${p.from.id}->${p.to.id}-${i}`}
                      leftInsetPx={SEP_LEFT_INSET}
                      horizontalPaddingPx={12 /* px-3 */}
                      renderItem={(p) => (
                        <div className={`py-${ITEM_VPAD}`}>
                          <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                            <AutoScrollRow className="min-w-0">
                              <MiniAvatar url={p.from.photo_url} alt={firstOnly(p.from)} />
                              <span className="text-[14px] text-[var(--tg-text-color)] font-medium">{firstOnly(p.from)}</span>
                              <span className="text-[14px] text-[var(--tg-text-color)] opacity-90">{owesWord}</span>
                              <MiniAvatar url={p.to.photo_url} alt={firstOnly(p.to)} />
                              <span className="text-[14px] text-[var(--tg-text-color)] font-medium">{firstOnly(p.to)}</span>
                            </AutoScrollRow>
                            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                              {fmtMoney(p.amount, currency)}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* контекстное меню по long-press — по центру */}
      {sheetOpen && selected && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-2xl bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.amount < 0 ? (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg_white/5 transition"
                onClick={() => { onRepay?.(selected.user, Math.abs(selected.amount)); setSheetOpen(false); }}
              >
                {t("repay_debt")}
              </button>
            ) : (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg_white/5 transition"
                onClick={() => { onRemind?.(selected.user, Math.abs(selected.amount)); setSheetOpen(false); setStubOpen(true); }}
              >
                {t("remind_debt")}
              </button>
            )}
            <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
            <button
              type="button"
              className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg_white/5 transition"
              onClick={() => setSheetOpen(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* центр-модалка-заглушка */}
      {stubOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={() => setStubOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-2xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-semibold mb-2">{t("remind_debt")}</div>
            <div className="text-[14px] opacity-80 mb-3">{t("debts_reserved")}</div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStubOpen(false)}
                className="h-9 px-4 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-semibold active:scale-95 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* скрытая кнопка для FAB */}
      <div className="hidden"><button type="button" onClick={onFabClick} /></div>
    </div>
  );
}
