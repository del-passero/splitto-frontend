import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * StartPage — точка входа, проверяет флаг онбординга
 * и делает редирект на нужную страницу.
 */
const StartPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем флаг в localStorage
    const completed = localStorage.getItem("onboardingCompleted");
    if (completed === "1") {
      // Онбординг пройден, ведём на главную страницу
      navigate("/main", { replace: true });
    } else {
      // Онбординг не пройден — показываем онбординг
      navigate("/onboarding", { replace: true });
    }
  }, [navigate]);

  // Пока редиректим — показываем пустой div (или лоадер по желанию)
  return <div />;
};

export default StartPage;
