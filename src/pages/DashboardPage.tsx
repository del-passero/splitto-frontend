// src/pages/DashboardPage.tsx

import { useEffect } from "react"
import CardSection from "../components/CardSection"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

const DashboardPage = () => {
  // типы подтянутся из стора, ошибок "implicit any" не будет
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)

  useEffect(() => {
    // сразу запускаем автообновление, затем — первичную загрузку
    const stop = startLive()
    void init()
    return () => {
      stop && stop()
    }
  }, [init, startLive])

  return (
    <main className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-2">
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* Важное: CardSection — тот же, что на других страницах (без боковых отступов) */}
        <CardSection>
          <DashboardBalanceCard />
        </CardSection>
      </div>
    </main>
  )
}

export default DashboardPage
