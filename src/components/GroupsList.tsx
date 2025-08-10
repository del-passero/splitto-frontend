// src/components/GroupsList.tsx
// Рендер и инфинити-скролл (вызывает loadMore из пропсов)

import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import CardSection from "./CardSection"
import GroupCard from "./GroupCard"
import type { GroupPreview } from "../types/group"

type Props = {
  groups: GroupPreview[]
  loadMore?: () => Promise<unknown> | void
  loading?: boolean
  hasMore?: boolean
}

const GroupsList = ({ groups, loadMore, loading = false, hasMore = false }: Props) => {
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)
  const lockRef = useRef(false)

  useEffect(() => {
    const el = loaderRef.current
    const canObserve = !!loadMore && !!hasMore && !loading && !!el
    if (!canObserve) return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) return
        if (lockRef.current || loading) return
        lockRef.current = true

        const p = loadMore?.()
        // Снимаем лок по завершению (и если loadMore не вернул промис — снимаем чуть позже)
        if (p && typeof (p as any).finally === "function") {
          ;(p as Promise<unknown>).finally(() => {
            lockRef.current = false
          })
        } else {
          setTimeout(() => (lockRef.current = false), 200)
        }
      },
      { root: null, rootMargin: "300px 0px 0px 0px", threshold: 0 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, hasMore, loading])

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group as any}
            onClick={() => navigate(`/groups/${group.id}`)}
          />
        ))}
      </div>

      {/* Сентинел. Прячем, но оставляем для обсерверa */}
      <div ref={loaderRef} aria-hidden style={{ height: 1, width: "100%", opacity: 0 }} />
    </CardSection>
  )
}

export default GroupsList
