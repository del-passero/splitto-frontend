// src/components/group/GroupBalanceTabSmart.tsx
import { useMemo, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell } from "lucide-react";

/* ===== Types (как в старом рабочем коде) ===== */
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

  onRepay?:  (user: User, amount: number, currency: string) => void;
  onRemind?: (user: User, amount: number, currency: string) => void;
};

/* ---------- utils ---------- */
const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

/** «550 TRY» или «45,50 USD»: без копеек, если дробная часть = 0 */
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
  return parts.join("; "); // перенос только после "; "
}

/* Локальные короткие тексты без добавления ключей */
function moreLabel(n: number, locale: string) {
  if (locale === "ru") return `и ещё ${n}`;
  if (locale === "es") return `y ${n} más`;
  return `and ${n} more`;
}
function collapseLabel(locale: string) {
  if (locale === "ru") return "Свернуть";
  if (locale === "es") return "Contraer";
  return "Collapse";
}

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // не используется сейчас; оставлен для совместимости
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

  // локальная заглушка для «Напомнить»
  const [stubOpen, setStubOpen] = useState(false);

  // раскрытие карточек по user.id
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggleExpanded = useCallback((uid: number) => {
    setExpanded((prev) => ({ ...prev, [uid]: !prev[uid] }));
  }, []);

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

  /* стили кнопок */
  const btn =
    "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105";

  return (
    <div className="w-full">
      {/* микротабы */}
      <div className="flex justify-center mt-1 mb-2">
        <div
          className="inline-flex rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        >
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`px-3 h-9 text-[13px] ${
              tab === "mine" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"
            }`}
          >
            {t("group_balance_microtab_mine")}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 h-9 text-[13px] ${
              tab === "all" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)]"
            }`}
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

              {/* Итоги по валютам — горизонтальный скролл */}
              {leftTotalsInline && (
                <div
                  role="region"
                  tabIndex={0}
                  aria-label={(t("group_balance_totals_aria") as string) || "Totals by currency"}
                  className="text-[12px] mb-2 overflow-x-auto overflow-y-hidden"
                  style={{
                    color: "var(--tg-hint-color)",
                    whiteSpace: "nowrap",
                    WebkitOverflowScrolling: "touch",
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
                  {leftCards.map((card) => {
                    const isOpen = !!expanded[card.user.id];
                    const visible = isOpen ? card.lines : card.lines.slice(0, 2);
                    const rest = Math.max(0, card.lines.length - visible.length);

                    return (
                      <div
                        key={card.user.id + "-L"}
                        className="relative rounded-xl border p-2"
                        style={{
                          borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                          background: "var(--tg-card-bg)",
                        }}
                      >
                        {/* шапка карточки: аватар + имя */}
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                          <div
                            className="text-[14px] font-medium truncate"
                            style={{ color: "var(--tg-text-color)" }}
                            title={firstOnly(card.user)}
                          >
                            {firstOnly(card.user)}
                          </div>
                        </div>

                        {/* строки валют: каждая строка — 2 колонки; справа — кнопка погашения */}
                        <div className="grid gap-1" style={{ gridTemplateColumns: "1fr auto" }}>
                          {visible.map((ln, i) => (
                            <FragmentRow
                              key={card.user.id + "-L-" + ln.currency + "-" + i}
                              left={
                                <div
                                  className="text-[14px] font-semibold"
                                  style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                                >
                                  {fmtNoTrailing(ln.amount, ln.currency, locale)}
                                </div>
                              }
                              right={
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => onRepay?.(card.user, ln.amount, ln.currency)}
                                    className={btn}
                                    aria-label={(t("repay_debt") as string) || "Settle up"}
                                    title={(t("repay_debt") as string) || "Settle up"}
                                  >
                                    <HandCoins size={18} />
                                  </button>
                                </div>
                              }
                            />
                          ))}
                        </div>

                        {/* Кнопка "и ещё N" / "Свернуть" */}
                        {card.lines.length > 2 && (
                          <div className="mt-1">
                            {!isOpen ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(card.user.id)}
                                className="text-[12px] opacity-80 hover:opacity-100"
                                style={{ color: "var(--tg-link-color)" }}
                              >
                                {moreLabel(rest, locale)}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(card.user.id)}
                                className="text-[12px] opacity-80 hover:opacity-100"
                                style={{ color: "var(--tg-link-color)" }}
                              >
                                {collapseLabel(locale)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Правая колонка — Мне должны */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("they_owe_me") || "Мне должны"}
              </div>

              {/* Итоги по валютам — горизонтальный скролл */}
              {rightTotalsInline && (
                <div
                  role="region"
                  tabIndex={0}
                  aria-label={(t("group_balance_totals_aria") as string) || "Totals by currency"}
                  className="text-[12px] mb-2 overflow-x-auto overflow-y-hidden"
                  style={{
                    color: "var(--tg-hint-color)",
                    whiteSpace: "nowrap",
                    WebkitOverflowScrolling: "touch",
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
                  {rightCards.map((card) => {
                    const isOpen = !!expanded[card.user.id];
                    const visible = isOpen ? card.lines : card.lines.slice(0, 2);
                    const rest = Math.max(0, card.lines.length - visible.length);

                    return (
                      <div
                        key={card.user.id + "-R"}
                        className="relative rounded-xl border p-2"
                        style={{
                          borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                          background: "var(--tg-card-bg)",
                        }}
                      >
                        {/* шапка карточки: аватар + имя */}
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                          <div
                            className="text-[14px] font-medium truncate"
                            style={{ color: "var(--tg-text-color)" }}
                            title={firstOnly(card.user)}
                          >
                            {firstOnly(card.user)}
                          </div>
                        </div>

                        {/* Двухколоночная сетка:
                            - слева все видимые строки
                            - справа ОДНА кнопка Bell, вертикально по центру блока строк */}
                        <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                          {/* ЛЕВАЯ КОЛОНКА: суммы */}
                          <div className="flex flex-col gap-1">
                            {visible.map((ln, i) => (
                              <div
                                key={card.user.id + "-R-" + ln.currency + "-" + i}
                                className="text-[14px] font-semibold"
                                style={{ color: "var(--tg-success-text,#2ecc71)" }}
                              >
                                {fmtNoTrailing(ln.amount, ln.currency, locale)}
                              </div>
                            ))}

                            {/* Кнопка "и ещё N" / "Свернуть" */}
                            {card.lines.length > 2 && (
                              <div className="mt-1">
                                {!isOpen ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(card.user.id)}
                                    className="text-[12px] opacity-80 hover:opacity-100"
                                    style={{ color: "var(--tg-link-color)" }}
                                  >
                                    {moreLabel(rest, locale)}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(card.user.id)}
                                    className="text-[12px] opacity-80 hover:opacity-100"
                                    style={{ color: "var(--tg-link-color)" }}
                                  >
                                    {collapseLabel(locale)}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ПРАВАЯ КОЛОНКА: единственная кнопка — всегда по вертикальному центру блока слева */}
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                // Всегда показываем заглушку, чтобы «модалка» открывалась.
                                setStubOpen(true);
                                // И дополнительно дергаем внешний обработчик, если он есть.
                                const first = visible[0];
                                if (onRemind && first) {
                                  setTimeout(() => onRemind(card.user, first.amount, first.currency), 0);
                                }
                              }}
                              className={btn}
                              aria-label={(t("remind_debt") as string) || "Remind"}
                              title={(t("remind_debt") as string) || "Remind"}
                            >
                              <Bell size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate" title={firstOnly(p.from)}>
                                  {firstOnly(p.from)}
                                </span>
                                <span className="text-[14px] text-[var(--tg-hint-color)]">
                                  {(t("tx_modal.owes") as string) || "owes"}
                                </span>
                                <Avatar url={p.to.photo_url} alt={firstOnly(p.to)} size={36} />
                                <span className="text-[14px] text-[var(--tg-text-color)] font-medium truncate" title={firstOnly(p.to)}>
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

      {/* Временная модалка-заглушка для "Напомнить" */}
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
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}

/* ===== Вспомогательный компонент для строки 2-колоночной сетки ===== */
function FragmentRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <>
      <div className="min-w-0">{left}</div>
      <div>{right}</div>
    </>
  );
}
