// src/store/transactionsStore.ts
import { create } from "zustand"
import type { SplitSelection } from "../components/transactions/SplitPickerModal"
import { createTransaction, uploadReceipt, setTransactionReceiptUrl, deleteTransactionReceipt } from "../api/transactionsApi"
import type { TransactionOut, TransactionCreateRequest } from "../types/transaction"

type CategoryLite = { id: number; name: string; color?: string | null; icon?: string | undefined }

export type LocalBaseTx = {
  id?: string | number
  created_at?: string
  date: string
  group_id: number
  type: "expense" | "transfer"
  amount: number
  currency: string
  comment?: string
}

export type LocalExpenseTx = LocalBaseTx & {
  type: "expense"
  category?: CategoryLite
  paid_by?: number
  split?: SplitSelection | null
}

export type LocalTransferTx = LocalBaseTx & {
  type: "transfer"
  from_user_id: number
  to_user_id: number
  from_name?: string
  to_name?: string
  from_avatar?: string
  to_avatar?: string
}

export type LocalTx = LocalExpenseTx | LocalTransferTx

type LocalExpenseInput = {
  group_id: number
  amount: number
  currency: string
  date: string
  comment: string
  category?: CategoryLite
  paid_by?: number
  split?: SplitSelection | null
}

type LocalTransferInput = {
  group_id: number
  amount: number
  currency: string
  date: string
  from_user_id: number
  to_user_id: number
  from_name?: string
  to_name?: string
  from_avatar?: string
  to_avatar?: string
}

type TxState = {
  itemsByGroup: Record<number, LocalTx[]>
  getByGroup: (gid?: number) => LocalTx[]
  _addLocal: (tx: LocalTx) => void
  _replaceLocal: (gid: number, tempId: string | number, real: LocalTx) => void
  _removeLocal: (gid: number, tempId: string | number) => void
  createExpense: (input: LocalExpenseInput) => Promise<TransactionOut>
  createTransfer: (input: LocalTransferInput) => Promise<TransactionOut>
  // Новые экшены для чеков:
  attachReceipt: (transactionId: number, file: File) => Promise<TransactionOut>
  removeReceipt: (transactionId: number) => Promise<void>
}

// --- helpers for money/share rounding ---
const r2 = (n: number) => Math.round(n * 100) / 100
const toMoneyStr = (n: number) => r2(n).toFixed(2)

/**
 * Преобразуем SplitSelection в { split_type, shares[] } для бэка.
 * Если участников нет — вернём split_type='equal' и пустые shares.
 * Последнюю долю подравниваем, чтобы сумма точно совпала с amount.
 */
function splitToBackend(
  split: SplitSelection | null | undefined,
  amount: number
): {
  split_type: "equal" | "shares" | "custom";
  shares: Array<{ user_id: number; amount: string; shares?: number | null }>;
} {
  if (!split) {
    return { split_type: "equal", shares: [] }
  }

  if (split.type === "equal") {
    const ids = split.participants.map((p) => p.user_id)
    const k = ids.length
    if (k === 0) return { split_type: "equal", shares: [] }
    const base = r2(amount / k)
    const out: number[] = Array.from({ length: k }, () => base)
    const diff = r2(amount - out.reduce((s, v) => s + v, 0))
    out[k - 1] = r2(out[k - 1] + diff)
    return {
      split_type: "equal",
      shares: ids.map((uid, i) => ({ user_id: uid, amount: toMoneyStr(out[i]) })),
    }
  }

  if (split.type === "shares") {
    const parts = split.participants.map((p) => ({ uid: p.user_id, sh: Number(p.share || 0) }))
    const totalShares = parts.reduce((s, p) => s + p.sh, 0)
    if (totalShares <= 0) {
      return { split_type: "shares", shares: [] }
    }
    const perShare = amount / totalShares
    const amounts = parts.map((p) => r2(perShare * p.sh))
    const diff = r2(amount - amounts.reduce((s, v) => s + v, 0))
    if (amounts.length) amounts[amounts.length - 1] = r2(amounts[amounts.length - 1] + diff)
    return {
      split_type: "shares",
      shares: parts.map((p, i) => ({
        user_id: p.uid,
        amount: toMoneyStr(amounts[i] || 0),
        shares: p.sh || null,
      })),
    }
  }

  // custom
  const parts = split.participants.map((p) => ({ uid: p.user_id, amt: Number(p.amount || 0) }))
  const sum = r2(parts.reduce((s, p) => s + p.amt, 0))
  let amounts = parts.map((p) => r2(p.amt))
  const diff = r2(amount - sum)
  if (amounts.length) amounts[amounts.length - 1] = r2(amounts[amounts.length - 1] + diff)

  return {
    split_type: "custom",
    shares: parts.map((p, i) => ({ user_id: p.uid, amount: toMoneyStr(amounts[i] || 0) })),
  }
}

