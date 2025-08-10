// src/components/GroupsList.tsx
// Рендер и инфинити-скролл (вызывает loadMore из пропсов)

import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import CardSection from "./CardSection"
import GroupCard from "./GroupCard"
import type { GroupPreview } from "../types/group"

type Props = {
  groups: GroupPreview[]
  loadMore?: () => void
  loading?: boolean
}

const GroupsList = ({ groups, loadMore, loading = false }: Props) => {
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loadMore || loading || !loaderRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        loadMore()
      }
    })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadMore, loading])

  return (
    <CardSection noPadding>
      <div className="grid grid-cols-1 gap-4">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group as any}
            onClick={() => navigate(`/groups/${group.id}`)}
          />
        ))}
      </div>
      <div ref={loaderRef} style={{ height: 1, width: "100%" }} />
    </CardSection>
  )
}

export default GroupsList
