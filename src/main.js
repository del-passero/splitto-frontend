import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import OnboardingPage from "./pages/OnboardingPage";
import MainPage from "./pages/MainPage";
import "./app/index.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(StartPage, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(OnboardingPage, {}) }), _jsx(Route, { path: "/main", element: _jsx(MainPage, {}) })] }) }) }));
