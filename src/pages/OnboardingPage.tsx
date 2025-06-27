import React from "react";
import { useNavigate } from "react-router-dom";
import Onboarding from "../components/onboarding/Onboarding";

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem("onboardingCompleted", "1");
    navigate("/main", { replace: true });
  };

  const handleSkip = () => {
    localStorage.setItem("onboardingCompleted", "0");
    navigate("/main", { replace: true });
  };

  return <Onboarding onFinish={handleFinish} onSkip={handleSkip} />;
};

export default OnboardingPage;
