// src/components/group/GroupBalanceTabSmart.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell, ArrowLeft, ArrowRight } from "lucide-react";

/* ===== Types ===== */
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

  /** опционально — если передан, на вкладке «Все балансы» покажем кнопки напротив соответствующих сумм */
  currentUserId?: number;
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

/* ---------- helpers ---------- */
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
  currentUserId,
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
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedLeft(s);
  };
  const toggleRight = (id: number) => {
    const s = new Set(expandedRight);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedRight(s);
  };

  // параметры высот
  const LINE_H = 22; // px на строку суммы
  const V_GAP = 6; // вертикальный гап между строками
  const visibleCount = (total: number, expanded: boolean) => (expanded ? total : Math.min(2, total));
  const heightFor = (vis: number) => (vis > 0 ? vis * LINE_H + (vis - 1) * V_GAP : 0);

  /* ======================= ВСЕ БАЛАНСЫ ======================= */
  type PairKey = string; // `${minId}-${maxId}`
  type PairCard = {
    a: User; // id меньше — A
    b: User; // второй — B
    toA: Record<string, number>; // B должен A (зелёный ←)
    toB: Record<string, number>; // A должен B (красный →)
  };

  const pairCards = useMemo(() => {
    const map = new Map<PairKey, PairCard>();

    for (const p of allDebts) {
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

      if (p.from.id === idA && p.to.id === idB) {
        // A -> B : A должен B
        pc.toB[p.currency] = (pc.toB[p.currency] || 0) + p.amount;
      } else {
        // B -> A : B должен A
        pc.toA[p.currency] = (pc.toA[p.currency] || 0) + p.amount;
      }
    }

    // сортировка пар по суммарному объёму
    const arr = Array.from(map.values()).sort((x, y) => {
      const sum = (r: Record<string, number>) => Object.values(r).reduce((s, v) => s + v, 0);
      return (sum(y.toA) + sum(y.toB)) - (sum(x.toA) + sum(x.toB));
    });
    return arr;
  }, [allDebts]);

  // развороты по столбцам для пар — вынесены наружу (без хуков внутри map)
  const [expandedPairsA, setExpandedPairsA] = useState<Set<string>>(() => new Set()); // b->a (зелёный)
  const [expandedPairsB, setExpandedPairsB] = useState<Set<string>>(() => new Set()); // a->b (красный)
  const togglePairA = (key: string) => {
    const s = new Set(expandedPairsA);
    s.has(key) ? s.delete(key) : s.add(key);
    setExpandedPairsA(s);
  };
  const togglePairB = (key: string) => {
    const s = new Set(expandedPairsB);
    s.has(key) ? s.delete(key) : s.add(key);
    setExpandedPairsB(s);
  };

  /* стили кнопок (без подписей) */
  const btn =
    "h-8 w-9 rounded-xl active:scale-95 transition " +
    "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
    "hover:brightness-105 flex items-center justify-center";

  /* ===== РЕНДЕР ===== */
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
          /* ================= Мой баланс (две колонки, парное выравнивание) ================= */
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Левая колонка — Я должен */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("i_owe") || "Я должен"}
              </div>

              {/* Итоги / пустое состояние — со старым градиентом и маленьким шрифтом (только здесь) */}
              {leftTotalsInline ? (
                <div
                  className="mb-2 overflow-x-auto no-scrollbar text-[12px]"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    color: "var(--tg-hint-color)",
                    whiteSpace: "nowrap",
                    // мягкий фейд по краям
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
                    maskImage:
                      "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
                  }}
                >
                  {leftTotalsInline}
                </div>
              ) : (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {t("group_balance_no_debts_left")}
                </div>
              )}

              {/* парная сетка с правой колонкой */}
              {(() => {
                // строим пары по индексу
                const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
                const maxLen = Math.max(leftCards.length, rightCards.length);
                for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });

                return rows.length === 0 ? (
                  <div className="text-[13px] text-[var(--tg-hint-color)]" />
                ) : (
                  rows.map(({ left, right }, rowIdx) => {
                    // вычисляем видимую высоту пары в СВЁРНУТОМ состоянии
                    const leftId = left?.user.id;
                    const rightId = right?.user.id;
                    const leftTotal = left?.lines.length || 0;
                    const rightTotal = right?.lines.length || 0;

                    const leftIsExpanded = !!(leftId && expandedLeft.has(leftId));
                    const rightIsExpanded = !!(rightId && expandedRight.has(rightId));

                    const leftVisibleCollapsed = Math.min(2, leftTotal);
                    const rightVisibleCollapsed = Math.min(2, rightTotal);

                    const leftVisible = leftIsExpanded ? leftTotal : leftVisibleCollapsed;
                    const rightVisible = rightIsExpanded ? rightTotal : rightVisibleCollapsed;

                    const bothCollapsed = !leftIsExpanded && !rightIsExpanded;
                    const pairVisible = Math.max(leftVisible, rightVisible); // для аккуратной сетки
                    const pairMinH = heightFor(pairVisible);

                    // выравнивание колонок сумм внутри пары: центрируем ту, где видимых строк меньше (только когда обе свёрнуты)
                    const leftJustify =
                      bothCollapsed && leftVisible < rightVisible ? "center" : "flex-start";
                    const rightJustify =
                      bothCollapsed && rightVisible < leftVisible ? "center" : "flex-start";

                    // для режима «одна раскрыта» сосед фиксируем по collapsedHeight
                    const leftMinH = bothCollapsed
                      ? pairMinH
                      : leftIsExpanded
                      ? undefined
                      : heightFor(leftVisibleCollapsed);
                    const rightMinH = bothCollapsed
                      ? pairMinH
                      : rightIsExpanded
                      ? undefined
                      : heightFor(rightVisibleCollapsed);

                    return (
                      <div
                        key={`row-${rowIdx}`}
                        className="grid gap-2"
                        style={{ gridTemplateColumns: "1fr 1fr" }}
                      >
                        {/* LEFT CARD */}
                        {left ? (
                          <div
                            className="relative rounded-xl border p-2"
                            style={{
                              borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                              background: "var(--tg-card-bg)",
                            }}
                          >
                            {/* шапка карточки */}
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} />
                              <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                                {firstOnly(left.user)}
                              </div>
                            </div>

                            {/* суммы + кнопки (каждой видимой строке — своя кнопка), стрелка вправо красная */}
                            <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                              <div
                                className="flex flex-col"
                                style={{
                                  gap: V_GAP,
                                  minHeight: leftMinH,
                                  justifyContent: leftJustify as any,
                                }}
                              >
                                {(leftIsExpanded ? left.lines : left.lines.slice(0, 2)).map((ln, i) => (
                                  <div
                                    key={`L-${left.user.id}-${ln.currency}-${i}`}
                                    className="flex items-center gap-2 text-[14px] font-semibold"
                                    style={{ color: "var(--tg-destructive-text,#ff5a5f)" }}
                                  >
                                    <ArrowRight size={16} />
                                    {fmtNoTrailing(ln.amount, ln.currency, locale)}
                                  </div>
                                ))}
                              </div>
                              <div
                                className="flex flex-col items-end"
                                style={{ gap: V_GAP, minHeight: leftMinH, justifyContent: leftJustify as any }}
                              >
                                {(leftIsExpanded ? left.lines : left.lines.slice(0, 2)).map((ln, i) => (
                                  <button
                                    key={`L-btn-${left.user.id}-${ln.currency}-${i}`}
                                    type="button"
                                    onClick={() => onRepay?.(left.user, ln.amount, ln.currency)}
                                    className={btn}
                                    aria-label={t("repay_debt") as string}
                                    title={t("repay_debt") as string}
                                  >
                                    <HandCoins size={18} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* «и ещё N» — близко к сумме */}
                            {left.lines.length > 2 && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleLeft(left.user.id)}
                                  className="text-[12px] opacity-80 hover:opacity-100 underline"
                                  style={{ color: "var(--tg-text-color)" }}
                                >
                                  {leftIsExpanded ? "Свернуть" : `и ещё ${left.lines.length - 2}`}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div /> // НЕТ пустой рамки-заглушки!
                        )}

                        {/* RIGHT CARD */}
                        {right ? (
                          <div
                            className="relative rounded-xl border p-2"
                            style={{
                              borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                              background: "var(--tg-card-bg)",
                            }}
                          >
                            {/* шапка карточки */}
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} />
                              <div className="text-[14px] font-medium" style={{ color: "var(--tg-text-color)" }}>
                                {firstOnly(right.user)}
                              </div>
                            </div>

                            {/* суммы + ОДНА кнопка «Напомнить» по центру видимых строк, стрелка влево зелёная */}
                            <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                              <div
                                className="flex flex-col"
                                style={{
                                  gap: V_GAP,
                                  minHeight: rightMinH,
                                  justifyContent: rightJustify as any,
                                }}
                              >
                                {(rightIsExpanded ? right.lines : right.lines.slice(0, 2)).map((ln, i) => (
                                  <div
                                    key={`R-${right.user.id}-${ln.currency}-${i}`}
                                    className="flex items-center gap-2 text-[14px] font-semibold"
                                    style={{ color: "var(--tg-success-text,#2ecc71)" }}
                                  >
                                    <ArrowLeft size={16} />
                                    {fmtNoTrailing(ln.amount, ln.currency, locale)}
                                  </div>
                                ))}
                              </div>
                              <div
                                className="flex items-center justify-end"
                                style={{ minHeight: rightMinH }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const first = right.lines[0];
                                    setStubOpen(true);
                                    if (onRemind && first) {
                                      setTimeout(() => onRemind(right.user, first.amount, first.currency), 0);
                                    }
                                  }}
                                  className={btn}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
                                </button>
                              </div>
                            </div>

                            {/* «и ещё N» */}
                            {right.lines.length > 2 && (
                              <div className="mt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleRight(right.user.id)}
                                  className="text-[12px] opacity-80 hover:opacity-100 underline"
                                  style={{ color: "var(--tg-text-color)" }}
                                >
                                  {rightIsExpanded ? "Свернуть" : `и ещё ${right.lines.length - 2}`}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    );
                  })
                );
              })()}
            </div>

            {/* Правая колонка — заголовок, итоги и сами карточки уже рендерятся в составе пар (выше) */}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                {t("they_owe_me") || "Мне должны"}
              </div>

              {/* Итоги / пустое состояние — со старым градиентом и маленьким шрифтом (только здесь) */}
              {rightTotalsInline ? (
                <div
                  className="mb-2 overflow-x-auto no-scrollbar text-[12px]"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    color: "var(--tg-hint-color)",
                    whiteSpace: "nowrap",
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
                    maskImage:
                      "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
                  }}
                >
                  {rightTotalsInline}
                </div>
              ) : (
                <div className="text-[12px] mb-2" style={{ color: "var(--tg-hint-color)" }}>
                  {t("group_balance_no_debts_right")}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= Все балансы (по парам пользователей, без верхнего скролла) ================= */
          <div className="flex flex-col gap-3">
            {pairCards.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              pairCards.map((pair) => {
                const pairKey = `${pair.a.id}-${pair.b.id}`;

                const toALines = Object.entries(pair.toA)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));
                const toBLines = Object.entries(pair.toB)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));

                const aExpanded = expandedPairsA.has(pairKey);
                const bExpanded = expandedPairsB.has(pairKey);

                const aShow = aExpanded ? toALines : toALines.slice(0, 2);
                const bShow = bExpanded ? toBLines : toBLines.slice(0, 2);

                // хелперы для кнопок по участию «я»
                const amA = currentUserId === pair.a.id;
                const amB = currentUserId === pair.b.id;

                return (
                  <div
                    key={pairKey}
                    className="rounded-xl border p-2"
                    style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                  >
                    {/* Строка 1: аватар A, имя A, большая двусторонняя стрелка, аватар B, имя B */}
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar url={pair.a.photo_url} alt={firstOnly(pair.a)} size={36} />
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(pair.a)}
                      </div>
                      <div className="mx-1 opacity-75 flex items-center">
                        {/* крупнее, чем раньше */}
                        <ArrowLeft size={20} />
                        <ArrowRight size={20} />
                      </div>
                      <Avatar url={pair.b.photo_url} alt={firstOnly(pair.b)} size={36} />
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }}>
                        {firstOnly(pair.b)}
                      </div>
                    </div>

                    {/* Строка 2 (заголовки столбцов): 
                        Col1: B (должен) → A (красный контекст считает B должником)
                        Col2: A (должен) → B (красный контекст считает A должником)
                    */}
                    <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="text-[12px]" style={{ color: "var(--tg-text-color)" }}>
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">{firstOnly(pair.b)}</span>
                          <ArrowRight size={14} />
                          <span className="font-medium">{firstOnly(pair.a)}</span>
                        </span>
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--tg-text-color)" }}>
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">{firstOnly(pair.a)}</span>
                          <ArrowRight size={14} />
                          <span className="font-medium">{firstOnly(pair.b)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Суммы: 
                        Col1 — зелёные (B → A), кнопки:
                          - если я = A (кредитор), одна кнопка «Напомнить» по центру видимых строк
                          - если я = B (должник), у каждой строки своя «Рассчитаться»
                        Col2 — красные (A → B), кнопки:
                          - если я = B (кредитор), одна «Напомнить»
                          - если я = A (должник), у каждой строки «Рассчитаться»
                    */}
                    <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      {/* COL 1: B -> A (зелёные) */}
                      <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                        <div className="flex flex-col" style={{ gap: 6 }}>
                          {aShow.map(([ccy, sum]) => (
                            <div
                              key={`toA-${pairKey}-${ccy}`}
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
                              onClick={() => togglePairA(pairKey)}
                              className="self-start text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {aExpanded ? "Свернуть" : `и ещё ${toALines.length - 2}`}
                            </button>
                          )}
                        </div>
                        {/* Кнопки (если знаем меня) */}
                        {currentUserId && (amA || amB) ? (
                          amA ? (
                            // я кредитор -> одна кнопка «Напомнить» по центру видимых строк
                            <div
                              className="flex items-center justify-end"
                              style={{ minHeight: heightFor(Math.min(2, toALines.length)) }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  // открываем stub, и если есть обработчик — дергаем его по первой строке
                                  setStubOpen(true);
                                  if (onRemind && toALines[0]) {
                                    const [ccy, sum] = toALines[0];
                                    setTimeout(() => onRemind(pair.b, sum, ccy), 0);
                                  }
                                }}
                                className={btn}
                                aria-label={t("remind_debt") as string}
                                title={t("remind_debt") as string}
                              >
                                <Bell size={18} />
                              </button>
                            </div>
                          ) : (
                            // я должник (B) -> у каждой строки своя кнопка «Рассчитаться»
                            <div className="flex flex-col items-end" style={{ gap: 6 }}>
                              {aShow.map(([ccy, sum]) => (
                                <button
                                  key={`toA-btn-${pairKey}-${ccy}`}
                                  type="button"
                                  onClick={() => onRepay?.(pair.a, sum, ccy)}
                                  className={btn}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          <div />
                        )}
                      </div>

                      {/* COL 2: A -> B (красные) */}
                      <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 8 }}>
                        <div className="flex flex-col" style={{ gap: 6 }}>
                          {bShow.map(([ccy, sum]) => (
                            <div
                              key={`toB-${pairKey}-${ccy}`}
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
                              onClick={() => togglePairB(pairKey)}
                              className="self-start text-[12px] opacity-80 hover:opacity-100 underline"
                              style={{ color: "var(--tg-text-color)" }}
                            >
                              {bExpanded ? "Свернуть" : `и ещё ${toBLines.length - 2}`}
                            </button>
                          )}
                        </div>
                        {/* Кнопки (если знаем меня) */}
                        {currentUserId && (amA || amB) ? (
                          amB ? (
                            // я кредитор (B) -> одна «Напомнить»
                            <div
                              className="flex items-center justify-end"
                              style={{ minHeight: heightFor(Math.min(2, toBLines.length)) }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setStubOpen(true);
                                  if (onRemind && toBLines[0]) {
                                    const [ccy, sum] = toBLines[0];
                                    setTimeout(() => onRemind(pair.a, sum, ccy), 0);
                                  }
                                }}
                                className={btn}
                                aria-label={t("remind_debt") as string}
                                title={t("remind_debt") as string}
                              >
                                <Bell size={18} />
                              </button>
                            </div>
                          ) : (
                            // я должник (A) -> у каждой строки «Рассчитаться»
                            <div className="flex flex-col items-end" style={{ gap: 6 }}>
                              {bShow.map(([ccy, sum]) => (
                                <button
                                  key={`toB-btn-${pairKey}-${ccy}`}
                                  type="button"
                                  onClick={() => onRepay?.(pair.b, sum, ccy)}
                                  className={btn}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          <div />
                        )}
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
