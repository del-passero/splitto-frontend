// src/components/transactions/ReceiptPreviewModal.tsx
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string | null;
  /** Необязательный флаг. Если не передан — определим по url. */
  isPdf?: boolean;
};

export default function ReceiptPreviewModal({ open, onClose, url, isPdf }: Props) {
  if (!open) return null;

  const pdf = isPdf ?? /\.pdf(\?|$)/i.test(url || "");

  return (
    <div className="fixed inset-0 z-[1400]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute inset-4 sm:inset-10 rounded-2xl bg-[var(--tg-card-bg,#111)] shadow-2xl p-3 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
          </button>
        </div>

        {/* Контент: min-h-0 чтобы iframe корректно занимал высоту внутри flex */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          {url ? (
            pdf ? (
              <iframe
                src={`${url}#view=FitH`}
                title="Receipt PDF"
                className="w-full h-full rounded-lg"
              />
            ) : (
              <img
                src={url}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg m-auto"
              />
            )
          ) : (
            <div className="m-auto text-[var(--tg-text-color)] opacity-70 text-sm">
              Файл отсутствует
            </div>
          )}
        </div>

        {url && pdf && (
          <div className="pt-2 text-right">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline text-[var(--tg-text-color)]/80"
            >
              Открыть в новой вкладке
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
