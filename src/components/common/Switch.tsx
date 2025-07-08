// src/components/common/Switch.tsx

/**
 * Кастомный тумблер (on/off), полностью кастомизируемый.
 * Очень похож на тумблер из Telegram Wallet/Cloud.
 */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Switch({ checked, onChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      className={`
        w-12 h-7 flex items-center rounded-full px-1 
        transition bg-[var(--tg-theme-secondary-bg-color)] 
        ${checked ? "justify-end" : "justify-start"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        border: "1.5px solid var(--tg-theme-hint-color, #ddd)",
      }}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "bg-[var(--tg-theme-button-color)]" : ""}`}
        style={{
          border: checked ? "2px solid var(--tg-theme-button-color)" : "2px solid #ccc",
        }}
      />
    </button>
  );
}
