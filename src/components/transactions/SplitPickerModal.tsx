// src/components/transactions/SplitPickerModal.tsx
// Модалка выбора способа деления: Equal / Shares / Custom, с ALL, выбором участников,
// строгая проверка суммы в Custom (без совпадения сохранить нельзя).
// Экспортирует утилиту computePerPerson для превью в родительской модалке.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckSquare, Square } from "lucide-react";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { GroupMember } from "../../types/group_member";

type Currency = { code: string; symbol: string; decimals: number };

export type SplitSelection =
  | { type: "equal"; participants: Array<{ user_id: number; name: string; avatar_url?: string | null }> }
  | { type: "shares"; participants: Array<{ user_id: number; name: string; avatar_url?: string | null; share: number }> }
  | { type: "custom"; participants: Array<{ user_id: number; name: string; avatar_url?: string | null; amount: number }> };

export type PerPerson = { user_id: number; name: string; avatar_url?: string | null; amount: number };

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  amount: number; // в валюте (major units)
  currency: Currency;
  initial: SplitSelection;
  paidById?: number; // НОВОЕ: плательщик — нельзя снять
  onSave: (sel: SplitSelection) => void;
};

function fullName(u: any): string {
  const a = (u?.first_name || "").trim();
  const b = (u?.last_name || "").trim();
  const uname = (u?.username || "").trim();
  const fallback = (u?.name || "").trim();
  const name = [a, b].filter(Boolean).join(" ") || fallback || uname || "User";
  return name;
}
function firstNameOnly(s: string) { return (s || "").split(/\s+/)[0] || s || ""; }

function toMinor(n: number, decimals: number) {
  return Math.round(n * Math.pow(10, decimals));
}
function fromMinor(v: number, decimals: number) {
  return v / Math.pow(10, decimals);
}

// распределение по долям с «честным» остатком
function fairDistribute(total: number, weights: number[], decimals: number): number[] {
  const T = toMinor(total, decimals);
  const sumW = weights.reduce((s, w) => s + w, 0);
  if (sumW <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (T * w) / sumW);
  const floors = raw.map((x) => Math.floor(x));
  let used = floors.reduce((s, x) => s + x, 0);
  let rem = T - used;

  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac)
    .map((o) => o.i);

  const result = [...floors];
  let k = 0;
  while (rem > 0) {
    result[order[k % order.length]] += 1;
    k += 1;
    rem -= 1;
  }
  return result.map((v) => fromMinor(v, decimals));
}

export function computePerPerson(selection: SplitSelection, total: number, decimals: number): PerPerson[] {
  if (total <= 0) return [];
  if (selection.type === "equal") {
    const ids = selection.participants;
    if (!ids.length) return [];
    const weights = ids.map(() => 1);
    const amounts = fairDistribute(total, weights, decimals);
    return ids.map((p, idx) => ({ user_id: p.user_id, name: p.name, avatar_url: p.avatar_url, amount: amounts[idx] }));
  }
  if (selection.type === "shares") {
    const ps = selection.participants;
    const weights = ps.map((p) => Math.max(0, p.share || 0));
    if (weights.reduce((s, w) => s + w, 0) <= 0) return [];
    const amounts = fairDistribute(total, weights, decimals);
    return ps.map((p, idx) => ({ user_id: p.user_id, name: p.name, avatar_url: p.avatar_url, amount: amounts[idx] }));
  }
  // custom
  return selection.participants.map((p) => ({ user_id: p.user_id, name: p.name, avatar_url: p.avatar_url, amount: p.amount }));
}

// type guard
function isShares(sel: SplitSelection): sel is Extract<SplitSelection, { type: "shares" }> {
  return sel.type === "shares";
}

