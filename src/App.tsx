import { useEffect } from "react";

const tg = window.Telegram?.WebApp;

export default function App() {
  useEffect(() => {
    tg?.ready();
  }, []);

  return (
    <button
      onClick={() => {
        console.log("tg = ", tg);
        if (tg) {
          tg.showAlert("Это Telegram WebApp!");
        } else {
          alert("Вы не в Telegram WebApp!!!");
        }
      }}
    >
      Проверить Telegram API
    </button>
  );
}