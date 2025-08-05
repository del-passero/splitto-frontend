// src/components/group/GroupAnalyticsTab.tsx

import { BarChart3 } from "lucide-react"
import { useTranslation } from "react-i18next"

const GroupAnalyticsTab = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 opacity-60">
        <BarChart3 size={56} className="text-[var(--tg-link-color)]" />
      </div>
      <div className="text-lg font-semibold text-[var(--tg-text-color)]">
        {t("group_analytics_coming_soon")}
      </div>
    </div>
  )
}

export default GroupAnalyticsTab
