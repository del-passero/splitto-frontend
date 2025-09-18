// src/components/group/GroupBalanceTabSmart.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HandCoins,
  Bell,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
} from "lucide-react";
import { useUserStore } from "../../store/userStore";

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

function Avatar({
  url,
  alt,
  size = 56,
}: {
  url?: string;
  alt?: string;
  size?: number;
}) {
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

/* ===== Общее оформление кнопок ===== */
const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
  "hover:brightness-105";

/* ===== Константы компоновки строк сумм ===== */
const LINE_H = 22; // высота строки суммы (px)
const V_GAP = 6; // вертикальный отступ между строками (px)

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // сейчас не используем в UI
  myDebts,
  allDebts,
  loading,
  onFabClick,
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const me = useUserStore((s) => s.user);
  const myId = Number(me?.id) || 0;

  const [tab, setTab] = useState<"mine" | "all">("mine");

  // локальная заглушка для «Напомнить» (если внешний обработчик не передали — всё равно открываем)
  const [stubOpen, setStubOpen] = useState(false);

  /* ---------- Мой баланс: подготовка данных ---------- */
  const {
    leftCards,
    rightCards,
    leftTotalsInline,
    rightTotalsInline,
  }: {
    leftCards: CardItem[];
    rightCards: CardItem[];
    leftTotalsInline: string;
    rightTotalsInline: string;
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
    const sortLines = (a: CurrencyLine, b: CurrencyLine) =>
      a.currency.localeCompare(b.currency);

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

  // свернуто/развернуто для карточек «Мой баланс» (по user.id и стороне)
  const [expandedMine, setExpandedMine] = useState<{
    left: Record<number, boolean>;
    right: Record<number, boolean>;
  }>({ left: {}, right: {} });

  const toggleMine = (side: "left" | "right", uid: number) =>
    setExpandedMine((s) => ({
      ...s,
      [side]: { ...s[side], [uid]: !s[side][uid] },
    }));

  // пары для «Мой баланс»: индексами выравниваем по строкам
  const mineRows = useMemo(() => {
    const maxLen = Math.max(leftCards.length, rightCards.length);
    const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
    for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });
    return rows;
  }, [leftCards, rightCards]);

  /* ---------- Все балансы: агрегирование по парам и валютам ---------- */
  type PairKey = string; // "minId-maxId"
  type SumMap = Record<string, number>; // currency -> amount
  type PairCard = {
    u1: User; // левый в заголовке
    u2: User; // правый в заголовке
    left: SumMap; // долги u1 -> u2 (u1 должник)
    right: SumMap; // долги u2 -> u1 (u2 должник)
  };

  const allPairs: PairCard[] = useMemo(() => {
    const byPair = new Map<PairKey, PairCard>();

    for (const p of allDebts) {
      const a = p.from;
      const b = p.to;
      // фиксируем порядок (левый — с меньшим id), но направления сумм учитываем отдельно
      const [minU, maxU] = a.id <= b.id ? [a, b] : [b, a];
      const key: PairKey = `${minU.id}-${maxU.id}`;
      if (!byPair.has(key)) {
        byPair.set(key, { u1: minU, u2: maxU, left: {}, right: {} });
      }
      const card = byPair.get(key)!;
      if (a.id === card.u1.id && b.id === card.u2.id) {
        // долг u1 -> u2
        card.left[p.currency] = (card.left[p.currency] || 0) + p.amount;
      } else {
        // долг u2 -> u1
        card.right[p.currency] = (card.right[p.currency] || 0) + p.amount;
      }
    }

    // сортировка по сумме по убыванию (берём max из левого/правого total)
    const total = (m: SumMap) => Object.values(m).reduce((s, v) => s + v, 0);
    return Array.from(byPair.values()).sort(
      (A, B) => Math.max(total(B.left), total(B.right)) - Math.max(total(A.left), total(A.right))
    );
  }, [allDebts]);

  // свернуто/развернуто для колонок пары (All)
  const [expandedAll, setExpandedAll] = useState<Record<PairKey, { left: boolean; right: boolean }>>({});
  const toggleAll = (key: PairKey, side: "left" | "right") =>
    setExpandedAll((s) => ({ ...s, [key]: { left: !!s[key]?.left, right: !!s[key]?.right, [side]: !s[key]?.[side] } }));

  /* ===== Общий UI-кусок: строчка валюты с суммой и стрелкой ===== */
  const DebtLine = ({
    amount,
    currency,
    color, // "red" | "green"
    arrow, // "left" | "right"
    locale,
  }: {
    amount: number;
    currency: string;
    color: "red" | "green";
    arrow: "left" | "right";
    locale: string;
  }) => {
    const isRed = color === "red";
    const col = isRed ? "var(--tg-destructive-text,#ff5a5f)" : "var(--tg-success-text,#2ecc71)";
    return (
      <div className="flex items-center gap-1">
        {arrow === "left" ? (
          <ArrowLeft size={14} style={{ color: col }} />
        ) : (
          <ArrowRight size={14} style={{ color: col }} />
        )}
        <span className="text-[14px] font-semibold" style={{ color: col }}>
          {fmtNoTrailing(amount, currency, locale)}
        </span>
      </div>
    );
  };

  /* ===== Верхняя полоска итогов (Mine): скролл + фейд градиенты ===== */
  const TotalsScroller = ({ text }: { text: string }) => {
    if (!text) return null;
    return (
      <div className="relative mb-2">
        {/* фейды слева/справа */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-6"
          style={{
            background:
              "linear-gradient(to right, var(--tg-bg-color,transparent) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-6"
          style={{
            background:
              "linear-gradient(to left, var(--tg-bg-color,transparent) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="overflow-x-auto no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="inline-block whitespace-nowrap text-[12px]"
            style={{ color: "var(--tg-hint-color)" }}
          >
            {text}
          </div>
        </div>
      </div>
    );
  };

  /* ===== Разметка ===== */
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

      {/* Контент */}
      <div className="px-2 py-2">
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">
            {t("loading")}
          </div>
        ) : tab === "mine" ? (
          /* ================= Мой баланс: две колонки ================= */
          <div>
            {/* Заголовки + итоги со скроллом и фейдом */}
            <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--tg-text-color)" }}
                >
                  {t("i_owe") || "Я должен"}
                </div>
                {leftCards.length === 0 ? (
                  <div className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                    {t("group_balance_no_debts_left")}
                  </div>
                ) : (
                  <TotalsScroller text={leftTotalsInline} />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--tg-text-color)" }}
                >
                  {t("they_owe_me") || "Мне должны"}
                </div>
                {rightCards.length === 0 ? (
                  <div className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                    {t("group_balance_no_debts_right")}
                  </div>
                ) : (
                  <TotalsScroller text={rightTotalsInline} />
                )}
              </div>
            </div>

            {/* Пары карточек */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {mineRows.map(({ left, right }, rowIdx) => {
                if (!left && !right) return null;

                // Состояние свёрнутости
                const Lexpanded = left ? !!expandedMine.left[left.user.id] : false;
                const Rexpanded = right ? !!expandedMine.right[right.user.id] : false;

                const Lfull = left ? left.lines.length : 0;
                const Rfull = right ? right.lines.length : 0;
                const Lvis = left ? (Lexpanded ? Lfull : Math.min(2, Lfull)) : 0;
                const Rvis = right ? (Rexpanded ? Rfull : Math.min(2, Rfull)) : 0;

                // Только когда обе карточки пары свернуты — равняем высоты
                const bothCollapsed = (!!left && !Lexpanded) && (!!right && !Rexpanded);
                const rowVisible = Math.max(Lvis, Rvis);
                const rowMinHeight = rowVisible > 0 ? rowVisible * LINE_H + (rowVisible - 1) * V_GAP : 0;

                // Для случая "одна карточка" — никакого рендера пустой рамки
                return (
                  <React.Fragment key={`row-${rowIdx}`}>
                    {/* Левая карточка */}
                    <div className="min-w-0">
                      {left ? (
                        <div
                          className="rounded-xl border p-2"
                          style={{
                            borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                            background: "var(--tg-card-bg)",
                          }}
                        >
                          {/* шапка */}
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(left.user)}
                            >
                              {firstOnly(left.user)}
                            </div>
                          </div>

                          {/* суммы */}
                          <div
                            className="flex flex-col gap-[6px]"
                            style={{
                              minHeight:
                                bothCollapsed
                                  ? rowMinHeight
                                  : Math.min(2, Lfull) * LINE_H +
                                    (Math.min(2, Lfull) - 1) * V_GAP,
                              justifyContent:
                                bothCollapsed && Lvis < Rvis ? "center" : "flex-start",
                            }}
                          >
                            {(left.lines.slice(0, Lexpanded ? Lfull : Math.min(2, Lfull))).map((ln, i) => (
                              <div
                                key={`L-${left.user.id}-${ln.currency}-${i}`}
                                className="grid items-center"
                                style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                              >
                                <DebtLine
                                  amount={ln.amount}
                                  currency={ln.currency}
                                  color="red"
                                  arrow="right"
                                  locale={locale}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRepay?.(left.user, ln.amount, ln.currency)
                                  }
                                  className={btn3D}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              </div>
                            ))}
                            {Lfull > 2 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleMine("left", left.user.id)}
                                  className="text-[12px] opacity-80 hover:opacity-100"
                                  style={{ color: "var(--tg-hint-color)" }}
                                >
                                  {Lexpanded
                                    ? t("close") || "Свернуть"
                                    : `${t("all") || "ВСЕ"} · +${Lfull - 2}`}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Правая карточка */}
                    <div className="min-w-0">
                      {right ? (
                        <div
                          className="rounded-xl border p-2"
                          style={{
                            borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                            background: "var(--tg-card-bg)",
                          }}
                        >
                          {/* шапка */}
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(right.user)}
                            >
                              {firstOnly(right.user)}
                            </div>
                          </div>

                          {/* две колонки: суммы и вертикальная колонка с кнопкой «Напомнить» */}
                          <div
                            className="grid"
                            style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                          >
                            <div
                              className="flex flex-col gap-[6px]"
                              style={{
                                minHeight:
                                  bothCollapsed
                                    ? rowMinHeight
                                    : Math.min(2, Rfull) * LINE_H +
                                      (Math.min(2, Rfull) - 1) * V_GAP,
                                justifyContent:
                                  bothCollapsed && Rvis < Lvis ? "center" : "flex-start",
                              }}
                            >
                              {(right.lines.slice(0, Rexpanded ? Rfull : Math.min(2, Rfull))).map(
                                (ln, i) => (
                                  <div
                                    key={`R-${right.user.id}-${ln.currency}-${i}`}
                                    className="text-[14px] font-semibold"
                                    style={{ color: "var(--tg-success-text,#2ecc71)" }}
                                  >
                                    <DebtLine
                                      amount={ln.amount}
                                      currency={ln.currency}
                                      color="green"
                                      arrow="left"
                                      locale={locale}
                                    />
                                  </div>
                                )
                              )}
                              {Rfull > 2 && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleMine("right", right.user.id)}
                                    className="text-[12px] opacity-80 hover:opacity-100"
                                    style={{ color: "var(--tg-hint-color)" }}
                                  >
                                    {Rexpanded
                                      ? t("close") || "Свернуть"
                                      : `${t("all") || "ВСЕ"} · +${Rfull - 2}`}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* колонка с «Напомнить» по вертикальному центру видимых строк */}
                            <div
                              className="flex items-center justify-end"
                              style={{
                                minHeight:
                                  (Rexpanded ? Rfull : Math.min(2, Rfull)) * LINE_H +
                                  ((Rexpanded ? Rfull : Math.min(2, Rfull)) - 1) * V_GAP,
                              }}
                            >
                              {Rfull > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStubOpen(true);
                                    if (onRemind) {
                                      const ln = right.lines[0];
                                      setTimeout(
                                        () => onRemind(right.user, ln.amount, ln.currency),
                                        0
                                      );
                                    }
                                  }}
                                  className={btn3D}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= Все балансы: карточки-пары пользователей ================= */
          <div className="flex flex-col gap-2">
            {allPairs.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              allPairs.map((pair) => {
                const key: PairKey = `${pair.u1.id}-${pair.u2.id}`;
                const leftEntries = Object.entries(pair.left).sort((a, b) =>
                  a[0].localeCompare(b[0])
                );
                const rightEntries = Object.entries(pair.right).sort((a, b) =>
                  a[0].localeCompare(b[0])
                );
                const Lfull = leftEntries.length;
                const Rfull = rightEntries.length;
                const Lexp = !!expandedAll[key]?.left;
                const Rexp = !!expandedAll[key]?.right;
                const Lvis = Lexp ? Lfull : Math.min(2, Lfull);
                const Rvis = Rexp ? Rfull : Math.min(2, Rfull);

                // Кнопки: если я должник — «Рассчитаться» в своем столбце, если кредитор — одна «Напомнить» по центру столбца
                const iAmU1 = myId === pair.u1.id;
                const iAmU2 = myId === pair.u2.id;

                // Для вертикального центрирования «Напомнить» — min-height видимых строк конкретного столбца.
                const minHLeft = Lvis * LINE_H + (Lvis - 1) * V_GAP;
                const minHRight = Rvis * LINE_H + (Rvis - 1) * V_GAP;

                return (
                  <div
                    key={key}
                    className="rounded-xl border p-2"
                    style={{
                      borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                      background: "var(--tg-card-bg)",
                    }}
                  >
                    {/* Заголовок пары */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar url={pair.u1.photo_url} alt={firstOnly(pair.u1)} size={40} />
                        <div
                          className="text-[14px] font-medium truncate"
                          style={{ color: "var(--tg-text-color)" }}
                          title={firstOnly(pair.u1)}
                        >
                          {firstOnly(pair.u1)}
                        </div>
                      </div>
                      <ArrowLeftRight size={20} style={{ opacity: 0.7, color: "var(--tg-hint-color)" }} />
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar url={pair.u2.photo_url} alt={firstOnly(pair.u2)} size={40} />
                        <div
                          className="text-[14px] font-medium truncate"
                          style={{ color: "var(--tg-text-color)" }}
                          title={firstOnly(pair.u2)}
                        >
                          {firstOnly(pair.u2)}
                        </div>
                      </div>
                    </div>

                    {/* Две колонки: левый столбец = u1->u2 (красный, →), правый столбец = u2->u1 (зелёный, ←) */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      {/* Левый столбец (u1 должник) */}
                      <div className="min-w-0">
                        <div
                          className="flex flex-col gap-[6px]"
                          style={{ minHeight: minHLeft, justifyContent: "flex-start" }}
                        >
                          {(leftEntries.slice(0, Lvis)).map(([ccy, amt], i) => (
                            <div
                              key={`pair-${key}-L-${ccy}-${i}`}
                              className="grid items-center"
                              style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                            >
                              <DebtLine
                                amount={amt}
                                currency={ccy}
                                color="red"
                                arrow="right"
                                locale={locale}
                              />
                              {iAmU1 ? (
                                <button
                                  type="button"
                                  onClick={() => onRepay?.(pair.u2, amt, ccy)}
                                  className={btn3D}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {Lfull > 2 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleAll(key, "left")}
                                className="text-[12px] opacity-80 hover:opacity-100"
                                style={{ color: "var(--tg-hint-color)" }}
                              >
                                {Lexp
                                  ? t("close") || "Свернуть"
                                  : `${t("all") || "ВСЕ"} · +${Lfull - 2}`}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Если я кредитор (u2) — одна кнопка «Напомнить» по центру видимых строк левого столбца */}
                        {iAmU2 && Lvis > 0 && (
                          <div
                            className="flex items-center mt-2"
                            style={{ minHeight: 0 }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setStubOpen(true);
                                // по смыслу напоминаем должнику u1 по первой строке
                                if (onRemind && leftEntries[0]) {
                                  const [ccy, amt] = leftEntries[0];
                                  setTimeout(() => onRemind(pair.u1, amt, ccy), 0);
                                }
                              }}
                              className={btn3D}
                              aria-label={t("remind_debt") as string}
                              title={t("remind_debt") as string}
                            >
                              <Bell size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Правый столбец (u2 должник) */}
                      <div className="min-w-0">
                        <div
                          className="flex flex-col gap-[6px]"
                          style={{ minHeight: minHRight, justifyContent: "flex-start" }}
                        >
                          {(rightEntries.slice(0, Rvis)).map(([ccy, amt], i) => (
                            <div
                              key={`pair-${key}-R-${ccy}-${i}`}
                              className="grid items-center"
                              style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                            >
                              <DebtLine
                                amount={amt}
                                currency={ccy}
                                color="green"
                                arrow="left"
                                locale={locale}
                              />
                              {iAmU2 ? (
                                <button
                                  type="button"
                                  onClick={() => onRepay?.(pair.u1, amt, ccy)}
                                  className={btn3D}
                                  aria-label={t("repay_debt") as string}
                                  title={t("repay_debt") as string}
                                >
                                  <HandCoins size={18} />
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {Rfull > 2 && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => toggleAll(key, "right")}
                                className="text-[12px] opacity-80 hover:opacity-100"
                                style={{ color: "var(--tg-hint-color)" }}
                              >
                                {Rexp
                                  ? t("close") || "Свернуть"
                                  : `${t("all") || "ВСЕ"} · +${Rfull - 2}`}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Если я кредитор (u1) — одна кнопка «Напомнить» по центру видимых строк правого столбца */}
                        {iAmU1 && Rvis > 0 && (
                          <div
                            className="flex items-center mt-2"
                            style={{ minHeight: 0 }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setStubOpen(true);
                                if (onRemind && rightEntries[0]) {
                                  const [ccy, amt] = rightEntries[0];
                                  setTimeout(() => onRemind(pair.u2, amt, ccy), 0);
                                }
                              }}
                              className={btn3D}
                              aria-label={t("remind_debt") as string}
                              title={t("remind_debt") as string}
                            >
                              <Bell size={18} />
                            </button>
                          </div>
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
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center"
          onClick={() => setStubOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-semibold mb-2">
              {t("remind_debt")}
            </div>
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
