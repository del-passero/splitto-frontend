// src/components/group/GroupBalanceTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { getTransactions } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import { useUserStore } from "../../store/userStore";

type TxShare = { user_id: number; amount: number };
type Tx = {
  id: number | string;
  type: "expense" | "transfer";
  amount: number;
  currency?: string | null;
  paid_by?: number | null;
  created_by?: number | null;
  shares: TxShare[];
  from_user_id?: number | null;
  to_user_id?: number | null;
  transfer_from?: number | null;
  transfer_to?: number[] | number | null;
};

type User = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type MyDebt = { user: User; amount: number }; // >0 — вам должны, <0 — вы должны
type AllDebt = { from: User; to: User; amount: number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const isFiniteNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const decimalsByCode = (code?: string | null) => (code && ["JPY", "KRW", "VND"].includes(code) ? 0 : 2);
const fmtMoney = (n: number, code?: string | null) => {
  const d = decimalsByCode(code || undefined);
  try {
    return `${new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)} ${code || ""}`.trim();
  } catch {
    return `${n.toFixed(d)} ${code || ""}`.trim();
  }
};

function greedySettleUp(netMap: Map<number, number>) {
  const creditors = Array.from(netMap.entries()).filter(([, v]) => v > 1e-2).sort((a, b) => b[1] - a[1]);
  const debtors   = Array.from(netMap.entries()).filter(([, v]) => v < -1e-2).sort((a, b) => a[1] - b[1]);

  const res: Array<{ from_user_id: number; to_user_id: number; amount: number }> = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debId, dVal] = debtors[i];
    const [creId, cVal] = creditors[j];
    const amt = round2(Math.min(-dVal, cVal));
    if (amt <= 1e-2) { if (-dVal <= 1e-2) i++; if (cVal <= 1e-2) j++; continue; }
    res.push({ from_user_id: debId, to_user_id: creId, amount: amt });
    const newD = round2(dVal + amt);
    const newC = round2(cVal - amt);
    debtors[i][1] = newD;
    creditors[j][1] = newC;
    if (Math.abs(newD) <= 1e-2) i++;
    if (Math.abs(newC) <= 1e-2) j++;
  }
  return res;
}

// Нормализация транзакции из API -> Tx
function normalizeTx(raw: any): Tx {
  const type = (raw?.type === "transfer" ? "transfer" : "expense") as "expense" | "transfer";
  const amount = Number(raw?.amount ?? 0);
  const currency = (raw?.currency ?? "").toString().toUpperCase() || undefined;

  // shares всегда есть у expense (по твоим словам), но приводим к числам на всякий
  const sharesArr: TxShare[] = Array.isArray(raw?.shares)
    ? raw.shares.map((s: any) => ({
        user_id: Number(s?.user_id),
        amount: Number(s?.amount ?? 0),
      })).filter((s: TxShare) => Number.isFinite(s.user_id) && s.amount > 0)
    : [];

  // поля перевода могут приходить по-разному — аккуратно вытаскиваем
  const paid_by = raw?.paid_by != null ? Number(raw.paid_by) : (raw?.created_by != null ? Number(raw.created_by) : null);
  const created_by = raw?.created_by != null ? Number(raw.created_by) : null;

  const from_user_id =
    raw?.from_user_id != null ? Number(raw.from_user_id)
    : raw?.transfer_from != null ? Number(raw.transfer_from)
    : null;

  let to_user_id: number | null = null;
  if (raw?.to_user_id != null) {
    to_user_id = Number(raw.to_user_id);
  } else if (Array.isArray(raw?.transfer_to) && raw.transfer_to.length > 0) {
    to_user_id = Number(raw.transfer_to[0]);
  } else if (raw?.transfer_to != null) {
    to_user_id = Number(raw.transfer_to);
  }

  return {
    id: raw?.id ?? `${type}-${raw?.date ?? ""}-${amount}`,
    type,
    amount: Number.isFinite(amount) ? amount : 0,
    currency,
    paid_by: Number.isFinite(paid_by!) ? paid_by! : null,
    created_by: Number.isFinite(created_by!) ? created_by! : null,
    shares: sharesArr,
    from_user_id: Number.isFinite(from_user_id!) ? from_user_id! : null,
    to_user_id: Number.isFinite(to_user_id!) ? to_user_id! : null,
    transfer_from: Number.isFinite(raw?.transfer_from) ? Number(raw.transfer_from) : null,
    transfer_to: raw?.transfer_to ?? null,
  };
}

