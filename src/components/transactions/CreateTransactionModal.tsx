// src/components/transactions/CreateTransactionModal.tsx
// Модалка (визуал) — пока ничего не сохраняет. Локализация через i18n.

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Calendar, DollarSign, CreditCard, Users, MessageSquare, Layers } from "lucide-react";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
}

export type TxType = "expense" | "transfer";

export interface CreateTransactionModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];
  defaultGroupId?: number;
}

function cx(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CreateTransactionModal({
  open,
  onOpenChange,
  groups,
  defaultGroupId,
}: CreateTransactionModalProps) {
  const { t } = useTranslation();

  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [comment, setComment] = useState<string>("");

  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setSelectedGroupId(defaultGroupId);
      setType("expense");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 16));
      setComment("");
      setPaidBy(undefined);
    }
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId), [groups, selectedGroupId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => onOpenChange(false)} />

          <motion.div
            className={cx(
              "absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2",
              "md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-[640px] w-full rounded-t-3xl md:rounded-3xl shadow-2xl",
              "bg-white dark:bg-zinc-900"
            )}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base md:text-lg font-semibold">{t("tx_modal.title")}</h3>
              <button onClick={() => onOpenChange(false)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 md:px-6 md:py-6 space-y-4">
              {/* STEP 1: GROUP */}
              <div className="space-y-2">
                <label className="text-sm font-medium opacity-80">{t("tx_modal.choose_group")}</label>
                <div className="relative">
                  <select
                    className={cx(
                      "w-full appearance-none rounded-2xl border border-zinc-200 dark:border-zinc-800",
                      "bg-white/80 dark:bg-zinc-900/80 px-4 py-3 pr-10",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    )}
                    value={selectedGroupId ?? ""}
                    onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">{t("tx_modal.group_placeholder")}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">▾</span>
                </div>
              </div>

              {/* STEP 2+: OTHER FIELDS */}
              <AnimatePresence initial={false}>
                {selectedGroup && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-4">
                    {/* TYPE */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium opacity-80">{t("tx_modal.type")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setType("expense")}
                          className={cx(
                            "rounded-2xl px-4 py-3 border text-center",
                            type === "expense"
                              ? "border-transparent bg-blue-600 text-white"
                              : "border-zinc-200 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          {t("tx_modal.expense")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setType("transfer")}
                          className={cx(
                            "rounded-2xl px-4 py-3 border text-center",
                            type === "transfer"
                              ? "border-transparent bg-blue-600 text-white"
                              : "border-zinc-200 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          {t("tx_modal.transfer")}
                        </button>
                      </div>
                    </div>

                    {/* AMOUNT + DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium opacity-80">{t("tx_modal.amount")}</label>
                        <div className="relative">
                          <input
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                            className={cx(
                              "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800",
                              "bg-white/80 dark:bg-zinc-900/80 px-4 py-3",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            )}
                          />
                          <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium opacity-80">{t("tx_modal.date")}</label>
                        <div className="relative">
                          <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={cx(
                              "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800",
                              "bg-white/80 dark:bg-zinc-900/80 px-4 py-3",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            )}
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                        </div>
                      </div>
                    </div>

                    {/* COMMENT */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium opacity-80">{t("tx_modal.comment")}</label>
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={2}
                          className={cx(
                            "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800",
                            "bg-white/80 dark:bg-zinc-900/80 px-4 py-3",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          )}
                        />
                        <MessageSquare className="absolute right-3 top-3 opacity-40" size={18} />
                      </div>
                    </div>

                    {/* PLACEHOLDERS (позже подключим категории/участников/сплит) */}
                    {type === "expense" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* CATEGORY */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium opacity-80">{t("tx_modal.category")}</label>
                          <button
                            type="button"
                            disabled
                            className="w-full rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-3 text-left opacity-70"
                            title="Coming soon"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Layers size={16} className="opacity-60" />
                              <span>—</span>
                            </div>
                          </button>
                        </div>

                        {/* PAID BY */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium opacity-80">{t("tx_modal.paid_by")}</label>
                          <div className="relative">
                            <select
                              disabled
                              className={cx(
                                "w-full appearance-none rounded-2xl border border-zinc-200 dark:border-zinc-800",
                                "bg-white/60 dark:bg-zinc-900/60 px-4 py-3 pr-10 text-zinc-400"
                              )}
                              value={paidBy ?? ""}
                              onChange={(e) => setPaidBy(Number(e.target.value))}
                            >
                              <option value="">—</option>
                            </select>
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* TRANSFER FROM */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium opacity-80">{t("tx_modal.transfer_from")}</label>
                          <div className="relative">
                            <select
                              disabled
                              className={cx(
                                "w-full appearance-none rounded-2xl border border-zinc-200 dark:border-zinc-800",
                                "bg-white/60 dark:bg-zinc-900/60 px-4 py-3 pr-10 text-zinc-400"
                              )}
                            >
                              <option>—</option>
                            </select>
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                          </div>
                        </div>

                        {/* TRANSFER TO */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium opacity-80">{t("tx_modal.transfer_to")}</label>
                          <button
                            type="button"
                            disabled
                            className="w-full rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-3 text-left opacity-70"
                            title="Coming soon"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Users size={16} className="opacity-60" />
                              <span>—</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 md:px-6 md:py-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5">
                {t("tx_modal.cancel")}
              </button>
              <div className="flex items-center gap-2">
                {!selectedGroup && (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed"
                    title={t("tx_modal.choose_group_first")}
                  >
                    {t("tx_modal.create")}
                  </button>
                )}
                {selectedGroup && (
                  <button
                    onClick={() => {
                      console.log("[CreateTransactionModal] draft", {
                        group_id: selectedGroupId,
                        type,
                        amount,
                        date,
                        comment,
                      });
                      onOpenChange(false);
                    }}
                    className={cx("px-4 py-2 rounded-xl font-medium shadow-sm", "bg-[var(--tg-link-color,#2563eb)] text-white")}
                  >
                    {t("tx_modal.create")}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
