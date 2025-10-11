import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDashboardStore } from "../store/dashboardStore"
import DashboardBalanceCard from "../components/dashboard/DashboardBalanceCard"
import SafeSection from "../components/SafeSection"

// Главная: пока подключаем только «Мой баланс» — ЧЁТКО без боковых отступов, с автозапуском и лайв-обновлением
export default function DashboardPage() {
  const { t } = useTranslation()

  const {
    init,
    startLive,
    stopLive,
    loading,
    error,
  } = useDashboardStore((s) => ({
    init: s.init,
    startLive: s.startLive,
    stopLive: s.stopLive,
    loading: !!s.loading?.balance,
    error: s.error,
  }))

  // моментальный старт: грузим баланс и включаем лайв-обновление
  useEffect(() => {
    void init()
    startLive()
    return () => stopLive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-3 text-[var(--tg-text-color)] bg-[var(--tg-bg-color)]">
      <h1 className="text-lg font-bold mb-3">{t("main")}</h1>

      {error && (
        <div className="mb-3 text-red-500">
          {t("error", { defaultValue: "Ошибка" })}: {String(error)}
        </div>
      )}

      {/* БЕЗ боковых отступов — как на Groups/Profile */}
      <div className="mb-3">
        <SafeSection>
          <DashboardBalanceCard />
        </SafeSection>
      </div>

      {loading && (
        <div className="text-[var(--tg-hint-color)]">{t("loading")}</div>
      )}
    </div>
  )
}
