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
import { getGroupMembers } from "../../api/groupMembersApi";
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
const AVA_MINE = 32;       // для вкладки "Мой баланс"
const AVA_ALL = 48;        // для вкладки "Все балансы" — как в UserCard

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

function Avatar({ url, alt, size }: { url?: string; alt?: string; size: number }) {
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

type CurrencyLine = { currency: string; amount: number };
type CardItem = { user: User; lines: CurrencyLine[]; total: number };

const btn3D =
  "h-8 px-3 rounded-xl text-[13px] font-semibold active:scale-95 transition " +
  "bg-gradient-to-b from-[color:var(--tg-secondary-bg-color,#e7e7e7)] to-[color:rgba(0,0,0,0.04)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105";

const LINE_H = 22;
const V_GAP = 6;

const Divider = ({ leftPx = AVA_MINE + 24 }) => (
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

/* ===== Helpers for inline money preview ===== */
function moneyEntriesFromTotals(totals: Record<string, number>) {
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[0].localeCompare(b[0])) as [string, number][];
}
function moneyPlainText(entries: [string, number][], locale: string) {
  return entries.map(([ccy, amt]) => fmtAmountSmart(amt, ccy, locale)).join("; ");
}
function MoneyInline({
  entries,
  colorClass,
  locale,
}: {
  entries: [string, number][];
  colorClass: string;
  locale: string;
}) {
  return (
    <span className="inline whitespace-normal break-normal">
      {entries.map(([ccy, amt], i) => (
        <span key={`${ccy}-${i}`} className="inline">
          <span className={`font-semibold ${colorClass} whitespace-nowrap`}>
            {fmtAmountSmart(amt, ccy, locale)}
          </span>
          {i < entries.length - 1 ? "; " : ""}
        </span>
      ))}
    </span>
  );
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

  // ===== Загрузка участников для «Все балансы»
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      if (!groupId) return;
      try {
        setMembersLoading(true);
        const res = await getGroupMembers(groupId as number);
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
  }: {
    leftCards: CardItem[];
    rightCards: CardItem[];
    leftTotals: Record<string, number>;
    rightTotals: Record<string, number>;
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
    const maxLen = Math.max(leftCards.length, rightCards.length);
    const rows: Array<{ left?: CardItem; right?: CardItem }> = [];
    for (let i = 0; i < maxLen; i++) rows.push({ left: leftCards[i], right: rightCards[i] });
    return rows;
  }, [leftCards, rightCards]);

  /* ---------- Все балансы: агрегация пар ---------- */
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

  const buildSectionForUser = useCallback(
    (u1: User) => {
      const sumsLeft: SumMap = {};
      const sumsRight: SumMap = {};
      const pairs: PairCard[] = [];

      for (const rec of pairAgg.values()) {
        const { low, high, lowToHigh, highToLow } = rec;
        if (u1.id === low.id) {
          const l: SumMap = {};
          const r: SumMap = {};
          for (const [ccy, amt] of Object.entries(lowToHigh)) {
            if (amt > 0) {
              l[ccy] = amt;
              sumsLeft[ccy] = (sumsLeft[ccy] || 0) + amt;
            }
          }
          for (const [ccy, amt] of Object.entries(highToLow)) {
            if (amt > 0) {
              r[ccy] = amt;
              sumsRight[ccy] = (sumsRight[ccy] || 0) + amt;
            }
          }
          if (Object.keys(l).length || Object.keys(r).length) {
            pairs.push({ u1, u2: high, left: l, right: r });
          }
        } else if (u1.id === high.id) {
          const l: SumMap = {};
          const r: SumMap = {};
          for (const [ccy, amt] of Object.entries(highToLow)) {
            if (amt > 0) {
              l[ccy] = amt;
              sumsLeft[ccy] = (sumsLeft[ccy] || 0) + amt;
            }
          }
          for (const [ccy, amt] of Object.entries(lowToHigh)) {
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

      // сортировка пар по имени u2
      const nameKey = (u: User) => (displayName(u) || `#${u.id}`).toLowerCase();
      pairs.sort(
        (A, B) => nameKey(A.u2).localeCompare(nameKey(B.u2), locale, { sensitivity: "base" }) || A.u2.id - B.u2.id
      );

      return { u1, pairs, sumsLeft, sumsRight };
    },
    [pairAgg, locale]
  );

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

  // ============ Состояние разворотов «Все балансы» ============
  const [expandedAllMap, setExpandedAllMap] = useState<Record<number, boolean>>({});
  const toggleAllItem = (uid: number) =>
    setExpandedAllMap((m) => ({ ...m, [uid]: !m[uid] }));
  const expandAll = (uids: number[]) =>
    setExpandedAllMap((m) => {
      const next: Record<number, boolean> = { ...m };
      for (const id of uids) next[id] = true;
      return next;
    });
  const collapseAll = (uids: number[]) =>
    setExpandedAllMap((m) => {
      const next: Record<number, boolean> = { ...m };
      for (const id of uids) next[id] = false;
      return next;
    });

  /* ===== Участники с долгами (фильтр) ===== */
  const participantsRaw: User[] = useMemo(() => {
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

  // Чтобы не пересчитывать buildSectionForUser многократно, сделаем кэш
  const sectionsByUser = useMemo(() => {
    const map = new Map<number, ReturnType<typeof buildSectionForUser>>();
    for (const u of participantsRaw) {
      map.set(u.id, buildSectionForUser(u));
    }
    return map;
  }, [participantsRaw, buildSectionForUser]);

  const participants = useMemo(() => {
    return participantsRaw.filter((u) => {
      const sec = sectionsByUser.get(u.id);
      if (!sec) return false;
      const hasLeft = Object.values(sec.sumsLeft).some((v) => v > 0);
      const hasRight = Object.values(sec.sumsRight).some((v) => v > 0);
      return hasLeft || hasRight;
    });
  }, [participantsRaw, sectionsByUser]);

  const anyExpanded = useMemo(
    () => participants.some((u) => expandedAllMap[u.id]),
    [participants, expandedAllMap]
  );

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
          /* ================= Мой баланс ================= */
          <div>
            {/* Превью-строки (без заголовков сверху) — в стиле GroupCard */}
            <div
              className="grid gap-2 mb-2 text-[12px] leading-[14px] text-[var(--tg-text-color)]"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div className="min-w-0">
                {moneyEntriesFromTotals(leftTotals).length === 0 ? (
                  <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_left")}</span>
                ) : (
                  <>
                    <span>{t("i_owe")}: </span>
                    <MoneyInline entries={moneyEntriesFromTotals(leftTotals)} colorClass="text-red-500" locale={locale} />
                  </>
                )}
              </div>
              <div className="min-w-0">
                {moneyEntriesFromTotals(rightTotals).length === 0 ? (
                  <span className="text-[var(--tg-hint-color)]">{t("group_balance_no_debts_right")}</span>
                ) : (
                  <>
                    <span>{t("they_owe_me")}: </span>
                    <MoneyInline entries={moneyEntriesFromTotals(rightTotals)} colorClass="text-green-600" locale={locale} />
                  </>
                )}
              </div>
            </div>

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
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={left.user.photo_url} alt={firstOnly(left.user)} size={AVA_MINE} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(left.user)}
                            >
                              {firstOnly(left.user)}
                            </div>
                          </div>

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
                                <div className="flex items-center gap-1">
                                  <ArrowRight size={14} style={{ color: "var(--tg-destructive-text,#d7263d)" }} aria-hidden />
                                  <span className="text-[14px] font-semibold" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                                    {fmtAmountSmart(ln.amount, ln.currency, locale)}
                                  </span>
                                </div>
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
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar url={right.user.photo_url} alt={firstOnly(right.user)} size={AVA_MINE} />
                            <div
                              className="text-[14px] font-medium truncate"
                              style={{ color: "var(--tg-text-color)" }}
                              title={firstOnly(right.user)}
                            >
                              {firstOnly(right.user)}
                            </div>
                          </div>

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
                                  <div className="flex items-center gap-1">
                                    <ArrowLeft size={14} style={{ color: "var(--tg-success-text,#1aab55)" }} aria-hidden />
                                    <span className="text-[14px] font-semibold" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                                      {fmtAmountSmart(ln.amount, ln.currency, locale)}
                                    </span>
                                  </div>
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
          <div className="overflow-hidden">
            {membersLoading && (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">{t("loading")}</div>
            )}

            {/* Если в группе реально нет долгов */}
            {participants.length === 0 && !membersLoading ? (
              <div className="px-3 py-3 text-sm text-[var(--tg-hint-color)]">
                {t("group_balance_no_debts_all")}
              </div>
            ) : (
              participants.map((u, idx) => {
                const sec = sectionsByUser.get(u.id)!;
                const expanded = !!expandedAllMap[u.id];
                const viewerIsU = myId === u.id;

                const leftTotalsEntries = moneyEntriesFromTotals(sec.sumsLeft);
                const rightTotalsEntries = moneyEntriesFromTotals(sec.sumsRight);
                const leftText = moneyPlainText(leftTotalsEntries, locale);
                const rightText = moneyPlainText(rightTotalsEntries, locale);

                // утилита: вставка цветной суммы внутрь шаблона t("group_balance_he_*", { sum })
                const withColoredSum = (
                  key: "group_balance_he_owes" | "group_balance_he_get",
                  entries: [string, number][],
                  colorClass: string
                ) => {
                  const tpl = t(key, { sum: "[[SUM]]" });
                  const parts = String(tpl).split("[[SUM]]");
                  return (
                    <>
                      {parts[0] || ""}
                      <MoneyInline entries={entries} colorClass={colorClass} locale={locale} />
                      {parts[1] || ""}
                    </>
                  );
                };

                return (
                  <div key={`u-${u.id}`} className="relative">
                    {/* Свёрнутое состояние — всё по левому краю */}
                    {!expanded && (
                      <button
                        type="button"
                        onClick={() => toggleAllItem(u.id)}
                        className="w-full active:opacity-70 text-left"
                      >
                        <div className="flex items-start px-3 py-3 gap-4">
                          <Avatar url={u.photo_url} alt={displayName(u)} size={AVA_ALL} />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base truncate">{displayName(u)}</div>
                            <div className="text-[var(--tg-hint-color)] text-xs truncate">
                              {u.username ? `@${u.username}` : ""}
                            </div>

                            {/* Две строки: суммы цветные как на GroupCard */}
                            <div className="mt-1 flex flex-col gap-[2px] text-[12px] leading-[14px] text-[var(--tg-text-color)]">
                              <div className="min-w-0 truncate" title={leftText || undefined}>
                                {leftTotalsEntries.length === 0
                                  ? t("group_balance_no_debts_left_all")
                                  : withColoredSum("group_balance_he_owes", leftTotalsEntries, "text-red-500")}
                              </div>
                              <div className="min-w-0 truncate" title={rightText || undefined}>
                                {rightTotalsEntries.length === 0
                                  ? t("group_balance_no_debts_right_all")
                                  : withColoredSum("group_balance_he_get", rightTotalsEntries, "text-green-600")}
                              </div>
                            </div>
                          </div>

                          {/* Кнопка раскрыть (вниз) */}
                          <ChevronDown size={18} className="mt-1 shrink-0" aria-hidden />
                        </div>
                      </button>
                    )}

                    {/* Разделитель как в ContactsList — когда элемент свернут */}
                    {idx !== participants.length - 1 && !expanded && (
                      <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                    )}

                    {/* Развёрнутое состояние */}
                    {expanded && (
                      <div className="px-3 pb-3">
                        {/* Кнопка свернуть (стрелка вверх) справа */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleAllItem(u.id)}
                            className="p-1 rounded-md text-[var(--tg-hint-color)] hover:opacity-80 active:scale-95"
                            aria-label={t("close") || "Свернуть"}
                          >
                            <ChevronDown size={18} className="rotate-180" />
                          </button>
                        </div>

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

                            const leftMinH =
                              Math.max(1, Math.min(2, Lfull)) * LINE_H +
                              Math.max(0, Math.min(2, Lfull) - 1) * V_GAP;
                            const rightMinH =
                              Math.max(1, Math.min(2, Rfull)) * LINE_H +
                              Math.max(0, Math.min(2, Rfull) - 1) * V_GAP;

                            return (
                              <div key={`pair-${u.id}-${pair.u2.id}-${pIdx}`} className="py-1">
                                {/* Заголовок пары: u1 слева, стрелки строго по центру, u2 слева сразу после стрелок */}
                                <div
                                  className="grid items-center"
                                  style={{ gridTemplateColumns: "1fr auto 1fr", columnGap: 8 }}
                                >
                                  <div className="flex items-center gap-2 min-w-0 justify-start">
                                    <Avatar url={pair.u1.photo_url} alt={firstOnly(pair.u1)} size={AVA_ALL} />
                                    <div
                                      className="text-[14px] font-medium truncate"
                                      style={{ color: "var(--tg-text-color)" }}
                                      title={firstOnly(pair.u1)}
                                    >
                                      {firstOnly(pair.u1)}
                                    </div>
                                  </div>

                                  <div className="justify-self-center">
                                    <ArrowLeftRight size={20} style={{ opacity: 0.7, color: "var(--tg-hint-color)" }} aria-hidden />
                                  </div>

                                  <div className="flex items-center gap-2 min-w-0 justify-start">
                                    <Avatar url={pair.u2.photo_url} alt={firstOnly(pair.u2)} size={AVA_ALL} />
                                    <div
                                      className="text-[14px] font-medium truncate"
                                      style={{ color: "var(--tg-text-color)" }}
                                      title={firstOnly(pair.u2)}
                                    >
                                      {firstOnly(pair.u2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                  {/* u1 -> u2 (красные) + «Рассчитаться» ТОЛЬКО в своей секции и только слева */}
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
                                            <div className="flex items-center gap-1">
                                              <ArrowRight size={14} style={{ color: "var(--tg-destructive-text,#d7263d)" }} aria-hidden />
                                              <span className="text-[14px] font-semibold" style={{ color: "var(--tg-destructive-text,#d7263d)" }}>
                                                {fmtAmountSmart(amt, ccy, locale)}
                                              </span>
                                            </div>
                                            {viewerIsU ? (
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
                                      {/* Слева «Напомнить» не показываем */}
                                      <div />
                                    </div>
                                  </div>

                                  {/* u2 -> u1 (зелёные) + «Напомнить» ТОЛЬКО если это моя секция (я кредитор) */}
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
                                            <div className="flex items-center gap-1">
                                              <ArrowLeft size={14} style={{ color: "var(--tg-success-text,#1aab55)" }} aria-hidden />
                                              <span className="text-[14px] font-semibold" style={{ color: "var(--tg-success-text,#1aab55)" }}>
                                                {fmtAmountSmart(amt, ccy, locale)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      {/* «Напомнить» справа только у кредитора */}
                                      <div className="flex items-center justify-end">
                                        {viewerIsU && rightEntries.length > 0 ? (
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
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* разделитель между u1-u2 — на всю ширину без боковых отступов */}
                                {pIdx !== sec.pairs.length - 1 && (
                                  <div className="-mx-3 mt-2">
                                    <div className="h-px bg-[var(--tg-hint-color)] opacity-15" />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* разделитель между участниками после разворота — на всю ширину */}
                    {idx !== participants.length - 1 && expanded && (
                      <div className="-mx-3">
                        <div className="h-px bg-[var(--tg-hint-color)] opacity-15" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Кнопка «Раскрыть все» / «Свернуть все» */}
            {participants.length > 0 && (
              <div className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => (anyExpanded ? collapseAll(participants.map((u) => u.id)) : expandAll(participants.map((u) => u.id)))}
                  className="w-full h-10 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white font-semibold active:scale-95 transition"
                >
                  {anyExpanded ? (t("collapse_all") || "Свернуть все") : (t("expand_all") || "Раскрыть все")}
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
