import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t?: (k: string) => string;
};

export default function ActionModal({ open, onClose, onEdit, onDelete, t }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-[min(92vw,420px)] rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-2"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <div className="text-[16px] font-bold text-[var(--tg-text-color)]">
            {t ? t("actions") : "Действия"}
          </div>
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} className="opacity-60" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
            onClick={onEdit}
          >
            {t ? t("edit") : "Редактировать"}
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] font-semibold text-red-500 hover:bg-red-500/10 transition"
            onClick={onDelete}
          >
            {t ? t("delete") : "Удалить"}
          </button>
          <div className="h-px bg-[var(--tg-hint-color)] opacity-10 my-1" />
          <button
            type="button"
            className="w-full text-center px-4 py-3 rounded-xl text-[14px] hover:bg-black/5 dark:hover:bg-white/5 transition"
            onClick={onClose}
          >
            {t ? t("cancel") : "Отмена"}
          </button>
        </div>
      </div>
    </div>
  );
}