export const useTransactionsStore = create<TxState>((set, get) => ({
  itemsByGroup: {},

  getByGroup: (gid?: number) => {
    if (!gid) return []
    return get().itemsByGroup[gid] || []
  },

  _addLocal: (tx: LocalTx) => {
    set((s) => {
      const arr = s.itemsByGroup[tx.group_id] ? [...s.itemsByGroup[tx.group_id]] : []
      arr.unshift(tx)
      return { itemsByGroup: { ...s.itemsByGroup, [tx.group_id]: arr } }
    })
  },

  _replaceLocal: (gid: number, tempId: string | number, real: LocalTx) => {
    set((s) => {
      const arr = (s.itemsByGroup[gid] || []).map((x) => (x.id === tempId ? real : x))
      return { itemsByGroup: { ...s.itemsByGroup, [gid]: arr } }
    })
  },

  _removeLocal: (gid: number, tempId: string | number) => {
    set((s) => {
      const arr = (s.itemsByGroup[gid] || []).filter((x) => x.id !== tempId)
      return { itemsByGroup: { ...s.itemsByGroup, [gid]: arr } }
    })
  },

  async createExpense(input) {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    }

    get()._addLocal(localTx)

    try {
      const { split_type, shares } = splitToBackend(input.split, input.amount)

      const payload: TransactionCreateRequest = {
        type: "expense",
        group_id: input.group_id,
        amount: toMoneyStr(input.amount),
        currency_code: (input.currency || "").toUpperCase(),
        date: input.date,
        comment: input.comment,
        category_id: input.category?.id ?? null,
        paid_by: input.paid_by ?? null,
        split_type,
        shares: shares.length ? shares : undefined,
      }

      const serverTx = await createTransaction(payload)

      const real: LocalExpenseTx = {
        ...localTx,
        id: (serverTx as any).id ?? localTx.id,
        created_at: (serverTx as any).created_at ?? localTx.created_at,
        category: (serverTx as any).category ?? localTx.category,
        split: localTx.split,
        comment: (serverTx as any).comment ?? localTx.comment,
        amount: Number((serverTx as any).amount ?? localTx.amount),
        currency: (serverTx as any).currency_code ?? (serverTx as any).currency ?? localTx.currency,
        date: (serverTx as any).date ?? localTx.date,
      }
      get()._replaceLocal(input.group_id, tempId, real)
      return serverTx
    } catch (e) {
      get()._removeLocal(input.group_id, tempId)
      throw e
    }
  },

  async createTransfer(input) {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    }

    get()._addLocal(localTx)

    try {
      const payload: TransactionCreateRequest = {
        type: "transfer",
        group_id: input.group_id,
        amount: toMoneyStr(input.amount),
        currency_code: (input.currency || "").toUpperCase(),
        date: input.date,
        transfer_from: input.from_user_id,
        transfer_to: [input.to_user_id],
      }

      const serverTx = await createTransaction(payload)

      const real: LocalTransferTx = {
        ...localTx,
        id: (serverTx as any).id ?? localTx.id,
        created_at: (serverTx as any).created_at ?? localTx.created_at,
        amount: Number((serverTx as any).amount ?? localTx.amount),
        currency: (serverTx as any).currency_code ?? (serverTx as any).currency ?? localTx.currency,
        date: (serverTx as any).date ?? localTx.date,
      }
      get()._replaceLocal(input.group_id, tempId, real)
      return serverTx
    } catch (e) {
      get()._removeLocal(input.group_id, tempId)
      throw e
    }
  },

  // ===== Чеки ===============================================================

  async attachReceipt(transactionId, file) {
    const { url } = await uploadReceipt(file)                    // 1) upload -> { url: "/media/receipts/..." }
    const tx = await setTransactionReceiptUrl(transactionId, url) // 2) bind -> TransactionOut (receipt_url абсолютный)
    // Если держишь список транзакций в сторе — тут можно найти по id и обновить receipt_url локально.
    return tx
  },

  async removeReceipt(transactionId) {
    await deleteTransactionReceipt(transactionId)
    // При необходимости — обнови локально транзакцию в своём состоянии (обнулить receipt_url).
  },
}))
