import React, { useState } from "react";
import OnboardingSlide from "./OnboardingSlide";
import ProgressDots from "./ProgressDots";

// Импортируем SVG-иллюстрации как ReactComponent
import { ReactComponent as Ill1 } from "./OnboardingIllustration1.svg";
import { ReactComponent as Ill2 } from "./OnboardingIllustration2.svg";
import { ReactComponent as Ill3 } from "./OnboardingIllustration3.svg";
import { ReactComponent as Ill4 } from "./OnboardingIllustration4.svg";

/**
 * Onboarding — обёртка-карусель для всех слайдов онбординга.
 * Управляет текущим шагом, навигацией, кнопками и обработкой завершения/пропуска.
 * НЕ содержит прямого API, только UI и навигацию!
 *
 * @param onFinish — обработчик при завершении (нажатии “НАЧАТЬ”)
 * @param onSkip — обработчик нажатия “Пропустить обучение”
 */
interface OnboardingProps {
  onFinish: () => void; // Вызывается, когда пользователь завершает онбординг
  onSkip: () => void;   // Вызывается, если пользователь жмёт “Пропустить”
}

// Данные всех слайдов — обычно потом подгружаются из i18n!
const slides = [
  {
    illustration: <Ill1 />,
    title: "Splitto — ваш помощник в управлении совместными тратами",
    text: "Удобно управляйте расходами в компаниях, путешествиях, походах в ресторан и любых ситуациях, требующих совместных трат, прямо в Telegram!",
  },
  {
    illustration: <Ill2 />,
    title: "Как Splitto использует ваши данные",
    text: "Любое приложение в Telegram получает только ваше публичное имя, фамилию, @username и фото профиля.\nSplitto не видит и не запрашивает ваш номер телефона, чаты или переписки.",
    smallText: "Вы всегда контролируете, что видит приложение. Splitto заботится о вашей приватности.",
  },
  {
    illustration: <Ill3 />,
    title: "Начать просто!",
    text: "1. Создайте группу для компании, поездки или семьи (на основе группы в Telegram или прямо в приложении Splitto).\n2. Добавьте общий расход и укажите участников — Splitto сам рассчитает долги.\n3. Пригласите друзей — они присоединятся по ссылке в Telegram.",
  },
  {
    illustration: <Ill4 />,
    title: "Готовы начать?",
    text: "Нажмите «Начать», чтобы создать ваш аккаунт Splitto и перейти к совместному учёту расходов!",
    buttonText: "НАЧАТЬ",
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onFinish, onSkip }) => {
  // Текущий слайд (индекс)
  const [current, setCurrent] = useState(0);

  // Перейти на следующий слайд
  const handleNext = () => {
    if (current < slides.length - 1) setCurrent((c) => c + 1);
  };

  // Перейти на предыдущий слайд (по желанию, можно убрать)
  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  // Текущий слайд для рендера
  const slide = slides[current];

  // Разметка компонента
  return (
    <div className="flex flex-col justify-between min-h-screen bg-telegram-bg dark:bg-telegram-bg-dark">
      {/* Основной контент (слайд) */}
      <div className="flex-1 flex flex-col justify-center">
        <OnboardingSlide
          illustration={slide.illustration}
          title={slide.title}
          text={slide.text}
          smallText={slide.smallText}
          buttonText={slide.buttonText}
          onButtonClick={onFinish}
        />
      </div>

      {/* Индикатор прогресса */}
      <ProgressDots count={slides.length} activeIndex={current} />

      {/* Нижняя панель с кнопками */}
      <div className="flex justify-between items-center px-6 pb-6 gap-2">
        {/* Назад (опционально, можно убрать для минимализма) */}
        {current > 0 ? (
          <button
            className="px-6 py-2 rounded-xl bg-telegram-card dark:bg-telegram-card-dark border border-telegram-blue text-telegram-blue font-medium"
            onClick={handlePrev}
            type="button"
          >
            Назад
          </button>
        ) : <div style={{ width: 80 }} />} {/* Заглушка для выравнивания */}

        {/* Далее или ничего (если последний слайд) */}
        {current < slides.length - 1 ? (
          <button
            className="px-6 py-2 rounded-xl bg-telegram-blue text-white font-medium"
            onClick={handleNext}
            type="button"
          >
            Далее
          </button>
        ) : <div style={{ width: 80 }} />} {/* Заглушка для выравнивания */}

        {/* Пропустить обучение — всегда справа */}
        <button
          className="px-6 py-2 rounded-xl bg-transparent border border-telegram-blue text-telegram-blue font-medium"
          onClick={onSkip}
          type="button"
        >
          Пропустить обучение
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
