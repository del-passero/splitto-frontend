// src/main.tsx
import "./dev/react-child-guard" 
import "./i18n"
import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/index.css"
import "./pdfjs-setup"
import { useUserStore } from "./store/userStore"
import { ErrorBoundary } from "./components/ErrorBoundary"

// Телеграм-тема → CSS-переменные
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
  root.style.colorScheme = "light dark"
}

applyTgTheme()
;(window as any)?.Telegram?.WebApp?.onEvent?.("themeChanged", () =>
  applyTgTheme((window as any).Telegram.WebApp.themeParams)
)
try { (window as any).Telegram?.WebApp?.ready?.() } catch {}

// Авторизация/бутабстрап до рендера
try {
  useUserStore.getState().bootstrap().catch(console.error)
} catch (e) {
  console.error(e)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
