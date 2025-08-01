// src/components/CardSection.tsx

/**
 * Универсальный контейнер для секций (например, FiltersRow, GroupsList).
 * Стили — Wallet/Telegram: скругления, шадоу, аккуратные отступы, поддержка темы.
 * Используется для обёртки фильтров, списка групп и т.д.
 */

type Props = {
  children: React.ReactNode
  className?: string
}

const CardSection = ({ children, className = "" }: Props) => (
  <section
    className={`
      w-full rounded-2xl bg-[var(--tg-card-bg)] shadow-tg-card
      px-2 py-2 mb-3
      ${className}
    `}
  >
    {children}
  </section>
)

export default CardSection
