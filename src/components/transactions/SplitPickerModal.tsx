// src/components/transactions/SplitPickerModal.tsx
// Выбор способа разделения: Equal / Shares / Custom + ALL, с валидацией.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FiltersRow from "../FiltersRow";
import { getGroupMembers } from "../../api/groupMembersApi";
import type { GroupMember } from "../../types/group_member";

export type SplitType = "equal" | "shares" | "custom";

export type SplitResult =
  | { type: "equal"; participants: { user_id: number; name: string; avatar_url?: string | null }[] }
  | { type: "shares"; participants: { user_id: number; name: string; avatar_url?: string | null; share: number }[] }
  | { type: "custom"; participants: { user_id: number; name: string; avatar_url?: string | null; amount: number }[] };

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  amount: number; // общая сумма
  currency: { code: string; symbol: string; decimals: number };
  initial?: SplitResult;
  onSave: (result: SplitResult) => void;
};

function norm(s: string) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function shortName(full: string): string { return (full || "").split(/\s+/)[0] || full || "User"; }
function toMinor(v: number, decimals: number) { return Math.round(v * 10 ** decimals); }
function fromMinor(v: number, decimals: number) { return v / 10 ** decimals; }

function parseAmountInput(raw: string, decimals: number): string {
  let s = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot + 1);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + tail;
  }
  if (s.includes(".")) {
    const [int, dec] = s.split(".");
    s = int + "." + dec.slice(0, decimals);
  }
  return s;
}

