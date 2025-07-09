// src/components/CardSection.tsx
import { ReactNode } from "react"
// Универсальная карточка для любой секции профиля/настроек
type Props = {
  title: string
  children: ReactNode
  className?: string
}
const CardSection = ({ title, children, className = "" }: Props) => (
  <div className={`rounded-2xl shadow bg-[var(--tg-bg-color)] p-0 my-3 ${className}`}>
    <div className="px-5 pt-4 pb-2 font-semibold text-[var(--tg-link-color)] text-sm">{title}</div>
    <div>{children}</div>
  </div>
)
export default CardSection
