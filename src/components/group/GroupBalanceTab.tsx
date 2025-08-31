import { useEffect, useMemo, useState } from "react";
import GroupBalanceTabSmart, { MyDebt, AllDebt } from "./GroupBalanceTabSmart";
import { getTransactions } from "../../api/transactionsApi";
import { getGroupMembers } from "../../api/groupMembersApi";
import { useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import type { GroupMember } from "../../types/group_member";

// Мягкое определение точности по коду валюты (как в других местах проекта)
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
  // expense
  paid_by?: number;
  created_by?: number;
  shares?: TxShare[];
  // transfer
  from_user_id?: number;
  to_user_id?: number;
  transfer_from?: number;
  transfer_to?: number;
  transfer?: number[]; // на всякий
};

// Доп. тип для колбэков
type SimpleUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

export default function GroupBalanceTab() {
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0);
  const currentUserId = useUserStore((s) => s.user?.id) ?? 0;

  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string | null>(null);

  const [allDebts, setAllDebts] = useState<AllDebt[]>([]);
  const [myDebts, setMyDebts] = useState<MyDebt[]>([]);
  const [myBalance, setMyBalance] = useState(0);

  // справочник участников
  const [membersMap, setMembersMap] = useState<Map<number, GroupMember>>(new Map());

  // загрузка участников (весь список)
  useEffect(() => {
    let aborted = false;
    const loadMembersAll = async () => {
      const map = new Map<number, GroupMember>();
      const LIMIT = 100;
      let offset = 0;
      while (true) {
        const page = await getGroupMembers(groupId, offset, LIMIT);
        for (const gm of (page.items || [])) {
          map.set(gm.user.id, gm);
        }
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

  // загрузка транзакций и расчёт
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
        // 1) Грузим ВСЕ транзакции группы
        const all: Tx[] = [];
        let offset = 0;
        let groupCcy: string | null = null;

        while (true) {
          const page = await getTransactions({
            groupId,
            offset,
            limit: LIMIT,
          });
          const items: Tx[] = (page.items || []) as any[];
          if (!groupCcy && items.length) {
            groupCcy = (items[0] as any)?.currency || null;
          }
          all.push(...items);
          offset += items.length;
          if (items.length < LIMIT || offset >= (page.total || 0)) break;
        }

        if (!groupCcy) groupCcy = null;
        if (!aborted) setCurrency(groupCcy);

        // 2) Считаем нетто-балансы по пользователям
        const d = decimalsByCode(groupCcy);
        const bal = new Map<number, number>(); // id -> net ( >0 должны вам, <0 вы должны )

        const add = (id: number, delta: number) => {
          if (!Number.isFinite(delta) || id == null) return;
          bal.set(id, roundBy((bal.get(id) || 0) + delta, d));
        };

        for (const tx of all) {
          // если у группы всегда одна валюта — пропустим проверку; если нет — считаем только в валюте группы
          if (groupCcy && tx.currency && String(tx.currency).toUpperCase() !== String(groupCcy).toUpperCase()) {
            continue;
          }
          if (tx.type === "expense") {
            const payer = Number(tx.paid_by ?? tx.created_by ?? NaN);
            const shares = Array.isArray(tx.shares) ? tx.shares : [];
            for (const s of shares) {
              const uid = Number(s.user_id);
              const amt = toNum((s as any).amount);
              if (!Number.isFinite(amt) || amt <= 0) continue;
              if (uid === payer) continue; // свою долю сам себе не должен
              add(payer, amt);   // участник должен payer'у
              add(uid, -amt);    // участник должен
            }
          } else if (tx.type === "transfer") {
            const from =
              Number(tx.from_user_id ??
                     tx.transfer_from ??
                     (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN));
            const to =
              Number(tx.to_user_id ??
                     tx.transfer_to ??
                     (Array.isArray(tx.transfer) ? tx.transfer[1] : NaN));
            const amt = toNum(tx.amount);
            if (Number.isFinite(from) && Number.isFinite(to) && Number.isFinite(amt) && amt > 0) {
              // перевод уменьшает долг: from получил «кредит», to — «снял требование»
              add(from, amt);
              add(to, -amt);
            }
          }
        }

        // 3) Жадная разборка на пары (debtor -> creditor)
        type Node = { id: number; left: number }; // left >0 для кредиторов, <0 для должников
        const creditors: Node[] = [];
        const debtors: Node[] = [];
        for (const [id, net] of bal.entries()) {
          const v = roundBy(net, d);
          if (v > 0) creditors.push({ id, left: v });
          else if (v < 0) debtors.push({ id, left: v });
        }

        creditors.sort((a, b) => b.left - a.left);   // по убыванию
        debtors.sort((a, b) => a.left - b.left);     // по возрастанию (самый «минусовой» первым)

        const pairs: { from: number; to: number; amount: number }[] = [];
        let ci = 0, di = 0;
        while (ci < creditors.length && di < debtors.length) {
          const c = creditors[ci];
          const dnode = debtors[di];
          const need = c.left;
          const owe = -dnode.left;
          const pay = roundBy(Math.min(need, owe), d);

          if (pay > 0) {
            pairs.push({ from: dnode.id, to: c.id, amount: pay });
            c.left = roundBy(c.left - pay, d);
            dnode.left = roundBy(dnode.left + pay, d);
          }

          if (c.left <= 0 + 1 / Math.pow(10, d)) ci++;
          if (dnode.left >= 0 - 1 / Math.pow(10, d)) di++;
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
          // fallback
          return { id };
        };

        const allDebtsBuilt: AllDebt[] = pairs.map((p) => ({
          from: toUser(p.from),
          to: toUser(p.to),
          amount: roundBy(p.amount, d),
        }));

        // 5) Мои долги/мои требования и итоговый баланс
        const myPairs: MyDebt[] = [];
        let meNet = 0;
        for (const [id, net] of bal.entries()) {
          if (id === currentUserId) meNet = roundBy(net, d);
        }
        for (const p of allDebtsBuilt) {
          if (p.to.id === currentUserId) {
            myPairs.push({ user: p.from, amount: roundBy(p.amount, d) }); // «мне должны»
          } else if (p.from.id === currentUserId) {
            myPairs.push({ user: p.to, amount: roundBy(-p.amount, d) });  // «я должен» (отриц.)
          }
        }

        if (!aborted) {
          setAllDebts(allDebtsBuilt);
          setMyDebts(myPairs);
          setMyBalance(meNet);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    if (groupId) calc().catch(() => setLoading(false));
    return () => { aborted = true; };
  }, [groupId, currentUserId, membersMap]);

  // Колбэки для «погасить»/«напомнить».
  // Сейчас — заглушки; сюда потом прикрутишь открытие модалки CreateTransactionModal.
  const handleRepay = (u: SimpleUser, amount: number) => {
    console.log("repay", u, amount);
    alert("Долги — скоро!");
  };
  const handleRemind = (u: SimpleUser, amount: number) => {
    console.log("remind", u, amount);
    alert("Долги — скоро!");
  };

  return (
    <GroupBalanceTabSmart
      myBalance={myBalance}
      myDebts={myDebts}
      allDebts={allDebts}
      loading={loading}
      onFabClick={() => {}}
      currency={currency}
      onRepay={handleRepay}
      onRemind={handleRemind}
    />
  );
}
