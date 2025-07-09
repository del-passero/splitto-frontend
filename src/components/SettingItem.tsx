// src/components/SettingItem.tsx
import { ReactNode } from "react"
type Props = {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
}
const SettingItem = ({ icon, label, value, onClick }: Props) => (
  <button onClick={onClick} className="w-full flex items-center rounded-xl py-3 px-4 bg-[var(--tg-bg-color)] mb-2 shadow">
    <span className="mr-3">{icon}</span>
    <span className="flex-1 text-left text-[var(--tg-text-color)]">{label}</span>
    <span className="text-[var(--tg-hint-color)]">{value}</span>
  </button>
)
export default SettingItem
