import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Да",
  cancelText = "Нет",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-[min(92vw,480px)] rounded-2xl bg-[var(--tg-card-bg)] border border-[var(--tg-secondary-bg-color,#e7e7e7)] shadow-2xl p-3"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[16px] font-bold text-[var(--tg-text-color)]">
            {title || ""}
          </div>
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={18} className="opacity-60" />
          </button>
        </div>

        <div className="text-[14px] text-[var(--tg-text-color)] mb-3">
          {message}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl font-semibold text-[14px] bg-[var(--tg-secondary-bg-color,#e6e6e6)] border border-[var(--tg-hint-color)]/30 hover:bg-black/5 dark:hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl font-semibold text-[14px] bg-red-600 text-white hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
