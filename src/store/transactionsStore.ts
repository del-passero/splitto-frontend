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

// ----- helpers: money / shares -----

// Строго 2 знака после запятой — как на бэке (Money = Decimal(12,2))
function toMoneyStr(n: number): string {
  // Избегаем плавающих ошибок: работаем в "центах"
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "-" : "";
  const int = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  return `${sign}${int}.${dec}`;
}

function upperCurrency(code?: string | null): string | undefined {
  return code ? code.trim().toUpperCase() : undefined;
}

/**
 * Построить split_type и shares[] из SplitSelection и total.
 * — equal: делим поровну, распределяем остаток по первым N участникам
 * — shares: делим пропорционально .share, распределяем остаток
 * — custom: берём amounts из participants (подправляем последнему, если надо)
 */
function buildSplitPayload(
  split: SplitSelection | null | undefined,
  total: number
): { split_type?: "equal" | "shares" | "custom"; shares?: Array<{ user_id: number; amount: string; shares?: number | null }> } {
  if (!split || !split.participants || split.participants.length === 0) {
    return {};
  }

  const totalCents = Math.round(total * 100);

  if (split.type === "equal") {
    const n = split.participants.length;
    if (n === 0) return {};
    const base = Math.floor(totalCents / n);
    let rest = totalCents - base * n;

    const shares = split.participants.map((p, idx) => {
      const add = rest > 0 ? 1 : 0;
      if (rest > 0) rest -= 1;
      const cents = base + add;
      return {
        user_id: p.user_id,
        amount: toMoneyStr(cents / 100),
      };
    });

    return { split_type: "equal", shares };
  }

  if (split.type === "shares") {
    const totalShares = split.participants.reduce((s, p) => s + (p.share || 0), 0);
    if (totalShares <= 0) return { split_type: "shares", shares: [] };

    // предварительно распределяем по floor, остаток — по первым
    let sumCents = 0;
    const prelim = split.participants.map((p) => {
      const portion = (totalCents * (p.share || 0)) / totalShares;
      const cents = Math.floor(portion);
      sumCents += cents;
      return { user_id: p.user_id, cents, share: p.share || 0 };
    });

    let rest = totalCents - sumCents;
    const shares = prelim.map((x, idx) => {
      const add = rest > 0 ? 1 : 0;
      if (rest > 0) rest -= 1;
      const cents = x.cents + add;
      return {
        user_id: x.user_id,
        amount: toMoneyStr(cents / 100),
        shares: x.share || undefined,
      };
    });

    return { split_type: "shares", shares };
  }

  // custom
  if (split.type === "custom") {
    // Собираем заявленные суммы, округляем до центов, выравниваем последнего
    const rawCents = split.participants.map((p) => ({
      user_id: p.user_id,
      cents: Math.round((p.amount || 0) * 100),
    }));
    let sum = rawCents.reduce((s, x) => s + x.cents, 0);
    const delta = totalCents - sum;
    if (rawCents.length > 0 && delta !== 0) {
      rawCents[rawCents.length - 1].cents += delta; // подправляем последнего
      sum += delta;
    }
    // если всё равно не сошлось (крайне маловероятно) — не отправляем shares
    if (sum !== totalCents) return { split_type: "custom", shares: [] };

    const shares = rawCents.map((x) => ({
      user_id: x.user_id,
      amount: toMoneyStr(x.cents / 100),
    }));
    return { split_type: "custom", shares };
  }

  return {};
}

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
      currency: upperCurrency(input.currency) || input.currency,
      comment: input.comment,
      category: input.category,
      paid_by: input.paid_by,
      split: input.split ?? null,
    };

    get()._addLocal(localTx);

    try {
      // Собираем payload под backend-схему TransactionCreateRequest
      const amountStr = toMoneyStr(input.amount);
      const { split_type, shares } = buildSplitPayload(input.split, input.amount);

      const payload: TransactionCreateRequest = {
        type: "expense",
        group_id: input.group_id,
        amount: amountStr,
        date: input.date,
        comment: input.comment,
        currency: upperCurrency(input.currency) || null,
        category_id: input.category ? input.category.id : null,
        paid_by: input.paid_by ?? null,
        split_type: split_type ?? null,
        shares: shares && shares.length ? shares : undefined,
      };

      const serverTx = await createTransaction(payload);

      const real: LocalExpenseTx = {
        ...localTx,
        id: serverTx.id ?? localTx.id,
        created_at: serverTx.created_at ?? localTx.created_at,
        // нормализованные поля от бэка
        category: (serverTx as any).category ?? localTx.category,
        split: localTx.split, // UI-сплит оставляем локально; сервер отдаёт shares отдельно
        comment: serverTx.comment ?? localTx.comment,
        amount: Number((serverTx as any).amount ?? localTx.amount),
        currency: (serverTx.currency ?? localTx.currency) || localTx.currency,
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
      currency: upperCurrency(input.currency) || input.currency,
      from_user_id: input.from_user_id,
      to_user_id: input.to_user_id,
      from_name: input.from_name,
      to_name: input.to_name,
      from_avatar: input.from_avatar,
      to_avatar: input.to_avatar,
    };

    get()._addLocal(localTx);

    try {
      const amountStr = toMoneyStr(input.amount);

      const payload: TransactionCreateRequest = {
        type: "transfer",
        group_id: input.group_id,
        amount: amountStr,
        date: input.date,
        currency: upperCurrency(input.currency) || null,
        transfer_from: input.from_user_id,
        transfer_to: [input.to_user_id],
        // comment: можно добавить при необходимости
      };

      const serverTx = await createTransaction(payload);

      const real: LocalTransferTx = {
        ...localTx, // оставляем локальные name/avatar для UI
        id: serverTx.id ?? localTx.id,
        created_at: serverTx.created_at ?? localTx.created_at,
        amount: Number((serverTx as any).amount ?? localTx.amount),
        currency: (serverTx.currency ?? localTx.currency) || localTx.currency,
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
