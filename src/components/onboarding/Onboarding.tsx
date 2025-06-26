import React, { useState } from "react";
import OnboardingSlide from "./OnboardingSlide";
import ProgressDots from "./ProgressDots";
import Ill1 from "./OnboardingIllustration1.svg?react";
import Ill2 from "./OnboardingIllustration2.svg?react";
import Ill3 from "./OnboardingIllustration3.svg?react";
import Ill4 from "./OnboardingIllustration4.svg?react";

interface OnboardingProps {
  onFinish: () => void;
  onSkip: () => void;
}

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
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent((c) => c + 1);
  };
  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };
  const slide = slides[current];

  return (
    <div
      className="flex flex-col justify-between min-h-screen"
      style={{
        background: "var(--tg-theme-bg-color, #fff)",
        color: "var(--tg-theme-text-color, #222)",
      }}
    >
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
      <ProgressDots count={slides.length} activeIndex={current} />
      <div className="flex justify-between items-center px-6 pb-6 gap-2">
        {current > 0 ? (
          <button
            className="px-6 py-2 rounded-xl font-medium"
            style={{
              background: "var(--tg-theme-secondary-bg-color, #f7f7f7)",
              color: "var(--tg-theme-link-color, #229ed9)",
              border: "1px solid var(--tg-theme-link-color, #229ed9)",
            }}
            onClick={handlePrev}
            type="button"
          >
            Назад
          </button>
        ) : <div style={{ width: 80 }} />}
        {current < slides.length - 1 ? (
          <button
            className="px-6 py-2 rounded-xl font-medium"
            style={{
              background: "var(--tg-theme-link-color, #229ed9)",
              color: "#fff",
              border: "none",
            }}
            onClick={handleNext}
            type="button"
          >
            Далее
          </button>
        ) : <div style={{ width: 80 }} />}
        <button
          className="px-6 py-2 rounded-xl font-medium"
          style={{
            background: "transparent",
            color: "var(--tg-theme-link-color, #229ed9)",
            border: "1px solid var(--tg-theme-link-color, #229ed9)",
          }}
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
