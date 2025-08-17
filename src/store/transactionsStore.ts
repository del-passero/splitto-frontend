import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TxType = "expense" | "transfer";

export type SplitParticipant = {
  user_id: number;
  name?: string;
  avatar_url?: string;
  share?: number;
  amount?: number;
};

export type SplitSelection =
  | { type: "equal"; participants: SplitParticipant[] }
  | { type: "shares"; participants: SplitParticipant[] }
  | { type: "custom"; participants: SplitParticipant[] };

export type LocalExpense = {
  id: string;
  group_id: number;
  type: "expense";
  amount: number;
  currency: string;
  comment: string;
  date: string; // YYYY-MM-DD
  category?: { id: number; name: string; color?: string | null; icon?: string | null };
  paid_by?: number;
  paid_by_name?: string;
  paid_by_avatar?: string;
  split?: SplitSelection | null;
  created_at: number;
};

export type LocalTransfer = {
  id: string;
  group_id: number;
  type: "transfer";
  amount: number;
  currency: string;
  comment: string;
  date: string;
  from_user_id?: number;
  from_name?: string;
  from_avatar?: string;
  to_user_id?: number;
  to_name?: string;
  to_avatar?: string;
  created_at: number;
};

export type LocalTx = LocalExpense | LocalTransfer;

// ---- inputs (без id/created_at) ----
export type LocalExpenseInput = Omit<LocalExpense, "id" | "created_at">;
export type LocalTransferInput = Omit<LocalTransfer, "id" | "created_at">;

type State = {
  byGroup: Record<number, LocalTx[]>;
  addExpense: (tx: LocalExpenseInput) => LocalExpense;
  addTransfer: (tx: LocalTransferInput) => LocalTransfer;
  getByGroup: (groupId: number | undefined) => LocalTx[];
  clearAll: () => void;
};

const genId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useTransactionsStore = create<State>()(
  persist(
    (set, get) => ({
      byGroup: {},

      addExpense: (txInput) => {
        const tx: LocalExpense = {
          ...(txInput as LocalExpenseInput),
          id: genId(),
          created_at: Date.now(),
        };
        set((s) => {
          const g = tx.group_id;
          const list = s.byGroup[g] ? [tx, ...s.byGroup[g]] : [tx];
          return { byGroup: { ...s.byGroup, [g]: list } };
        });
        return tx;
      },

      addTransfer: (txInput) => {
        const tx: LocalTransfer = {
          ...(txInput as LocalTransferInput),
          id: genId(),
          created_at: Date.now(),
        };
        set((s) => {
          const g = tx.group_id;
          const list = s.byGroup[g] ? [tx, ...s.byGroup[g]] : [tx];
          return { byGroup: { ...s.byGroup, [g]: list } };
        });
        return tx;
      },

      getByGroup: (groupId) => {
        if (!groupId) return [];
        return get().byGroup[groupId] ?? [];
      },

      clearAll: () => set({ byGroup: {} }),
    }),
    {
      name: "splitto-txs",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byGroup: s.byGroup }),
    }
  )
);
