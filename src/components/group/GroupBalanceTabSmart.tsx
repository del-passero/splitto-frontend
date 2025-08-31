import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

  // колбэки для действий (длинный тап)
  onRepay?: (user: User, amount: number) => void;
  onRemind?: (user: User, amount: number) => void;
};

const decimalsByCode = (code?: string | null) =>
  code && ["JPY", "KRW", "VND"].includes(code) ? 0 : 2;

const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code || undefined);
  try {
    return `${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n)} ${code || ""}`.trim();
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
    <img
      src={url}
      alt={alt || ""}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="rounded-full inline-block shrink-0"
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

/** Автопрокрутка, если текст не влезает по ширине. */
function AutoScrollRow({
  children,
  className = "",
  gap = 8,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [need, setNeed] = useState(false);
  const [dist, setDist] = useState(0); // на сколько прокручивать

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const needNow = el.scrollWidth > el.clientWidth + 2;
      setNeed(needNow);
      if (needNow) setDist(el.scrollWidth - el.clientWidth + gap * 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [gap, children]);

  // скорость ~ 40px/s, но в пределах 6..24s
  const duration = Math.max(6, Math.min(24, dist / 40));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* локальные keyframes (не трогаем глобальные css) */}
      <style>{`
        @keyframes gbs-auto-x {
          0% { transform: translateX(0); }
          12% { transform: translateX(0); }
          88% { transform: translateX(calc(-1 * var(--gbs-dist, 0px))); }
          100% { transform: translateX(calc(-1 * var(--gbs-dist, 0px))); }
        }
      `}</style>
      <div
        ref={ref}
        className="whitespace-nowrap flex items-center"
        style={
          need
            ? {
                columnGap: gap,
                animation: `gbs-auto-x ${duration}s linear infinite`,
                // небольшая маска по краям, чтобы скролл выглядел мягче
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0px, black 12px, black calc(100% - 12px), transparent 100%)",
                maskImage:
                  "linear-gradient(to right, transparent 0px, black 12px, black calc(100% - 12px), transparent 100%)",
                // прокрутка на вычисленную дистанцию
                // @ts-ignore — кастомное css-свойство
                ["--gbs-dist" as any]: `${dist}px`,
              }
            : { columnGap: gap }
        }
      >
        {children}
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");

  // sheet по длинному тапу (только для «Мой баланс»)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<MyDebt | null>(null);

  const headerText = useMemo(() => {
    if (myBalance > 0)
      return t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) });
    if (myBalance < 0)
      return t("group_balance_you_owe", {
        sum: fmtMoney(Math.abs(myBalance), currency),
      });
    return t("group_balance_zero");
  }, [myBalance, t, currency]);

  const owesWord =
    (t("tx_modal.owes") as string) ||
    ((t("tx_modal.owes_label") as string) || "").toString().toLowerCase() ||
    "owes";

  // обработка длинного нажатия
  const pressTimer = useRef<number | null>(null);
  const startPress = (d: MyDebt) => {
    clearPress();
    pressTimer.current = window.setTimeout(() => {
      setSelected(d);
      setSheetOpen(true);
    }, 420);
  };
  const clearPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mt-1 mb-2">
        <div
          className="inline-flex rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        >
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-3 h-9 text-[13px] ${
              tab === "mine"
                ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${
              tab === "all"
                ? "bg-[var(--tg-accent-color,#40A7E3)] text-white"
                : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_all")}
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border p-3 bg-[var(--tg-card-bg)]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
        ) : tab === "mine" ? (
          <>
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-2">
              {headerText}
            </div>

            {myDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts")}
              </div>
            ) : (
              <div>
                {myDebts.map((d, idx) => {
                  const iOwe = d.amount < 0;
                  const amountAbs = Math.abs(d.amount);

                  return (
                    <div key={d.user.id} className="relative">
                      <div
                        className="py-2"
                        onPointerDown={() => startPress(d)}
                        onPointerUp={clearPress}
                        onPointerLeave={clearPress}
                      >
                        {/* 2 колонки: бегущая строка слева + сумма справа */}
                        <div
                          className="grid items-center"
                          style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}
                        >
                          {/* main text (автопрокрутка при переполнении) */}
                          <AutoScrollRow className="min-w-0">
                            <span className="text-[14px] text-[var(--tg-text-color)]">
                              {iOwe ? t("group_balance_owe_to", { sum: "" }).replace(/\s*[:：]\s*$/, "") || t("group_balance_owe_to")
                                   : t("group_balance_get_from", { sum: "" }).replace(/\s*[:：]\s*$/, "") || t("group_balance_get_from")}
                            </span>
                            <MiniAvatar url={d.user.photo_url} alt={firstOnly(d.user)} />
                            <span className="text-[14px] text-[var(--tg-text-color)] font-medium">
                              {firstOnly(d.user)}
                            </span>
                          </AutoScrollRow>

                          {/* amount */}
                          <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                            {fmtMoney(amountAbs, currency)}
                          </div>
                        </div>
                      </div>

                      {idx !== myDebts.length - 1 && (
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              <div>
                {allDebts.map((p, idx) => (
                  <div key={idx} className="relative">
                    <div className="py-2">
                      {/* две колонки: основной текст (бегущий) + сумма */}
                      <div
                        className="grid items-center"
                        style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}
                      >
                        <AutoScrollRow className="min-w-0">
                          <MiniAvatar url={p.from.photo_url} alt={firstOnly(p.from)} />
                          <span className="text-[14px] text-[var(--tg-text-color)] font-medium">
                            {firstOnly(p.from)}
                          </span>
                          <span className="text-[14px] text-[var(--tg-text-color)] opacity-90">
                            {owesWord}
                          </span>
                          <MiniAvatar url={p.to.photo_url} alt={firstOnly(p.to)} />
                          <span className="text-[14px] text-[var(--tg-text-color)] font-medium">
                            {firstOnly(p.to)}
                          </span>
                        </AutoScrollRow>

                        <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                          {fmtMoney(p.amount, currency)}
                        </div>
                      </div>
                    </div>

                    {idx !== allDebts.length - 1 && (
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* mini action sheet для «Мой баланс» */}
      {sheetOpen && selected && (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center"
          onClick={() => setSheetOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-[520px] rounded-t-2xl bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.amount < 0 ? (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
                onClick={() => {
                  onRepay ? onRepay(selected.user, Math.abs(selected.amount)) : alert((t("debts_reserved") as string) || "Coming soon");
                  setSheetOpen(false);
                }}
              >
                {t("repay_debt")}
              </button>
            ) : (
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
                onClick={() => {
                  onRemind ? onRemind(selected.user, Math.abs(selected.amount)) : alert((t("debts_reserved") as string) || "Coming soon");
                  setSheetOpen(false);
                }}
              >
                {t("remind_debt")}
              </button>
            )}
            <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
            <button
              type="button"
              className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={() => setSheetOpen(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Hook для onFabClick */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}
