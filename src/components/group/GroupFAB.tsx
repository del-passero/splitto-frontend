// src/components/group/GroupFAB.tsx
import { HandCoins } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useRef, useState, useEffect } from "react"

type Props = {
  onClick: () => void
  className?: string
}

const SCROLL_EPS = 2    // игнорим микро-движения
const TOUCH_EPS = 8     // чувствительность к свайпу
const NEAR_TOP = 10     // порог «у самого верха»

const getScrollEl = (): HTMLElement | Window => {
  const el = document.querySelector(".app-scroll") as HTMLElement | null
  return el || window
}

const getScrollPos = (target: HTMLElement | Window) =>
  target instanceof Window
    ? window.scrollY || document.documentElement.scrollTop || 0
    : (target as HTMLElement).scrollTop

const GroupFAB = ({ onClick, className = "" }: Props) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = getScrollEl()

    let last = getScrollPos(target)
    let touchY = 0

    const ensureTopVisible = () => {
      if (getScrollPos(target) <= NEAR_TOP) {
        setVisible(true)
        return true
      }
      return false
    }

    const onScroll = () => {
      const cur = getScrollPos(target)
      const diff = cur - last
      if (Math.abs(diff) > SCROLL_EPS) {
        if (diff > 0) {
          // скроллим ВНИЗ -> показываем
          setVisible(true)
        } else {
          // скроллим ВВЕРХ -> скрываем (кроме самого верха)
          if (!ensureTopVisible()) setVisible(false)
        }
        last = cur
      } else {
        ensureTopVisible()
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches?.[0]?.clientY ?? 0
      ensureTopVisible()
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches?.[0]?.clientY ?? 0
      const dy = y - touchY
      if (Math.abs(dy) > TOUCH_EPS) {
        if (dy < 0) {
          // палец вверх (контент вниз) -> показываем
          setVisible(true)
        } else {
          // палец вниз (контент вверх) -> скрываем, кроме самого верха
          if (!ensureTopVisible()) setVisible(false)
        }
        touchY = y
      }
    }

    const opts: AddEventListenerOptions = { passive: true }
    ;(target as any).addEventListener?.("scroll", onScroll, opts)
    ;(target as any).addEventListener?.("touchstart", onTouchStart, opts)
    ;(target as any).addEventListener?.("touchmove", onTouchMove, opts)

    // Дублируем на window — на случай, если скроллер не тот
    window.addEventListener("scroll", onScroll, opts)
    window.addEventListener("touchstart", onTouchStart, opts)
    window.addEventListener("touchmove", onTouchMove, opts)

    // стартовое состояние
    ensureTopVisible()

    return () => {
      ;(target as any).removeEventListener?.("scroll", onScroll)
      ;(target as any).removeEventListener?.("touchstart", onTouchStart)
      ;(target as any).removeEventListener?.("touchmove", onTouchMove)

      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  return (
    <div
      ref={fabRef}
      className={`
        fixed z-50
        right-6 bottom-[90px]
        transition-opacity duration-200
        ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        ${className}
      `}
    >
      <button
        type="button"
        aria-label={t("group_fab_add_transaction")}
        onClick={onClick}
        className={`
          w-14 h-14 rounded-full
          bg-[var(--tg-link-color)] text-white
          flex items-center justify-center
          border border-white/80 shadow-xl
          shadow-[0_4px_16px_0_rgba(34,105,255,0.14)]
          transition hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/40
        `}
        style={{ transition: "box-shadow 0.2s, transform 0.1s" }}
      >
        <HandCoins className="w-8 h-8" />
      </button>
    </div>
  )
}

export default GroupFAB
