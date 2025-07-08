// src/components/common/Badge.tsx

import clsx from "clsx";

/**
 * Badge: компактный индикатор (например, PRO, статус)
 */
export interface BadgeProps {
  children: React.ReactNode;
  color?: "gold" | "gray" | "green" | "red";
  className?: string;
}

export default function Badge({ children, color = "gray", className }: BadgeProps) {
  const palette = {
    gold: "bg-yellow-300 text-yellow-900",
    gray: "bg-gray-200 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
  }[color];
  return (
    <span
      className={clsx(
        "px-3 py-0.5 text-xs font-bold rounded-lg",
        palette,
        className
      )}
    >
      {children}
    </span>
  );
}
