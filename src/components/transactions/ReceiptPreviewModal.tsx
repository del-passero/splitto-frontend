// src/components/transactions/ReceiptPreviewModal.tsx
import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /* Нормализуем вход: можно передать url напрямую либо через displayUrl/previewUrl/existingUrl */
  url?: string | null;
  displayUrl?: string | null;
  previewUrl?: string | null;
  existingUrl?: string | null;
  isPdf?: boolean;
};

export default function ReceiptPreviewModal({
  open,
  onClose,
  url,
  displayUrl,
  previewUrl,
  existingUrl,
  isPdf,
}: Props) {
  if (!open) return null;

  const u = url ?? displayUrl ?? previewUrl ?? existingUrl ?? null;
  const pdf = typeof isPdf === "boolean" ? isPdf : (u ? /\.pdf($|\?)/i.test(u) : false);

  return (
    <div className="fixed inset-0 z-[1200]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-4 sm:inset-10 rounded-2xl overflow-hidden bg-[var(--tg-card-bg)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="font-bold">Предпросмотр чека</div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-3">
          {u ? (
            pdf ? (
              <iframe title="receipt-pdf" src={u} className="w-full h-full rounded-md border" />
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={u} alt="" className="max-w-full max-h-full object-contain" />
            )
          ) : (
            <div className="text-[var(--tg-hint-color)]">Нет данных</div>
          )}
        </div>
      </div>
    </div>
  );
}

