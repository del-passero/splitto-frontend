// src/components/SectionTitle.tsx

/**
 * Универсальный заголовок раздела, стилизованный под Telegram/Wallet.
 * Пример: "У вас N активных групп"
 * Используется над списками, секциями, не имеет собственной логики,
 * просто children, нужные отступы и цвет (поддержка темы).
 */
type Props = {
  children: React.ReactNode
  className?: string
}

const SectionTitle = ({ children, className = "" }: Props) => (
  <div
    className={
      `text-lg font-bold text-[var(--tg-link-color)] mb-3 tracking-tight` +
      (className ? ` ${className}` : "")
    }
    style={{
      marginTop: 4,
      marginBottom: 12
    }}
  >
    {children}
  </div>
)

export default SectionTitle
