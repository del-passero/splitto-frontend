import { useTranslation } from "react-i18next"
import { useRef, useEffect, useState } from "react"

type TabKey = "transactions" | "balance" | "analytics"

type Props = {
  selected: TabKey
  onSelect: (key: TabKey) => void
  className?: string
}

const GroupTabs = ({ selected, onSelect, className = "" }: Props) => {
  const { t } = useTranslation()

  const TABS: { key: TabKey; label: string }[] = [
    { key: "transactions", label: t("group_tab_transactions") },
    { key: "balance", label: t("group_tab_balance") },
    { key: "analytics", label: t("group_tab_analytics") },
  ]

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [underline, setUnderline] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const idx = TABS.findIndex(tab => tab.key === selected)
    const el = tabRefs.current[idx]
    if (el) {
      setUnderline({
        left: el.offsetLeft,
        width: el.offsetWidth,
      })
    }
  }, [selected, TABS])

  return (
    <div className={`flex w-full justify-center px-2 mt-2 mb-3 ${className}`} role="tablist">
      <div className="relative flex w-full max-w-full sm:max-w-md">
        {TABS.map((tab, i) => (
          <button
            ref={el => { tabRefs.current[i] = el }}
            key={tab.key}
            type="button"
            className={`
              flex-1 min-w-0 px-2 pb-2 pt-0 mx-1
              text-[15px] font-medium bg-transparent border-none outline-none
              transition-colors
              ${selected === tab.key
                ? "text-[var(--tg-accent-color)]"
                : "text-[var(--tg-theme-link-color), var(--tg-hint-color)]"}
            `}
            onClick={() => onSelect(tab.key)}
            role="tab"
            aria-selected={selected === tab.key}
            tabIndex={selected === tab.key ? 0 : -1}
            style={{
              cursor: selected === tab.key ? "default" : "pointer",
              background: "none",
              boxShadow: "none"
            }}
          >
            {tab.label}
          </button>
        ))}
        <span
          className="absolute bottom-0 h-[3px] rounded-lg transition-all duration-200"
          style={{
            left: underline.left,
            width: underline.width,
            background: "var(--tg-accent-color)"
          }}
        />
      </div>
    </div>
  )
}

export default GroupTabs
