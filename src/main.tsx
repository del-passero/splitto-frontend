import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import OnboardingPage from "./pages/OnboardingPage";
import MainPage from "./pages/MainPage";
import "./app/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
