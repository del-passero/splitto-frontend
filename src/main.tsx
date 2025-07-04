import ReactDOM from "react-dom/client";
import App from "./App";

// Стартуем только после полной загрузки документа
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(<App />);
  }
});
