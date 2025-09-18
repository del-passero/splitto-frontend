// src/components/group/GroupBalanceTabSmart.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell, ArrowLeft, ArrowRight } from "lucide-react";

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

  onRepay?: (user: User, amount: number, currency: string) => void;
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
  const entries = Object.entries(by).filter(([, v]) => v > 0);
  if (!entries.length) return "";
  const parts = entries
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ccy, sum]) => fmtNoTrailing(sum, ccy, locale));
  return parts.join("; "); // перенос только после "; "
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

  /* ======================= МОЙ БАЛАНС ======================= */
  const {
    leftCards,
    rightCards,
    leftTotalsInline,
    rightTotalsInline,
  } = useMemo(() => {
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

  // раскрытия: показываем >2 строк
  const [expandedLeft, setExpandedLeft] = useState<Set<number>>(() => new Set());
  const [expandedRight, setExpandedRight] = useState<Set<number>>(() => new Set());
  const toggleLeft = (id: number) => {
    const s = new Set(expandedLeft);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setExpandedLeft(s);
  };
  const toggleRight = (id: number) => {
    const s = new Set(expandedRight);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setExpandedRight(s);
  };

  // параметры для вычислений высот
  const LINE_H = 22; // px на строку суммы
  const V_GAP = 6; // вертикальный гап между строками

  const visibleCount = (total: number, expanded: boolean) => (expanded ? total : Math.min(2, total));
  const heightFor = (vis: number) => (vis > 0 ? vis * LINE_H + (vis - 1) * V_GAP : 0);

  /* ======================= ВСЕ БАЛАНСЫ ======================= */
  type PairKey = string; // `${minId}-${maxId}`
  type PairCard = {
    a: User; // тот, у кого id меньше — левый
    b: User; // правый
    toA: Record<string, number>; // что b должен a (зелёный левый столбец)
    toB: Record<string, number>; // что a должен b (красный правый столбец)
  };

  const { allSummaryInline, pairCards } = useMemo(() => {
    // сводка по валютам сверху (вся вкладка)
    const totalByCcy: Record<string, number> = {};
    // пары
    const map = new Map<PairKey, PairCard>();

    for (const p of allDebts) {
      totalByCcy[p.currency] = (totalByCcy[p.currency] || 0) + Math.max(0, p.amount);

      const idA = Math.min(p.from.id, p.to.id);
      const idB = Math.max(p.from.id, p.to.id);
      const key: PairKey = `${idA}-${idB}`;

      let pc = map.get(key);
      if (!pc) {
        const aUser = p.from.id === idA ? p.from : p.to;
        const bUser = p.from.id === idB ? p.from : p.to;
        pc = { a: aUser, b: bUser, toA: {}, toB: {} };
        map.set(key, pc);
      }

      // Если from -> to: кто кому
      if (p.from.id === idA && p.to.id === idB) {
        // a должен b
        pc.toB[p.currency] = (pc.toB[p.currency] || 0) + p.amount;
      } else {
        // b должен a
        pc.toA[p.currency] = (pc.toA[p.currency] || 0) + p.amount;
      }
    }

    const allSummaryInline = totalsToInline(totalByCcy, locale);
    const pairCards = Array.from(map.values()).sort((x, y) => {
      const sum = (r: Record<string, number>) => Object.values(r).reduce((s, v) => s + v, 0);
      const yTotal = sum(y.toA) + sum(y.toB);
      const xTotal = sum(x.toA) + sum(x.toB);
      return yTotal - xTotal;
    });

    return { allSummaryInline, pairCards };
  }, [allDebts, locale]);

  /* стили кнопок (без подписей) */
  const btn =
    "h-8 w-9 rounded-xl active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105 flex items-center justify-center";

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

              {/* Итоги / пустое состояние */}
              {leftTotalsInline ? (
                <div
                  className="mb-2 overflow-x-auto no-scrollbar"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    color: "var(--tg-text-color)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {leftTotalsInline}
                </div>
              ) : (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {t("group_balance_no_debts_left")}
                </div>
              )}

              {leftCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{/* пусто */}</div>
              ) : (
                <div className="grid gap-2">
                  {leftCards.map((card) => {
                    const id = card.user.id;
                    const isExpanded = expandedLeft.has(id);
                    const totalLines = card.lines.length;
                    const visCollapsed = Math.min(2, totalLines);
                    const linesVisible = isExpanded ? totalLines : visCollapsed;
                    return (
                      <div
                        key={id + "-L"}
                        className="relative rounded-xl border p-2"
                        style={{
                          borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                          background: "var(--tg-card-bg)",
                        }}
                      >
                        {/* шапка карточки: аватар + имя */}
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                          <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                            {firstOnly(card.user)}
                          </div>
                        </div>

                        {/* строки валют: левая колонка (суммы + стрелка вправо), правая колонка — кнопки для каждой строки */}
                        <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                          {/* СУММЫ */}
                          <div
                            className="flex flex-col"
                            style={{
                              gap: V_GAP,
                              // базовая высота под видимые строки; остальное доберётся естественно
                              minHeight: heightFor(linesVisible),
                            }}
                          >
                            {(isExpanded ? card.lines : card.lines.slice(0, 2)).map((ln, i) => (
                              <div
                                key={id + "-L-" + ln.currency + "-" + i}
                                className="flex items-center gap-2 text-[14px] font-semibold"
                                style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                              >
                                <ArrowRight size={16} />
                                {fmtNoTrailing(ln.amount, ln.currency, locale)}
                              </div>
                            ))}
                          </div>

                          {/* КНОПКИ — для каждой видимой строки */}
                          <div
                            className="flex flex-col items-end"
                            style={{
                              gap: V_GAP,
                              minHeight: heightFor(linesVisible),
                            }}
                          >
                            {(isExpanded ? card.lines : card.lines.slice(0, 2)).map((ln, i) => (
                              <button
                                key={id + "-L-btn-" + ln.currency + "-" + i}
                                type="button"
                                onClick={() => onRepay?.(card.user, ln.amount, ln.currency)}
                                className={btn}
                                aria-label="Settle up"
                                title="Settle up"
                              >
                                <HandCoins size={18} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* «и ещё N» (подбираем ближе к суммам) */}
                        {totalLines > 2 && (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => toggleLeft(id)}
                              className="text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {isExpanded ? "Свернуть" : `и ещё ${totalLines - 2}`}
                            </button>
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

              {/* Итоги / пустое состояние */}
              {rightTotalsInline ? (
                <div
                  className="mb-2 overflow-x-auto no-scrollbar"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    color: "var(--tg-text-color)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rightTotalsInline}
                </div>
              ) : (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {t("group_balance_no_debts_right")}
                </div>
              )}

              {rightCards.length === 0 ? (
                <div className="text-[13px] text-[var(--tg-hint-color)]">{/* пусто */}</div>
              ) : (
                <div className="grid gap-2">
                  {rightCards.map((card) => {
                    const id = card.user.id;
                    const isExpanded = expandedRight.has(id);
                    const totalLines = card.lines.length;
                    const visCollapsed = Math.min(2, totalLines);
                    const linesVisible = isExpanded ? totalLines : visCollapsed;

                    return (
                      <div
                        key={id + "-R"}
                        className="relative rounded-xl border p-2"
                        style={{
                          borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                          background: "var(--tg-card-bg)",
                        }}
                      >
                        {/* шапка карточки: аватар + имя */}
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar url={card.user.photo_url} alt={firstOnly(card.user)} />
                          <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                            {firstOnly(card.user)}
                          </div>
                        </div>

                        {/* строки валют: слева суммы + стрелка влево; справа — ОДНА кнопка по вертикальному центру видимых строк */}
                        <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                          {/* СУММЫ */}
                          <div
                            className="flex flex-col"
                            style={{
                              gap: V_GAP,
                              minHeight: heightFor(linesVisible),
                            }}
                          >
                            {(isExpanded ? card.lines : card.lines.slice(0, 2)).map((ln, i) => (
                              <div
                                key={id + "-R-" + ln.currency + "-" + i}
                                className="flex items-center gap-2 text-[14px] font-semibold"
                                style={{ color: "var(--tg-success-text,#2ecc71)" }}
                              >
                                <ArrowLeft size={16} />
                                {fmtNoTrailing(ln.amount, ln.currency, locale)}
                              </div>
                            ))}
                          </div>

                          {/* ЕДИНСТВЕННАЯ КНОПКА — по вертикальному центру видимых строк */}
                          <div
                            className="flex items-center justify-end"
                            style={{
                              minHeight: heightFor(linesVisible),
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const first = card.lines[0];
                                // всегда открываем локальную «модалку», плюс, если есть внешний обработчик — дергаем его
                                setStubOpen(true);
                                if (onRemind && first) {
                                  setTimeout(() => onRemind(card.user, first.amount, first.currency), 0);
                                }
                              }}
                              className={btn}
                              aria-label="Remind"
                              title="Remind"
                            >
                              <Bell size={18} />
                            </button>
                          </div>
                        </div>

                        {/* «и ещё N» */}
                        {totalLines > 2 && (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => toggleRight(id)}
                              className="text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {isExpanded ? "Свернуть" : `и ещё ${totalLines - 2}`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= Все балансы: сводка + карточки-пары пользователей ================= */
          <div className="flex flex-col gap-3">
            {/* Сводный горизонтальный бар валют со скроллом */}
            {allSummaryInline && (
              <div
                className="overflow-x-auto no-scrollbar px-1 py-1 rounded-lg"
                style={{
                  WebkitOverflowScrolling: "touch",
                  whiteSpace: "nowrap",
                  color: "var(--tg-text-color)",
                  border: "1px solid var(--tg-secondary-bg-color,#e7e7e7)",
                  background: "var(--tg-card-bg)",
                }}
              >
                {allSummaryInline}
              </div>
            )}

            {/* Карточки-пары */}
            {pairCards.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              pairCards.map((pair, idx) => {
                const toALines = Object.entries(pair.toA)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));
                const toBLines = Object.entries(pair.toB)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));

                // локальные раскрытия для этой карточки
                const [expA, setExpA] = useState(false);
                const [expB, setExpB] = useState(false);

                const visA = expA ? toALines.length : Math.min(2, toALines.length);
                const visB = expB ? toBLines.length : Math.min(2, toBLines.length);

                return (
                  <div
                    key={`pair-${idx}-${pair.a.id}-${pair.b.id}`}
                    className="rounded-xl border p-2"
                    style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                  >
                    {/* шапка: два аватара и имена */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar url={pair.a.photo_url} alt={firstOnly(pair.a)} size={36} />
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(pair.a)}
                      </div>
                      <span className="opacity-60 mx-1">↔</span>
                      <Avatar url={pair.b.photo_url} alt={firstOnly(pair.b)} size={36} />
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(pair.b)}
                      </div>
                    </div>

                    {/* тело: две колонки — b → a (зелёный слева), a → b (красный справа) */}
                    <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      {/* b → a (мне должны, зелёный, стрелка влево) */}
                      <div>
                        <div className="text-[12px] mb-1 opacity-80" style={{ color: "var(--tg-text-color)" }}>
                          {/* визуальная подсказка колонки, без слова «должен» */}
                          <span className="inline-flex items-center gap-1">
                            <ArrowLeft size={14} />
                            {firstOnly(pair.b)} → {firstOnly(pair.a)}
                          </span>
                        </div>
                        <div className="flex flex-col" style={{ gap: V_GAP }}>
                          {(expA ? toALines : toALines.slice(0, 2)).map(([ccy, sum]) => (
                            <div
                              key={`toA-${ccy}`}
                              className="flex items-center gap-2 text-[14px] font-semibold"
                              style={{ color: "var(--tg-success-text,#2ecc71)" }}
                            >
                              <ArrowLeft size={16} />
                              {fmtNoTrailing(sum, ccy, locale)}
                            </div>
                          ))}
                          {toALines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setExpA(!expA)}
                              className="self-start text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {expA ? "Свернуть" : `и ещё ${toALines.length - 2}`}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* a → b (я должен, красный, стрелка вправо) */}
                      <div>
                        <div className="text-[12px] mb-1 opacity-80" style={{ color: "var(--tg-text-color)" }}>
                          <span className="inline-flex items-center gap-1">
                            <ArrowRight size={14} />
                            {firstOnly(pair.a)} → {firstOnly(pair.b)}
                          </span>
                        </div>
                        <div className="flex flex-col" style={{ gap: V_GAP }}>
                          {(expB ? toBLines : toBLines.slice(0, 2)).map(([ccy, sum]) => (
                            <div
                              key={`toB-${ccy}`}
                              className="flex items-center gap-2 text-[14px] font-semibold"
                              style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                            >
                              <ArrowRight size={16} />
                              {fmtNoTrailing(sum, ccy, locale)}
                            </div>
                          ))}
                          {toBLines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setExpB(!expB)}
                              className="self-start text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {expB ? "Свернуть" : `и ещё ${toBLines.length - 2}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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
            <div className="text-[15px] font-semibold mb-2">{t("remind_debt") || "Напомнить"}</div>
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

/* ===== (вспомогательное) скрываем нативный скроллбар по возможности ===== */
declare global {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
