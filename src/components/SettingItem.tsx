// src/components/SettingItem.tsx
import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

type Props = {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
}
const SettingItem = ({ icon, label, value, onClick }: Props) => (
  <button
    onClick={onClick}
    className="flex items-center w-full bg-transparent px-0 py-4 focus:outline-none hover:bg-[var(--tg-accent-bg-color)]"
    style={{ minHeight: 44 }}
  >
    <span className="ml-5 mr-4">{icon}</span>
    <span className="flex-1 text-left text-[var(--tg-text-color)] text-base">{label}</span>
    <span className="text-[var(--tg-link-color)] text-base mr-2">{value}</span>
    <ChevronRight className="text-[var(--tg-hint-color)]" size={20} />
  </button>
)
export default SettingItem
