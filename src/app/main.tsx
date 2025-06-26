import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles/theme.css";
import "../app/index.css"; // если есть базовый reset
// import "tailwindcss/tailwind.css"; // если используется через postcss

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
