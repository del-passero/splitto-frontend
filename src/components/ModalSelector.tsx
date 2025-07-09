// src/components/ModalSelector.tsx
import { ReactNode } from "react"
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
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center">
      <div className="w-full max-w-md rounded-t-2xl bg-[var(--tg-bg-color)] p-5 animate-slide-up shadow-xl">
        <div className="font-bold text-lg mb-4 text-center text-[var(--tg-text-color)]">{title}</div>
        <div className="flex flex-col gap-2">
          {options.map(opt => (
            <button
              key={opt.value}
              className={`w-full rounded-xl px-3 py-3 flex items-center justify-between ${opt.value === value ? "bg-[var(--tg-link-color)] text-white font-bold" : "bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"}`}
              onClick={() => onChange(opt.value)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="text-xl ml-2">✓</span>}
            </button>
          ))}
        </div>
        <button className="w-full text-[var(--tg-link-color)] py-2 mt-4 rounded-xl font-bold" onClick={onClose}>Отмена</button>
      </div>
    </div>
  )
}
