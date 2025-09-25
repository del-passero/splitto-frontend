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

const THRESHOLD_SCROLL = 1      // игнорируем микро-движения скролла
const THRESHOLD_TOUCH = 8       // чувствительность к свайпу

const findScrollEl = (from?: HTMLElement | null): HTMLElement | Window => {
  const closest = from?.closest(".app-scroll") as HTMLElement | null
  const global = document.querySelector(".app-scroll") as HTMLElement | null
  const mainEl = document.querySelector("main") as HTMLElement | null
  return closest || global || mainEl || window
}

const getScrollPos = (target: HTMLElement | Window) =>
  target instanceof Window
    ? window.scrollY || document.documentElement.scrollTop || 0
    : (target as HTMLElement).scrollTop

const FAB = ({ actions }: Props) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const fabRef = useRef<HTMLDivElement>(null)

  // Закрываем меню по клику вне FAB
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!fabRef.current) return
      if (!fabRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Показывать FAB, когда вверху
  const forceVisibleIfNearTop = (target: HTMLElement | Window) => {
    const nearTop = getScrollPos(target) <= 10
    if (nearTop) setVisible(true)
    return nearTop
  }

  // Основная логика направления скролла/свайпа
  useEffect(() => {
    const target = findScrollEl(fabRef.current)

    let last = getScrollPos(target)
    let touchY = 0

    const onScroll = () => {
      const cur = getScrollPos(target)
      const diff = cur - last
      if (Math.abs(diff) >= THRESHOLD_SCROLL) {
        if (diff > 0) {
          // скроллим вниз — показываем FAB
          setVisible(true)
        } else {
          // скроллим вверх — прячем, кроме самого верха
          if (!forceVisibleIfNearTop(target)) setVisible(false)
        }
        last = cur
      } else {
        // даже при микро-движении, если вверху — всегда видим
        forceVisibleIfNearTop(target)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches?.[0]?.clientY ?? 0
      // при начале жеста у самого верха — сразу показать
      forceVisibleIfNearTop(target)
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches?.[0]?.clientY ?? 0
      const dy = y - touchY
      if (Math.abs(dy) >= THRESHOLD_TOUCH) {
        if (dy < 0) {
          // палец вверх => контент вниз => показываем
          setVisible(true)
        } else {
          // палец вниз => контент вверх => прячем, кроме самого верха
          if (!forceVisibleIfNearTop(target)) setVisible(false)
        }
        touchY = y
      }
    }

    // Подписки на сам скроллер
    const opts: AddEventListenerOptions = { passive: true }
    ;(target as any).addEventListener?.("scroll", onScroll, opts)
    ;(target as any).addEventListener?.("touchstart", onTouchStart, opts)
    ;(target as any).addEventListener?.("touchmove", onTouchMove, opts)

    // Дублируем на window — для случаев, когда скроллер «промахнулся»
    window.addEventListener("scroll", onScroll, opts)
    window.addEventListener("touchstart", onTouchStart, opts)
    window.addEventListener("touchmove", onTouchMove, opts)

    // Стартовое состояние — если уже не вверху, считаем «прокрутили вниз»
    if (!forceVisibleIfNearTop(target)) setVisible(true)

    return () => {
      ;(target as any).removeEventListener?.("scroll", onScroll)
      ;(target as any).removeEventListener?.("touchstart", onTouchStart)
      ;(target as any).removeEventListener?.("touchmove", onTouchMove)

      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  // Если меню открыто — не прячем FAB
  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  const FAB_COLOR = "bg-[var(--tg-link-color)]"

  return (
    <div
      ref={fabRef}
      className={`
        fixed z-50
        right-6 bottom-[90px]
        flex flex-col items-end
        transition-opacity duration-200
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
    >
      <div className="flex flex-col items-end gap-4 mb-2 pointer-events-none">
        {open &&
          actions.map((action, idx) => (
            <div key={action.key} className="flex flex-row items-center justify-end w-full">
              {action.label && (
                <span
                  className={`
                    mr-3 px-3 py-[6px] rounded-lg text-sm font-medium fab-label-appear
                    bg-transparent
                    text-[var(--tg-hint-color)]
                    select-none pointer-events-none
                    transition
                  `}
                  style={{ animationDelay: `${idx * 60}ms` }}
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
                style={{ animationDelay: `${idx * 60}ms` }}
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
        style={{ transition: "box-shadow 0.2s, transform 0.1s" }}
      >
        <Plus size={32} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export default FAB
