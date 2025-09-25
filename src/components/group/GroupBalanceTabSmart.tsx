// src/components/group/GroupBalanceTabSmart.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Bell,
  HandCoins,
  X,
  ChevronDown,
} from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import { useParams } from "react-router-dom";
import { getGroupMembers } from "../../api/groupMembersApi"; // для списка ВСЕХ участников
import type { GroupMember } from "../../types/group_member";

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
};

/* ---------- utils ---------- */
const AVA = 32; // единый размер всех аватаров в этом компоненте

const firstOnly = (u?: User) => {
  if (!u) return "";
  const name = (u.first_name || "").trim();
  return name || u.username || `#${u.id}`;
};

const displayName = (u: User) => {
  const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return full || firstOnly(u);
};

const nbsp = "\u00A0";
export function fmtAmountSmart(value: number, currency: string, locale?: string) {
  try {
    const nfCurrency = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    });
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

function Avatar({ url, alt, size = AVA }: { url?: string; alt?: string; size?: number }) {
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

type CurrencyLine = { currency: string; amount: number }; // абсолют
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105";

const LINE_H = 22;
const V_GAP = 6;

const Divider = ({ leftPx = AVA + 24 }) => (
  <div
    className="h-px bg-[var(--tg-hint-color)] opacity-15 w-full"
    style={{ marginLeft: leftPx, width: `calc(100% - ${leftPx}px)` }}
  />
);

/* ====== Clipboard helper ====== */
async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
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

/* ====== Message builder ====== */
function buildReminderMessage(opts: {
  locale: string;
  name?: string;
  username?: string;
  amounts: Record<string, number>; // currency -> sum
  groupName?: string;
}) {
  const { locale, name, amounts, groupName } = opts;
  const hasName = !!(name && name.trim());
  const hello =
    locale.startsWith("ru")
      ? hasName
        ? `Привет, ${name}!`
        : "Привет!"
      : locale.startsWith("es")
      ? hasName
        ? `¡Hola, ${name}!`
        : "¡Hola!"
      : hasName
      ? `Hi, ${name}!`
      : "Hi!";

  const groupPart =
    groupName && groupName.trim()
      ? locale.startsWith("ru")
        ? `в группе «${groupName}»`
        : locale.startsWith("es")
        ? `en el grupo “${groupName}”`
        : `in the “${groupName}” group`
      : locale.startsWith("ru")
      ? "в нашей группе"
      : locale.startsWith("es")
      ? "en nuestro grupo"
      : "in our group";

  const list = Object.entries(amounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ccy, sum]) => fmtAmountSmart(sum, ccy, locale))
    .join(", ");

  const ask =
    locale.startsWith("ru")
      ? "Сможешь закрыть долг?"
      : locale.startsWith("es")
      ? "¿Puedes saldar la deuda?"
      : "Could you settle it?";

  const youOweMe =
    locale.startsWith("ru")
      ? `По нашим расходам ${groupPart} ты должен мне: ${list}.`
      : locale.startsWith("es")
      ? `Según nuestros gastos ${groupPart}, me debes: ${list}.`
      : `For our expenses ${groupPart}, you owe me: ${list}.`;

  return `${hello}\n${youOweMe}\n${ask}`;
}

