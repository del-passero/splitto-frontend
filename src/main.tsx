// src/main.tsx

import ReactDOM from "react-dom/client";
import { ThemeLangProvider } from "./contexts/ThemeLangContext";
import { UserProvider } from "./contexts/UserContext";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeLangProvider>
    <UserProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </UserProvider>
  </ThemeLangProvider>
);
