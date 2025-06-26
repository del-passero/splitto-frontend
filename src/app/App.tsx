import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StartPage from "../pages/StartPage";
import OnboardingPage from "../pages/OnboardingPage";
import MainPage from "../pages/MainPage"; // предположим, что есть

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/main" element={<MainPage />} />
    </Routes>
  </Router>
);

export default App;
