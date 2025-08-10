// src/components/GroupsList.tsx
// Рендер и инфинити-скролл. Без “самоотключения” на нулевом приросте.

import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import CardSection from "./CardSection"
import GroupCard from "./GroupCard"
import type { GroupPreview } from "../types/group"

type Props = {
  groups: GroupPreview[]
  loadMore?: () => Promise<unknown> | void
  loading?: boolean
}

const GroupsList = ({ groups, loadMore, loading = false }: Props) => {
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)
  const lockRef = useRef(false)

  useEffect(() => {
    const el = loaderRef.current
    // если нет loadMore — нечего наблюдать
    if (!el || !loadMore) return

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e.isIntersecting) return
        if (lockRef.current || loading) return

        lockRef.current = true
        const p = loadMore()
        const unlock = () => (lockRef.current = false)

        if (p && typeof (p as any).finally === "function") {
          ;(p as Promise<unknown>).finally(unlock)
        } else {
          // на всякий случай — короткая задержка, чтобы стейт успел обновиться
          setTimeout(unlock, 120)
        }
      },
      { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 }
    )

    io.observe(el)
    ioRef.current = io
    return () => {
      io.disconnect()
      if (ioRef.current === io) ioRef.current = null
    }
  }, [loadMore, loading])

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g as any}
            onClick={() => navigate(`/groups/${g.id}`)}
          />
        ))}
      </div>
      {/* Сентинел */}
      <div ref={loaderRef} aria-hidden style={{ height: 1, width: "100%", opacity: 0 }} />
    </CardSection>
  )
}

export default GroupsList
