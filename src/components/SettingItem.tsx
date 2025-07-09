// src/components/SettingItem.tsx
import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
type Props = {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
  last?: boolean
}
const SettingItem = ({ icon, label, value, onClick, last = false }: Props) => (
  <button onClick={onClick} className="flex items-center w-full px-5 py-4 bg-transparent relative">
    <span className="mr-3">{icon}</span>
    <span className="flex-1 text-left text-[var(--tg-text-color)] text-base">{label}</span>
    <span className="text-[var(--tg-hint-color)] text-base mr-2">{value}</span>
    <ChevronRight className="text-[var(--tg-hint-color)]" size={20} />
    {!last && <div className="absolute left-12 right-2 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-20"></div>}
  </button>
)
export default SettingItem
