import { useEffect } from "react"
import CardSection from "../components/CardSection"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

const DashboardPage = () => {
  useEffect(() => {
    const st = useDashboardStore.getState()
    // сразу дёргаем баланс (не ждём init)
    void st.reloadBalance()
    // автообновление + мягкий прогрев
    const stop = st.startLive()
    void st.init()
    return () => {
      stop && stop()
    }
  }, [])

  return (
    <main className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-2">
      <div className="w-full max-w-md flex flex-col space-y-2">
        <CardSection>
          <DashboardBalanceCard />
        </CardSection>
      </div>
    </main>
  )
}

export default DashboardPage
