import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StartPage from "../pages/StartPage";
import OnboardingPage from "../pages/OnboardingPage";
import MainPage from "../pages/MainPage"; // предположим, что есть
const App = () => (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(StartPage, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(OnboardingPage, {}) }), _jsx(Route, { path: "/main", element: _jsx(MainPage, {}) })] }) }));
export default App;