// @ts-ignore – экспорт-обёртка, чтобы можно было навесить статическое свойство ниже
export default function SplitPickerModal(props: Props) { return InnerSplitPickerModal(props); }

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center ${checked ? "border-[var(--tg-link-color)] bg-[var(--tg-accent-color,#40A7E3)]/10" : "border-[var(--tg-hint-color)]/70"}`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path d="M20 6L9 17l-5-5" stroke="var(--tg-link-color)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

function InnerSplitPickerModal({ open, onClose, groupId, amount, currency, initial, paidById, onSave }: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);

  const [mode, setMode] = useState<"equal" | "shares" | "custom">(initial?.type ?? "equal");
  const [equalSel, setEqualSel] = useState<Set<number>>(new Set());
  const [shares, setShares] = useState<Map<number, number>>(new Map());
  const [custom, setCustom] = useState<Map<number, number>>(new Map()); // major units

  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open || !groupId) return;

    // init from initial
    setMode(initial?.type ?? "equal");
    setEqualSel(new Set(initial?.type === "equal" ? initial.participants.map((p) => p.user_id) : []));
    setShares(new Map(initial?.type === "shares" ? initial.participants.map((p) => [p.user_id, p.share]) : []));
    setCustom(new Map(initial?.type === "custom" ? initial.participants.map((p) => [p.user_id, p.amount]) : []));

    const myId = ++reqIdRef.current;
    (async () => {
      setLoading(true);
      try {
        // грузим всех (постранично)
        let offset = 0;
        const PAGE = 100;
        const acc: GroupMember[] = [];
        while (true) {
          const res = await getGroupMembers(groupId, offset, PAGE);
          const items = res?.items || [];
          acc.push(...items);
          offset += items.length;
          if (items.length < PAGE) break;
        }
        if (reqIdRef.current !== myId) return;
        setMembers(acc);

        // по умолчанию — Equal: все участники
        if (!initial || !("participants" in initial) || initial.participants.length === 0) {
          const all = new Set(acc.map((m) => m.user.id));
          setEqualSel(all);
        }
      } finally {
        if (reqIdRef.current === myId) setLoading(false);
      }
    })();
  }, [open, groupId, initial]);

  // Гарантируем, что плательщик всегда активен
  useEffect(() => {
    if (!paidById) return;
    if (mode === "equal") {
      setEqualSel((prev) => new Set(prev).add(paidById));
    } else if (mode === "shares") {
      setShares((prev) => {
        const m = new Map(prev);
        const v = m.get(paidById);
        if (!v || v < 1) m.set(paidById, 1);
        return m;
      });
    } else if (mode === "custom") {
      // если custom пуст — распределим поровну по всем
      setCustom((prev) => {
        if (prev.size > 0) return prev;
        const ids = (members || []).map((mm) => mm.user.id);
        const n = Math.max(1, ids.length);
        const part = Number((amount / n).toFixed(currency.decimals));
        const m = new Map<number, number>();
        ids.forEach((id) => m.set(id, part));
        return m;
      });
    }
  }, [mode, paidById, members, amount, currency.decimals]);

  const items = useMemo(() => members || [], [members]);

  const allIds = useMemo(() => new Set((members || []).map((m) => m.user.id)), [members]);
  const allSelected = useMemo(() => {
    if (mode === "equal") return allIds.size > 0 && Array.from(allIds).every((id) => equalSel.has(id));
    if (mode === "shares") return allIds.size > 0 && Array.from(allIds).every((id) => (shares.get(id) || 0) > 0);
    return allIds.size > 0 && Array.from(allIds).every((id) => (custom.get(id) || 0) > 0);
  }, [mode, allIds, equalSel, shares, custom]);

  const toggleAll = () => {
    if (mode === "equal") {
      const next = allSelected ? new Set<number>() : new Set(allIds);
      if (paidById) next.add(paidById);
      setEqualSel(next);
    } else if (mode === "shares") {
      if (allSelected) {
        const m = new Map<number, number>();
        if (paidById) m.set(paidById, 1);
        setShares(m);
      } else {
        const m = new Map<number, number>();
        allIds.forEach((id) => m.set(id, 1));
        if (paidById) m.set(paidById, Math.max(1, m.get(paidById) || 0));
        setShares(m);
      }
    } else {
      if (allSelected) {
        const m = new Map<number, number>();
        if (paidById) m.set(paidById, Number((amount / Math.max(1, allIds.size)).toFixed(currency.decimals)));
        setCustom(m);
      } else {
        const avg = amount > 0 ? (amount / Math.max(1, allIds.size)) : 0;
        const m = new Map<number, number>();
        allIds.forEach((id) => m.set(id, Number(avg.toFixed(currency.decimals))));
        setCustom(m);
      }
    }
  };

  // selection для предпросмотра/сохранения
  const selection: SplitSelection = useMemo(() => {
    const pack = (id: number) => {
      const m = members.find((mm) => mm.user.id === id);
      const name = firstNameOnly(fullName(m?.user));
      // ВАЖНО: поддерживаем и avatar_url, и photo_url
      const avatar = (m?.user as any)?.avatar_url || (m?.user as any)?.photo_url || null;
      return { user_id: id, name, avatar_url: avatar };
    };
    if (mode === "equal") {
      return { type: "equal", participants: Array.from(equalSel).map(pack) };
    }
    if (mode === "shares") {
      return { type: "shares", participants: Array.from(shares.entries()).filter(([, s]) => s > 0).map(([id, share]) => ({ ...pack(id), share })) };
    }
    return { type: "custom", participants: Array.from(custom.entries()).filter(([, a]) => a > 0).map(([id, amount]) => ({ ...pack(id), amount })) };
  }, [mode, equalSel, shares, custom, members]);

  const perPerson = useMemo(() => computePerPerson(selection, amount, currency.decimals), [selection, amount, currency.decimals]);

  const sumCustom = useMemo(() => {
    if (selection.type !== "custom") return null;
    const s = selection.participants.reduce((x, p) => x + (p.amount || 0), 0);
    return s;
  }, [selection]);

  const customMismatch = useMemo(() => {
    if (selection.type !== "custom") return false;
    const eps = 1 / Math.pow(10, currency.decimals);
    return Math.abs((sumCustom || 0) - (amount || 0)) > eps;
  }, [selection, sumCustom, amount, currency.decimals]);

  const totalShares = useMemo(() => (isShares(selection)
    ? selection.participants.reduce((s, p) => s + (p.share || 0), 0)
    : 0), [selection]);

  const canSave = useMemo(() => {
    if (selection.type === "equal") return selection.participants.length > 0;
    if (selection.type === "shares") return selection.participants.length > 0 && totalShares > 0;
    return selection.participants.length > 0 && !customMismatch;
  }, [selection, totalShares, customMismatch]);

  if (!open) return null;

  const allLabel = t("tx_modal.all") || (locale === "ru" ? "ВСЕ" : locale === "es" ? "TODOS" : "ALL");

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.split")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        {/* mode switch + ALL */}
        <div className="px-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
              <button className={`px-3 h-9 text-[13px] ${mode === "equal" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`} onClick={() => setMode("equal")}>{t("tx_modal.split_equal")}</button>
              <button className={`px-3 h-9 text-[13px] ${mode === "shares" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`} onClick={() => setMode("shares")}>{t("tx_modal.split_shares")}</button>
              <button className={`px-3 h-9 text-[13px] ${mode === "custom" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : ""}`} onClick={() => setMode("custom")}>{t("tx_modal.split_custom")}</button>
            </div>

            <button
              type="button"
              onClick={toggleAll}
              className={`ml-3 inline-flex items-center gap-2 px-3 h-9 rounded-full border transition ${
                allSelected
                  ? "border-[var(--tg-link-color)] bg-[var(--tg-accent-color,#40A7E3)]/10"
                  : "border-[var(--tg-hint-color)]/50"
              }`}
            >
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} className="opacity-70" />}
              <span className="text-[13px] font-medium">{allLabel}</span>
            </button>
          </div>
        </div>

        {/* список участников */}
        <div className="flex-1 overflow-y-auto mt-1">
          {items.map((m) => {
            const u = m.user;
            const id = u.id;
            const name = firstNameOnly(fullName(u));
            const avatar = (u as any)?.avatar_url || (u as any)?.photo_url;

            let right: React.ReactNode = null;
            if (mode === "equal") {
              const checked = equalSel.has(id);
              right = <Checkbox checked={checked} />;
            } else if (mode === "shares") {
              const val = shares.get(id) || 0;
              right = (
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)]"
                    onClick={() => {
                      const next = new Map(shares);
                      const nv = Math.max(id === paidById ? 1 : 0, (next.get(id) || 0) - 1);
                      next.set(id, nv);
                      setShares(next);
                    }}
                  >−</button>
                  <input
                    value={String(val)}
                    onChange={(e) => {
                      let n = Math.floor(Number(e.target.value) || 0);
                      if (id === paidById) n = Math.max(1, n);
                      else n = Math.max(0, n);
                      const next = new Map(shares);
                      next.set(id, n);
                      setShares(next);
                    }}
                    inputMode="numeric"
                    className="w-12 text-center bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]"
                  />
                  <button
                    className="px-2 py-1 rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)]"
                    onClick={() => setShares(new Map(shares.set(id, (shares.get(id) || 0) + 1)))}
                  >+</button>
                </div>
              );
            } else {
              const val = custom.get(id) || 0;
              right = (
                <input
                  value={val === 0 ? "" : String(val)}
                  onChange={(e) => {
                    let s = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                    const firstDot = s.indexOf(".");
                    if (firstDot !== -1) {
                      const head = s.slice(0, firstDot + 1);
                      const tail = s.slice(firstDot + 1).replace(/\./g, "");
                      s = head + tail;
                    }
                    if (s.includes(".")) {
                      const [int, dec] = s.split(".");
                      s = int + "." + dec.slice(0, currency.decimals);
                    }
                    const n = Number(s || 0);
                    setCustom(new Map(custom.set(id, isFinite(n) ? n : 0)));
                  }}
                  inputMode="decimal"
                  placeholder="0"
                  className="w-24 text-right bg-transparent outline-none border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]"
                />
              );
            }

            const isLocked = mode === "equal" && paidById === id;

            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "equal") {
                      if (paidById === id) return; // Нельзя снять плательщика
                      const next = new Set(equalSel);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      // ещё раз гарантируем плательщика
                      if (paidById) next.add(paidById);
                      setEqualSel(next);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${isLocked ? "cursor-default" : ""}`}
                >
                  <div className="flex items-center min-w-0">
                    {avatar ? (
                      <img src={avatar} alt="" className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />
                    ) : (
                      <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: "var(--tg-link-color)" }}>
                        <span style={{ fontSize: 16 }}>{name?.[0] || "U"}</span>
                      </div>
                    )}
                    <div className="flex flex-col text-left min-w-0">
                      <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">
                        {name}{isLocked ? " • " + (t("tx_modal.paid_by") || "Paid by") : ""}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3">{right}</div>
                </button>
                <div className="absolute left-[74px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
              </div>
            );
          })}

          {!loading && items.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">
              {t("contacts_not_found")}
            </div>
          )}
          {loading && (
            <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">
              {t("loading")}
            </div>
          )}
        </div>

        {/* итоги / ошибки */}
        <div className="px-4 py-3 border-t border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          {selection.type === "equal" && (
            <div className="text-[13px] opacity-80">
              {(locale.startsWith("ru") ? "Участников" : "Participants")}: {selection.participants.length} • {(locale.startsWith("ru") ? "по" : "≈ each")}{" "}
              {(() => {
                const n = perPerson[0]?.amount || (amount / Math.max(1, selection.participants.length));
                try { return new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(n) + " " + currency.symbol; }
                catch { return n.toFixed(currency.decimals) + " " + currency.symbol; }
              })()}
            </div>
          )}
          {selection.type === "shares" && (
            <div className="text-[13px] opacity-80">
              {(locale.startsWith("ru") ? "Всего долей" : "Total shares")}: {totalShares} • {(locale.startsWith("ru") ? "за долю ≈" : "per share ≈")}{" "}
              {(() => {
                const n = (amount / Math.max(1, totalShares)) || 0;
                try { return new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(n) + " " + currency.symbol; }
                catch { return n.toFixed(currency.decimals) + " " + currency.symbol; }
              })()}
            </div>
          )}
          {selection.type === "custom" && (
            <div className={`text-[13px] ${customMismatch ? "text-red-500" : "opacity-80"}`}>
              {locale.startsWith("ru")
                ? `По участникам: ${new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(sumCustom || 0)} ${currency.symbol} • Общая: ${new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(amount)} ${currency.symbol}`
                : `Participants: ${new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(sumCustom || 0)} ${currency.symbol} • Total: ${new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }).format(amount)} ${currency.symbol}`
              }
            </div>
          )}

          <div className="mt-2 flex gap-8 justify-end">
            <button className="px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]" onClick={onClose}>
              {t("cancel")}
            </button>
            <button
              className="px-4 py-2 rounded-xl text-white bg-[var(--tg-accent-color,#40A7E3)] disabled:opacity-60"
              disabled={!canSave}
              onClick={() => onSave(selection)}
            >
              {t("save") || "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Чтобы можно было использовать статически из родителя
(SplitPickerModal as any).computePerPerson = computePerPerson;
