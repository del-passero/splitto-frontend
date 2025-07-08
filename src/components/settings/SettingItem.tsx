// src/components/settings/SettingItem.tsx

export interface SettingItemProps {
  icon: string;
  label: string;
  value: string;
  onClick: () => void;
}

/**
 * Одна строка в блоке настроек (иконка, текст, значение, стрелка)
 */
export default function SettingItem({ icon, label, value, onClick }: SettingItemProps) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-2 cursor-pointer rounded-xl hover:bg-[var(--tg-theme-hint-color)] transition"
      onClick={onClick}
    >
      <div className="w-7 flex justify-center">{icon}</div>
      <div className="flex-1 min-w-0 font-medium truncate">{label}</div>
      <div className="opacity-60 text-sm truncate">{value}</div>
      <div className="ml-2 opacity-30 text-lg">&rsaquo;</div>
    </div>
  );
}
