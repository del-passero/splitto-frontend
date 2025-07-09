// src/components/CardSection.tsx
import { ReactNode } from "react"
// Карточка секции (Telegram Wallet стиль, плотный фон, тень, скругления)
type Props = {
  title: string
  children: ReactNode
  className?: string
}
const CardSection = ({ title, children, className = "" }: Props) => (
  <div className={`rounded-2xl shadow-xl bg-white/90 dark:bg-[#232b3b] p-0 my-5 max-w-md mx-auto ${className}`}>
    <div className="px-5 pt-4 pb-2 font-semibold text-[var(--tg-link-color)] text-sm">{title}</div>
    <div>{children}</div>
  </div>
)
export default CardSection
