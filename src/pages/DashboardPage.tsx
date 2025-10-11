// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import CardSection from "../components/CardSection"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

const DashboardPage = () => {
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)

  useEffect(() => {
    // прогрев и лайв
    let stop = () => {}
    ;(async () => {
      await init()
      stop = startLive()
    })()
    return () => {
      stop && stop()
    }
  }, [init, startLive])

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-10">
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* ВАЖНО: без боковых паддингов */}
        <CardSection noPadding>
          <DashboardBalanceCard />
        </CardSection>
      </div>
    </div>
  )
}

export default DashboardPage
