// src/components/group/GroupBalanceTab.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import GroupBalanceTabSmart, { MyDebt, AllDebt } from "./GroupBalanceTabSmart";
import { getTransactions } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import { useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import type { GroupMember } from "../../types/group_member";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import CardSection from "../CardSection";

// Точность по коду валюты
const ZERO_DEC = new Set(["JPY", "KRW", "VND"]);
const decimalsByCode = (code?: string | null) => (code && ZERO_DEC.has(code) ? 0 : 2);
const roundBy = (n: number, d: number) => {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
};

type TxShare = { user_id: number; amount: number | string };
type Tx = {
  id?: number;
  type: "expense" | "transfer";
  amount: number | string;
  currency?: string | null;
  currency_code?: string | null;
  // expense
  paid_by?: number;
  created_by?: number;
  shares?: TxShare[];
  // transfer
  from_user_id?: number;
  to_user_id?: number;
  transfer_from?: number;
  transfer_to?: number;
  transfer?: number[];
};

type SimpleUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

export default function GroupBalanceTab() {
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0);
  const currentUserId = useUserStore((s) => s.user?.id) ?? 0;

  const [loading, setLoading] = useState(true);

  const [allDebts, setAllDebts] = useState<AllDebt[]>([]);
  const [myDebts, setMyDebts] = useState<MyDebt[]>([]);
  const [myBalanceByCurrency, setMyBalanceByCurrency] = useState<Record<string, number>>({});

  // справочник участников
  const [membersMap, setMembersMap] = useState<Map<number, GroupMember>>(new Map());

  // ====== модалка перевода (погашение долга)
  const [txOpen, setTxOpen] = useState(false);
  const [txInitial, setTxInitial] = useState<any | null>(null);

  // чтобы пересчитать после создания транзакции / закрытия модалки
  const [refreshSeq, setRefreshSeq] = useState(0);
  const wasOpenRef = useRef(false);
  const shouldRefreshOnCloseRef = useRef(false);

  // загрузка участников
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

  // загрузка транзакций и расчёт (по всем валютам)
  useEffect(() => {
    let aborted = false;
    const LIMIT = 100;

    const toNum = (v: any): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const calc = async () => {
      setLoading(true);
      try {
        // 1) Грузим все транзакции группы
        const all: Tx[] = [];
        let offset = 0;
        while (true) {
          const page = await getTransactions({ groupId, offset, limit: LIMIT });
          const items: Tx[] = (page.items || []) as any[];
          all.push(...items);
          offset += items.length;
          if (items.length < LIMIT || offset >= (page.total || 0)) break;
        }

        // 2) Нетто-балансы по пользователям в разрезе валют
        //    Map<CCY, Map<UserId, Net>>
        const balByCcy = new Map<string, Map<number, number>>();
        const add = (ccy: string, id: number, delta: number) => {
          if (!Number.isFinite(delta) || id == null || !ccy) return;
          const d = decimalsByCode(ccy);
          const map = balByCcy.get(ccy) || new Map<number, number>();
          map.set(id, roundBy((map.get(id) || 0) + delta, d));
          balByCcy.set(ccy, map);
        };

        for (const tx of all) {
          const txCcy = String(((tx as any).currency_code ?? (tx as any).currency) || "").toUpperCase();
          if (!txCcy) continue;

          if (tx.type === "expense") {
            const payer = Number(tx.paid_by ?? tx.created_by ?? NaN);
            const shares = Array.isArray(tx.shares) ? tx.shares : [];
            for (const s of shares) {
              const uid = Number(s.user_id);
              const amt = toNum((s as any).amount);
              if (!Number.isFinite(amt) || amt <= 0) continue;
              if (uid === payer) continue;
              add(txCcy, payer, amt); // участник должен payer'у
              add(txCcy, uid, -amt); // участник должен
            }
          } else if (tx.type === "transfer") {
            const from = Number(tx.from_user_id ?? tx.transfer_from ?? (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN));
            const to = Number(tx.to_user_id ?? tx.transfer_to ?? (Array.isArray(tx.transfer) ? tx.transfer[1] : NaN));
            const amt = toNum(tx.amount);
            if (Number.isFinite(from) && Number.isFinite(to) && Number.isFinite(amt) && amt > 0) {
              add(txCcy, from, amt);
              add(txCcy, to, -amt);
            }
          }
        }

        // 3) Для каждой валюты раскладываем в пары (debtor -> creditor)
        type Node = { id: number; left: number };
        const pairs: { from: number; to: number; amount: number; currency: string }[] = [];

        const myBalanceObj: Record<string, number> = {};

        for (const [ccy, bal] of balByCcy.entries()) {
          const d = decimalsByCode(ccy);
          const creditors: Node[] = [];
          const debtors: Node[] = [];
          for (const [id, net] of bal.entries()) {
            const v = roundBy(net, d);
            if (id === currentUserId) myBalanceObj[ccy] = v;
            if (v > 0) creditors.push({ id, left: v });
            else if (v < 0) debtors.push({ id, left: v });
          }
          creditors.sort((a, b) => b.left - a.left);
          debtors.sort((a, b) => a.left - b.left);

          let ci = 0, di = 0;
          while (ci < creditors.length && di < debtors.length) {
            const c = creditors[ci];
            const dn = debtors[di];
            const pay = roundBy(Math.min(c.left, -dn.left), d);
            if (pay > 0) {
              pairs.push({ from: dn.id, to: c.id, amount: pay, currency: ccy });
              c.left = roundBy(c.left - pay, d);
              dn.left = roundBy(dn.left + pay, d);
            }
            if (c.left <= 0 + 1 / Math.pow(10, d)) ci++;
            if (dn.left >= 0 - 1 / Math.pow(10, d)) di++;
          }

          if (!(ccy in myBalanceObj)) myBalanceObj[ccy] = 0;
        }

        // 4) Собираем объекты с юзерами
        const toUser = (id: number) => {
          const gm = membersMap.get(id);
          if (gm) {
            const u = gm.user;
            return {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              username: u.username,
              photo_url: u.photo_url,
            };
          }
          return { id };
        };

        const allDebtsBuilt: AllDebt[] = pairs.map((p) => ({
          from: toUser(p.from),
          to: toUser(p.to),
          amount: p.amount,
          currency: p.currency,
        }));

        // 5) Мои долги/требования (с валютой)
        const myPairs: MyDebt[] = [];
        for (const p of allDebtsBuilt) {
          if (p.to.id === currentUserId) myPairs.push({ user: p.from, amount: p.amount, currency: p.currency });
          else if (p.from.id === currentUserId) myPairs.push({ user: p.to, amount: -p.amount, currency: p.currency });
        }

        if (!aborted) {
          setAllDebts(allDebtsBuilt);
          setMyDebts(myPairs);
          setMyBalanceByCurrency(myBalanceObj);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    if (groupId) calc().catch(() => setLoading(false));
    return () => { aborted = true; };
  }, [groupId, currentUserId, membersMap, refreshSeq]);

  // ====== Колбэки для «погасить»/«напомнить» ======
  const handleRepay = useCallback(
    (u: SimpleUser, amount: number, currency: string) => {
      const amt = Math.abs(Number(amount) || 0);
      setTxInitial({
        type: "transfer",
        amount: amt,
        paidBy: currentUserId,
        toUser: u.id,
        groupId,
        currency_code: currency, // важное: подставляем валюту долга
      });
      shouldRefreshOnCloseRef.current = true;
      setTxOpen(true);
    },
    [currentUserId, groupId]
  );

  const handleRemind = useCallback((u: SimpleUser, amount: number, currency: string) => {
    // заглушка (на будущее)
    // eslint-disable-next-line no-console
    console.log("remind", u, amount, currency);
  }, []);

  // Автообновление после закрытия модалки
  useEffect(() => {
    if (txOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current && shouldRefreshOnCloseRef.current) {
      shouldRefreshOnCloseRef.current = false;
      wasOpenRef.current = false;
      setRefreshSeq((v) => v + 1);
    }
  }, [txOpen]);

  // Мемо-обёртки, чтобы не дёргать детей по пустякам
  const smartProps = useMemo(() => ({
    myBalanceByCurrency,
    myDebts,
    allDebts,
    loading,
    onFabClick: () => {},
    onRepay: (user: SimpleUser, amount: number, currency: string) => handleRepay(user, amount, currency),
    onRemind: (user: SimpleUser, amount: number, currency: string) => handleRemind(user, amount, currency),
  }), [myBalanceByCurrency, myDebts, allDebts, loading, handleRepay, handleRemind]);

  return (
    <CardSection
      noPadding
      className="relative w-full h-full min-h-[320px] overflow-x-hidden overscroll-x-none"
    >
      <div className="w-full min-w-0" style={{ color: "var(--tg-text-color)" }}>
        <GroupBalanceTabSmart {...smartProps} />
      </div>

      {/* модалка создания транзакции с предзаполнением для «Погасить долг» */}
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
