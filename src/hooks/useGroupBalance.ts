// src/hooks/useGroupBalance.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { getTransactions } from "../api/transactionsApi";
import { getGroupMembers } from "../api/groupMembersApi";
import { useUserStore } from "../store/userStore";

type User = { id: number; first_name?: string; username?: string; photo_url?: string };

export type MyDebt = { user: User; amount: number };     // >0 = вам должны, <0 = вы должны
export type AllDebt = { from: User; to: User; amount: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

function greedySettleUp(net: Map<number, number>) {
  const creditors = Array.from(net.entries()).filter(([, v]) => v > 1e-2).sort((a, b) => b[1] - a[1]);
  const debtors   = Array.from(net.entries()).filter(([, v]) => v < -1e-2).sort((a, b) => a[1] - b[1]);
  const res: Array<{ from_user_id: number; to_user_id: number; amount: number }> = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debId, dVal] = debtors[i];
    const [creId, cVal] = creditors[j];
    const amt = round2(Math.min(-dVal, cVal));
    if (amt <= 1e-2) { if (-dVal <= 1e-2) i++; if (cVal <= 1e-2) j++; continue; }
    res.push({ from_user_id: debId, to_user_id: creId, amount: amt });
    debtors[i][1]  = round2(dVal + amt);
    creditors[j][1] = round2(cVal - amt);
    if (Math.abs(debtors[i][1])  <= 1e-2) i++;
    if (Math.abs(creditors[j][1]) <= 1e-2) j++;
  }
  return res;
}

export function useGroupBalance(groupId?: number) {
  const me = useUserStore((s: any) => s.user);
  const myId: number | undefined = me?.id != null ? Number(me.id) : undefined;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [myBalance, setMyBalance] = useState(0);
  const [myDebts, setMyDebts] = useState<MyDebt[]>([]);
  const [allDebts, setAllDebts] = useState<AllDebt[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!groupId || !myId) { setLoading(false); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const load = async () => {
      setLoading(true);
      try {
        // 1) Все участники
        const membersAcc: User[] = [];
        let off = 0; const PAGE = 200;
        while (true) {
          const res = await getGroupMembers(groupId, off, PAGE);
          const items = (res as any)?.items ?? [];
          for (const gm of items) {
            const u = gm?.user || {};
            membersAcc.push({
              id: Number(u.id),
              first_name: u.first_name ?? u.firstName ?? u.name ?? u.username ?? "",
              username: u.username ?? "",
              photo_url: u.photo_url ?? u.avatar_url ?? u.avatarUrl ?? "",
            });
          }
          off += items.length;
          if (items.length < PAGE) break;
        }
        if (ac.signal.aborted) return;
        const byId = new Map<number, User>(membersAcc.map(u => [u.id, u]));
        setMembers(membersAcc);

        // 2) Все транзакции группы
        const txAcc: any[] = [];
        off = 0;
        while (true) {
          const { items } = await getTransactions({ groupId, offset: off, limit: 100, signal: ac.signal as any });
          txAcc.push(...items);
          off += items.length;
          if (items.length < 100) break;
        }
        if (ac.signal.aborted) return;

        // 3) Счёт парных долгов и нетто-сальдо
        const pair = new Map<number, Map<number, number>>(); // pair[a].get(b) >0 => b должен a
        const net  = new Map<number, number>();               // net[u] >0 => группе должны u

        const addPair = (creditor: number, debtor: number, amount: number) => {
          if (!Number.isFinite(amount) || amount <= 0 || creditor === debtor) return;
          if (!pair.has(creditor)) pair.set(creditor, new Map());
          if (!pair.has(debtor)) pair.set(debtor, new Map());
          pair.get(creditor)!.set(debtor, round2((pair.get(creditor)!.get(debtor) || 0) + amount));
          pair.get(debtor)!.set(creditor, round2((pair.get(debtor)!.get(creditor) || 0) - amount));
          net.set(creditor, round2((net.get(creditor) || 0) + amount));
          net.set(debtor,   round2((net.get(debtor)   || 0) - amount));
        };

        for (const tx of txAcc) {
          if (tx.type === "expense") {
            const payer = Number(tx.paid_by ?? tx.created_by ?? NaN);
            const shares: Array<{ user_id: number; amount: number }> = Array.isArray(tx.shares) ? tx.shares : [];
            for (const s of shares) {
              const uid = Number(s.user_id);
              const amt = Number(s.amount) || 0;
              if (!Number.isFinite(uid) || uid === payer || amt <= 0) continue;
              // участник должен плательщику свою долю
              addPair(payer, uid, amt);
            }
          } else if (tx.type === "transfer") {
            const from = Number(tx.from_user_id ?? tx.transfer_from ?? NaN);
            const to   = Number(tx.to_user_id ?? (Array.isArray(tx.transfer_to) ? tx.transfer_to[0] : tx.transfer_to) ?? NaN);
            const amt  = Number(tx.amount) || 0;
            if (Number.isFinite(from) && Number.isFinite(to) && from !== to && amt > 0) {
              // трактуем как «получатель должен отправителю»
              addPair(from, to, amt);
            }
          }
        }

        // 4) Мой баланс
        setMyBalance(round2(net.get(myId) || 0));

        // 5) Мои долги по участникам
        const mine: MyDebt[] = [];
        const myRow = pair.get(myId) || new Map<number, number>();
        for (const [otherId, amount] of myRow.entries()) {
          if (otherId === myId || Math.abs(amount) < 1e-2) continue;
          const u = byId.get(otherId) || { id: otherId, first_name: `#${otherId}`, username: "", photo_url: "" };
          mine.push({ user: u, amount: round2(amount) });
        }
        mine.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        setMyDebts(mine);

        // 6) Минимальные переводы по группе
        const settle = greedySettleUp(net).map(s => ({
          from: byId.get(s.from_user_id) || { id: s.from_user_id, first_name: `#${s.from_user_id}`, username: "", photo_url: "" },
          to:   byId.get(s.to_user_id)   || { id: s.to_user_id,   first_name: `#${s.to_user_id}`,   username: "", photo_url: "" },
          amount: s.amount,
        }));
        setAllDebts(settle);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => ac.abort();
  }, [groupId, myId]);

  return { loading, myBalance, myDebts, allDebts, members };
}
