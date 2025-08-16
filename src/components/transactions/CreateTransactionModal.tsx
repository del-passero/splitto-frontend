// src/components/transactions/CreateTransactionModal.tsx
// Визуальная модалка создания транзакции (интерфейс обновлён).
// Фиксы:
//  - Заголовок оставлен (tx_modal.title).
//  - Крестик не налезает: добавлен внутренний отступ сверху.
//  - Компактные отступы везде (меньше вертикальных зазоров).
//  - Пилюля группы: если groupLocked=true — не кликабельна.
//  - Выбор плательщика: модалка PaidByPickerModal, показываем только имя и аватар.
//  - Никаких условных вызовов хуков (во избежание React error #310).
//  - Никаких изменений vite.config.ts/main.tsx/API.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, Layers, CalendarDays, CircleDollarSign, CreditCard,
  MessageSquare, ChevronRight, Shuffle, Users
} from "lucide-react";
import CardSection from "../CardSection";
import GroupPickerModal from "../group/GroupPickerModal";
import { useUserStore } from "../../store/userStore";
import { useGroupsStore } from "../../store/groupsStore";
import PaidByPickerModal from "./PaidByPickerModal";

export type TxType = "expense" | "transfer";

export interface MinimalGroup {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  // currency берём из группы, если в сторе она есть — здесь опционально
  currency_code?: string | null;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: MinimalGroup[];           // можно передавать пустой — модалка сама подгрузит
  defaultGroupId?: number;
  groupLocked?: boolean;            // если true — группу нельзя сменить (страница деталей группы)
};

function Row({
  icon, label, value, onClick, right, isLast
}: {
  icon: React.ReactNode; label: string; value?: string; onClick?: () => void; right?: React.ReactNode; isLast?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center w-full py-2 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 40 }}
      >
        <span className="ml-3 mr-3 flex items-center" style={{ width: 20 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[14px]">{label}</span>
        {right ? (
          <span className="mr-2">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[14px] mr-1.5">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-3" size={16} />}
          </>
        )}
      </button>
      {!isLast && (
        <div className="absolute left-[46px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
      )}
    </div>
  );
}

function GroupPill({
  group, disabled, onClick,
}: {
  group?: MinimalGroup; disabled?: boolean; onClick?: () => void;
}) {
  if (!group) return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]
        ${disabled ? "opacity-60" : "hover:bg-[var(--tg-accent-color)]/10"} transition`}
    >
      <Users className="text-[var(--tg-link-color)]" size={18} />
      <span className="text-[14px]">{/* placeholder отрисуется в Row-заголовке */}</span>
    </button>
  );

  const bg = group.color || "#40A7E3";
  const letter = (group.name || "?").charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]
        ${disabled ? "cursor-default opacity-70" : "hover:bg-[var(--tg-accent-color)]/10"} transition`}
      aria-disabled={disabled}
    >
      <div
        className="shrink-0 rounded-lg text-white flex items-center justify-center"
        style={{ width: 28, height: 28, background: bg }}
      >
        <span style={{ fontSize: 14 }}>{group.icon || letter}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[14px] font-medium truncate">{group.name}</div>
      </div>
      {!disabled && <ChevronRight className="text-[var(--tg-hint-color)]" size={16} />}
    </button>
  );
}

