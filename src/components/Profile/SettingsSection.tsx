// src/components/Profile/SettingsSection.tsx
import { useThemeLang } from "../../contexts/ThemeLangContext";

export default function SettingsSection() {
  const { theme, setTheme, realLang, setLang } = useThemeLang();

  return (
    <div className="space-y-5">
      {/* Тема */}
      <div>
        <div className="font-semibold mb-2">Тема:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("auto")}
            className={`px-3 py-2 rounded-lg ${theme === "auto"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Наследовать
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`px-3 py-2 rounded-lg ${theme === "light"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Светлая
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-3 py-2 rounded-lg ${theme === "dark"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Тёмная
          </button>
        </div>
      </div>
      {/* Язык */}
      <div>
        <div className="font-semibold mb-2">Язык:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setLang("auto")}
            className={`px-3 py-2 rounded-lg ${realLang === "auto"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Наследовать
          </button>
          <button
            onClick={() => setLang("ru")}
            className={`px-3 py-2 rounded-lg ${realLang === "ru"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Русский
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-2 rounded-lg ${realLang === "en"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("es")}
            className={`px-3 py-2 rounded-lg ${realLang === "es"
              ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
              : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
            }`}
          >
            Español
          </button>
        </div>
      </div>
      {/* Заглушки: версия и ссылки */}
      <div className="mt-4 text-xs opacity-50 text-center">
        v0.1 • <a href="#" className="underline">Privacy Policy</a>
      </div>
    </div>
  );
}
