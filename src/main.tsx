// src/main.tsx

import ReactDOM from "react-dom/client";
import { ThemeLangProvider } from "./contexts/ThemeLangContext";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; // Tailwind + кастомные стили

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeLangProvider>
    <UserProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </UserProvider>
  </ThemeLangProvider>
);
