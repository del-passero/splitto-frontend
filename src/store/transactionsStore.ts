// src/store/transactionsStore.ts
import { create } from "zustand";
import type { SplitSelection } from "../components/transactions/SplitPickerModal";
import { createTransaction } from "../api/transactionsApi";
import type { TransactionOut, TransactionCreateRequest } from "../types/transaction";

type CategoryLite = { id: number; name: string; color?: string | null; icon?: string | undefined };

export type LocalBaseTx = {
  id?: string | number;
  created_at?: string;
  date: string;
  group_id: number;
  type: "expense" | "transfer";
  amount: number;
  currency: string;
  comment?: string;
};

export type LocalExpenseTx = LocalBaseTx & {
  type: "expense";
  category?: CategoryLite;
  paid_by?: number;
  split?: SplitSelection | null;
};

export type LocalTransferTx = LocalBaseTx & {
  type: "transfer";
  from_user_id: number;
  to_user_id: number;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
};

export type LocalTx = LocalExpenseTx | LocalTransferTx;

type LocalExpenseInput = {
  group_id: number;
  amount: number;
  currency: string;
  date: string;
  comment: string;
  category?: CategoryLite;
  paid_by?: number;
  split?: SplitSelection | null;
};

type LocalTransferInput = {
  group_id: number;
  amount: number;
  currency: string;
  date: string;
  from_user_id: number;
  to_user_id: number;
  from_name?: string;
  to_name?: string;
  from_avatar?: string;
  to_avatar?: string;
};

type TxState = {
  itemsByGroup: Record<number, LocalTx[]>;
  getByGroup: (gid?: number) => LocalTx[];
  _addLocal: (tx: LocalTx) => void;
  _replaceLocal: (gid: number, tempId: string | number, real: LocalTx) => void;
  _removeLocal: (gid: number, tempId: string | number) => void;
  createExpense: (input: LocalExpenseInput) => Promise<TransactionOut>;
  createTransfer: (input: LocalTransferInput) => Promise<TransactionOut>;
};

export const useTransactionsStore = create<TxState>((set, get) => ({
  itemsByGroup: {},

  getByGroup: (gid?: number) => {
    if (!gid) return [];
    return get().itemsByGroup[gid] || [];
  },

  _addLocal: (tx: LocalTx) => {
    set(s => {
      const arr = s.itemsByGroup[tx.group_id] ? [...s.itemsByGroup[tx.group_id]] : [];
      arr.unshift(tx);
      return { itemsByGroup: { ...s.itemsByGroup, [tx.group_id]: arr } };
    });
  },

  _replaceLocal: (gid: number, tempId: string | number, real: LocalTx) => {
    set(s => {
      const arr = (s.itemsByGroup[gid] || []).map(x => (x.id === tempId ? real : x));
      return { itemsByGroup: { ...s.itemsByGroup, [gid]: arr } };
    });
  },

  _removeLocal: (gid: number, tempId: string | number) => {
    set(s => {
      const arr = (s.itemsByGroup[gid] || []).filter(x => x.id !== tempId);
      return { itemsByGroup: { ...s.itemsByGroup, [gid]: arr } };
    });
  },

  async createExpense(input) {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localTx: LocalExpenseTx = {
      id: tempId,
      created_at: new Date().toISOString(),
      type: "expense",
      group_id: input.group_id,
      date: input.date,
      amount: input.amount,
      currency: input.currency,
      comment: input.comment,
      category: input.category,
      paid_by: input.paid_by,
      split: input.split ?? null,
    };

    get()._addLocal(localTx);

    try {
      const payload: TransactionCreateRequest = {
        type: "expense",
        ...input,
      } as unknown as TransactionCreateRequest;

      const serverTx = await createTransaction(payload);

      const real: LocalExpenseTx = {
        ...localTx,
        id: serverTx.id ?? localTx.id,
        created_at: serverTx.created_at ?? localTx.created_at,
        // нормализованные поля от бэка
        category: (serverTx as any).category ?? localTx.category,
        split: (serverTx as any).split ?? localTx.split,
        comment: serverTx.comment ?? localTx.comment,
        amount: Number((serverTx as any).amount ?? localTx.amount), // ВАЖНО: Decimal(string) -> number
        currency: serverTx.currency ?? localTx.currency,
        date: serverTx.date ?? localTx.date,
      };
      get()._replaceLocal(input.group_id, tempId, real);
      return serverTx;
    } catch (e) {
      get()._removeLocal(input.group_id, tempId);
      throw e;
    }
  },

  async createTransfer(input) {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localTx: LocalTransferTx = {
      id: tempId,
      created_at: new Date().toISOString(),
      type: "transfer",
      group_id: input.group_id,
      date: input.date,
      amount: input.amount,
      currency: input.currency,
      from_user_id: input.from_user_id,
      to_user_id: input.to_user_id,
      from_name: input.from_name,
      to_name: input.to_name,
      from_avatar: input.from_avatar,
      to_avatar: input.to_avatar,
    };

    get()._addLocal(localTx);

    try {
      const payload: TransactionCreateRequest = {
        type: "transfer",
        ...input,
      } as unknown as TransactionCreateRequest;

      const serverTx = await createTransaction(payload);

      const real: LocalTransferTx = {
        ...localTx,
        id: serverTx.id ?? localTx.id,
        created_at: serverTx.created_at ?? localTx.created_at,
        amount: Number((serverTx as any).amount ?? localTx.amount), // ВАЖНО: Decimal(string) -> number
        currency: serverTx.currency ?? localTx.currency,
        date: serverTx.date ?? localTx.date,
      };
      get()._replaceLocal(input.group_id, tempId, real);
      return serverTx;
    } catch (e) {
      get()._removeLocal(input.group_id, tempId);
      throw e;
    }
  },
}));
