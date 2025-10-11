// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import CardSection from "../components/CardSection"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

export default function DashboardPage() {
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const refreshBalance = useDashboardStore((s) => s.refreshBalance)

  // грузим всё на старте + мягкий рефетч через 600мс, чтобы поймать initData телеги
  useEffect(() => {
    hydrateIfNeeded()
    const t = setTimeout(() => refreshBalance(), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // онлайн-обновление: по фокусу и таймер
  useEffect(() => {
    const handler = () => refreshBalance()
    window.addEventListener("focus", handler)
    const id = window.setInterval(handler, 30000)
    return () => {
      window.removeEventListener("focus", handler)
      clearInterval(id)
    }
  }, [refreshBalance])

  return (
    // как ProfilePage: центрируем, без внешних паддингов, ограничиваем max-width
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-3">
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* ВАЖНО: без SafeSection, рендерим сразу; и без боковых паддингов CardSection */}
        <CardSection noPadding>
          <DashboardBalanceCard />
        </CardSection>
      </div>
    </div>
  )
}
