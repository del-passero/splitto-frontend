// frontend/src/hooks/useAcceptInviteOnBoot.ts
// Безусловный порядок хуков. На старте выцепляем токен и переводим на /invite?token=...

import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getStartParam, normalizeInviteToken } from "../api/groupInvitesApi"

export function useAcceptInviteOnBoot() {
  const onceRef = useRef(false)
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    if (onceRef.current) return
    onceRef.current = true

    const raw = getStartParam()
    const tok = normalizeInviteToken(raw)

    if (!tok) return

    const sp = new URLSearchParams()
    sp.set("token", tok)

    // Всегда ведём на единый безопасный роут, где нет условных хуков.
    const target = `/invite?${sp.toString()}`
    if (loc.pathname !== "/invite" || loc.search !== `?${sp.toString()}`) {
      nav(target, { replace: true })
    }
  }, [nav, loc.pathname, loc.search])
}
