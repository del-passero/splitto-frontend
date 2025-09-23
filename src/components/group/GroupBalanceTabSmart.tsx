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

/** Формат «1 234.50 USD», автоматически скрывает .00 и уважает валюты без копеек */
const nbsp = "\u00A0";
export function fmtAmountSmart(value: number, currency: string, locale?: string) {
  try {
    // 1) Получаем дробность валюты через currency-форматтер
    const nfCurrency = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    });
    const parts = nfCurrency.formatToParts(Math.abs(value));
    const fractionPart = parts.find((p) => p.type === "fraction");
    const hasCents = !!fractionPart && Number(fractionPart.value) !== 0;

    // 2) Форматируем как число, без символа валюты, с 0/2 знаками
    const nfNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
      useGrouping: true,
    });
    return `${nfNumber.format(value)}${nbsp}${currency}`;
  } catch {
    const rounded = Math.round(value * 100) / 100;
    const hasCents = Math.round((Math.abs(rounded) % 1) * 100) !== 0;
    return `${hasCents ? rounded.toFixed(2) : Math.trunc(rounded)}${nbsp}${currency}`;
  }
}

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

/* ---------- helpers ---------- */
type CurrencyLine = { currency: string; amount: number }; // абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

function totalsToInline(by: Record<string, number>, locale?: string) {
  const parts = Object.entries(by)
    .filter(([, sum]) => sum > 0) // [26] — исключаем нулевые
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ccy, sum]) => fmtAmountSmart(sum, ccy, locale));
  return parts.join("; ");
}

