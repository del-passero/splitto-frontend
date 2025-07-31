// src/components/GroupAvatar.tsx

/**
 * Компонент для отображения аватара группы.
 * Не круглый, стильный, адаптируется под светлую/тёмную тему.
 * Если нет картинки — показывает первую букву названия группы на фоне.
 * Размер и доп. стили задаются через пропсы.
 * Все подписи через i18n НЕ нужны, так как внутри только визуал.
 */

type Props = {
  name?: string            // Название группы (для буквы)
  src?: string             // URL картинки группы (на будущее)
  size?: number            // Размер стороны аватара (px)
  className?: string       // Дополнительные tailwind-классы
}

const DEFAULT_BG = "var(--tg-link-color)" // основной акцентный цвет

const GroupAvatar = ({
  name = "",
  src,
  size = 56,
  className = "",
}: Props) => {
  // Если передан src (URL картинки) — показываем изображение (будет использоваться в будущем)
  if (src) {
    return (
      <img
        src={src}
        alt={name || "group-avatar"}
        width={size}
        height={size}
        style={{ borderRadius: 18, background: DEFAULT_BG }} // скругление углов
        className={`object-cover border border-[var(--tg-hint-color)] ${className}`}
      />
    )
  }

  // Заглушка: первая буква названия группы, если нет картинки
  return (
    <div
      className={`
        flex items-center justify-center
        font-bold text-white select-none
        border border-[var(--tg-hint-color)]
        ${className}
      `}
      style={{
        width: size,
        height: size,
        background: DEFAULT_BG,
        borderRadius: 18,       // скруглённый квадрат
        fontSize: size ? size / 2 : 28,
        boxShadow: "0 2px 10px 0 rgba(83,147,231,0.11)", // лёгкая тень как в Card
      }}
    >
      {name?.[0]?.toUpperCase() || "G"}
    </div>
  )
}

export default GroupAvatar
