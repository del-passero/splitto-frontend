// src/components/FAB.tsx

import { useRef, useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

type FabAction = {
  key: string
  icon: React.ReactNode
  onClick: () => void
  ariaLabel: string
  label?: string
}

type Props = {
  actions: FabAction[]
}

const FAB = ({ actions }: Props) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!fabRef.current) return
      if (!fabRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let lastScroll = window.scrollY
    const onScroll = () => {
      const current = window.scrollY
      setVisible(current < lastScroll || current < 10)
      lastScroll = current
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const FAB_COLOR = "bg-[var(--tg-link-color)]"

  return (
    <div
      ref={fabRef}
      className={`
        fixed z-50
        right-6 bottom-[90px]
        flex flex-col items-end
        transition-opacity
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
    >
      <div className="flex flex-col items-end gap-4 mb-2 pointer-events-none">
        {open && actions.map((action, idx) => (
          <div key={action.key} className="flex flex-row items-center justify-end w-full">
            {/* Лейбл слева, кнопка справа */}
            {action.label && (
              <span
                className={`
                  mr-3 px-3 py-[6px] rounded-lg text-sm font-medium fab-label-appear
                  bg-transparent
                  text-[var(--tg-hint-color)]
                  select-none pointer-events-none
                  transition
                `}
                style={{
                  animationDelay: `${idx * 60}ms`
                }}
              >
                {t(action.label)}
              </span>
            )}
            <button
              type="button"
              aria-label={action.ariaLabel}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
              className={`
                w-12 h-12 rounded-full
                ${FAB_COLOR} text-white
                flex items-center justify-center
                border border-white/80 shadow-xl
                shadow-[0_4px_16px_0_rgba(34,105,255,0.14)]
                transition-all duration-200
                pointer-events-auto
                scale-0 opacity-0
                animate-fab-in
              `}
              style={{
                animationDelay: `${idx * 60}ms`,
              }}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Open actions"
        onClick={() => setOpen((v) => !v)}
        className={`
          w-14 h-14 rounded-full
          ${FAB_COLOR} text-white
          flex items-center justify-center
          border border-white/80 shadow-xl
          shadow-[0_4px_16px_0_rgba(34,105,255,0.14)]
          transition hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/40
          ${open ? "rotate-45" : ""}
        `}
        style={{
          transition: "box-shadow 0.2s, transform 0.1s",
        }}
      >
        <Plus size={32} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export default FAB
