// src/components/ModalSelector.tsx
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

type Option = { value: string; label: string }
type Props = {
  title: string
  open: boolean
  value: string
  options: Option[]
  onChange: (v: string) => void
  onClose: () => void
}

export const ModalSelector = ({ title, open, value, options, onChange, onClose }: Props) => {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement | null>(null)

  // ВАЖНО: хук вызываем всегда, но внутри проверяем open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const handleBackdropMouseDown = () => open && onClose()
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-[var(--tg-bg-color)] pb-2 animate-slide-up shadow-lg"
        onMouseDown={stop}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="font-bold text-lg pt-4 pb-3 px-6 mb-2 text-left text-[var(--tg-link-color)]">
          {title}
        </div>

        <div className="flex flex-col max-h-[65vh] overflow-y-auto" role="radiogroup" aria-label={title}>
          {options.map((opt) => {
            const selected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                className={`w-full flex items-center px-6 py-4 text-base text-[var(--tg-text-color)] ${
                  selected ? "font-bold" : ""
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-link-color)]/40`}
                onClick={() => onChange(opt.value)}
                role="radio"
                aria-checked={selected}
              >
                <span
                  className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"
                  }`}
                  aria-hidden="true"
                >
                  {selected && <span className="w-3 h-3 rounded-full bg-[var(--tg-link-color)]" />}
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="w-full text-[var(--tg-link-color)] py-3 mt-2 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-link-color)]/40"
          onClick={onClose}
        >
          {t("cancel", "Cancel")}
        </button>
      </div>
    </div>
  )
}
