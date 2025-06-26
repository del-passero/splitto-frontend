import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StartPage from "../pages/StartPage";
import OnboardingPage from "../pages/OnboardingPage";
import MainPage from "../pages/MainPage";

/**
 * App — главный компонент приложения. 
 * Здесь настраивается роутинг (какая страница на каком пути).
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Точка входа "/" */}
        <Route path="/" element={<StartPage />} />
        {/* Онбординг */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* Главная страница */}
        <Route path="/main" element={<MainPage />} />
        {/* Всё остальное — на "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
