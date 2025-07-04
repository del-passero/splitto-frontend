import { useEffect, useState } from "react";

export default function App() {
  const [initData, setInitData] = useState("");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    if (tg?.initData) {
      setInitData(tg.initData);
      console.log("[App] Telegram initData:", tg.initData);
    } else {
      setInitData("window.Telegram.WebApp.initData отсутствует!");
      console.warn("[App] window.Telegram.WebApp.initData = undefined");
    }
  }, []);

  return (
    <div>
      <h2>Splitto TEST WebApp</h2>
      <div>
        <b>initData:</b>
        <pre style={{ fontSize: "10px", whiteSpace: "pre-wrap" }}>{initData}</pre>
      </div>
      <button
        onClick={() => {
          alert("Тут будет отправка на backend!\ninitData (первые 100 символов):\n" + initData.slice(0, 100));
        }}
      >
        Отправить initData на backend
      </button>
    </div>
  );
}
