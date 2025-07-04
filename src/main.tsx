// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";

console.log("[main.tsx] starting app");
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
