import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * StartPage — точка входа, проверяет флаг онбординга
 * и делает редирект на нужную страницу.
 */
const StartPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem("onboardingCompleted");
    if (completed === "1") {
      navigate("/main", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }, [navigate]);

  return <div />; // Можно показать лоадер
};

export default StartPage;
