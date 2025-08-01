// src/components/CardSection.tsx

type Props = {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

const CardSection = ({ children, className = "", noPadding = false }: Props) => (
  <section
    className={`
      w-full rounded-2xl
      bg-[var(--tg-card-bg)]
      shadow-[0_8px_32px_0_rgba(50,60,90,0.08)]
      ${noPadding ? "" : "px-2 py-2"}
      mb-1
      ${className}
    `}
  >
    {children}
  </section>
)

export default CardSection
