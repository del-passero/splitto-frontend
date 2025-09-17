// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell } from "lucide-react";

/* ===== Types (совпадают с тем, как их формирует GroupBalanceTab.tsx) ===== */
type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type MyDebt = { user: User; amount: number; currency: string }; // >0 — мне должны, <0 — я должен
export type AllDebt = { from: User; to: User; amount: number; currency: string };

type Props = {
  myBalanceByCurrency: Record<string, number>;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
  loading: boolean;
  onFabClick: () => void;

  onRepay: (user: User, amount: number, currency: string) => void;
  onRemind: (user: User, amount: number, currency: string) => void;
};

/* ---------- utils ---------- */
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

/** Формат «550 TRY» или «45,50 USD»: без копеек, если дробная часть = 0 */
const fmtNoTrailing = (n: number, code: string, locale?: string) => {
  const rounded = Math.round(n * 100) / 100;
  const hasCents = Math.round((rounded % 1) * 100) !== 0;
  try {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    });
    return `${nf.format(rounded)}\u00A0${code}`;
  } catch {
    return `${hasCents ? rounded.toFixed(2) : Math.trunc(rounded)}\u00A0${code}`;
  }
};

function Avatar({ url, alt, size = 56 }: { url?: string; alt?: string; size?: number }) {
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

function totalsToInline(by: Record<string, number>, locale?: string) {
  const parts = Object.entries(by)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ccy, sum]) => fmtNoTrailing(sum, ccy, locale));
  // перенос возможен только после '; '
  return parts.join("; ");
}

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // не используем прямо сейчас, оставлен для совместимости пропсов
  myDebts,
  allDebts,
  loading,
  onFabClick,
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const [tab, setTab] = useState<"mine" | "all">("mine");

  /* подготовка данных для двух колонок */
  const { leftCards, rightCards, leftTotalsInline, rightTotalsInline } = useMemo(() => {
    const leftMap = new Map<number, CardItem>(); // я должен
    const rightMap = new Map<number, CardItem>(); // мне должны
    const leftTotals: Record<string, number> = {};
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

    const leftCards = Array.from(leftMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.sort(sortLines) }))
      .sort(sortCards);
    const rightCards = Array.from(rightMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.sort(sortLines) }))
      .sort(sortCards);

    return {
      leftCards,
      rightCards,
      leftTotalsInline: totalsToInline(leftTotals, locale),
      rightTotalsInline: totalsToInline(rightTotals, locale),
    };
  }, [myDebts, locale]);

  /* стили кнопок (не увеличивают высоту карточки) */
  const btn = "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
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
                    whiteSpace: "pre-wrap",
                    wordBreak: "keep-all",
                  }}
                >
                  {leftTotalsInline}
                </div>
              )}

              {leftCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">
                  {t("group_balance_no_debts_left") || "Нет долгов"}
                </div>
              ) : (
                <div className="grid gap-2">
                  {leftCards.map((card, cardIdx) => (
                    <div
                      key={card.user.id + "-L"}
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

                      {/* строки валют: сумма (красная) + кнопка «Выплатить/Settle Up/Pagar» справа;
                          Только на самой верхней кнопке колонки — подпись над кнопкой */}
                      <div className="flex flex-col gap-1">
                        {card.lines.map((ln, lineIdx) => {
                          const showTopLabel = cardIdx === 0 && lineIdx === 0;
                          return (
                            <div
                              key={card.user.id + "-L-" + ln.currency + "-" + lineIdx}
                              className="grid items-center relative"
                              style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                            >
                              <div
                                className="text-[14px] font-semibold"
                                style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                              >
                                {fmtNoTrailing(ln.amount, ln.currency, locale)}
                              </div>

                              <div className="relative flex items-center justify-end">
                                {showTopLabel && (
                                  <div className="absolute -top-3 right-0 text-[11px] opacity-75 leading-none">
                                    {t("repay_debt")}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onRepay(card.user, ln.amount, ln.currency)}
                                  className={btn}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                <div className="text-[13px] text-[var(--tg-hint-color)]">
                  {t("group_balance_no_debts_right") || "Никто не должен"}
                </div>
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

                      {/* строки валют (зелёные) + одна кнопка «Напомнить/Bell» справа по центру */}
                      <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                        <div className="flex flex-col gap-1">
                          {card.lines.map((ln, i) => (
                            <div
                              key={card.user.id + "-R-" + ln.currency + "-" + i}
                              className="text-[14px] font-semibold"
                              style={{ color: "var(--tg-success-text,#2ecc71)" }}
                            >
                              {fmtNoTrailing(ln.amount, ln.currency, locale)}
                            </div>
                          ))}
                        </div>
                        <div className="relative flex items-center justify-end">
                          <div className="absolute -top-3 right-0 text-[11px] opacity-75 leading-none">
                            {t("remind_debt")}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemind(card.user, card.lines[0]?.amount ?? 0, card.lines[0]?.currency ?? "")}
                            className={btn}
                            aria-label={t("remind_debt") as string}
                            title={t("remind_debt") as string}
                          >
                            <Bell size={18} />
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
          /* ================= Все балансы: группировка по валютам + аватары ================= */
          <div>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              (() => {
                const byCcy = new Map<string, AllDebt[]>();
                for (const p of allDebts) {
                  const arr = byCcy.get(p.currency) || [];
                  arr.push(p);
                  byCcy.set(p.currency, arr);
                }
                return Array.from(byCcy.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([ccy, arr]) => (
                    <div key={ccy} className="mb-3">
                      <div className="px-1 mb-1 text-[12px] uppercase tracking-wide opacity-70">{ccy}</div>
                      {arr.map((p, idx) => (
                        <div key={`${ccy}-${idx}-${p.from.id}-${p.to.id}`} className="relative">
                          <div className="py-2">
                            <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                              <div className="min-w-0 flex items-center gap-2">
                                <Avatar url={p.from.photo_url} alt={firstOnly(p.from)} size={36} />
                                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                                  {firstOnly(p.from)}
                                </span>
                                <span className="text-[14px] text-[var(--tg-hint-color)]">
                                  {(t("tx_modal.owes") as string) || "owes"}
                                </span>
                                <Avatar url={p.to.photo_url} alt={firstOnly(p.to)} size={36} />
                                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate">
                                  {firstOnly(p.to)}
                                </span>
                              </div>
                              <div className="text-[14px] font-semibold text-[var(--tg-text-color)] text-right">
                                {fmtNoTrailing(p.amount, p.currency, locale)}
                              </div>
                            </div>
                          </div>
                          {idx !== arr.length - 1 && (
                            <div className="h-px bg-[var(--tg-hint-color)] opacity-15" />
                          )}
                        </div>
                      ))}
                    </div>
                  ));
              })()
            )}
          </div>
        )}
      </div>

      {/* скрытая кнопка для FAB */}
      <div className="hidden"><button type="button" onClick={onFabClick} /></div>
    </div>
  );
}
