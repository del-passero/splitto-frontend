// src/main.tsx
import "./i18n"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/index.css"
import { useUserStore } from "./store/userStore"

// 1) Прописать tg-переменные в :root и слушать смену темы
function applyTgTheme(p: any = (window as any)?.Telegram?.WebApp?.themeParams || {}) {
  const root = document.documentElement
  const map: Record<string, string | undefined> = {
    "--tg-bg-color": p.bg_color,
    "--tg-card-bg": p.secondary_bg_color ?? p.bg_color,
    "--tg-text-color": p.text_color,
    "--tg-hint-color": p.hint_color,
    "--tg-link-color": p.link_color,
    "--tg-accent-color": p.link_color,
    "--tg-button-color": p.button_color,
    "--tg-button-text-color": p.button_text_color,
    "--tg-secondary-bg-color": p.secondary_bg_color,
  }
  Object.entries(map).forEach(([k, v]) => v && root.style.setProperty(k, v))
  // чтобы системные контролы/скроллбар корректно инвертировались
  root.style.colorScheme = "light dark"
}

// применяем сразу
applyTgTheme()
// и подписываемся на смену темы Telegram
;(window as any)?.Telegram?.WebApp?.onEvent?.("themeChanged", () =>
  applyTgTheme((window as any).Telegram.WebApp.themeParams)
)
// (необязательно) Telegram рекомендует вызывать ready
try { (window as any).Telegram?.WebApp?.ready?.() } catch {}

// 2) Bootstrap userStore (авторизация по Telegram + сброс остальных стора при смене юзера)
try {
  // вызывем один раз до рендера; внутри bootstrap есть вся логика с userKey/resetAllStores
  useUserStore.getState().bootstrap().catch(console.error)
} catch (e) {
  console.error(e)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
)
