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
  size = 40, // единообразно 40px
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

/* ---------- helpers для «двух колонок» (Mine) ---------- */
type CurrencyLine = { currency: string; amount: number }; // абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

/* ===== Общее оформление кнопок ===== */
const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] " +
  "hover:brightness-105";

/* ===== Константы компоновки строк сумм (Mine) ===== */
const LINE_H = 22; // высота строки суммы (px)
const V_GAP = 6; // вертикальный отступ между строками (px)

/* ====== Chip UI ====== */
const Chip = ({
  children,
  title,
  tone, // "neutral" | "red" | "green"
}: {
  children: React.ReactNode;
  title?: string;
  tone?: "neutral" | "red" | "green";
}) => {
  const color =
    tone === "red"
      ? "var(--tg-destructive-text,#d7263d)"
      : tone === "green"
      ? "var(--tg-success-text,#1aab55)"
      : "var(--tg-text-color)";
  return (
    <span
      className="inline-flex items-center h-7 px-2 rounded-xl border text-[12px] font-medium mr-2 mb-2"
      style={{
        borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
        color,
        background: "var(--tg-card-bg)",
      }}
      title={title}
    >
      {children}
    </span>
  );
};

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // не используем в UI
  myDebts,
  allDebts,
  loading,
  onFabClick, // не используем скрытую кнопку
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const me = useUserStore((s) => s.user);
  const myId = Number(me?.id) || 0;

  const [tab, setTab] = useState<"mine" | "all">("mine");

  // локальная заглушка для «Напомнить»
  const [stubOpen, setStubOpen] = useState(false);

  /* ---------- Мой баланс: подготовка данных ---------- */
  const {
    leftCards,
    rightCards,
    leftTotalsByCcy,
    rightTotalsByCcy,
  }: {
    leftCards: CardItem[];
    rightCards: CardItem[];
    leftTotalsByCcy: Record<string, number>;
    rightTotalsByCcy: Record<string, number>;
  } = useMemo(() => {
    const leftMap = new Map<number, CardItem>(); // я должен
    const rightMap = new Map<number, CardItem>(); // мне должны
    const leftTotals: Record<string, number> = {};
    const rightTotals: Record<string, number> = {};

    for (const d of myDebts) {
      const abs = Math.abs(d.amount);
      if (abs <= 0) continue; // исключаем нули
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
      .map((ci) => ({ ...ci, lines: ci.lines.filter(l => l.amount > 0).sort(sortLines) }))
      .sort(sortCards);
    const rightCards = Array.from(rightMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.filter(l => l.amount > 0).sort(sortLines) }))
      .sort(sortCards);

    return {
      leftCards,
      rightCards,
      leftTotalsByCcy: leftTotals,
      rightTotalsByCcy: rightTotals,
    };
  }, [myDebts]);

  // свёрнуто/развернуто для карточек «Мой баланс» (по user.id и стороне)
  const [expandedMine, setExpandedMine] = useState<{
    left: Record<number, boolean>;
    right: Record<number, boolean>;
  }>({ left: {}, right: {} });

  const toggleMine = (side: "left" | "right", uid: number) =>
    setExpandedMine((s) => ({
      ...s,
      [side]: { ...s[side], [uid]: !s[side][uid] },
    }));

  // пары для «Мой баланс»: индексами выравниваем по строкам (как было)
  const mineRows = useMemo(() => {
    const maxLen = Math.max(leftCards.length, rightCards.length);
    const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
    for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });
    return rows;
  }, [leftCards, rightCards]);

  /* ---------- Все балансы: агрегирование по парам/секциям ---------- */
  type PairKey = string; // "minId-maxId"
  type SumMap = Record<string, number>; // currency -> amount
  type PairCard = {
    u1: User; // левый в заголовке (ориентированный)
    u2: User; // правый в заголовке
    left: SumMap; // долги u1 -> u2 (u1 должник)
    right: SumMap; // долги u2 -> u1 (u2 должник)
  };

  const sections: {
    u1: User;
    pairs: PairCard[];
    totalsLeft: SumMap;  // суммарно u1 должен (→)
    totalsRight: SumMap; // суммарно должны u1 (←)
  }[] = useMemo(() => {
    type Agg = { low: User; high: User; lowToHigh: SumMap; highToLow: SumMap };
    const byPair = new Map<PairKey, Agg>();

    const nameKey = (u: User) => (firstOnly(u) || `#${u.id}`).toLowerCase();
    const cmpByName = (x: User, y: User) =>
      nameKey(x).localeCompare(nameKey(y), locale, { sensitivity: "base" }) ||
      (x.id - y.id); // стабильный тайбрейк по id

    // 1) Канонические пары с накоплением по модулю
    for (const p of allDebts) {
      const amt = Math.abs(p.amount);
      if (amt <= 0) continue;

      const a = p.from;
      const b = p.to;
      const [low, high] = a.id <= b.id ? [a, b] : [b, a];
      const key: PairKey = `${low.id}-${high.id}`;

      let rec = byPair.get(key);
      if (!rec) {
        rec = { low, high, lowToHigh: {}, highToLow: {} };
        byPair.set(key, rec);
      }

      if (a.id === low.id && b.id === high.id) {
        rec.lowToHigh[p.currency] = (rec.lowToHigh[p.currency] || 0) + amt;   // low -> high
      } else {
        rec.highToLow[p.currency] = (rec.highToLow[p.currency] || 0) + amt;   // high -> low
      }
    }

    // 2) Ориентируем пары (мой id слева, иначе по алфавиту)
    const oriented: PairCard[] = [];
    for (const rec of byPair.values()) {
      const { low, high, lowToHigh, highToLow } = rec;

      let u1: User, u2: User, left: SumMap, right: SumMap;

      if (myId && myId === low.id) {
        u1 = low; u2 = high; left = lowToHigh; right = highToLow;
      } else if (myId && myId === high.id) {
        u1 = high; u2 = low; left = highToLow; right = lowToHigh;
      } else {
        if (cmpByName(low, high) <= 0) {
          u1 = low; u2 = high; left = lowToHigh; right = highToLow;
        } else {
          u1 = high; u2 = low; left = highToLow; right = lowToHigh;
        }
      }

      oriented.push({ u1, u2, left, right });
    }

    // 3) Группируем по u1 (секции)
    const byU1 = new Map<number, { u1: User; pairs: PairCard[] }>();
    for (const p of oriented) {
      const k = p.u1.id;
      if (!byU1.has(k)) byU1.set(k, { u1: p.u1, pairs: [] });
      byU1.get(k)!.pairs.push(p);
    }

    // 4) Считаем секционные тоталы (→ и ← отдельно по валютам), сортируем пары по u2
    const secArr: {
      u1: User; pairs: PairCard[]; totalsLeft: SumMap; totalsRight: SumMap;
    }[] = [];

    for (const sec of byU1.values()) {
      const totalsL: SumMap = {};
      const totalsR: SumMap = {};

      const pairsSorted = sec.pairs.slice().sort((A, B) => {
        const a = nameKey(A.u2); const b = nameKey(B.u2);
        if (a !== b) return a.localeCompare(b, locale, { sensitivity: "base" });
        return A.u2.id - B.u2.id;
      });

      for (const p of pairsSorted) {
        for (const [ccy, v] of Object.entries(p.left || {})) {
          if (v > 0) totalsL[ccy] = (totalsL[ccy] || 0) + v;
        }
        for (const [ccy, v] of Object.entries(p.right || {})) {
          if (v > 0) totalsR[ccy] = (totalsR[ccy] || 0) + v;
        }
      }

      secArr.push({ u1: sec.u1, pairs: pairsSorted, totalsLeft: totalsL, totalsRight: totalsR });
    }

    // 5) Сортировка секций: моя первая, затем по имени u1
    const myFirst = (u: User) => (u.id === myId ? 0 : 1);
    secArr.sort((A, B) => {
      const aM = myFirst(A.u1), bM = myFirst(B.u1);
      if (aM !== bM) return aM - bM;
      const nn = nameKey(A.u1).localeCompare(nameKey(B.u1), locale, { sensitivity: "base" });
      if (nn) return nn;
      return A.u1.id - B.u1.id;
    });

    // Пустые секции (если и → и ← нули) убираем
    return secArr.filter(sec => {
      const hasL = Object.values(sec.totalsLeft).some(v => v > 0);
      const hasR = Object.values(sec.totalsRight).some(v => v > 0);
      return hasL || hasR || sec.pairs.length > 0;
    });
  }, [allDebts, locale, myId]);

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
          /* ================= Мой баланс ================= */
          <div>
            {/* Заголовки и ЧИПЫ (суммы под заголовком) */}
            <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* LEFT: Я должен */}
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold mb-1"
                  style={{ color: "var(--tg-text-color)" }}
                >
                  {t("i_owe") || "Я должен"}
                </div>
                {/* Chips (без стрелок) */}
                <div className="flex flex-wrap">
                  {Object.entries(leftTotalsByCcy)
                    .filter(([, sum]) => sum > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`L-${ccy}`} tone="neutral" title={`${t("i_owe")} · ${ccy}`}>
                        {fmtAmountSmart(sum, ccy, locale)}
                      </Chip>
                    ))}
                  {Object.values(leftTotalsByCcy).every(v => !v) && (
                    <span className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                      {t("group_balance_no_debts_left")}
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT: Мне должны */}
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold mb-1"
                  style={{ color: "var(--tg-text-color)" }}
                >
                  {t("they_owe_me") || "Мне должны"}
                </div>
                {/* Chips (без стрелок) */}
                <div className="flex flex-wrap">
                  {Object.entries(rightTotalsByCcy)
                    .filter(([, sum]) => sum > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`R-${ccy}`} tone="neutral" title={`${t("they_owe_me")} · ${ccy}`}>
                        {fmtAmountSmart(sum, ccy, locale)}
                      </Chip>
                    ))}
                  {Object.values(rightTotalsByCcy).every(v => !v) && (
                    <span className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                      {t("group_balance_no_debts_right")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Пары карточек: 2 колонки + выравнивание высот (как было) */}
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
                            <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} size={40} />
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
                            <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} size={40} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(right.user)}
                            >
                              {firstOnly(right.user)}
                            </div>
                          </div>

                          {/* две колонки: суммы и вертикальная колонка с «Напомнить» */}
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
          /* ================= Все балансы: секции по u1 ================= */
          <div className="flex flex-col gap-3">
            {sections.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              sections.map((sec) => (
                <div key={`sec-${sec.u1.id}`} className="w-full">
                  {/* Заголовок секции */}
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                    {firstOnly(sec.u1)}
                  </div>

                  {/* Сводные чипы секции */}
                  <div className="flex flex-wrap mb-2">
                    {/* → u1 должен */}
                    {Object.entries(sec.totalsLeft)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([ccy, v]) => (
                        <Chip key={`sec-${sec.u1.id}-L-${ccy}`} tone="red" title={`${t("i_owe")} · ${ccy}`}>
                          <ArrowRight size={14} className="mr-1" />
                          {fmtAmountSmart(v, ccy, locale)}
                        </Chip>
                      ))}
                    {/* ← должны u1 */}
                    {Object.entries(sec.totalsRight)
                      .filter(([, v]) => v > 0)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([ccy, v]) => (
                        <Chip key={`sec-${sec.u1.id}-R-${ccy}`} tone="green" title={`${t("they_owe_me")} · ${ccy}`}>
                          <ArrowLeft size={14} className="mr-1" />
                          {fmtAmountSmart(v, ccy, locale)}
                        </Chip>
                      ))}
                  </div>

                  {/* Пары в секции */}
                  <div className="flex flex-col gap-2">
                    {sec.pairs.map((pair) => {
                      const key: PairKey = `${pair.u1.id}-${pair.u2.id}`;
                      const iAmU1 = myId === pair.u1.id;
                      const iAmU2 = myId === pair.u2.id;

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

                      // карточка пары
                      return (
                        <div
                          key={key}
                          className="rounded-xl border p-2"
                          style={{
                            borderColor: "var(--tg-secondary-bg-color,#e7e7e7)",
                            background: "var(--tg-card-bg)",
                          }}
                        >
                          {/* Хедер: [u1]  ⇄  [u2], стрелка по центру, правый аватар сразу после стрелки */}
                          <div
                            className="grid items-center mb-2"
                            style={{ gridTemplateColumns: "1fr auto 1fr", columnGap: 8 }}
                          >
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

                            <div className="flex items-center justify-center">
                              <ArrowLeftRight size={20} style={{ opacity: 0.7, color: "var(--tg-hint-color)" }} aria-hidden />
                            </div>

                            <div className="flex items-center gap-2 min-w-0 justify-start">
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

                          {/* Две колонки: u1→u2 (красн) | u2→u1 (зел) */}
                          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            {/* Левый столбец (u1 должник →) */}
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

                            {/* Правый столбец (u2 должник ←) */}
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
                    })}
                  </div>
                </div>
              ))
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
    </div>
  );
}
