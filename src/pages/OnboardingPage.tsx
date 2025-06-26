import React from "react";
import Onboarding from "../components/onboarding/Onboarding";
import { useNavigate } from "react-router-dom";

/**
 * OnboardingPage — страница для онбординга.
 * После завершения (onFinish/onSkip) переводит пользователя на главную страницу.
 */
const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  // После "НАЧАТЬ"
  const handleFinish = () => {
    localStorage.setItem("onboardingCompleted", "1");
    // TODO: отправить данные пользователя на backend, когда будет готов API
    navigate("/main");
  };

  // После "Пропустить обучение"
  const handleSkip = () => {
    localStorage.setItem("onboardingCompleted", "1");
    navigate("/main");
  };

  return (
    <div className="min-h-screen bg-telegram-bg dark:bg-telegram-bg-dark flex flex-col justify-center">
      <Onboarding onFinish={handleFinish} onSkip={handleSkip} />
    </div>
  );
};

export default OnboardingPage;
