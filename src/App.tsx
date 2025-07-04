// src/App.tsx
import { useEffect, useState } from "react";

export default function App() {
  const [tg, setTg] = useState<any>(null);
  const [initData, setInitData] = useState<string>("");

  useEffect(() => {
    // Ожидание window.Telegram
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      setTg(window.Telegram.WebApp);
      setInitData(window.Telegram.WebApp.initData || "");
      console.log("[TG] window.Telegram.WebApp", window.Telegram.WebApp);
      console.log("[TG] initData", window.Telegram.WebApp.initData);
    } else {
      console.log("[TG] window.Telegram или window.Telegram.WebApp отсутствует");
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Splitto: Telegram WebApp ТЕСТ</h1>
      <p>
        <b>window.Telegram:</b> {window.Telegram ? "OK" : "undefined"}
      </p>
      <p>
        <b>window.Telegram.WebApp:</b> {tg ? "OK" : "undefined"}
      </p>
      <p>
        <b>initData:</b>{" "}
        <span style={{ wordBreak: "break-all", color: initData ? "#060" : "#c00" }}>
          {initData || "Нет блядь данных!"}
        </span>
      </p>
      <button
        onClick={() => {
          if (tg) {
            tg.showAlert("initData: " + (tg.initData || "нет данных!"));
          } else {
            alert("window.Telegram.WebApp не найден!");
          }
        }}
      >
        Проверить Telegram API (showAlert)
      </button>
    </div>
  );
}
