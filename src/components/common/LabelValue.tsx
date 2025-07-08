// src/components/common/LabelValue.tsx

/**
 * Одна строка: подпись слева, значение справа (например, для телефона или email).
 * Для профиля и настроек — как в Telegram Wallet.
 */

import { ReactNode } from "react";

interface LabelValueProps {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}

export default function LabelValue({ label, value, className = "" }: LabelValueProps) {
  return (
    <div className={`flex justify-between items-center py-2 px-0 ${className}`}>
      <span className="text-[15px] font-normal opacity-80">{label}</span>
      <span className="text-[15px] font-semibold text-right">{value}</span>
    </div>
  );
}
