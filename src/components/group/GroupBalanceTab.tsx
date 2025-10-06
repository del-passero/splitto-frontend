// src/components/group/GroupBalanceTab.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import GroupBalanceTabSmart, { MyDebt, AllDebt } from "./GroupBalanceTabSmart";
import { getGroupMembers } from "../../api/groupMembersApi";
import { getGroupBalances, getGroupSettleUp } from "../../api/groupsApi";
import { useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import type { GroupMember } from "../../types/group_member";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import CardSection from "../CardSection";

type SimpleUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

/** --- Нормализатор пар settle-up (мультивалютный и одно-валютный ответ) --- */
function normalizeSettlePairs(raw: any): Array<{ from: number; to: number; amount: number; currency: string }> {
  const out: Array<{ from: number; to: number; amount: number; currency: string }> = [];
  const push = (it: any, codeHint?: string) => {
    if (!it) return;
    const from = Number(it.from_user_id ?? it.from?.id ?? it.from ?? NaN);
    const to = Number(it.to_user_id ?? it.to?.id ?? it.to ?? NaN);
    const amount = Number(it.amount);
    const currency = String(it.currency || it.currency_code || codeHint || "").toUpperCase();
    if (Number.isFinite(from) && Number.isFinite(to) && Number.isFinite(amount) && amount > 0 && currency) {
      out.push({ from, to, amount, currency });
    }
  };

  // 1) массив: [{...}]
  if (Array.isArray(raw)) {
    for (const it of raw) push(it);
    return out;
  }

  // 2) { pairs: [...] }
  if (raw && Array.isArray(raw.pairs)) {
    for (const it of raw.pairs) push(it);
    return out;
  }

  // 3) мультивалютный объект: { "USD": [...], "EUR": [...] }
  if (raw && typeof raw === "object") {
    for (const [ccy, arr] of Object.entries(raw)) {
      if (Array.isArray(arr)) {
        for (const it of arr) push(it, ccy);
      }
    }
  }
  return out;
}

/** --- Нормализатор балансов (ожидаем объект по валютам) --- */
function normalizeBalances(raw: any): Map<string, Map<number, number>> {
  // Поддержим разные формы: raw, { balances: ... }, значения как массивы объектов или как мапы
  const src = raw?.balances || raw || {};
  const byCcy = new Map<string, Map<number, number>>();

  for (const [ccy0, val] of Object.entries(src)) {
    const ccy = String(ccy0).toUpperCase();
    const m = new Map<number, number>();

    if (Array.isArray(val)) {
      // [{ user_id, balance }, ...]
      for (const row of val) {
        const uid = Number((row as any).user_id);
        const net = Number((row as any).balance ?? (row as any).net ?? (row as any).amount);
        if (Number.isFinite(uid) && Number.isFinite(net)) m.set(uid, net);
      }
    } else if (val && typeof val === "object") {
      // { "1": 12.34, "2": -5.67 }
      for (const [uidStr, net] of Object.entries(val as Record<string, number>)) {
        const uid = Number(uidStr);
        const v = Number(net);
        if (Number.isFinite(uid) && Number.isFinite(v)) m.set(uid, v);
      }
    }
    if (m.size > 0) byCcy.set(ccy, m);
  }

  return byCcy;
}

export default function GroupBalanceTab() {
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0);
  const currentUserId = useUserStore((s) => s.user?.id) ?? 0;

  const [loading, setLoading] = useState(true);
  const [allDebts, setAllDebts] = useState<AllDebt[]>([]);
  const [myDebts, setMyDebts] = useState<MyDebt[]>([]);
  const [myBalanceByCurrency, setMyBalanceByCurrency] = useState<Record<string, number>>({});

  const [membersMap, setMembersMap] = useState<Map<number, GroupMember>>(new Map());

  const [txOpen, setTxOpen] = useState(false);
  const [txInitial, setTxInitial] = useState<any | null>(null);

  const [refreshSeq, setRefreshSeq] = useState(0);
  const wasOpenRef = useRef(false);
  const shouldRefreshOnCloseRef = useRef(false);

  // Участники (для имён/аватаров)
  useEffect(() => {
    let aborted = false;
    const loadMembersAll = async () => {
      const map = new Map<number, GroupMember>();
      const LIMIT = 100;
      let offset = 0;
      while (true) {
        const page = await getGroupMembers(groupId, offset, LIMIT);
        for (const gm of (page.items || [])) map.set(gm.user.id, gm);
        const got = (page.items || []).length;
        const total = page.total || 0;
        offset += got;
        if (got < LIMIT || offset >= total) break;
      }
      if (!aborted) setMembersMap(map);
    };
    if (groupId) loadMembersAll().catch(() => {});
    return () => { aborted = true; };
  }, [groupId]);

  // Пары + балансы с сервера (мультивалютно)
  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      try {
        // 1) План выплат мультивалютный — по текущему алгоритму группы
        const settleRaw = await getGroupSettleUp(groupId, { multicurrency: true });
        const pairs = normalizeSettlePairs(settleRaw);

        // 2) Балансы — мультивалютно
        let myBal: Record<string, number> = {};
        try {
          const balancesRaw = await getGroupBalances(groupId, { multicurrency: true });
          const byCcy = normalizeBalances(balancesRaw);
          const mine: Record<string, number> = {};
          for (const [ccy, m] of byCcy.entries()) {
            mine[ccy] = Number(m.get(Number(currentUserId)) || 0);
          }
          myBal = mine;
        } catch {
          // Фоллбек: считаем личный баланс через пары
          const mine: Record<string, number> = {};
          for (const p of pairs) {
            if (p.to === currentUserId) mine[p.currency] = (mine[p.currency] || 0) + p.amount;
            else if (p.from === currentUserId) mine[p.currency] = (mine[p.currency] || 0) - p.amount;
          }
          myBal = mine;
        }

        // 3) Обогащаем пользователями
        const toUser = (id: number): SimpleUser => {
          const gm = membersMap.get(id);
          if (gm) {
            const u = gm.user;
            return { id: u.id, first_name: u.first_name, last_name: u.last_name, username: u.username, photo_url: u.photo_url };
          }
          return { id };
        };

        const allBuilt: AllDebt[] = pairs.map((p) => ({ from: toUser(p.from), to: toUser(p.to), amount: p.amount, currency: p.currency }));
        const minePairs: MyDebt[] = [];
        for (const p of allBuilt) {
          if (p.to.id === currentUserId) minePairs.push({ user: p.from, amount: p.amount, currency: p.currency });
          else if (p.from.id === currentUserId) minePairs.push({ user: p.to, amount: -p.amount, currency: p.currency });
        }

        if (!aborted) {
          setAllDebts(allBuilt);
          setMyDebts(minePairs);
          setMyBalanceByCurrency(myBal);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    if (groupId) load().catch(() => setLoading(false));
    return () => { aborted = true; };
  }, [groupId, currentUserId, membersMap, refreshSeq]);

  const handleRepay = useCallback(
    (u: SimpleUser, amount: number, currency: string) => {
      const amt = Math.abs(Number(amount) || 0);
      setTxInitial({ type: "transfer", amount: amt, paidBy: currentUserId, toUser: u.id, groupId, currency_code: currency });
      shouldRefreshOnCloseRef.current = true;
      setTxOpen(true);
    },
    [currentUserId, groupId]
  );

  useEffect(() => {
    if (txOpen) { wasOpenRef.current = true; return; }
    if (wasOpenRef.current && shouldRefreshOnCloseRef.current) {
      shouldRefreshOnCloseRef.current = false;
      wasOpenRef.current = false;
      setRefreshSeq((v) => v + 1);
    }
  }, [txOpen]);

  const smartProps = useMemo(() => ({
    myBalanceByCurrency, myDebts, allDebts, loading,
    onFabClick: () => {},
    onRepay: (user: SimpleUser, amount: number, currency: string) => handleRepay(user, amount, currency),
  }), [myBalanceByCurrency, myDebts, allDebts, loading, handleRepay]);

  return (
    <CardSection noPadding className="relative w-full h-full min-h-[320px] overflow-x-hidden overscroll-x-none">
      <div className="w-full min-w-0" style={{ color: "var(--tg-text-color)" }}>
        <GroupBalanceTabSmart {...smartProps} />
      </div>
      <CreateTransactionModal
        open={txOpen}
        onOpenChange={setTxOpen}
        groups={[]}
        defaultGroupId={groupId}
        initialTx={txInitial || undefined}
        onCreated={() => { setRefreshSeq((v) => v + 1); }}
      />
    </CardSection>
  );
}
