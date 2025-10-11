// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import CardSection from "../components/CardSection"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

export default function DashboardPage() {
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const refreshBalance = useDashboardStore((s) => s.refreshBalance)
  const error = useDashboardStore((s) => s.error)

  // грузим всё и сразу «подстраховываемся» лёгким рефетчем баланса
  useEffect(() => {
    hydrateIfNeeded()
    const t = setTimeout(() => refreshBalance(), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // live-обновление: при фокусе и раз в 30с
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
    // как в ProfilePage: без внешних боковых паддингов, центрируем и ограничиваем ширину
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-3">
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* НЕ оборачиваем в SafeSection, чтобы не видеть «временно недоступен» при первом заходе */}
        <CardSection>
          <DashboardBalanceCard />
        </CardSection>

        {/* при желании можно показать тонкую строку ошибки, но не блокировать карточку */}
        {!!error && (
          <div className="px-2 text-[13px] text-[var(--tg-hint-color)]">
            {/* локализация общей ошибки у вас уже есть; тут оставляю нейтральный подсказчик */}
          </div>
        )}
      </div>
    </div>
  )
}
