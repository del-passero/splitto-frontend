// Визуальная модалка создания транзакции (пока без сохранения).
// Добавлено: модалка выбора категории (в стиле CurrencyPickerModal),
// сброс категории при смене группы/типа, дизейбл категории для transfer.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Layers, CalendarDays, CircleDollarSign, CreditCard, MessageSquare, ChevronRight, Shuffle, Users } from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import CategoryPickerModal, { type CategoryItem } from "../category/CategoryPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];           // можно передавать пустой — модалка сама подгрузит
  defaultGroupId?: number;
};

function Row({ icon, label, value, onClick, right, isLast, disabled }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; right?: React.ReactNode; isLast?: boolean; disabled?: boolean }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`flex items-center w-full py-2.5 bg-transparent focus:outline-none active:opacity-90 ${disabled ? "opacity-60" : ""}`}
        style={{ minHeight: 44 }}
      >
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[15px]">{label}</span>
        {right ? (
          <span className="mr-3">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[15px] mr-1.5">{value}</span>}
            {onClick && !disabled && <ChevronRight className="text-[var(--tg-hint-color)] mr-3" size={18} />}
          </>
        )}
      </button>
      {!isLast && <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />}
    </div>
  );
}

export default function CreateTransactionModal({ open, onOpenChange, groups: groupsProp, defaultGroupId }: Props) {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  // если проп пуст, берём из стора
  const [localGroups, setLocalGroups] = useState<MinimalGroup[]>([]);
  useEffect(() => { setLocalGroups(groupsProp && groupsProp.length ? groupsProp : (groupsStoreItems ?? [])); }, [groupsProp, groupsStoreItems]);

  // автоподгрузка групп при первом открытии
  const didLoadRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (didLoadRef.current) return;
    const need = !(groupsProp && groupsProp.length) && !(groupsStoreItems && groupsStoreItems.length);
    if (need && user?.id) {
      didLoadRef.current = true;
      fetchGroups(user.id).catch(() => {}).finally(() => { /* позже попадут через стор */ });
    }
  }, [open, groupsProp, groupsStoreItems, user, fetchGroups]);

  // форма
  const [groupModal, setGroupModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);
  const [type, setType] = useState<TxType>("expense");
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [split, setSplit] = useState<"equal" | "shares" | "custom">("equal");
  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  // сброс при закрытии
  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setSelectedCategory(null);
    setAmount("");
    setSplit("equal");
    setPaidBy(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
  }, [open, defaultGroupId]);

  // сброс категории при смене группы/типа
  useEffect(() => {
    setSelectedCategory(null);
  }, [selectedGroupId]);
  useEffect(() => {
    if (type === "transfer") setSelectedCategory(null);
  }, [type]);

  const selectedGroup = useMemo(() => localGroups.find((g) => g.id === selectedGroupId), [localGroups, selectedGroupId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          <button type="button" onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition" aria-label={t("close")}><X className="w-6 h-6 text-[var(--tg-hint-color)]" /></button>

          <div className="p-4 pt-3 flex flex-col gap-1">
            <div className="text-[17px] font-bold text-[var(--tg-text-color)] mb-1">{t("tx_modal.title")}</div>

            {/* 1) Группа */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<Users className="text-[var(--tg-link-color)]" size={20} />}
                  label={t("tx_modal.choose_group")}
                  value={selectedGroup ? selectedGroup.name : t("tx_modal.group_placeholder")}
                  onClick={() => setGroupModal(true)}
                  isLast
                />
              </CardSection>
            </div>

            {/* 2) Тип транзакции */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<Shuffle className="text-[var(--tg-link-color)]" size={20} />}
                  label={t("tx_modal.type")}
                  right={
                    <div className="inline-flex rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                      <button type="button" onClick={() => setType("expense")} className={`px-3 h-9 text-[14px] ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.expense")}</button>
                      <button type="button" onClick={() => setType("transfer")} className={`px-3 h-9 text-[14px] ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}>{t("tx_modal.transfer")}</button>
                    </div>
                  }
                  isLast
                />
              </CardSection>
            </div>

            {/* 3) Категория */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<Layers className="text-[var(--tg-link-color)]" size={20} />}
                  label={t("tx_modal.category")}
                  value={selectedCategory?.name || "—"}
                  onClick={() => {
                    if (!selectedGroupId) { setGroupModal(true); return }
                    setCategoryModal(true)
                  }}
                  isLast
                  disabled={type === "transfer"}
                />
              </CardSection>
            </div>

            {/* 4) Сумма */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-4 py-2.5">
                  <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.amount")}</label>
                  <div className="relative">
                    <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))} className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tg-accent-color)]" />
                    <CircleDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  </div>
                </div>
              </CardSection>
            </div>

            {/* 5) Тип деления — выпадающий список */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-4 py-2.5">
                  <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.split")}</label>
                  <div className="relative">
                    <select value={split} onChange={(e) => setSplit(e.target.value as any)} className="w-full appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 pr-9 text-[15px] focus:outline-none focus:border-[var(--tg-accent-color)]">
                      <option value="equal">{t("tx_modal.split_equal")}</option>
                      <option value="shares">{t("tx_modal.split_shares")}</option>
                      <option value="custom">{t("tx_modal.split_custom")}</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                  </div>
                </div>
              </CardSection>
            </div>

            {/* 6) Кто платил (пока disabled-плейсхолдер) */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-4 py-2.5">
                  <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.paid_by")}</label>
                  <div className="relative">
                    <select disabled value={paidBy ?? ""} onChange={(e) => setPaidBy(Number(e.target.value))} className="w-full appearance-none rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 pr-9 text-[15px] text-[color:var(--tg-hint-color)] focus:outline-none">
                      <option value="">{t("not_specified")}</option>
                    </select>
                    <CreditCard className="absolute right-8 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tg-hint-color)]">▾</span>
                  </div>
                </div>
              </CardSection>
            </div>

            {/* 7) Дата */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-4 py-2.5">
                  <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.date")}</label>
                  <div className="relative">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[var(--tg-accent-color)]" />
                    <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  </div>
                </div>
              </CardSection>
            </div>

            {/* 8) Комментарий */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-4 py-2.5">
                  <label className="block text-[13px] font-medium opacity-80 mb-1">{t("tx_modal.comment")}</label>
                  <div className="relative">
                    <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2.5 text-[15px] resize-y min-h-[72px] focus:outline-none focus:border-[var(--tg-accent-color)]" />
                    <MessageSquare className="absolute right-3 top-2 opacity-40" size={18} />
                  </div>
                </div>
              </CardSection>
            </div>

            {/* Кнопки */}
            <div className="flex flex-row gap-2 mt-1 w-full">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{ color: "#000" }}
                className="w-1/2 py-2.5 rounded-xl font-bold text-[15px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("[CreateTransactionModal] draft", {
                    group_id: selectedGroupId,
                    type,
                    category_id: selectedCategory?.id ?? null,
                    category_name: selectedCategory?.name ?? null,
                    amount,
                    split,
                    paid_by: paidBy,
                    date,
                    comment,
                  });
                  onOpenChange(false);
                }}
                className="w-1/2 py-2.5 rounded-xl font-bold text-[15px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                disabled={!selectedGroupId || !amount.trim()}
              >
                {t("tx_modal.create")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор группы (как выбор валюты) */}
      <GroupPickerModal
        open={groupModal}
        onClose={() => setGroupModal(false)}
        selectedId={selectedGroupId}
        onSelect={(g) => { setSelectedGroupId(g.id); setGroupModal(false); }}
      />

      {/* Выбор категории */}
      {selectedGroupId !== undefined && (
        <CategoryPickerModal
          open={categoryModal}
          onClose={() => setCategoryModal(false)}
          groupId={selectedGroupId}
          selectedId={selectedCategory?.id}
          onSelect={(c) => setSelectedCategory(c)}
          closeOnSelect
        />
      )}
    </div>
  );
}
