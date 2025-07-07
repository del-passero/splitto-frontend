// src/main.tsx

/**
 * Точка входа приложения. Монтирует App в root элемент.
 */
import { createRoot } from "react-dom/client";
import App from "./App";

// Рендерим приложение
createRoot(document.getElementById("root")!).render(<App />);
