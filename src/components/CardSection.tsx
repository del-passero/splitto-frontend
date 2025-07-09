// src/components/CardSection.tsx
import { ReactNode } from "react"
type Props = { title?: string; children: ReactNode; className?: string }
const CardSection = ({ title, children, className = "" }: Props) => (
  <div className={`rounded-2xl shadow-lg bg-[var(--tg-card-bg)] my-6 px-0 pt-2 pb-1 max-w-[420px] mx-auto ${className}`}>
    {title && <div className="px-6 pt-3 pb-1 font-bold text-[var(--tg-link-color)] text-base">{title}</div>}
    {children}
  </div>
)
export default CardSection
