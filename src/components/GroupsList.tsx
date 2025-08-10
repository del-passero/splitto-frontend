// src/components/GroupsList.tsx
// Рендер и инфинити-скролл. Фикс «моргания»: как только новая порция не приходит,
// наблюдатель отключается сам. Никаких правок в странице не требуется.

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

  // защита от повторных вызовов, когда сентинел в видимой зоне
  const lockRef = useRef(false)
  // как только понимаем, что больше ничего не приходит — навсегда отключаем дозагрузку
  const disabledRef = useRef(false)
  // актуальная длина списка между вызовами
  const lastLenRef = useRef(groups.length)
  // чтобы можно было корректно disconnect()
  const ioRef = useRef<IntersectionObserver | null>(null)

  // следим за длиной массива и обновляем ref
  useEffect(() => {
    lastLenRef.current = groups.length
    // если список сброшен (новый поиск/фильтр) — позволяем заново дозагружать
    if (groups.length === 0) {
      disabledRef.current = false
    }
  }, [groups.length])

  useEffect(() => {
    const target = loaderRef.current
    if (!target) return
    if (!loadMore) return
    if (disabledRef.current) return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) return
        if (lockRef.current || loading) return

        lockRef.current = true
        const before = lastLenRef.current

        const finish = () => {
          // Ждём тик, чтобы стейт наверху успел обновиться
          setTimeout(() => {
            const after = lastLenRef.current
            // если ничего не добавилось — достигли конца; дальше не наблюдаем
            if (after <= before) {
              disabledRef.current = true
              ioRef.current?.disconnect()
            }
            lockRef.current = false
          }, 0)
        }

        try {
          const p = loadMore()
          if (p && typeof (p as any).finally === "function") {
            ;(p as Promise<unknown>).finally(finish)
          } else {
            finish()
          }
        } catch {
          // при ошибке тоже снимаем лок, чтобы не повиснуть
          finish()
        }
      },
      { root: null, rootMargin: "320px 0px 0px 0px", threshold: 0 }
    )

    io.observe(target)
    ioRef.current = io

    return () => {
      io.disconnect()
      if (ioRef.current === io) ioRef.current = null
    }
  }, [loadMore, loading])

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
      {/* Сентинел для IntersectionObserver — полностью прозрачный, 1px высоты */}
      <div ref={loaderRef} aria-hidden style={{ height: 1, width: "100%", opacity: 0 }} />
    </CardSection>
  )
}

export default GroupsList
