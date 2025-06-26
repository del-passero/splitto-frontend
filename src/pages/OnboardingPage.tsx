import React from "react";
import Onboarding from "../components/onboarding/Onboarding";
import { useNavigate } from "react-router-dom";

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  // После онбординга пишем флаг и ведём на главную
  const handleFinish = () => {
    localStorage.setItem("onboardingCompleted", "1");
    navigate("/main", { replace: true });
  };

  const handleSkip = () => {
    localStorage.setItem("onboardingCompleted", "1");
    navigate("/main", { replace: true });
  };

  return <Onboarding onFinish={handleFinish} onSkip={handleSkip} />;
};

export default OnboardingPage;