/* ================= main ================= */
export default function GroupBalanceTabSmart({
  myBalanceByCurrency,
  myDebts,
  allDebts,
  loading,
  onFabClick,
  onRepay,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];
  const me = useUserStore((s) => s.user);
  const myId = Number(me?.id) || 0;

  const [tab, setTab] = useState<"mine" | "all">("mine");

  // group name (для текста напоминания)
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;
  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);
  const groupName = useMemo(() => {
    const g = groups.find((x: any) => Number(x?.id) === Number(groupId));
    return (g?.name as string) || undefined;
  }, [groups, groupId]);

  // ===== Загрузка ВСЕХ участников группы (для "Все балансы")
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      if (!groupId) return;
      try {
        setMembersLoading(true);
        const res = await getGroupMembers(groupId as number);
        // допускаем оба формата ответа
        const arr: GroupMember[] = Array.isArray(res) ? (res as any) : (res?.items ?? []);
        const users: User[] = (arr || [])
          .map((gm: any) => gm?.user)
          .filter(Boolean);
        if (!cancelled) setMembers(users);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  /* ---------- Мой баланс: подготовка данных ---------- */
  const {
    leftCards,
    rightCards,
    leftTotals,
    rightTotals,
    showChipsMine,
  }: {
    leftCards: CardItem[];
    rightCards: CardItem[];
    leftTotals: Record<string, number>;
    rightTotals: Record<string, number>;
    showChipsMine: boolean;
  } = useMemo(() => {
    const leftMap = new Map<number, CardItem>(); // я должен
    const rightMap = new Map<number, CardItem>(); // мне должны
    const leftTotals: Record<string, number> = {};
    const rightTotals: Record<string, number> = {};
    let leftLines = 0;
    let rightLines = 0;

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
        leftLines++;
      } else {
        const ci = rightMap.get(key) || { user: d.user, lines: [], total: 0 };
        ci.lines.push({ currency: d.currency, amount: abs });
        ci.total += abs;
        rightMap.set(key, ci);
        rightTotals[d.currency] = (rightTotals[d.currency] || 0) + abs;
        rightLines++;
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

    // логика показа чипов (для "Мой баланс"): если хотя бы в одной колонке есть "сжатие" — показываем обе
    const leftUnique = Object.keys(leftTotals).length;
    const rightUnique = Object.keys(rightTotals).length;
    const leftCompressed = leftLines > 0 && leftUnique < leftLines;
    const rightCompressed = rightLines > 0 && rightUnique < rightLines;
    const showChipsMine = leftCompressed || rightCompressed;

    return { leftCards, rightCards, leftTotals, rightTotals, showChipsMine };
  }, [myDebts]);

  const [expandedMine, setExpandedMine] = useState<{ left: Record<number, boolean>; right: Record<number, boolean> }>({
    left: {},
    right: {},
  });
  const toggleMine = (side: "left" | "right", uid: number) =>
    setExpandedMine((s) => ({ ...s, [side]: { ...s[side], [uid]: !s[side][uid] } }));

  const mineRows = useMemo(() => {
    const maxLen = Math.max(leftCards.length, rightCards.length);
    const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
    for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });
    return rows;
  }, [leftCards, rightCards]);

  /* ---------- Все балансы: агрегация пар (канонический вид) ---------- */
  type PairKey = string;
  type SumMap = Record<string, number>;
  type Agg = { low: User; high: User; lowToHigh: SumMap; highToLow: SumMap };
  type PairCard = { u1: User; u2: User; left: SumMap; right: SumMap }; // left: u1->u2, right: u2->u1

  const pairAgg = useMemo(() => {
    const byPair = new Map<PairKey, Agg>();
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
    return byPair;
  }, [allDebts]);

  // построить секцию "участник u1" -> список его пар и суммарные чипы (всегда показываем)
  const buildSectionForUser = useCallback(
    (u1: User) => {
      const sumsLeft: SumMap = {};
      const sumsRight: SumMap = {};
      const pairs: PairCard[] = [];

      // собрать все пары, где участвует u1, и ориентировать так, чтобы u1 был слева
      for (const rec of pairAgg.values()) {
        const { low, high, lowToHigh, highToLow } = rec;
        if (u1.id === low.id) {
          // u1 -> high
          const left = { ...lowToHigh };
          const right = { ...highToLow };
          // отфильтруем нули и параллельно суммируем
          const l: SumMap = {};
          const r: SumMap = {};
          for (const [ccy, amt] of Object.entries(left)) {
            if (amt > 0) {
              l[ccy] = amt;
              sumsLeft[ccy] = (sumsLeft[ccy] || 0) + amt;
            }
          }
          for (const [ccy, amt] of Object.entries(right)) {
            if (amt > 0) {
              r[ccy] = amt;
              sumsRight[ccy] = (sumsRight[ccy] || 0) + amt;
            }
          }
          if (Object.keys(l).length || Object.keys(r).length) {
            pairs.push({ u1, u2: high, left: l, right: r });
          }
        } else if (u1.id === high.id) {
          // u1 -> low (в обратную сторону)
          const left = { ...highToLow };
          const right = { ...lowToHigh };
          const l: SumMap = {};
          const r: SumMap = {};
          for (const [ccy, amt] of Object.entries(left)) {
            if (amt > 0) {
              l[ccy] = amt;
              sumsLeft[ccy] = (sumsLeft[ccy] || 0) + amt;
            }
          }
          for (const [ccy, amt] of Object.entries(right)) {
            if (amt > 0) {
              r[ccy] = amt;
              sumsRight[ccy] = (sumsRight[ccy] || 0) + amt;
            }
          }
          if (Object.keys(l).length || Object.keys(r).length) {
            pairs.push({ u1, u2: low, left: l, right: r });
          }
        }
      }

      // отсортировать пары по имени u2
      const nameKey = (u: User) => (displayName(u) || `#${u.id}`).toLowerCase();
      pairs.sort(
        (A, B) => nameKey(A.u2).localeCompare(nameKey(B.u2), locale, { sensitivity: "base" }) || A.u2.id - B.u2.id
      );

      return { u1, pairs, sumsLeft, sumsRight };
    },
    [pairAgg, locale]
  );

  /* ===== Общий UI-кусок: строчка валюты с суммой и стрелкой ===== */
  const DebtLine = React.memo(
    ({
      amount,
      currency,
      color,
      arrow,
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
    }
  );

  /* ===== Chips ===== */
  const Chip = ({
    dir,
    amount,
    currency,
  }: {
    dir: "out" | "in"; // out = я должен / u1->*, in = мне должны / *->u1
    amount: number;
    currency: string;
  }) => {
    const isOut = dir === "out";
    const col = isOut ? "var(--tg-destructive-text,#d7263d)" : "var(--tg-success-text,#1aab55)";
    const Icon = isOut ? ArrowRight : ArrowLeft;
    return (
      <div
        className="h-7 px-2 rounded-lg border flex items-center gap-1 text-[13px]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
      >
        <Icon size={14} style={{ color: col }} />
        <span style={{ color: col, fontWeight: 600 }}>{fmtAmountSmart(amount, currency, locale)}</span>
      </div>
    );
  };

  /* ===== Напоминание (модалка) ===== */
  const [remindOpen, setRemindOpen] = useState(false);
  const [remindUsername, setRemindUsername] = useState<string | undefined>(undefined);
  const [remindMessage, setRemindMessage] = useState<string>("");

  const openTelegram = useCallback(() => {
    if (!remindUsername) return;
    const url = `https://t.me/${remindUsername}`;
    window.open(url, "_blank");
  }, [remindUsername]);

  const triggerRemind = useCallback(
    async (user: User, amounts: Record<string, number>) => {
      const msg = buildReminderMessage({
        locale,
        name: firstOnly(user),
        username: user.username,
        amounts,
        groupName,
      });
      await copyToClipboard(msg);
      setRemindUsername(user.username);
      setRemindMessage(msg);
      setRemindOpen(true);
    },
    [locale, groupName]
  );

  // ============ Состояние разворотов для "Все балансы" ============
  const [expandedAllMap, setExpandedAllMap] = useState<Record<number, boolean>>({});
  const toggleAllItem = (uid: number) =>
    setExpandedAllMap((m) => ({ ...m, [uid]: !m[uid] }));
  const expandAll = (uids: number[]) =>
    setExpandedAllMap((m) => {
      const next: Record<number, boolean> = { ...m };
      for (const id of uids) next[id] = true;
      return next;
    });

  // Полный список участников (из БД) + подстраховка пользователями из allDebts
  const participants: User[] = useMemo(() => {
    const map = new Map<number, User>();
    for (const u of members) map.set(u.id, u);
    for (const p of allDebts) {
      if (p.from) map.set(p.from.id, p.from);
      if (p.to) map.set(p.to.id, p.to);
    }
    const arr = Array.from(map.values());
    const key = (u: User) => (displayName(u) || `#${u.id}`).toLowerCase();
    arr.sort((a, b) => {
      const mineA = a.id === myId ? 1 : 0;
      const mineB = b.id === myId ? 1 : 0;
      if (mineA !== mineB) return mineB - mineA; // я — первым
      return key(a).localeCompare(key(b), locale, { sensitivity: "base" }) || a.id - b.id;
    });
    return arr;
  }, [members, allDebts, myId, locale]);

  /* ===== Разметка ===== */
  return (
    <div className="w-full select-none" style={{ WebkitTapHighlightColor: "transparent" }}>
      {/* микротабы */}
      <div className="flex justify-center mt-1 mb-1">
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
          <div className="py-6 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          /* ================= Мой баланс (НЕ ТРОГАЕМ) ================= */
          <div>
            {/* Заголовки */}
            <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                  {t("i_owe") || "Я должен"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: "var(--tg-text-color)" }}>
                  {t("they_owe_me") || "Мне должны"}
                </div>
              </div>
            </div>

            {/* Чипы — только если нужно, и тогда в обеих колонках */}
            {showChipsMine && (
              <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="flex items-center gap-1 flex-wrap">
                  {Object.entries(leftTotals)
                    .filter(([, v]) => v > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`L-${ccy}`} dir="out" amount={sum} currency={ccy} />
                    ))}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {Object.entries(rightTotals)
                    .filter(([, v]) => v > 0)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([ccy, sum]) => (
                      <Chip key={`R-${ccy}`} dir="in" amount={sum} currency={ccy} />
                    ))}
                </div>
              </div>
            )}

            {/* Пары карточек */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {mineRows.map(({ left, right }, rowIdx) => {
                if (!left && !right) return null;

                const Lexpanded = left ? !!expandedMine.left[left.user.id] : false;
                const Rexpanded = right ? !!expandedMine.right[right.user.id] : false;

                const Lfull = left ? left.lines.length : 0;
                const Rfull = right ? right.lines.length : 0;
                const Lvis = left ? (Lexpanded ? Lfull : Math.min(2, Lfull)) : 0;
                const Rvis = right ? (Rexpanded ? Rfull : Math.min(2, Rfull)) : 0;

                const bothCollapsed = !!left && !Lexpanded && !!right && !Rexpanded;
                const rowVisible = Math.max(Lvis, Rvis);
                const rowMinHeight = rowVisible > 0 ? rowVisible * LINE_H + (rowVisible - 1) * V_GAP : 0;

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
                          {/* шапка: только аватар + имя */}
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} size={AVA} />
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
                              minHeight: bothCollapsed
                                ? rowMinHeight
                                : Math.min(2, Lfull) * LINE_H + (Math.min(2, Lfull) - 1) * V_GAP,
                              justifyContent: bothCollapsed && Lvis < Rvis ? "center" : "flex-start",
                            }}
                          >
                            {left.lines.slice(0, Lexpanded ? Lfull : Math.min(2, Lfull)).map((ln, i) => (
                              <div
                                key={`L-${left.user.id}-${ln.currency}-${i}`}
                                className="grid items-center"
                                style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}
                              >
                                <DebtLine amount={ln.amount} currency={ln.currency} color="red" arrow="right" locale={locale} />
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
                            ))}
                            {Lfull > 2 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleMine("left", left.user.id)}
                                  className="text-[12px] opacity-80 hover:opacity-100"
                                  style={{ color: "var(--tg-hint-color)" }}
                                >
                                  {Lexpanded ? t("close") || "Свернуть" : `${t("all") || "ВСЕ"} · +${Lfull - 2}`}
                                </button>
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
                          {/* шапка: только аватар + имя */}
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} size={AVA} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(right.user)}
                            >
                              {firstOnly(right.user)}
                            </div>
                          </div>

                          {/* суммы + одна кнопка Напомнить на колонку */}
                          <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                            <div
                              className="flex flex-col gap-[6px]"
                              style={{
                                minHeight:
                                  (Rexpanded ? Rfull : Math.min(2, Rfull)) * LINE_H +
                                  ((Rexpanded ? Rfull : Math.min(2, Rfull)) - 1) * V_GAP,
                              }}
                            >
                              {right.lines.slice(0, Rexpanded ? Rfull : Math.min(2, Rfull)).map((ln, i) => (
                                <div key={`R-${right.user.id}-${ln.currency}-${i}`} className="text-[14px] font-semibold">
                                  <DebtLine amount={ln.amount} currency={ln.currency} color="green" arrow="left" locale={locale} />
                                </div>
                              ))}
                              {Rfull > 2 && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleMine("right", right.user.id)}
                                    className="text-[12px] opacity-80 hover:opacity-100"
                                    style={{ color: "var(--tg-hint-color)" }}
                                  >
                                    {Rexpanded ? t("close") || "Свернуть" : `${t("all") || "ВСЕ"} · +${Rfull - 2}`}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* одна кнопка Напомнить для всех долгов карточки */}
                            <div className="flex items-center justify-end">
                              {Rfull > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const amounts: Record<string, number> = {};
                                    for (const ln of right.lines) amounts[ln.currency] = (amounts[ln.currency] || 0) + ln.amount;
                                    triggerRemind(right.user, amounts);
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
          /* ================= Все балансы -> СПИСОК УЧАСТНИКОВ ================= */
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
            {membersLoading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}

            {participants.length === 0 && !membersLoading ? (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              participants.map((u, idx) => {
                const sec = buildSectionForUser(u);
                const expanded = !!expandedAllMap[u.id];

                const leftTotals = Object.entries(sec.sumsLeft).sort((a, b) => a[0].localeCompare(b[0]));
                const rightTotals = Object.entries(sec.sumsRight).sort((a, b) => a[0].localeCompare(b[0]));

                // одна карточка участника как в UserCard, + чипы всегда + иконка разворота
                return (
                  <div key={`u-${u.id}`} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleAllItem(u.id)}
                      className="w-full active:opacity-70"
                    >
                      <div className="flex items-center px-3 py-3 gap-4">
                        <Avatar url={u.photo_url} alt={displayName(u)} size={48} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base truncate">{displayName(u)}</div>
                          <div className="text-[var(--tg-hint-color)] text-xs truncate">
                            {u.username ? `@${u.username}` : ""}
                          </div>
                        </div>

                        {/* Чипы: Я должен (out) — Мне должны (in). Показываем ВСЕГДА (для имеющихся валют) */}
                        <div className="hidden sm:flex items-center gap-2 mr-2">
                          {leftTotals.map(([ccy, sum]) => (
                            <Chip key={`u-${u.id}-L-${ccy}`} dir="out" amount={sum} currency={ccy} />
                          ))}
                          {rightTotals.map(([ccy, sum]) => (
                            <Chip key={`u-${u.id}-R-${ccy}`} dir="in" amount={sum} currency={ccy} />
                          ))}
                        </div>

                        {/* На узких экранах чипы в две маленькие кучки */}
                        <div className="sm:hidden flex flex-col items-end gap-1 mr-2">
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {leftTotals.map(([ccy, sum]) => (
                              <Chip key={`u-${u.id}-L-${ccy}`} dir="out" amount={sum} currency={ccy} />
                            ))}
                          </div>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {rightTotals.map(([ccy, sum]) => (
                              <Chip key={`u-${u.id}-R-${ccy}`} dir="in" amount={sum} currency={ccy} />
                            ))}
                          </div>
                        </div>

                        <ChevronDown
                          size={18}
                          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </div>
                    </button>

                    {/* разделитель как в ContactsList — после шапки */}
                    {idx !== participants.length - 1 && !expanded && (
                      <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                    )}

                    {/* Развёрнутый блок: Пары u1–u2 (БЕЗ чипов) */}
                    {expanded && (
                      <div className="px-3 pb-3">
                        {sec.pairs.length === 0 ? (
                          <div className="text-[13px] text-[var(--tg-hint-color)]">
                            {t("group_balance_no_debts_all")}
                          </div>
                        ) : (
                          sec.pairs.map((pair, pIdx) => {
                            const leftEntries = Object.entries(pair.left)
                              .filter(([, v]) => v > 0)
                              .sort((a, b) => a[0].localeCompare(b[0]));
                            const rightEntries = Object.entries(pair.right)
                              .filter(([, v]) => v > 0)
                              .sort((a, b) => a[0].localeCompare(b[0]));
                            const Lfull = leftEntries.length;
                            const Rfull = rightEntries.length;

                            const iAmU1 = myId === pair.u1.id;
                            const iAmU2 = myId === pair.u2.id;

                            const PairHeader = (
                              <div
                                className="grid items-center"
                                style={{ gridTemplateColumns: "1fr auto 1fr", columnGap: 8 }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar url={pair.u1.photo_url} alt={firstOnly(pair.u1)} size={AVA} />
                                  <div
                                    className="text-[14px] font-medium truncate"
                                    style={{ color: "var(--tg-text-color)" }}
                                    title={firstOnly(pair.u1)}
                                  >
                                    {firstOnly(pair.u1)}
                                  </div>
                                </div>
                                <div className="justify-self-center">
                                  <ArrowLeftRight
                                    size={20}
                                    style={{ opacity: 0.7, color: "var(--tg-hint-color)" }}
                                    aria-hidden
                                  />
                                </div>
                                <div className="flex items-center gap-2 min-w-0 justify-end">
                                  <Avatar url={pair.u2.photo_url} alt={firstOnly(pair.u2)} size={AVA} />
                                  <div
                                    className="text-[14px] font-medium truncate"
                                    style={{ color: "var(--tg-text-color)" }}
                                    title={firstOnly(pair.u2)}
                                  >
                                    {firstOnly(pair.u2)}
                                  </div>
                                </div>
                              </div>
                            );

                            const RightBell =
                              (pair.u1.id === u.id) && Rfull > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const amounts: Record<string, number> = {};
                                    for (const [ccy, amt] of rightEntries) amounts[ccy] = (amounts[ccy] || 0) + amt;
                                    triggerRemind(pair.u2, amounts);
                                  }}
                                  className={btn3D}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
                                </button>
                              ) : null;

                            const LeftBell =
                              (pair.u1.id === u.id) && Lfull > 0 && myId === pair.u2.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const amounts: Record<string, number> = {};
                                    for (const [ccy, amt] of leftEntries) amounts[ccy] = (amounts[ccy] || 0) + amt;
                                    triggerRemind(pair.u1, amounts);
                                  }}
                                  className={btn3D}
                                  aria-label={t("remind_debt") as string}
                                  title={t("remind_debt") as string}
                                >
                                  <Bell size={18} />
                                </button>
                              ) : null;

                            const leftMinH =
                              Math.max(1, Math.min(2, Lfull)) * LINE_H +
                              Math.max(0, Math.min(2, Lfull) - 1) * V_GAP;
                            const rightMinH =
                              Math.max(1, Math.min(2, Rfull)) * LINE_H +
                              Math.max(0, Math.min(2, Rfull) - 1) * V_GAP;

                            return (
                              <div key={`pair-${u.id}-${pair.u2.id}-${pIdx}`} className="py-2">
                                {PairHeader}

                                <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                  {/* u1 -> u2 (красные) */}
                                  <div className="min-w-0">
                                    <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                                      <div
                                        className="flex flex-col gap-[6px]"
                                        style={{ minHeight: leftMinH, justifyContent: "flex-start" }}
                                      >
                                        {leftEntries.slice(0, 2).map(([ccy, amt], i) => (
                                          <div
                                            key={`pair-L-${ccy}-${i}`}
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
                                            {/* «Рассчитаться» если я должник (u1) */}
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
                                      </div>
                                      <div className="flex items-center justify-end">{LeftBell}</div>
                                    </div>
                                  </div>

                                  {/* u2 -> u1 (зелёные) */}
                                  <div className="min-w-0">
                                    <div className="grid" style={{ gridTemplateColumns: "1fr auto", columnGap: 6 }}>
                                      <div
                                        className="flex flex-col gap-[6px]"
                                        style={{ minHeight: rightMinH, justifyContent: "flex-start" }}
                                      >
                                        {rightEntries.slice(0, 2).map(([ccy, amt], i) => (
                                          <div
                                            key={`pair-R-${ccy}-${i}`}
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
                                            {/* «Рассчитаться» если я должник (u2) */}
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
                                      </div>
                                      <div className="flex items-center justify-end">{RightBell}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* разделитель между парами */}
                                {pIdx !== sec.pairs.length - 1 && (
                                  <div className="mt-2">
                                    <Divider />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* разделитель между участниками (как в ContactsList) */}
                    {idx !== participants.length - 1 && expanded && (
                      <div className="h-px bg-[var(--tg-hint-color)] opacity-15" />
                    )}
                  </div>
                );
              })
            )}

            {/* Кнопка «Раскрыть все» */}
            {participants.length > 0 && (
              <div className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => expandAll(participants.map((u) => u.id))}
                  className="w-full h-10 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-semibold active:scale-95 transition"
                >
                  {t("expand_all") || "Раскрыть все"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модалка «Текст скопирован…» */}
      {remindOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center" tabIndex={-1}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setRemindOpen(false)} />
          <div
            className="relative max-w-[90vw] w-[440px] rounded-xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
            style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute top-2 right-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setRemindOpen(false)}
              aria-label={t("close") as string}
              title={t("close") as string}
            >
              <X size={18} />
            </button>

            <div className="text-[15px] font-semibold mb-1">{t("reminder_copied_title")}</div>
            <div className="text-[14px] opacity-80 mb-3">{t("reminder_copied_desc")}</div>

            <div
              className="max-h-[200px] overflow-auto rounded-lg border p-2 text-[13px] mb-3"
              style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
            >
              <pre className="whitespace-pre-wrap break-words m-0">{remindMessage}</pre>
            </div>

            {remindUsername ? (
              <button
                type="button"
                onClick={openTelegram}
                className="w-full h-10 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-semibold active:scale-95 transition"
              >
                {t("contact.open_in_telegram")}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
