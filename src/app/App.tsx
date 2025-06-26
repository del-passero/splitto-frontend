import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import StartPage from "../pages/StartPage";
import OnboardingPage from "../pages/OnboardingPage";
import MainPage from "../pages/MainPage";

const App: React.FC = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
