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
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center">
      <div className="w-full max-w-md rounded-t-2xl bg-[var(--tg-bg-color)] p-5">
        <div className="font-bold text-lg mb-4 text-[var(--tg-text-color)]">{title}</div>
        {options.map(opt => (
          <button
            key={opt.value}
            className={`w-full text-left py-3 px-2 rounded-lg mb-2 ${opt.value === value ? "bg-[var(--tg-link-color)] text-white font-bold" : "hover:bg-[var(--tg-secondary-bg-color)] text-[var(--tg-text-color)]"}`}
            onClick={() => onChange(opt.value)}
          >{opt.label}</button>
        ))}
        <button className="w-full text-[var(--tg-link-color)] py-2 mt-1" onClick={onClose}>Отмена</button>
      </div>
    </div>
  )
}
