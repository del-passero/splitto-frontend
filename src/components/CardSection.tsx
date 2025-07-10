// src/components/CardSection.tsx
import { ReactNode, CSSProperties } from "react"
type Props = {
  title?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}
const CardSection = ({ title, children, className = "", style }: Props) => (
  <section
    className={`rounded-2xl shadow-tg-card bg-[var(--tg-card-bg)] w-full max-w-md mx-auto px-5 py-4 ${className}`}
    style={style}
  >
    {title && (
      <div className="px-1 pb-1 pt-2 font-semibold text-[var(--tg-link-color)] text-[17px]">
        {title}
      </div>
    )}
    <div className="flex flex-col">{children}</div>
  </section>
)
export default CardSection
