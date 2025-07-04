import { useEffect, useState } from "react";

export default function App() {
  const [initData, setInitData] = useState("");
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState("");

  // Адрес backend — меняй если у тебя отличается!
  const API_URL = "https://splitto-backend-prod-ugraf.amvera.io/api";

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

  // Отправка initData на backend
  async function handleAuth() {
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Ошибка авторизации: ${text}`);
        return;
      }
      const user = await res.json();
      setMe(user);
      setError("");
      alert("Успешная авторизация!\n\n" + JSON.stringify(user, null, 2));
    } catch (e: any) {
      setError("Ошибка сети: " + e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Splitto TEST WebApp</h2>
      <div>
        <b>initData:</b>
        <pre style={{ fontSize: "10px", whiteSpace: "pre-wrap" }}>{initData}</pre>
      </div>
      <button onClick={handleAuth} style={{ fontSize: 16, padding: "6px 16px" }}>
        Авторизоваться через Telegram (отправить initData)
      </button>
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      {me && (
        <div style={{ marginTop: 20 }}>
          <b>Вы авторизованы как:</b>
          <pre>{JSON.stringify(me, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
