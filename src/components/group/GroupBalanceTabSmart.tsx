// src/components/group/GroupBalanceTabSmart.tsx
import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HandCoins, Bell, ArrowRight, ArrowLeft, ArrowLeftRight } from "lucide-react";
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

/* ===== Utils ===== */

const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return name || u.username || `#${u.id}`;
};

/** «1 234.50 USD», скрывает .00 и уважает валюты без копеек */
const nbsp = "\u00A0";
export function fmtAmountSmart(value: number, currency: string, locale?: string) {
  try {
    const nfCurrency = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code" });
    const parts = nfCurrency.formatToParts(Math.abs(value));
    const fractionPart = parts.find((p) => p.type === "fraction");
    const hasCents = !!fractionPart && Number(fractionPart.value) !== 0;
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
  size = 40, // важное: 40px на обеих вкладках
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

/* ===== Кнопки ===== */
const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105";

/* ===== Константы раскладки ===== */
const LINE_H = 22;
const V_GAP = 6;

/* ===== Компоненты UI ===== */

const DebtLine: React.FC<{
  amount: number;
  currency: string;
  color: "red" | "green";
  arrow: "left" | "right";
  locale: string;
}> = ({ amount, currency, color, arrow, locale }) => {
  const Icon = arrow === "left" ? ArrowLeft : ArrowRight;
  const col = color === "red" ? "var(--tg-destructive-text,#d7263d)" : "var(--tg-success-text,#1aab55)";
  return (
    <div className="flex items-center gap-1">
      <Icon size={14} style={{ color: col }} aria-hidden />
      <span className="text-[14px] font-semibold" style={{ color: col }}>
        {fmtAmountSmart(amount, currency, locale)}
      </span>
    </div>
  );
};

const Chip: React.FC<{
  dir: "left" | "right"; // left = мне должны (←), right = я должен (→) ИЛИ наоборот в зависимости от места применения — мы передаём корректно
  amount: number;
  currency: string;
  color: "red" | "green";
  locale: string;
  title?: string;
}> = ({ dir, amount, currency, color, locale, title }) => {
  const Icon = dir === "left" ? ArrowLeft : ArrowRight;
  const col = color === "red" ? "var(--tg-destructive-text,#d7263d)" : "var(--tg-success-text,#1aab55)";
  return (
    <span
      className="inline-flex items-center gap-1 h-7 px-2 rounded-full border text-[12px]"
      style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      title={title}
      aria-label={title}
    >
      <Icon size={14} style={{ color: col }} aria-hidden />
      <span className="font-semibold" style={{ color: col }}>
        {fmtAmountSmart(amount, currency, locale)}
      </span>
    </span>
  );
};

/* ==== Напоминание: генерация текста + буфер + модалка ==== */

function buildReminderText(opts: {
  locale: string;
  name?: string;
  amount: number;
  currency: string;
}) {
  const { locale, name, amount, currency } = opts;
  const amountStr = fmtAmountSmart(amount, currency, locale);
  const hasName = !!(name && name.trim());
  const namePart = hasName ? (locale.startsWith("ru") ? `, ${name}` : locale.startsWith("es") ? `, ${name}` : `, ${name}`) : "";

  if (locale.startsWith("ru")) {
    // №1: дружелюбно и коротко; если имени нет — "Привет!"
    const hello = hasName ? `Привет${namePart}!` : "Привет!";
    return `${hello} Напоминаю про долг ${amountStr} по группе в Splitto. Спасибо! 🙏`;
  }
  if (locale.startsWith("es")) {
    const hello = hasName ? `¡Hola${namePart}!` : "¡Hola!";
    return `${hello} Te recuerdo la deuda de ${amountStr} del grupo en Splitto. ¡Gracias! 🙏`;
  }
  const hello = hasName ? `Hi${namePart}!` : "Hi!";
  return `${hello} Just a friendly reminder about the ${amountStr} in our Splitto group. Thanks! 🙏`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/* ================== main ================== */

export default function GroupBalanceTabSmart({
  myBalanceByCurrency, // не используется напрямую
  myDebts,
  allDebts,
  loading,
  onFabClick,
  onRepay,
  onRemind,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").toLowerCase();
  const me = useUserStore((s) => s.user);
  const myId = Number(me?.id) || 0;

  const [tab, setTab] = useState<"mine" | "all">("mine");

  /* ===== Модалка «текст скопирован» для 🔔 ===== */
  const [remindOpen, setRemindOpen] = useState(false);
  const [remindUsername, setRemindUsername] = useState<string | undefined>();
  const [remindText, setRemindText] = useState<string>("");

  const openTelegramContact = useCallback(() => {
    if (!remindUsername) return;
    const url = `https://t.me/${remindUsername}`;
    try {
      window.open(url, "_blank");
    } catch {
      window.location.href = url;
    }
  }, [remindUsername]);

  const doRemind = useCallback(
    async (user: User, amount: number, currency: string) => {
      const text = buildReminderText({
        locale,
        name: user.first_name || undefined,
        amount,
        currency,
      });
      setRemindText(text);
      await copyToClipboard(text);
      setRemindUsername(user.username || undefined);
      setRemindOpen(true);
      // если родитель хочет — вызовем и его
      if (onRemind) setTimeout(() => onRemind(user, amount, currency), 0);
    },
    [locale, onRemind]
  );

  /* ====== «Мой баланс»: подготовка ====== */
  type CurrencyLine = { currency: string; amount: number }; // абсолют
  type CardItem = { user: User; lines: CurrencyLine[]; total: number };

  const minePrepared = useMemo(() => {
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
      .map((ci) => ({ ...ci, lines: ci.lines.filter((l) => l.amount > 0).sort(sortLines) }))
      .sort(sortCards);
    const rightCards = Array.from(rightMap.values())
      .map((ci) => ({ ...ci, lines: ci.lines.filter((l) => l.amount > 0).sort(sortLines) }))
      .sort(sortCards);

    return { leftCards, rightCards, leftTotals, rightTotals };
  }, [myDebts]);

  const [expandedMine, setExpandedMine] = useState<{ left: Record<number, boolean>; right: Record<number, boolean> }>({
    left: {},
    right: {},
  });
  const toggleMine = (side: "left" | "right", uid: number) =>
    setExpandedMine((s) => ({ ...s, [side]: { ...s[side], [uid]: !s[side][uid] } }));

  const mineRows = useMemo(() => {
    const { leftCards, rightCards } = minePrepared;
    const maxLen = Math.max(leftCards.length, rightCards.length);
    const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
    for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });
    return rows;
  }, [minePrepared]);

  /* ====== «Все балансы»: агрегирование ====== */
  type PairKey = string; // "minId-maxId"
  type SumMap = Record<string, number>; // currency -> amount
  type PairCard = { u1: User; u2: User; left: SumMap; right: SumMap };

  const allSections = useMemo(() => {
    type Agg = { low: User; high: User; lowToHigh: SumMap; highToLow: SumMap };
    const byPair = new Map<PairKey, Agg>();

    const nameKey = (u: User) => (firstOnly(u) || `#${u.id}`).toLowerCase();
    const cmpByName = (x: User, y: User) =>
      nameKey(x).localeCompare(nameKey(y), locale, { sensitivity: "base" }) || x.id - y.id;

    // соберём пары (канонически minId-maxId), суммы — по модулю
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
        rec.lowToHigh[p.currency] = (rec.lowToHigh[p.currency] || 0) + amt;
      } else {
        rec.highToLow[p.currency] = (rec.highToLow[p.currency] || 0) + amt;
      }
    }

    // ориентируем: текущий пользователь всегда слева, иначе — по имени
    const oriented: PairCard[] = [];
    for (const rec of byPair.values()) {
      const { low, high, lowToHigh, highToLow } = rec;
      let u1: User, u2: User, left: SumMap, right: SumMap;
      if (myId && myId === low.id) {
        u1 = low; u2 = high; left = lowToHigh; right = highToLow;
      } else if (myId && myId === high.id) {
        u1 = high; u2 = low; left = highToLow; right = lowToHigh;
      } else if (cmpByName(low, high) <= 0) {
        u1 = low; u2 = high; left = lowToHigh; right = highToLow;
      } else {
        u1 = high; u2 = low; left = highToLow; right = lowToHigh;
      }
      oriented.push({ u1, u2, left, right });
    }

    // сгруппируем по u1
    const groups = new Map<number, { u1: User; pairs: PairCard[] }>();
    for (const pc of oriented) {
      const g = groups.get(pc.u1.id) || { u1: pc.u1, pairs: [] };
      g.pairs.push(pc);
      groups.set(pc.u1.id, g);
    }

    // сортируем: секция текущего пользователя первая, остальные по имени u1
    const sections = Array.from(groups.values());
    sections.sort((A, B) => {
      const mineA = A.u1.id === myId;
      const mineB = B.u1.id === myId;
      if (mineA !== mineB) return mineA ? -1 : 1;
      return firstOnly(A.u1).toLowerCase().localeCompare(firstOnly(B.u1).toLowerCase(), locale, {
        sensitivity: "base",
      }) || A.u1.id - B.u1.id;
    });

    // сортировка пар внутри секции по имени u2
    for (const s of sections) {
      s.pairs.sort(
        (A, B) =>
          firstOnly(A.u2).toLowerCase().localeCompare(firstOnly(B.u2).toLowerCase(), locale, {
            sensitivity: "base",
          }) || A.u2.id - B.u2.id
      );
    }

    return sections;
  }, [allDebts, myId, locale]);

  const [expandedAll, setExpandedAll] = useState<Record<PairKey, { left: boolean; right: boolean }>>({});
  const toggleAll = (key: PairKey, side: "left" | "right") =>
    setExpandedAll((s) => ({ ...s, [key]: { left: !!s[key]?.left, right: !!s[key]?.right, [side]: !s[key]?.[side] } }));

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
          /* ================= Мой баланс ================= */
          <div>
            {/* Заголовки + чипы сумм под ними */}
            <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                  {t("i_owe") || "Я должен"}
                </div>
                {/* чипы: я должен → (красные) */}
                <div className="flex flex-wrap gap-1.5 mb-2" aria-label={t("group_balance_totals_aria") as string}>
                  {Object.entries(minePrepared.leftTotals)
                    .filter(([, sum]) => sum > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`L-${ccy}`} dir="right" amount={sum} currency={ccy} color="red" locale={locale} />
                    ))}
                  {Object.keys(minePrepared.leftTotals).filter((k) => minePrepared.leftTotals[k] > 0).length === 0 && (
                    <div className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                      {t("group_balance_no_debts_left")}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--tg-text-color)" }}>
                  {t("they_owe_me") || "Мне должны"}
                </div>
                {/* чипы: мне должны ← (зелёные) */}
                <div className="flex flex-wrap gap-1.5 mb-2" aria-label={t("group_balance_totals_aria") as string}>
                  {Object.entries(minePrepared.rightTotals)
                    .filter(([, sum]) => sum > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`R-${ccy}`} dir="left" amount={sum} currency={ccy} color="green" locale={locale} />
                    ))}
                  {Object.keys(minePrepared.rightTotals).filter((k) => minePrepared.rightTotals[k] > 0).length === 0 && (
                    <div className="text-[12px]" style={{ color: "var(--tg-hint-color)" }}>
                      {t("group_balance_no_debts_right")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Пары карточек: 2 колонки, выравнивание по высоте строк (как было) */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {mineRows.map(({ left, right }, rowIdx) => {
                if (!left && !right) return null;

                const Lexpanded = left ? !!expandedMine.left[left.user.id] : false;
                const Rexpanded = right ? !!expandedMine.right[right.user.id] : false;

                const Lfull = left ? left.lines.length : 0;
                const Rfull = right ? right.lines.length : 0;
                const Lvis = left ? (Lexpanded ? Lfull : Math.min(2, Lfull)) : 0;
                const Rvis = right ? (Rexpanded ? Rfull : Math.min(2, Rfull)) : 0;

                const bothCollapsed = (!!left && !Lexpanded) && (!!right && !Rexpanded);
                const rowVisible = Math.max(Lvis, Rvis);
                const rowMinHeight = rowVisible > 0 ? rowVisible * LINE_H + (rowVisible - 1) * V_GAP : 0;

                return (
                  <React.Fragment key={`row-${rowIdx}`}>
                    {/* Левая карточка */}
                    <div className="min-w-0">
                      {left ? (
                        <div className="rounded-xl border p-2" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} />
                            <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(left.user)}>
                              {firstOnly(left.user)}
                            </div>
                          </div>

                          <div
                            className="flex flex-col gap-[6px]"
                            style={{
                              minHeight: bothCollapsed ? rowMinHeight : Math.min(2, Lfull) * LINE_H + (Math.min(2, Lfull) - 1) * V_GAP,
                              justifyContent: bothCollapsed && Lvis < Rvis ? "center" : "flex-start",
                            }}
                          >
                            {(left.lines.slice(0, Lexpanded ? Lfull : Math.min(2, Lfull))).map((ln, i) => (
                              <div key={`L-${left.user.id}-${ln.currency}-${i}`} className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                                <DebtLine amount={ln.amount} currency={ln.currency} color="red" arrow="right" locale={locale} />
                                <button type="button" onClick={() => onRepay?.(left.user, ln.amount, ln.currency)} className={btn3D} aria-label={t("repay_debt") as string} title={t("repay_debt") as string}>
                                  <HandCoins size={18} />
                                </button>
                              </div>
                            ))}
                            {Lfull > 2 && (
                              <div className="pt-1">
                                <button type="button" onClick={() => toggleMine("left", left.user.id)} className="text-[12px] opacity-80 hover:opacity-100" style={{ color: "var(--tg-hint-color)" }}>
                                  {Lexpanded ? (t("close") || "Свернуть") : `${t("tx_modal.all") || "ВСЕ"} · +${Lfull - 2}`}
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
                        <div className="rounded-xl border p-2" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} />
                            <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(right.user)}>
                              {firstOnly(right.user)}
                            </div>
                          </div>

                          <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                            <div
                              className="flex flex-col gap-[6px]"
                              style={{
                                minHeight: bothCollapsed ? rowMinHeight : Math.min(2, Rfull) * LINE_H + (Math.min(2, Rfull) - 1) * V_GAP,
                                justifyContent: bothCollapsed && Rvis < Lvis ? "center" : "flex-start",
                              }}
                            >
                              {(right.lines.slice(0, Rexpanded ? Rfull : Math.min(2, Rfull))).map((ln, i) => (
                                <div key={`R-${right.user.id}-${ln.currency}-${i}`} className="text-[14px] font-semibold" style={{ color: "var(--tg-success-text,#2ecc71)" }}>
                                  <DebtLine amount={ln.amount} currency={ln.currency} color="green" arrow="left" locale={locale} />
                                </div>
                              ))}
                              {Rfull > 2 && (
                                <div className="pt-1">
                                  <button type="button" onClick={() => toggleMine("right", right.user.id)} className="text-[12px] opacity-80 hover:opacity-100" style={{ color: "var(--tg-hint-color)" }}>
                                    {Rexpanded ? (t("close") || "Свернуть") : `${t("tx_modal.all") || "ВСЕ"} · +${Rfull - 2}`}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* одна 🔔 на колонку */}
                            <div
                              className="flex items-center justify-end"
                              style={{
                                minHeight: (Rexpanded ? Rfull : Math.min(2, Rfull)) * LINE_H + ((Rexpanded ? Rfull : Math.min(2, Rfull)) - 1) * V_GAP,
                              }}
                            >
                              {Rfull > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ln = right.lines[0];
                                    void doRemind(right.user, ln.amount, ln.currency);
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
          /* ================= Все балансы ================= */
          <div className="flex flex-col gap-3">
            {allSections.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              allSections.map((sec) => {
                // суммарные чипы по u1: лево (u1→u2) = я должен → (красные); право (u2→u1) = мне должны ← (зелёные)
                const sumLeft: Record<string, number> = {};
                const sumRight: Record<string, number> = {};
                for (const p of sec.pairs) {
                  for (const [ccy, v] of Object.entries(p.left)) sumLeft[ccy] = (sumLeft[ccy] || 0) + v;
                  for (const [ccy, v] of Object.entries(p.right)) sumRight[ccy] = (sumRight[ccy] || 0) + v;
                }

                return (
                  <div
                    key={`sec-${sec.u1.id}`}
                    className="relative rounded-2xl border p-3"
                    style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                  >
                    {/* Вертикальный «рейл», привязанный к центру аватара u1 (аватар слева, паддинг секции = 12px/px-3) */}
                    <div
                      className="absolute top-[72px] bottom-3 w-px"
                      style={{ left: 12 + 20 /* padding + half of 40px avatar */, background: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                      aria-hidden
                    />

                    {/* Шапка секции: аватар + Имя Фамилия + @username */}
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar url={sec.u1.photo_url} alt={firstOnly(sec.u1)} />
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold truncate" style={{ color: "var(--tg-text-color)" }}>
                          {(sec.u1.first_name || "") + (sec.u1.last_name ? ` ${sec.u1.last_name}` : "") || firstOnly(sec.u1)}
                        </div>
                        {sec.u1.username ? (
                          <div className="text-[12px] text-[var(--tg-hint-color)]">@{sec.u1.username}</div>
                        ) : null}
                      </div>
                    </div>

                    {/* Чипы сводки по u1 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(sumLeft)
                        .filter(([, v]) => v > 0)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([ccy, v]) => (
                          <Chip key={`sumL-${ccy}`} dir="right" amount={v} currency={ccy} color="red" locale={locale} />
                        ))}
                      {Object.entries(sumRight)
                        .filter(([, v]) => v > 0)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([ccy, v]) => (
                          <Chip key={`sumR-${ccy}`} dir="left" amount={v} currency={ccy} color="green" locale={locale} />
                        ))}
                    </div>

                    {/* Пары u1 ↔ u2 */}
                    <div className="flex flex-col gap-3">
                      {sec.pairs.map((pair) => {
                        const key: PairKey = `${pair.u1.id}-${pair.u2.id}`;
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

                        const iAmU1 = myId === pair.u1.id;
                        const iAmU2 = myId === pair.u2.id;

                        return (
                          <div
                            key={key}
                            className="relative rounded-xl border p-2"
                            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)", background: "var(--tg-card-bg)" }}
                          >
                            {/* Хедер пары: ⇄ строго по центру; u2 аватар сразу после стрелки */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar url={pair.u1.photo_url} alt={firstOnly(pair.u1)} />
                                <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(pair.u1)}>
                                  {firstOnly(pair.u1)}
                                </div>
                              </div>
                              <ArrowLeftRight size={20} style={{ opacity: 0.7, color: "var(--tg-hint-color)" }} aria-hidden />
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar url={pair.u2.photo_url} alt={firstOnly(pair.u2)} />
                                <div className="text-[14px] font-medium truncate" style={{ color: "var(--tg-text-color)" }} title={firstOnly(pair.u2)}>
                                  {firstOnly(pair.u2)}
                                </div>
                              </div>
                            </div>

                            {/* Две колонки сумм */}
                            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                              {/* Левый столбец (u1 должник →) */}
                              <div className="min-w-0">
                                <div className="flex flex-col gap-[6px]">
                                  {leftEntries.slice(0, Lvis).map(([ccy, amt], i) => (
                                    <div key={`pair-${key}-L-${ccy}-${i}`} className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                                      <DebtLine amount={amt} currency={ccy} color="red" arrow="right" locale={locale} />
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
                                          onClick={() => void doRemind(pair.u1, amt, ccy)}
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
                                        {Lexp ? (t("close") || "Свернуть") : `${t("tx_modal.all") || "ВСЕ"} · +${Lfull - 2}`}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Правый столбец (u2 должник ←) */}
                              <div className="min-w-0">
                                <div className="flex flex-col gap-[6px]">
                                  {rightEntries.slice(0, Rvis).map(([ccy, amt], i) => (
                                    <div key={`pair-${key}-R-${ccy}-${i}`} className="grid items-center" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                                      <DebtLine amount={amt} currency={ccy} color="green" arrow="left" locale={locale} />
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
                                          onClick={() => void doRemind(pair.u2, amt, ccy)}
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
                                        {Rexp ? (t("close") || "Свернуть") : `${t("tx_modal.all") || "ВСЕ"} · +${Rfull - 2}`}
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
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Модалка после копирования текста напоминания */}
      {remindOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === "Escape") setRemindOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setRemindOpen(false)} />
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-4"
            style={{ color: "var(--tg-text-color)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="text-[15px] font-semibold mb-2">{t("remind_copied") || "Text copied. Open Telegram and paste it."}</div>
            <div className="text-[13px] opacity-80 mb-3 whitespace-pre-wrap break-words">{remindText}</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 h-10 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition"
                onClick={() => setRemindOpen(false)}
              >
                {t("close")}
              </button>
              {remindUsername ? (
                <button
                  type="button"
                  className="px-4 h-10 rounded-xl font-bold text-[14px] border active:scale-95 transition"
                  style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
                  onClick={openTelegramContact}
                >
                  {t("contact.open_in_telegram")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Скрытая кнопка для FAB (чтобы сохранить поведение внешнего FAB) */}
      <div className="hidden">
        <button type="button" onClick={onFabClick} />
      </div>
    </div>
  );
}

