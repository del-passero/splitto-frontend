// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, MessageCircle } from "lucide-react";

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number; currency: string }; // >0 — вам должны, <0 — вы должны
export type AllDebt  = { from: User; to: User; amount: number; currency: string };

type Props = {
  myBalanceByCurrency: Record<string, number>;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;

  onRepay?:  (user: User, amount: number, currency: string) => void;
  onRemind?: (user: User, amount: number, currency: string) => void;
};

/* ---------- utils ---------- */
const DECLESS = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (c?: string | null) => (c && DECLESS.has(c) ? 0 : 2);
const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code);
  const num =
    new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  // неразрывный пробел между суммой и валютой
  return `${num}\u00A0${code || ""}`.trim();
};
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

function Avatar({ url, alt }: { url?: string; alt?: string }) {
  const size = 56; // в 2 раза больше прежнего
  return url ? (
    <img
      src={url}
      alt={alt || ""}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full inline-block shrink-0"
      style={{ width: size, height: size, background: "var(--tg-link-color)" }}
      aria-hidden
    />
  );
}

/* ---------- helpers для «двух колонок» ---------- */
type CurrencyLine = { currency: string; amount: number }; // абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

function totalsToInline(by: Record<string, number>) {
  // "100 RUB; 28 BYN; 5 USD"  (перенос возможен только после '; ')
  const parts = Object.entries(by).map(([ccy, sum]) => fmtMoney(sum, ccy));
  return parts.join("; ");
}

/* ---------- main ---------- */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, myDebts, allDebts, loading, onFabClick, onRepay, onRemind,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [stubOpen, setStubOpen] = useState(false);

  /* подготовка данных для двух колонок */
  const { leftCards, rightCards, leftTotalsInline, rightTotalsInline } = useMemo(() => {
    const leftMap  = new Map<number, CardItem>(); // я должен
    const rightMap = new Map<number, CardItem>(); // мне должны
    const leftTotals:  Record<string, number> = {};
    const rightTotals: Record<string, number> = {};

    for (const d of myDebts) {
      const abs = Math.abs(d.amount);
      if (abs <= 0) continue;
      const key = d.user.id;

      if (d.amount < 0) {
        const ci = leftMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        leftMap.set(key, ci);
        leftTotals[d.currency] = (leftTotals[d.currency] || 0) + abs;
      } else {
        const ci = rightMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        rightMap.set(key, ci);
        rightTotals[d.currency] = (rightTotals[d.currency] || 0) + abs;
      }
    }

    const sortCards = (a: CardItem, b: CardItem) => b.total - a.total;
    const sortLines = (a: CurrencyLine, b: CurrencyLine) => a.currency.localeCompare(b.currency);

    const leftCards  = Array.from(leftMap.values()).map(ci => ({ ...ci,  lines: ci.lines.sort(sortLines) })).sort(sortCards);
    const rightCards = Array.from(rightMap.values()).map(ci => ({ ...ci, lines: ci.lines.sort(sortLines) })).sort(sortCards);

    return {
      leftCards,
      rightCards,
      leftTotalsInline:  totalsToInline(leftTotals),
      rightTotalsInline: totalsToInline(rightTotals),
    };
  }, [myDebts]);

  /* стили кнопок (3D-эффект) */
  const btn3D = "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
                "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
                "hover:brightness-105";

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

      {/* Контент */}
      <div className="px-2 py-2">
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          /* ================= Мой баланс: две колонки ================= */
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Левая колонка — Я должен */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("i_owe") || "Я должен"}
              </div>
              {leftTotalsInline && (
                <div
                  className="text-[12px] mb-2"
                  style={{
                    color: "var(--tg-hint-color)",
                    // перенос только после "; "
                    whiteSpace: "pre-wrap",
                    wordBreak: "keep-all",
                  }}
                >
                  {leftTotalsInline}
                </div>
              )}

              {leftCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left") || "Нет долгов"}</div>
              ) : (
                <div className="grid gap-2">
                  {leftCards.map((card) => (
                    <div
                      key={card.user.id + "-L"}
                      className="rounded-xl border p-2"
                      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                    >
                      {/* шапка карточки: аватар + имя в одной строке */}
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                        <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                          {firstOnly(card.user)}
                        </div>
                      </div>

                      {/* строки валют: сумма (красная) + кнопка погасить справа */}
                      <div className="flex flex-col gap-1">
                        {card.lines.map((ln, i) => (
                          <div
                            key={card.user.id + "-L-" + ln.currency + "-" + i}
                            className="grid items-center"
                            style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                          >
                            <div
                              className="text-[14px] font-semibold"
                              style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                            >
                              {fmtMoney(ln.amount, ln.currency)}
                            </div>
                            <button
                              type="button"
                              onClick={() => onRepay?.(card.user, ln.amount, ln.currency)}
                              className={btn3D}
                              aria-label="Repay"
                              title={t("repay_debt") as string}
                            >
                              <Banknote size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Правая колонка — Мне должны */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("they_owe_me") || "Мне должны"}
              </div>
              {rightTotalsInline && (
                <div
                  className="text-[12px] mb-2"
                  style={{
                    color: "var(--tg-hint-color)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "keep-all",
                  }}
                >
                  {rightTotalsInline}
                </div>
              )}

              {rightCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right") || "Никто не должен"}</div>
              ) : (
                <div className="grid gap-2">
                  {rightCards.map((card) => (
                    <div
                      key={card.user.id + "-R"}
                      className="rounded-xl border p-2"
                      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                    >
                      {/* шапка карточки: аватар + имя */}
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                        <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                          {firstOnly(card.user)}
                        </div>
                      </div>

                      {/* строки валют (зелёные) + одна кнопка справа по центру */}
                      <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                        <div className="flex flex-col gap-1">
                          {card.lines.map((ln, i) => (
                            <div
                              key={card.user.id + "-R-" + ln.currency + "-" + i}
                              className="text-[14px] font-semibold"
                              style={{ color: "var(--tg-success-text,#2ecc71)" }}
                            >
                              {fmtMoney(ln.amount, ln.currency)}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setStubOpen(true)}
                            className={btn3D}
                            aria-label="Remind"
                            title={t("remind_debt") as string}
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= Все балансы (без изменений визуально) ================= */
          <div>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              allDebts.map((p, idx) => (
                <div key={`${idx}-${p.currency}`} className="relative">
                  <div className="py-2">
                    <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                      <div className="min-w-0 flex items-center gap-8">
                        <span className="text-[14px] text-[var(--tg-text-color)] font-medium">{firstOnly(p.from)}</span>
                        <span className="text-[14px] text-[var(--tg-hint-color)]">{(t("tx_modal.owes") as string) || "owes"}</span>
                        <span className="text-[14px] text-[var(--tg-text-color)] font-medium">{firstOnly(p.to)}</span>
                      </div>
                      <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                        {fmtMoney(p.amount, p.currency)}
                      </div>
                    </div>
                  </div>
                  {idx !== allDebts.length - 1 && (
                    <div className="h-px bg-[var(--tg-hint-color)] opacity-15" />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Временная модалка-заглушка для "напомнить" */}
      {stubOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={() => setStubOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
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
