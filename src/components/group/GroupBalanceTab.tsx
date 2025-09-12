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
  transfer?: number[];
};

// Доп. тип для колбэков
type SimpleUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

// Результат по каждой валюте
type CurrencySummary = {
  code: string | null;
  myBalance: number;
  myDebts: MyDebt[];
  allDebts: AllDebt[];
};

export default function GroupBalanceTab() {
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0);
  const currentUserId = useUserStore((s) => s.user?.id) ?? 0;

  const [loading, setLoading] = useState(true);

  const [summaries, setSummaries] = useState<CurrencySummary[]>([]);

  // справочник участников
  const [membersMap, setMembersMap] = useState<Map<number, GroupMember>>(new Map());

  // ====== состояние модалки перевода (погашение долга)
  const [txOpen, setTxOpen] = useState(false);
  const [txInitial, setTxInitial] = useState<any | null>(null);

  // чтобы пересчитать после создания транзакции / закрытия модалки
  const [refreshSeq, setRefreshSeq] = useState(0);
  const wasOpenRef = useRef(false);
  const shouldRefreshOnCloseRef = useRef(false);

  // загрузка участников (весь список)
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
    return () => {
      aborted = true;
    };
  }, [groupId]);

  // загрузка транзакций и расчёт ПО ВАЛЮТАМ
  useEffect(() => {
    let aborted = false;
    const LIMIT = 100;

    const toNum = (v: any): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const getTxCode = (tx: any): string | null => {
      const raw = tx?.currency_code ?? tx?.currency ?? null;
      if (typeof raw !== "string") return null;
      const trimmed = raw.trim();
      return trimmed ? trimmed.toUpperCase() : null;
    };

    const calc = async () => {
      setLoading(true);
      try {
        // 1) Грузим ВСЕ транзакции группы
        const all: Tx[] = [];
        let offset = 0;

        while (true) {
          const page = await getTransactions({ groupId, offset, limit: LIMIT });
          const items: Tx[] = (page.items || []) as any[];
          all.push(...items);
          offset += items.length;
          if (items.length < LIMIT || offset >= (page.total || 0)) break;
        }

        // 2) Группируем по валюте
        const byCode = new Map<string | null, Tx[]>();
        for (const tx of all) {
          const code = getTxCode(tx);
          const arr = byCode.get(code) || [];
          arr.push(tx);
          byCode.set(code, arr);
        }

        // 3) Для каждой валюты считаем нетто-балансы и пары
        const makeUser = (id: number) => {
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

        const out: CurrencySummary[] = [];

        for (const [code, list] of byCode.entries()) {
          const d = decimalsByCode(code);
          const bal = new Map<number, number>(); // id -> net ( >0 должны вам, <0 вы должны )
          const add = (id: number, delta: number) => {
            if (!Number.isFinite(delta) || id == null) return;
            bal.set(id, roundBy((bal.get(id) || 0) + delta, d));
          };

          for (const tx of list) {
            if (tx.type === "expense") {
              const payer = Number(tx.paid_by ?? tx.created_by ?? NaN);
              const shares = Array.isArray(tx.shares) ? tx.shares : [];
              for (const s of shares) {
                const uid = Number(s.user_id);
                const amt = toNum((s as any).amount);
                if (!Number.isFinite(amt) || amt <= 0) continue;
                if (uid === payer) continue;
                add(payer, amt);   // участник должен payer'у
                add(uid, -amt);    // участник должен
              }
            } else if (tx.type === "transfer") {
              const from = Number(tx.from_user_id ?? tx.transfer_from ?? (Array.isArray(tx.transfer) ? tx.transfer[0] : NaN));
              const to = Number(tx.to_user_id ?? tx.transfer_to ?? (Array.isArray(tx.transfer) ? tx.transfer[1] : NaN));
              const amt = toNum(tx.amount);
              if (Number.isFinite(from) && Number.isFinite(to) && Number.isFinite(amt) && amt > 0) {
                add(from, amt);
                add(to, -amt);
              }
            }
          }

          // Жадная разборка на пары (debtor -> creditor)
          type Node = { id: number; left: number };
          const creditors: Node[] = [];
          const debtors: Node[] = [];
          for (const [id, net] of bal.entries()) {
            const v = roundBy(net, d);
            if (v > 0) creditors.push({ id, left: v });
            else if (v < 0) debtors.push({ id, left: v });
          }
          creditors.sort((a, b) => b.left - a.left);
          debtors.sort((a, b) => a.left - b.left);

          const pairs: { from: number; to: number; amount: number }[] = [];
          let ci = 0, di = 0;
          while (ci < creditors.length && di < debtors.length) {
            const c = creditors[ci];
            const dn = debtors[di];
            const pay = roundBy(Math.min(c.left, -dn.left), d);
            if (pay > 0) {
              pairs.push({ from: dn.id, to: c.id, amount: pay });
              c.left = roundBy(c.left - pay, d);
              dn.left = roundBy(dn.left + pay, d);
            }
            if (c.left <= 0 + 1 / Math.pow(10, d)) ci++;
            if (dn.left >= 0 - 1 / Math.pow(10, d)) di++;
          }

          const allDebtsBuilt: AllDebt[] = pairs.map((p) => ({
            from: makeUser(p.from),
            to: makeUser(p.to),
            amount: roundBy(p.amount, d),
          }));

          // Мои долги/мои требования и итоговый баланс
          let meNet = 0;
          for (const [id, net] of bal.entries()) if (id === currentUserId) meNet = roundBy(net, d);

          const myPairs: MyDebt[] = [];
          for (const p of allDebtsBuilt) {
            if (p.to.id === currentUserId) myPairs.push({ user: p.from, amount: roundBy(p.amount, d) });
            else if (p.from.id === currentUserId) myPairs.push({ user: p.to, amount: roundBy(-p.amount, d) });
          }

          out.push({
            code,
            myBalance: meNet,
            myDebts: myPairs,
            allDebts: allDebtsBuilt,
          });
        }

        // сортируем по коду (null в конец)
        out.sort((a, b) => {
          const aa = a.code || "~~~"; // чтобы null были в конце
          const bb = b.code || "~~~";
          return aa.localeCompare(bb);
        });

        if (!aborted) setSummaries(out);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    if (groupId) calc().catch(() => setLoading(false));
    return () => {
      aborted = true;
    };
    // пересчитываем также по refreshSeq (после создания перевода / закрытия модалки)
  }, [groupId, currentUserId, membersMap, refreshSeq]);

  // ====== Колбэк «Погасить» с валютой ======
  const makeRepayHandler = useCallback(
    (code?: string | null) =>
      (u: SimpleUser, amount: number) => {
        const amt = Math.abs(Number(amount) || 0);
        setTxInitial({
          type: "transfer",
          amount: amt,
          paidBy: currentUserId,
          toUser: u.id,
          groupId,
          currency: code || undefined,
        });
        shouldRefreshOnCloseRef.current = true; // при закрытии модалки обновим список
        setTxOpen(true);
      },
    [currentUserId, groupId]
  );

  const handleRemind = useCallback((u: SimpleUser, amount: number) => {
    // сейчас логика-«заглушка» живёт в Smart (центр-модалка). Оставляем хук на будущее.
    // eslint-disable-next-line no-console
    console.log("remind", u, amount);
  }, []);

  // Автообновление при закрытии модалки (даже если пользователь отменил — это безопасно)
  useEffect(() => {
    if (txOpen) {
      wasOpenRef.current = true;
      return;
    }
    // стейт перешёл в закрытое состояние
    if (wasOpenRef.current && shouldRefreshOnCloseRef.current) {
      shouldRefreshOnCloseRef.current = false;
      wasOpenRef.current = false;
      setRefreshSeq((v) => v + 1);
    }
  }, [txOpen]);

  const multipleCurrencies = summaries.length > 1;

  return (
    <CardSection
      noPadding
      className="relative w-full h-full min-h-[320px] overflow-x-hidden overscroll-x-none"
    >
      {summaries.map((s) => (
        <div key={s.code || "NOCCY"} className="w-full min-w-0" style={{ color: "var(--tg-text-color)" }}>
          {multipleCurrencies && (
            <div className="px-3 pt-2 text-[12px] opacity-70">
              {s.code ? `Currency: ${s.code}` : "Currency: —"}
            </div>
          )}
          <GroupBalanceTabSmart
            myBalance={s.myBalance}
            myDebts={s.myDebts}
            allDebts={s.allDebts}
            loading={loading}
            onFabClick={() => {}}
            currency={s.code}
            onRepay={makeRepayHandler(s.code)}
            onRemind={handleRemind}
          />
          {multipleCurrencies && <div className="h-2" />}
        </div>
      ))}

      {/* модалка создания транзакции с предзаполнением для «Погасить долг» */}
      <CreateTransactionModal
        open={txOpen}
        onOpenChange={setTxOpen}
        groups={[]}
        defaultGroupId={groupId}
        initialTx={txInitial || undefined}
        onCreated={() => {
          // если CreateTransactionModal вызовет колбэк — обновим сразу (дублируем логику на случай,
          // если модалка НЕ вызовет onCreated — тогда сработает эффект закрытия выше)
          setRefreshSeq((v) => v + 1);
        }}
      />
    </CardSection>
  );
}
