import React from "react";

/**
 * ProgressDots — индикатор шагов/прогресса (точки), например для онбординга или wizard-форм.
 * Отображает count точек, подсвечивает одну как активную.
 *
 * Пример использования:
 * <ProgressDots count={4} activeIndex={1} />
 */
interface ProgressDotsProps {
  count: number;        // Сколько всего точек
  activeIndex: number;  // Индекс активной точки (0-based)
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ count, activeIndex }) => {
  // Создаём массив длины count для отрисовки точек
  return (
    <div className="flex items-center justify-center gap-2 mt-4 mb-2">
      {Array.from({ length: count }).map((_, idx) => (
        <span
          key={idx}
          // Активная точка — крупнее и Telegram blue, остальные серые и поменьше
          className={`
            inline-block rounded-full transition-all duration-150
            ${idx === activeIndex
              ? "bg-telegram-blue w-3 h-3"
              : "bg-telegram-secondary w-2 h-2 opacity-60"
            }
          `}
        />
      ))}
    </div>
  );
};

export default ProgressDots;
