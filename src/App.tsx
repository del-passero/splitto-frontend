import { useEffect } from "react";
import { tg } from "./telegram";

function setTelegramTheme() {
  // Считываем тему и цвета из Telegram WebApp
  if (!tg) return;

  const root = document.documentElement;
  const tp = tg.themeParams || {};

  // Применяем фон и основной цвет текста
  if (tp.bg_color) root.style.background = tp.bg_color;
  if (tp.text_color) root.style.color = tp.text_color;

  // (опционально) Можно добавить поддержку других параметров (кнопки и т.п.)
}

export default function App() {
  useEffect(() => {
    setTelegramTheme();

    // Слушаем смену темы/цвета из Telegram (реагировать на изменение)
    tg?.onEvent("themeChanged", setTelegramTheme);

    // Оповещаем Telegram, что WebApp готов
    tg?.ready();

    // Чистим слушатель при размонтировании компонента
    return () => {
      tg?.offEvent("themeChanged", setTelegramTheme);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Splitto WebApp</h1>
      <p>
        Сейчас активна <b>{tg?.colorScheme === "dark" ? "тёмная" : "светлая"}</b> тема Telegram
      </p>
      <button
        className="mt-6 px-6 py-2 rounded bg-blue-600 text-white"
        onClick={() => tg?.showAlert("Это Telegram WebApp!")}
      >
        Проверить Telegram API
      </button>
    </div>
  );
}
