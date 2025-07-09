// src/components/ModalSelector.tsx
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-[var(--tg-bg-color)] pb-2 animate-slide-up shadow-lg">
        <div className="font-bold text-lg pt-4 pb-3 px-6 mb-2 text-left text-[var(--tg-link-color)]">{title}</div>
        <div className="flex flex-col">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              className={`w-full flex items-center px-6 py-4 text-base text-[var(--tg-text-color)] ${opt.value === value ? "font-bold" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              <span className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${opt.value === value ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>
                {opt.value === value && <span className="w-3 h-3 rounded-full bg-[var(--tg-link-color)]"></span>}
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <button className="w-full text-[var(--tg-link-color)] py-3 mt-2 text-base font-semibold" onClick={onClose}>Отмена</button>
      </div>
    </div>
  )
}
