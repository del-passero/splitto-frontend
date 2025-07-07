// src/components/Common/Badge.tsx
export default function Badge({
  text = "Обычный",
  color = "var(--tg-theme-button-color)",
  textColor = "var(--tg-theme-button-text-color)",
  icon,
}: {
  text?: string;
  color?: string;
  textColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-lg text-xs font-bold gap-1 shadow-sm"
      style={{ background: color, color: textColor }}
    >
      {icon}
      {text}
    </span>
  );
}