export default function GroupBalanceTab() {
  const { t } = useTranslation();
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || 0;

  const me = useUserStore((s: any) => s.user);
  const myId: number | undefined = me?.id != null ? Number(me.id) : undefined;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [tab, setTab] = useState<"mine"|"all">("mine");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!groupId || !myId) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const load = async () => {
      setLoading(true);
      try {
        // Участники
        const membersAcc: User[] = [];
        let off = 0;
        const PAGE = 200;
        while (true) {
          const res = await getGroupMembers(groupId, off, PAGE);
          const items = (res as any)?.items ?? [];
          for (const gm of items) {
            const u = gm?.user || {};
            membersAcc.push({
              id: Number(u.id),
              first_name: u.first_name ?? "",
              last_name: u.last_name ?? "",
              username: u.username ?? "",
              photo_url: u.photo_url ?? u.avatar_url ?? "",
            });
          }
          off += items.length;
          if (items.length < PAGE) break;
        }
        if (ac.signal.aborted) return;
        setMembers(membersAcc);

        // Транзакции
        const txAcc: Tx[] = [];
        off = 0;
        while (true) {
          const res: any = await getTransactions({ groupId, offset: off, limit: 100, signal: ac.signal as any });
          const items: any[] = Array.isArray(res?.items) ? res.items : [];
          txAcc.push(...items.map(normalizeTx));
          off += items.length;
          if (items.length < 100) break;
        }
        if (ac.signal.aborted) return;
        setTxs(txAcc);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => ac.abort();
  }, [groupId, myId]);

  const currency = useMemo(() => {
    return (txs.find(Boolean)?.currency || "").toString().toUpperCase() || undefined;
  }, [txs]);

  const byId = useMemo(() => new Map<number, User>(members.map(u => [u.id, u])), [members]);

  const { pair, net } = useMemo(() => {
    const pairMap = new Map<number, Map<number, number>>(); // pair[a].get(b) >0 => b должен a
    const netMap  = new Map<number, number>();              // net[u] >0 => группе должны u

    const addPair = (creditor: number, debtor: number, amount: number) => {
      if (!isFiniteNum(amount) || amount <= 0 || creditor === debtor) return;
      if (!pairMap.has(creditor)) pairMap.set(creditor, new Map());
      if (!pairMap.has(debtor))   pairMap.set(debtor,   new Map());
      pairMap.get(creditor)!.set(debtor, round2((pairMap.get(creditor)!.get(debtor) || 0) + amount));
      pairMap.get(debtor)!.set(creditor, round2((pairMap.get(debtor)!.get(creditor) || 0) - amount));
      netMap.set(creditor, round2((netMap.get(creditor) || 0) + amount));
      netMap.set(debtor,   round2((netMap.get(debtor)   || 0) - amount));
    };

    for (const tx of txs) {
      if (tx.type === "expense") {
        const payer = Number(tx.paid_by ?? tx.created_by ?? NaN);
        for (const s of tx.shares) {
          const uid = Number(s.user_id);
          const amt = Number(s.amount) || 0;
          if (!Number.isFinite(uid) || uid === payer || amt <= 0) continue;
          addPair(payer, uid, amt);
        }
      } else if (tx.type === "transfer") {
        const from = Number(tx.from_user_id ?? tx.transfer_from ?? NaN);
        const to = Number(tx.to_user_id ?? NaN);
        const amt = Number(tx.amount) || 0;
        if (Number.isFinite(from) && Number.isFinite(to) && from !== to && amt > 0) {
          addPair(from, to, amt);
        }
      }
    }

    return { pair: pairMap, net: netMap };
  }, [txs]);

  const myIdNum = Number(myId ?? -1);
  const myBalance = useMemo(() => round2(net.get(myIdNum) || 0), [net, myIdNum]);

  const myDebts = useMemo<MyDebt[]>(() => {
    if (!Number.isFinite(myIdNum)) return [];
    const row = pair.get(myIdNum) || new Map<number, number>();
    const list: MyDebt[] = [];
    for (const [otherId, val] of row.entries()) {
      if (otherId === myIdNum || Math.abs(val) < 1e-2) continue;
      const u = byId.get(otherId) || { id: otherId, first_name: `#${otherId}` };
      list.push({ user: u as User, amount: round2(val) });
    }
    return list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [pair, myIdNum, byId]);

  const allDebts = useMemo<AllDebt[]>(() => {
    const plan = greedySettleUp(new Map(net));
    return plan.map((p) => ({
      from: byId.get(p.from_user_id) || { id: p.from_user_id, first_name: `#${p.from_user_id}` },
      to:   byId.get(p.to_user_id)   || { id: p.to_user_id,   first_name: `#${p.to_user_id}` },
      amount: p.amount,
    }));
  }, [net, byId]);

  const nameOf = (u?: User) => {
    if (!u) return "";
    const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
    return n || u.username || `#${u.id}`;
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mt-1 mb-2">
        <div className="inline-flex rounded-xl border overflow-hidden"
             style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
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

      <div className="rounded-xl border p-3 bg-[var(--tg-card-bg)]"
           style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}>
        {loading ? (
          <div className="py-8 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
        ) : tab === "mine" ? (
          <>
            <div className="text-[14px] font-semibold text-[var(--tg-text-color)] mb-2">
              {myBalance > 0
                ? t("group_balance_you_get", { sum: fmtMoney(myBalance, currency) })
                : myBalance < 0
                ? t("group_balance_you_owe", { sum: fmtMoney(Math.abs(myBalance), currency) })
                : t("group_balance_zero")}
            </div>

            {myDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {myDebts.map((d) => (
                  <div key={d.user.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      {d.user.photo_url ? (
                        <img src={d.user.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <span className="w-7 h-7 rounded-full inline-block" style={{ background: "var(--tg-link-color)" }} />
                      )}
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(d.user)}</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                      {d.amount >= 0
                        ? t("group_balance_get_from", { sum: fmtMoney(d.amount, currency) })
                        : t("group_balance_owe_to", { sum: fmtMoney(Math.abs(d.amount), currency) })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {allDebts.length === 0 ? (
              <div className="text-[13px] text-[var(--tg-hint-color)]">{t("group_balance_no_debts_all")}</div>
            ) : (
              <div className="flex flex-col gap-2">
                {allDebts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      {p.from.photo_url ? (
                        <img src={p.from.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <span className="w-6 h-6 rounded-full inline-block" style={{ background: "var(--tg-link-color)" }} />
                      )}
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(p.from)}</span>
                      <span className="opacity-60">→</span>
                      <span className="truncate text-[14px] text-[var(--tg-text-color)]">{nameOf(p.to)}</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--tg-text-color)]">
                      {fmtMoney(p.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