export default function CreateTransactionModal({
  open, onOpenChange, groups: groupsProp, defaultGroupId, groupLocked = false
}: Props) {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { groups: groupsStoreItems, fetchGroups } = useGroupsStore();

  // локальные группы (из пропа или стора)
  const [localGroups, setLocalGroups] = useState<MinimalGroup[]>([]);
  useEffect(() => {
    setLocalGroups(
      groupsProp && groupsProp.length ? groupsProp : (groupsStoreItems ?? [])
    );
  }, [groupsProp, groupsStoreItems]);

  // автоподгрузка групп при первом открытии
  const didLoadRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (didLoadRef.current) return;
    const need = !(groupsProp && groupsProp.length) && !(groupsStoreItems && groupsStoreItems.length);
    if (need && user?.id) {
      didLoadRef.current = true;
      fetchGroups(user.id).catch(() => {}).finally(() => {});
    }
  }, [open, groupsProp, groupsStoreItems, user, fetchGroups]);

  // форма
  const [groupModal, setGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(defaultGroupId);
  const [type, setType] = useState<TxType>("expense");
  const [categoryName, setCategoryName] = useState<string | null>(null); // плейсхолдер
  const [amount, setAmount] = useState<string>("");
  const [split, setSplit] = useState<"equal" | "shares" | "custom">("equal");
  const [paidBy, setPaidBy] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  // модалка выбора плательщика
  const [paidByModal, setPaidByModal] = useState(false);

  // сброс при закрытии
  useEffect(() => {
    if (open) return;
    setSelectedGroupId(defaultGroupId);
    setType("expense");
    setCategoryName(null);
    setAmount("");
    setSplit("equal");
    setPaidBy(undefined);
    setDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setGroupModal(false);
    setPaidByModal(false);
  }, [open, defaultGroupId]);

  const selectedGroup = useMemo(
    () => localGroups.find((g) => g.id === selectedGroupId),
    [localGroups, selectedGroupId]
  );

  // формат отображения суммы-черновика (без строгой маски — маску подключим отдельно)
  const normalizedAmount = useMemo(() => {
    const v = amount.replace(",", ".").trim();
    if (!v) return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return n.toFixed(2);
  }, [amount]);

  if (!open) return null;

  const canSubmit = Boolean(selectedGroupId && normalizedAmount && comment.trim().length > 0);
  const groupPickDisabled = groupLocked;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          {/* Кнопка закрытия */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
          >
            <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
          </button>

          {/* Контент с верхним отступом, чтобы крестик не перекрывал */}
          <div className="p-4 pt-9 flex flex-col gap-1">
            {/* Заголовок (по просьбе — вернуть) */}
            <div className="text-[16px] font-bold text-[var(--tg-text-color)] mb-1">
              {t("tx_modal.title")}
            </div>

            {/* 1) Группа (пилюля) */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-3 py-2">
                  <div className="text-[12px] font-medium opacity-80 mb-1">{t("tx_modal.choose_group")}</div>
                  <GroupPill
                    group={selectedGroup}
                    disabled={groupPickDisabled}
                    onClick={() => setGroupModal(true)}
                  />
                </div>
              </CardSection>
            </div>

            {/* 2) Тип транзакции */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<Shuffle className="text-[var(--tg-link-color)]" size={18} />}
                  label={t("tx_modal.type")}
                  right={
                    <div className="inline-flex rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`px-2.5 h-8 text-[13px] ${type === "expense" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                      >
                        {t("tx_modal.expense")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("transfer")}
                        className={`px-2.5 h-8 text-[13px] ${type === "transfer" ? "bg-[var(--tg-accent-color,#40A7E3)] text-white" : "text-[var(--tg-text-color)] bg-transparent"}`}
                      >
                        {t("tx_modal.transfer")}
                      </button>
                    </div>
                  }
                  isLast
                />
              </CardSection>
            </div>

            {/* 3) Категория (плейсхолдер) */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<Layers className="text-[var(--tg-link-color)]" size={18} />}
                  label={t("tx_modal.category")}
                  value={categoryName || "—"}
                  onClick={() => {
                    // позже откроем CategoryPickerModal
                  }}
                  isLast
                />
              </CardSection>
            </div>

            {/* 4) Сумма */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-3 py-2">
                  <label className="block text-[12px] font-medium opacity-80 mb-1">{t("tx_modal.amount")}</label>
                  <div className="relative">
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                      className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                    />
                    <CircleDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                  </div>
                  {/* Пример форматированного вида рядом */}
                  {normalizedAmount && (
                    <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">≈ {normalizedAmount}</div>
                  )}
                </div>
              </CardSection>
            </div>

            {/* 5) Кто платил */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-3 py-2">
                  <label className="block text-[12px] font-medium opacity-80 mb-1">{t("tx_modal.paid_by")}</label>
                  <button
                    type="button"
                    onClick={() => selectedGroupId && setPaidByModal(true)}
                    className="w-full flex items-center justify-between rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] text-left"
                  >
                    <div className="flex items-center min-w-0">
                      <CreditCard className="opacity-50 mr-2" size={16} />
                      <span className="truncate">
                        {paidBy ? t("tx_modal.paid_by") : t("not_specified")}
                      </span>
                    </div>
                    <ChevronRight className="text-[var(--tg-hint-color)]" size={16} />
                  </button>
                </div>
              </CardSection>
            </div>

            {/* 6) Дата */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-3 py-2">
                  <label className="block text-[12px] font-medium opacity-80 mb-1">{t("tx_modal.date")}</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                    />
                    <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
                  </div>
                </div>
              </CardSection>
            </div>

            {/* 7) Комментарий (обязательное поле) */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <div className="px-3 py-2">
                  <label className="block text-[12px] font-medium opacity-80 mb-1">{t("tx_modal.comment")}</label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] resize-y min-h-[64px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                    />
                    <MessageSquare className="absolute right-3 top-2 opacity-40" size={16} />
                  </div>
                  {/* Подсказка при пустом значении */}
                  {!comment.trim() && (
                    <div className="mt-1 text-[12px] text-[var(--tg-hint-color)]">
                      {t("errors?.comment_required") || "Введите комментарий"}
                    </div>
                  )}
                </div>
              </CardSection>
            </div>

            {/* Кнопки */}
            <div className="flex flex-row gap-2 mt-1 w-full">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{ color: "#000" }}
                className="w-1/2 py-2 rounded-xl font-bold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("[CreateTransactionModal] draft", {
                    group_id: selectedGroupId, type, category: categoryName, amount: normalizedAmount,
                    split, paid_by: paidBy, date, comment
                  });
                  onOpenChange(false);
                }}
                className="w-1/2 py-2 rounded-xl font-bold text-[14px] bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition disabled:opacity-60"
                disabled={!canSubmit}
              >
                {t("tx_modal.create")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Выбор группы */}
      <GroupPickerModal
        open={groupModal && !groupPickDisabled}
        onClose={() => setGroupModal(false)}
        selectedId={selectedGroupId}
        onSelect={(g) => { setSelectedGroupId(g.id); setGroupModal(false); }}
      />

      {/* Выбор плательщика */}
      <PaidByPickerModal
        open={paidByModal}
        onClose={() => setPaidByModal(false)}
        groupId={selectedGroupId}
        selectedUserId={paidBy}
        onSelect={(userId) => { setPaidBy(userId); setPaidByModal(false); }}
        closeOnSelect
      />
    </div>
  );
}
