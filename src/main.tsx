// frontend/src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App";

// Telegram WebApp ready
window.Telegram?.WebApp?.ready?.();

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
