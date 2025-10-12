// src/pages/DashboardPage.tsx
// Минимальная страница: гарантированный init + live-пуллинг баланса.

import { useEffect } from "react"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"

const DashboardPage = () => {
  const init = useDashboardStore((s) => s.init)
  const startLive = useDashboardStore((s) => s.startLive)
  const stopLive = useDashboardStore((s) => s.stopLive)
  const errMap = useDashboardStore((s) => s.error)

  useEffect(() => {
    init()
    startLive(30_000)
    return () => stopLive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstError =
    errMap?.balance ||
    errMap?.activity ||
    errMap?.summary ||
    errMap?.top ||
    errMap?.frequent ||
    errMap?.groups ||
    errMap?.events ||
    ""

  return (
    <div className="p-3 flex flex-col gap-3">
      {firstError ? <div className="text-red-500 text-sm">{firstError}</div> : null}
      <DashboardBalanceCard />
      {/* Остальные карточки подключай по мере надобности */}
    </div>
  )
}

export default DashboardPage
