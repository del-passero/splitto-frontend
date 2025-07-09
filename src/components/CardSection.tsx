// src/components/CardSection.tsx
import { ReactNode } from "react"
type Props = {
  children: ReactNode
  className?: string
}
const CardSection = ({ children, className = "" }: Props) => (
  <div className={`rounded-2xl shadow-md bg-[var(--tg-bg-color)] p-4 my-4 ${className}`}>
    {children}
  </div>
)
export default CardSection
