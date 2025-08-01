// src/components/SettingItem.tsx
import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
type Props = {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
  isLast?: boolean
}
const SettingItem = ({ icon, label, value, onClick, isLast = false }: Props) => (
  <div className="relative">
    <button
      onClick={onClick}
      className="flex items-center w-full px-1 py-4 bg-transparent focus:outline-none hover:bg-[var(--tg-accent-bg-color)] transition"
      type="button"
      style={{ minHeight: 48 }}
    >
      <span className="mr-4 flex items-center">{icon}</span>
      <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">{label}</span>
      <span className="text-[var(--tg-link-color)] text-[16px] mr-2">{value}</span>
      <ChevronRight className="text-[var(--tg-hint-color)]" size={20} />
    </button>
    {/* Divider снизу — кроме последнего SettingItem */}
    {!isLast && <div className="absolute left-5 right-5 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
  </div>
)
export default SettingItem
