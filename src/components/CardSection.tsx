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
      ${noPadding ? "" : "px-2 py-2"}
      mb-1
      ${className}
    `}
  >
    {children}
  </section>
)

export default CardSection
