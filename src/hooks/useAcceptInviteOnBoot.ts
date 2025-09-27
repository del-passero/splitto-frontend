// frontend/src/hooks/useAcceptInviteOnBoot.ts
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { acceptGroupInviteFromInit, acceptGroupInvite, getStartParam, normalizeInviteToken } from "../api/groupInvitesApi"

/**
 * Монтируй в App. Алгоритм:
 *  1) Пробуем принять инвайт БЕЗ токена — бэкенд сам достанет из initData.start_param.
 *  2) Если backend сказал "bad_token" — откат к старой схеме: достаём токен на фронте и шлём его.
 */
export default function useAcceptInviteOnBoot() {
  const ranRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    ;(async () => {
      // 1) Попытка через initData (более надёжно, фронт не парсит ничего)
      try {
        const r1 = await acceptGroupInviteFromInit()
        if (r1?.success && r1?.group_id) {
          sessionStorage.setItem(`accepted_invite_group_${r1.group_id}`, "1")
          navigate(`/groups/${r1.group_id}`, { replace: true })
          return
        }
      } catch (e: any) {
        // если это не "bad_token" — просто замолчим, перейдём к fallback
      }

      // 2) Fallback: старый путь — берём токен сами (если он вообще был)
      const raw = getStartParam()
      const token = normalizeInviteToken(raw)
      if (!token) return

      const cacheKey = `accepted_invite_${token}`
      if (sessionStorage.getItem(cacheKey)) return

      try {
        const r2 = await acceptGroupInvite(token)
        if (r2?.success && r2?.group_id) {
          sessionStorage.setItem(cacheKey, "1")
          navigate(`/groups/${r2.group_id}`, { replace: true })
        }
      } catch {}
    })()
  }, [navigate])
}
