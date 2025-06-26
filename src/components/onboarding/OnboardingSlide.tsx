import React from "react";

/**
 * OnboardingSlide — atomic-компонент для одного слайда онбординга.
 * Показывает иллюстрацию, заголовок, основной текст, опционально мелкий текст и/или кнопку.
 */
export interface OnboardingSlideProps {
  illustration: React.ReactNode;      // SVG или React-компонент иллюстрации
  title: string;                      // Заголовок (обычно из i18n)
  text: string;                       // Основной текст
  smallText?: string;                 // Мелкий (дополнительный) текст
  buttonText?: string;                // Текст кнопки (если нужна)
  onButtonClick?: () => void;         // Обработчик нажатия на кнопку
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  illustration,
  title,
  text,
  smallText,
  buttonText,
  onButtonClick,
}) => (
  <div
    className="
      flex flex-col items-center justify-center
      w-full h-full min-h-[350px] px-6 py-4
      text-center
      max-w-onboarding mx-auto
    "
  >
    {/* SVG-иллюстрация */}
    <div className="w-full flex justify-center mb-6 mt-2">
      <div className="max-h-[180px] w-auto">{illustration}</div>
    </div>

    {/* Заголовок */}
    <h2
      className="
        font-bold text-[22px] leading-tight mb-3
        text-telegram-header dark:text-telegram-header-dark
      "
      style={{ wordBreak: "break-word" }}
    >
      {title}
    </h2>

    {/* Основной текст */}
    <div
      className="
        font-medium text-[17px] leading-snug
        text-telegram-main dark:text-telegram-main-dark mb-2
      "
      style={{ wordBreak: "break-word" }}
    >
      {text}
    </div>

    {/* Дополнительный (мелкий) текст */}
    {smallText && (
      <div
        className="
          font-normal text-[15px] leading-normal
          text-telegram-secondary dark:text-telegram-secondary-dark mb-4
        "
      >
        {smallText}
      </div>
    )}

    {/* Кнопка (если нужна) */}
    {buttonText && onButtonClick && (
      <button
        className="
          mt-3 px-8 py-3 rounded-xl bg-telegram-blue text-white
          text-[17px] font-bold transition active:bg-telegram-blue/80
          shadow-sm focus:outline-none w-full max-w-[320px]
        "
        type="button"
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    )}
  </div>
);

export default OnboardingSlide;
