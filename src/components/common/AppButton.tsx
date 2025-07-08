// src/components/common/AppButton.tsx

import clsx from "clsx";

export interface AppButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: "primary" | "danger" | "secondary";
  full?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

/**
 * Универсальная кнопка — Telegram-style, pill-edges, цветовая схема зависит от color
 */
export default function AppButton({
  children,
  onClick,
  className,
  color = "primary",
  full = true,
  disabled,
  type = "button",
}: AppButtonProps) {
  const colors = {
    primary:
      "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] hover:opacity-90",
    danger: "bg-red-500 text-white hover:bg-red-600",
    secondary:
      "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] hover:bg-gray-100",
  };
  return (
    <button
      type={type}
      className={clsx(
        "rounded-2xl py-3 px-5 font-semibold shadow transition text-base",
        full && "w-full",
        colors[color],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
