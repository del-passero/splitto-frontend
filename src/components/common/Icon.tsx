// src/components/common/Icon.tsx

/**
 * Универсальный компонент для SVG-иконок (можно расширять).
 * Используй как <Icon name="edit" />, <Icon name="logout" /> и т.д.
 */

import { ReactNode } from "react";

// Добавь нужные SVG прямо сюда (или импортируй из assets)
const icons: Record<string, ReactNode> = {
  edit: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M4 13.7V16h2.3l7.1-7.1-2.3-2.3L4 13.7zm10.7-7.6c.2-.2.2-.5 0-.7l-1.4-1.4a.5.5 0 00-.7 0l-1 1 2.3 2.3 1-1z"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M7 10h6m-6 0a6 6 0 110-12 6 6 0 010 12zm6 0v-4m0 4v4" />
    </svg>
  ),
  // Добавляй свои SVG-иконки тут!
};

export default function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex align-middle ${className}`}>
      {icons[name] || <span>?</span>}
    </span>
  );
}
