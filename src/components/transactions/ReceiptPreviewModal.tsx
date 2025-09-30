// src/components/transactions/ReceiptPreviewModal.tsx
import { X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  url: string | null
  /** Необязательный флаг. Если не передан — определим по url. */
  isPdf?: boolean
}

export default function ReceiptPreviewModal({ open, onClose, url, isPdf }: Props) {
  if (!open) return null

  const pdf = isPdf ?? /\.pdf(\?|$)/i.test(url || "")

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

        <div className="flex-1 overflow-auto flex items-center justify-center">
          {url ? (
            pdf ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={url}
                  title="receipt-pdf"
                  className="w-full h-full rounded-lg"
                />
                <div className="text-[var(--tg-text-color)] text-sm px-2 mt-2 text-center">
                  Если PDF не отображается, попробуйте{" "}
                  <a href={url} target="_blank" rel="noreferrer" className="underline">
                    открыть в новой вкладке
                  </a>
                </div>
              </div>
            ) : (
              // «Книжное» превью 3:4 по центру модалки
              <div className="w-[min(90vw,520px)] aspect-[3/4] rounded-lg overflow-hidden border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)]">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )
          ) : (
            <div className="text-[var(--tg-text-color)] opacity-70 text-sm">
              Файл отсутствует
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
