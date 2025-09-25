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

  // закрытие по клику вне
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
    // если меню открыто — не прячем
    if (open) {
      setVisible(true)
      return
    }

    const lastMap = new WeakMap<EventTarget, number>()
    const THRESH = 6 // мёртвая зона против дрожания

    const getTop = (target: EventTarget | null): number => {
      if (target instanceof Element) {
        const st = (target as Element).scrollTop as number | undefined
        if (typeof st === "number") return st || 0
      }
      if (target instanceof Document) {
        const se = target.scrollingElement || target.documentElement
        return (se?.scrollTop || 0)
      }
      const se = document.scrollingElement || document.documentElement
      return (se?.scrollTop || window.scrollY || 0)
    }

    const applyByDelta = (dy: number, yNow: number) => {
      // у самого верха — всегда видно
      if (yNow < 10) {
        setVisible(true)
        return
      }
      if (Math.abs(dy) < THRESH) return
      // ТЗ: вверх — скрыть, вниз — показать
      if (dy > 0) setVisible(true)      // скролл вниз
      else setVisible(false)            // скролл вверх
    }

    let raf = 0
    const onScrollCapture = (e: Event) => {
      const tgt: EventTarget = (e.target as EventTarget) || document
      const y = getTop(tgt)
      const last = lastMap.get(tgt) ?? y
      const dy = y - last
      lastMap.set(tgt, y)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => applyByDelta(dy, y))
    }

    const onWheelCapture = (e: WheelEvent) => {
      // колесо даёт направление, высоту берём из документа
      const y = getTop(document)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => applyByDelta(e.deltaY, y))
    }

    window.addEventListener("scroll", onScrollCapture, { capture: true, passive: true })
    document.addEventListener("scroll", onScrollCapture, { capture: true, passive: true })
    window.addEventListener("wheel", onWheelCapture, { capture: true, passive: true })

    return () => {
      window.removeEventListener("scroll", onScrollCapture as any, true)
      document.removeEventListener("scroll", onScrollCapture as any, true)
      window.removeEventListener("wheel", onWheelCapture as any, true)
      cancelAnimationFrame(raf)
    }
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