/* ===== Единый пресет для кнопок [27] ===== */
const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
  "hover:brightness-105";

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // сейчас не используем в UI
  myDebts,
  allDebts,
  loading,
  onFabClick, // [18] — больше не используем скрытую кнопку
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const me = useUserStore((s) => s.user);
  const myId = Number(me?.id) || 0;

  const [tab, setTab] = useState<"mine" | "all">("mine");

  // локальная заглушка для «Напомнить» (если внешний обработчик не передали — всё равно откроем)
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
      if (abs <= 0) continue; // [26] — исключаем нулевые
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

    const sortCards = (a: CardItem, b: CardItem) => {
      // [25] — стабильная сортировка: по total, затем по имени
      const byTotal = b.total - a.total;
      if (byTotal !== 0) return byTotal;
      return firstOnly(a.user).localeCompare(firstOnly(b.user));
    };
    const sortLines = (a: CurrencyLine, b: CurrencyLine) =>
      a.currency.localeCompare(b.currency);

    const leftCards = Array.from(leftMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.filter(l => l.amount > 0).sort(sortLines) })) // [26]
      .sort(sortCards);
    const rightCards = Array.from(rightMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.filter(l => l.amount > 0).sort(sortLines) })) // [26]
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

  // пары для «Мой баланс»: индексами выравниваем по строкам (без принудительных высот) [10]
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
      const amt = Math.abs(p.amount); // [2] — складываем по модулю
      if (amt <= 0) continue; // [26] — исключаем нулевые

      // фиксируем порядок (левый — с меньшим id), но направления сумм учитываем отдельно
      const [minU, maxU] = a.id <= b.id ? [a, b] : [b, a];
      const key: PairKey = `${minU.id}-${maxU.id}`;
      if (!byPair.has(key)) {
        byPair.set(key, { u1: minU, u2: maxU, left: {}, right: {} });
      }
      const card = byPair.get(key)!;
      if (a.id === card.u1.id && b.id === card.u2.id) {
        // долг u1 -> u2
        card.left[p.currency] = (card.left[p.currency] || 0) + amt;
      } else {
        // долг u2 -> u1
        card.right[p.currency] = (card.right[p.currency] || 0) + amt;
      }
    }

    const sum = (m: SumMap) => Object.values(m).reduce((s, v) => s + v, 0);

    // [25] — сортировка: по max(total), при равенстве — по имени пары (стабильно)
    const sorted = Array.from(byPair.values()).sort((A, B) => {
      const aSum = Math.max(sum(A.left), sum(A.right));
      const bSum = Math.max(sum(B.left), sum(B.right));
      if (bSum !== aSum) return bSum - aSum;
      const aName = `${firstOnly(A.u1)} ${firstOnly(A.u2)}`.toLowerCase();
      const bName = `${firstOnly(B.u1)} ${firstOnly(B.u2)}`.toLowerCase();
      return aName.localeCompare(bName);
    });

    return sorted;
  }, [allDebts]);

  // свернуто/развернуто для колонок пары (All)
  const [expandedAll, setExpandedAll] = useState<Record<PairKey, { left: boolean; right: boolean }>>({});
  const toggleAll = (key: PairKey, side: "left" | "right") =>
    setExpandedAll((s) => ({ ...s, [key]: { left: !!s[key]?.left, right: !!s[key]?.right, [side]: !s[key]?.[side] } }));

  /* ===== Общий UI-кусок: строчка валюты с суммой и стрелкой ===== */
  const DebtLine = React.memo(({
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
    const col = isRed ? "var(--tg-destructive-text,#d7263d)" : "var(--tg-success-text,#1aab55)";
    const Icon = arrow === "left" ? ArrowLeft : ArrowRight;
    return (
      <div className="flex items-center gap-1">
        <Icon size={14} style={{ color: col }} aria-hidden />
        <span className="text-[14px] font-semibold" style={{ color: col }}>
          {fmtAmountSmart(amount, currency, locale)}
        </span>
      </div>
    );
  });

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
    <div className="w-full select-none" style={{ WebkitTapHighlightColor: "transparent" }}>
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
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mb-1">
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

            {/* Пары карточек: адаптивная сетка [9], без принудительного выравнивания [10] */}
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {mineRows.map(({ left, right }, rowIdx) => {
                if (!left && !right) return null;

                const Lexpanded = left ? !!expandedMine.left[left.user.id] : false;
                const Rexpanded = right ? !!expandedMine.right[right.user.id] : false;

                const Lfull = left ? left.lines.length : 0;
                const Rfull = right ? right.lines.length : 0;

                return (
                  <React.Fragment key={`row-${rowIdx}`}>
                    {/* Левая карточка (я должен) */}
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

                          {/* суммы — [3a] кнопка в строке */}
                          <div className="flex flex-col gap-[6px]">
                            {(left.lines.slice(0, Lexpanded ? Lfull : Math.min(2, Lfull))).map(
                              (ln, i) => (
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
                                    onClick={() => onRepay?.(left.user, ln.amount, ln.currency)}
                                    className={btn3D}
                                    aria-label={t("repay_debt") as string}
                                    title={t("repay_debt") as string}
                                  >
                                    <HandCoins size={18} />
                                  </button>
                                </div>
                              )
                            )}
                            {Lfull > 2 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleMine("left", left.user.id)}
                                  className="text-[12px] opacity-80 hover:opacity-100"
                                  style={{ color: "var(--tg-hint-color)" }}
                                  aria-expanded={Lexpanded}
                                  aria-controls={`mine-left-${left.user.id}`}
                                >
                                  {Lexpanded
                                    ? t("close") || "Свернуть"
                                    : `${t("all") || "ВСЕ"} · +${Lfull - 2}`}
                                </button>
                                <div id={`mine-left-${left.user.id}`} />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Правая карточка (мне должны) */}
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

                          {/* суммы — [3a] кнопка в строке */}
                          <div className="flex flex-col gap-[6px]">
                            {(right.lines.slice(0, Rexpanded ? Rfull : Math.min(2, Rfull))).map(
                              (ln, i) => (
                                <div
                                  key={`R-${right.user.id}-${ln.currency}-${i}`}
                                  className="grid items-center"
                                  style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                                >
                                  <DebtLine
                                    amount={ln.amount}
                                    currency={ln.currency}
                                    color="green"
                                    arrow="left"
                                    locale={locale}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStubOpen(true);
                                      onRemind?.(right.user, ln.amount, ln.currency);
                                    }}
                                    className={btn3D}
                                    aria-label={t("remind_debt") as string}
                                    title={t("remind_debt") as string}
                                  >
                                    <Bell size={18} />
                                  </button>
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
                                  aria-expanded={Rexpanded}
                                  aria-controls={`mine-right-${right.user.id}`}
                                >
                                  {Rexpanded
                                    ? t("close") || "Свернуть"
                                    : `${t("all") || "ВСЕ"} · +${Rfull - 2}`}
                                </button>
                                <div id={`mine-right-${right.user.id}`} />
                              </div>
                            )}
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
                const iAmU1 = myId === pair.u1.id;
                const iAmU2 = myId === pair.u2.id;

                // entries по валютам: сорт по коду; [26] — фильтруем нули
                const leftEntries = Object.entries(pair.left)
                  .filter(([, amt]) => amt > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));
                const rightEntries = Object.entries(pair.right)
                  .filter(([, amt]) => amt > 0)
                  .sort((a, b) => a[0].localeCompare(b[0]));

                const Lfull = leftEntries.length;
                const Rfull = rightEntries.length;
                const Lexp = !!expandedAll[key]?.left;
                const Rexp = !!expandedAll[key]?.right;
                const Lvis = Lexp ? Lfull : Math.min(2, Lfull);
                const Rvis = Rexp ? Rfull : Math.min(2, Rfull);

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
                      <ArrowLeftRight
                        size={20}
                        style={{ opacity: 0.7, color: "var(--tg-hint-color)" }}
                        aria-hidden
                      />
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

                    {/* Две колонки: адаптивная сетка [9]; [3a] — кнопки прямо в строках */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {/* Левый столбец (u1 должник → красные →) */}
                      <div className="min-w-0">
                        <div className="flex flex-col gap-[6px]">
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
                              {/* если я должник (u1) — «Рассчитаться», если кредитор (u2) — «Напомнить» */}
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
                              ) : iAmU2 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStubOpen(true);
                                    onRemind?.(pair.u1, amt, ccy);
                                  }}
                                  className={btn3D}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
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
                                aria-expanded={Lexp}
                              >
                                {Lexp
                                  ? t("close") || "Свернуть"
                                  : `${t("all") || "ВСЕ"} · +${Lfull - 2}`}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Правый столбец (u2 должник ← зелёные) */}
                      <div className="min-w-0">
                        <div className="flex flex-col gap-[6px]">
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
                              ) : iAmU1 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStubOpen(true);
                                    onRemind?.(pair.u2, amt, ccy);
                                  }}
                                  className={btn3D}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
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
                                aria-expanded={Rexp}
                              >
                                {Rexp
                                  ? t("close") || "Свернуть"
                                  : `${t("all") || "ВСЕ"} · +${Rfull - 2}`}
                              </button>
                            </div>
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

      {/* Модалка-заглушка для "Напомнить" (закрываем кнопкой/ESC) */}
      {stubOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === "Escape") setStubOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative max-w-[84vw] w-[420px] rounded-xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
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
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [18] — убрано: скрытая кнопка для FAB больше не нужна */}
    </div>
  );
}
