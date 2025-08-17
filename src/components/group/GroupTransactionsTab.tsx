import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import FiltersRow from "../FiltersRow";
import GroupFAB from "./GroupFAB";
import EmptyTransactions from "../EmptyTransactions";
import CreateTransactionModal from "../transactions/CreateTransactionModal";
import TransactionCard from "../transactions/TransactionCard";

// сторы
import { useGroupsStore } from "../../store/groupsStore";
import { useTransactionsStore } from "../../store/transactionsStore";

type Props = {
  loading: boolean;
  transactions: any[];
  onAddTransaction: () => void;
};

const GroupTransactionsTab = ({ loading, transactions, onAddTransaction }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  // groupId из урла, чтобы знать, какие локальные транзакции подмешивать
  const params = useParams();
  const groupId = Number(params.groupId || params.id || 0) || undefined;

  const groups = useGroupsStore((s: { groups: any[] }) => s.groups ?? []);
  const localTxs = useTransactionsStore((s) => s.getByGroup(groupId));

  const handleAddClick = () => {
    onAddTransaction && onAddTransaction();
    setOpenCreate(true);
  };

  // объединяем: сначала локальные (свежесозданные), затем пришедшие с сервера
  const combined = useMemo(() => {
    const src = [...(localTxs || []), ...(transactions || [])];
    // удалим дубли по id
    const seen = new Set<string | number>();
    const out: any[] = [];
    for (const it of src) {
      const k = it.id ?? `${it.type}-${it.date}-${it.amount}-${it.comment}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
    // сортировка по дате/созданию убыв.
    out.sort((a, b) => {
      const ta = new Date(a.date || a.created_at || 0).getTime();
      const tb = new Date(b.date || b.created_at || 0).getTime();
      return tb - ta;
    });
    // фильтр по поиску
    if (!search.trim()) return out;
    const q = search.toLowerCase();
    return out.filter((tx) => {
      const hay = [
        tx.comment,
        tx.category?.name,
        tx.from_name,
        tx.to_name,
        tx.currency,
        tx.amount?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [localTxs, transactions, search]);

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <FiltersRow search={search} setSearch={setSearch} />

      {loading && combined.length === 0 ? (
        <div className="flex justify-center py-12 text-[var(--tg-hint-color)]">
          {t("loading")}
        </div>
      ) : combined.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="flex flex-col gap-2 py-3">
          {combined.map((tx: any) => (
            <TransactionCard key={tx.id || `${tx.type}-${tx.date}-${tx.amount}-${tx.comment}`} tx={tx} />
          ))}
        </div>
      )}

      <GroupFAB onClick={handleAddClick} />

      <CreateTransactionModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        groups={groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
          default_currency_code: (g as any).default_currency_code,
          currency_code: (g as any).currency_code,
          currency: (g as any).currency,
        }))}
        defaultGroupId={groupId}
      />
    </div>
  );
};

export default GroupTransactionsTab;
