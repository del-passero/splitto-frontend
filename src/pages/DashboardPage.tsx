// src/pages/DashboardPage.tsx
import { useEffect } from "react"
import CardSection from "../components/CardSection"
import ErrorBoundary from "../components/ErrorBoundary"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import { useDashboardStore } from "../store/dashboardStore"

export default function DashboardPage() {
  const hydrateIfNeeded = useDashboardStore((s) => s.hydrateIfNeeded)
  const refreshBalance = useDashboardStore((s) => s.refreshBalance)

  useEffect(() => {
    hydrateIfNeeded()
    const t = setTimeout(() => refreshBalance(), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onFocus = () => refreshBalance()
    window.addEventListener("focus", onFocus)
    const id = window.setInterval(onFocus, 30000)
    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(id)
    }
  }, [refreshBalance])

  return (
    <div className="min-h-screen w-full bg-[var(--tg-bg-color)] flex flex-col items-center py-3">
      <div className="w-full max-w-md flex flex-col space-y-2">
        {/* Важно: без боковых паддингов, как на ProfilePage */}
        <CardSection noPadding className="py-2">
          <ErrorBoundary>
            <DashboardBalanceCard />
          </ErrorBoundary>
        </CardSection>
      </div>
    </div>
  )
}
