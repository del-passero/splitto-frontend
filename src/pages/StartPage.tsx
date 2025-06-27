import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const StartPage: React.FC = () => {
  const navigate = useNavigate();

useEffect(() => {
  // const completed = localStorage.getItem("onboardingCompleted");
  // if (completed === "1") {
  //   navigate("/main", { replace: true });
  // } else {
  //   navigate("/onboarding", { replace: true });
  // }

  // Например, всегда ведём на онбординг:
  navigate("/onboarding", { replace: true });
}, [navigate]);

  return <div />;
};

export default StartPage;
