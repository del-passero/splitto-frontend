import React, { useEffect } from "react";

const MainPage: React.FC = () => {
  useEffect(() => {
    // Если в адресе есть ?reset, сбрасываем onboardingCompleted
    if (window.location.search.includes("reset")) {
      localStorage.removeItem("onboardingCompleted");
      window.location.href = "/";
    }
  }, []);

  return (
    <div>
      <h1>Главная страница Splitto</h1>
      <p>Чтобы сбросить онбординг, открой WebApp по адресу:<br/>
      <b>https://splitto.app?reset</b></p>
    </div>
  );
};

export default MainPage;
