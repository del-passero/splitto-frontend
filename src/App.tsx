import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Всегда логируем, что получили из window
    console.log("[App] window.Telegram =", window.Telegram);
    // Проверяем загрузился ли Telegram WebApp API
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      console.log("[App] Telegram WebApp API готов");
    } else {
      console.warn("[App] Telegram WebApp API не найден! (window.Telegram = undefined)");
    }
  }, []);

  return (
    <div>
      <h2>Splitto TEST WebApp</h2>
      <button
        onClick={() => {
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(
              "initData: " + window.Telegram.WebApp.initData
            );
          } else {
            alert("window.Telegram.WebApp отсутствует!");
          }
        }}
      >
        Проверить Telegram API
      </button>
    </div>
  );
}