export default function SplitPickerModal({
  open,
  onClose,
  groupId,
  amount,
  currency,
  initial,
  onSave,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "ru").split("-")[0];

  const [mode, setMode] = useState<SplitType>(initial?.type || "equal");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [shares, setShares] = useState<Record<number, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({}); // строки для инпутов

  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open || !groupId) return;
    setSearch("");
    const myId = ++reqIdRef.current;

    (async () => {
      setLoading(true);
      try {
        let offset = 0;
        const acc: GroupMember[] = [];
        while (true) {
          const res = await getGroupMembers(groupId, offset, 200);
          const page: GroupMember[] = res?.items ?? [];
          acc.push(...page);
          offset += page.length;
          if (page.length < 200) break;
        }
        if (reqIdRef.current !== myId) return;
        setMembers(acc);

        // инициализация состояния по initial/по умолчанию
        const baseChecked: Record<number, boolean> = {};
        const baseShares: Record<number, number> = {};
        const baseCustom: Record<number, string> = {};

        if (initial?.type === "equal") {
          acc.forEach((m) => { baseChecked[m.user.id] = true; });
        } else if (initial?.type === "shares") {
          acc.forEach((m) => {
            const found = (initial as any).participants?.find((p: any) => p.user_id === m.user.id);
            baseShares[m.user.id] = Math.max(0, Number(found?.share || 0));
          });
        } else if (initial?.type === "custom") {
          acc.forEach((m) => {
            const found = (initial as any).participants?.find((p: any) => p.user_id === m.user.id);
            baseCustom[m.user.id] = typeof found?.amount === "number" ? found.amount.toFixed(currency.decimals) : "";
          });
        } else {
          acc.forEach((m) => { baseChecked[m.user.id] = true; });
        }

        setMode(initial?.type || "equal");
        setChecked(baseChecked);
        setShares(baseShares);
        setCustomAmounts(baseCustom);
      } catch {
        // ignore
      } finally {
        if (reqIdRef.current === myId) setLoading(false);
      }
    })();
  }, [open, groupId, initial, currency.decimals]);

  useEffect(() => { if (!open) setSearch(""); }, [open]);

  const list = useMemo(() => {
    const q = norm(search).trim();
    const src = members || [];
    if (!q) return src;
    return src.filter((m) => norm(`${m.user.first_name || ""} ${m.user.last_name || ""} ${m.user.username || ""}`).includes(q));
  }, [members, search]);

  const allSelected = useMemo(() => {
    if (mode !== "equal") return false;
    if (!list.length) return false;
    return list.every((m) => checked[m.user.id]);
  }, [mode, list, checked]);

  const toggleAll = () => {
    if (mode !== "equal") return;
    const next: Record<number, boolean> = { ...checked };
    const make = !allSelected;
    list.forEach((m) => { next[m.user.id] = make; });
    setChecked(next);
  };

  const nf = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }), [locale, currency.decimals]);

  // проверки
  const validation = useMemo(() => {
    if (mode === "equal") {
      const ids = members.filter((m) => checked[m.user.id]).map((m) => m.user.id);
      if (ids.length === 0) return { ok: false, reason: "no_participants" };
      return { ok: true as const };
    }
    if (mode === "shares") {
      const total = Object.values(shares).reduce((s, x) => s + (Number(x) || 0), 0);
      if (total <= 0) return { ok: false, reason: "no_shares" };
      return { ok: true as const };
    }
    // custom
    const targetMinor = toMinor(amount, currency.decimals);
    let sumMinor = 0;
    for (const m of members) {
      const raw = (customAmounts[m.user.id] || "").trim();
      if (!raw) continue;
      const n = Number(raw);
      if (isFinite(n)) sumMinor += toMinor(n, currency.decimals);
    }
    if (sumMinor !== targetMinor) {
      return { ok: false, reason: "custom_mismatch", sum: fromMinor(sumMinor, currency.decimals), target: amount };
    }
    if (sumMinor <= 0) return { ok: false, reason: "no_custom_values" };
    return { ok: true as const };
  }, [mode, members, checked, shares, customAmounts, amount, currency.decimals]);

  const save = () => {
    if (!validation.ok) return;
    if (mode === "equal") {
      const participants = members
        .filter((m) => checked[m.user.id])
        .map((m) => ({
          user_id: m.user.id,
          name: shortName(`${m.user.first_name || ""} ${m.user.last_name || ""}` || m.user.username || "User"),
          avatar_url: (m.user as any)?.photo_url,
        }));
      onSave({ type: "equal", participants });
      onClose();
      return;
    }
    if (mode === "shares") {
      const participants = members
        .filter((m) => (shares[m.user.id] || 0) > 0)
        .map((m) => ({
          user_id: m.user.id,
          share: Math.max(0, Math.floor(Number(shares[m.user.id]) || 0)),
          name: shortName(`${m.user.first_name || ""} ${m.user.last_name || ""}` || m.user.username || "User"),
          avatar_url: (m.user as any)?.photo_url,
        }));
      onSave({ type: "shares", participants });
      onClose();
      return;
    }
    // custom
    const participants = members
      .map((m) => {
        const raw = (customAmounts[m.user.id] || "").trim();
        const n = Number(raw);
        if (!raw || !isFinite(n) || n <= 0) return null;
        return {
          user_id: m.user.id,
          amount: n,
          name: shortName(`${m.user.first_name || ""} ${m.user.last_name || ""}` || m.user.username || "User"),
          avatar_url: (m.user as any)?.photo_url,
        };
      })
      .filter(Boolean) as any[];
    onSave({ type: "custom", participants });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("tx_modal.split")}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        {/* режимы */}
        <div className="px-4 pt-2 pb-1">
          <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
            <button type="button" onClick={() => setMode("equal")} className={`px-3 h-9 text-[13px] ${mode === "equal" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.split_equal")}</button>
            <button type="button" onClick={() => setMode("shares")} className={`px-3 h-9 text-[13px] ${mode === "shares" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.split_shares")}</button>
            <button type="button" onClick={() => setMode("custom")} className={`px-3 h-9 text-[13px] ${mode === "custom" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.split_custom")}</button>
          </div>
        </div>

        {/* поиск */}
        <div className="px-2 pt-1 pb-1">
          <FiltersRow search={search} setSearch={setSearch} />
        </div>

        {/* строка ALL для equal */}
        {mode === "equal" && (
          <div className="px-4 pb-1">
            <button onClick={toggleAll} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${allSelected ? "border-[var(--tg-link-color)] bg-[var(--tg-accent-color,#40A7E3)]/10" : "border-[var(--tg-hint-color)]/50 bg-[var(--tg-card-bg)]"}`}>
              <span className="text-sm">{t("tx_modal.all")}</span>
            </button>
          </div>
        )}

        {/* список участников */}
        <div className="flex-1 overflow-y-auto">
          {list.map((m) => {
            const baseName = shortName(`${m.user.first_name || ""} ${m.user.last_name || ""}` || m.user.username || "User");
            const avatar = (m.user as any)?.photo_url;

            if (mode === "equal") {
              const sel = !!checked[m.user.id];
              return (
                <label key={m.user.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <span className="flex items-center min-w-0">
                    {avatar ? (
                      <img src={avatar} alt={baseName} className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />
                    ) : (
                      <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: "#40A7E3" }}>
                        <span style={{ fontSize: 16 }}>{baseName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{baseName}</span>
                  </span>
                  <input type="checkbox" className="w-5 h-5" checked={sel} onChange={(e) => setChecked((s) => ({ ...s, [m.user.id]: e.target.checked }))} />
                </label>
              );
            }

            if (mode === "shares") {
              const val = Math.max(0, Number(shares[m.user.id] || 0));
              return (
                <div key={m.user.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <span className="flex items-center min-w-0">
                    {avatar ? (
                      <img src={avatar} alt={baseName} className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />
                    ) : (
                      <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: "#40A7E3" }}>
                        <span style={{ fontSize: 16 }}>{baseName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{baseName}</span>
                  </span>
                  <div className="inline-flex items-center gap-1">
                    <button className="px-2 py-1 rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)]" onClick={() => setShares((s) => ({ ...s, [m.user.id]: Math.max(0, (s[m.user.id] || 0) - 1) }))}>–</button>
                    <input
                      inputMode="numeric"
                      value={val}
                      onChange={(e) => {
                        const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setShares((s) => ({ ...s, [m.user.id]: n }));
                      }}
                      className="w-14 text-center rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-transparent py-1"
                    />
                    <button className="px-2 py-1 rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)]" onClick={() => setShares((s) => ({ ...s, [m.user.id]: (s[m.user.id] || 0) + 1 }))}>+</button>
                  </div>
                </div>
              );
            }

            // custom
            const raw = customAmounts[m.user.id] ?? "";
            return (
              <div key={m.user.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition">
                <span className="flex items-center min-w-0">
                  {avatar ? (
                    <img src={avatar} alt={baseName} className="mr-3 rounded-xl object-cover" style={{ width: 34, height: 34 }} />
                  ) : (
                    <div className="flex items-center justify-center mr-3 rounded-xl text-white" style={{ width: 34, height: 34, background: "#40A7E3" }}>
                      <span style={{ fontSize: 16 }}>{baseName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{baseName}</span>
                </span>
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs opacity-70">{currency.code}</span>
                  <input
                    inputMode="decimal"
                    value={raw}
                    onChange={(e) => {
                      const next = parseAmountInput(e.target.value, currency.decimals);
                      setCustomAmounts((s) => ({ ...s, [m.user.id]: next }));
                    }}
                    className="w-28 text-right rounded border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-transparent py-1 px-2"
                    placeholder={(0).toFixed(currency.decimals)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* итог / валидация */}
        <div className="px-4 py-3 border-t border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          {mode === "equal" && (
            <div className="text-sm opacity-80">
              {(() => {
                const ids = members.filter((m) => checked[m.user.id]).map((m) => m.user.id);
                const n = ids.length;
                const per = n > 0 ? amount / n : 0;
                return `${n} ${locale.startsWith("ru") ? "участников" : "people"} • ${nf.format(per)} ${currency.symbol}`;
              })()}
            </div>
          )}
          {mode === "shares" && (
            <div className="text-sm opacity-80">
              {(() => {
                const totalShares = Object.values(shares).reduce((s, x) => s + (Number(x) || 0), 0);
                const perShare = totalShares > 0 ? amount / totalShares : 0;
                return `${t("tx_modal.total_shares")}: ${totalShares} • ${nf.format(perShare)} ${currency.symbol}/${t("tx_modal.per_share")}`;
              })()}
            </div>
          )}
          {mode === "custom" && (
            <div className={`text-sm ${!validation.ok && (validation as any).reason === "custom_mismatch" ? "text-red-500" : "opacity-80"}`}>
              {(() => {
                let sum = 0;
                for (const v of Object.values(customAmounts)) {
                  const n = Number(v);
                  if (isFinite(n)) sum += n;
                }
                return `${locale.startsWith("ru") ? "Сумма по участникам" : "Participants total"}: ${nf.format(sum)} ${currency.symbol} • ${locale.startsWith("ru") ? "Итого" : "Total"}: ${nf.format(amount)} ${currency.symbol}`;
              })()}
            </div>
          )}

          {!validation.ok && (
            <div className="text-xs mt-1 text-red-500">
              {((r) => {
                switch (r) {
                  case "no_participants": return t("tx_modal.split_no_participants");
                  case "no_shares": return t("tx_modal.split_no_shares");
                  case "no_custom_values": return t("tx_modal.split_custom_no_values");
                  case "custom_mismatch": return t("tx_modal.split_custom_mismatch");
                  default: return "";
                }
              })((validation as any).reason)}
            </div>
          )}

          <div className="mt-2 flex gap-2 justify-end">
            <button className="px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]" onClick={onClose}>{t("cancel")}</button>
            <button
              className="px-3 py-2 rounded-xl bg-[var(--tg-accent-color,#40A7E3)] text-white disabled:opacity-60"
              onClick={save}
              disabled={!validation.ok}
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
