// src/hooks/useAcceptInviteOnBoot.ts
import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { acceptGroupInvite, getStartParam, normalizeInviteToken } from "../api/groupInvitesApi"

/**
 * Монтируй ЭТОТ хук в корневом компоненте (App), чтобы авто-принятие сработало сразу.
 * Он читает start_param из Telegram, принимает инвайт и мгновенно ведёт в /groups/:id.
 */
export default function useAcceptInviteOnBoot() {
  const ranRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const raw = getStartParam()
    const token = normalizeInviteToken(raw)
    if (!token) return

    const cacheKey = `accepted_invite_${token}`
    if (sessionStorage.getItem(cacheKey)) return

    acceptGroupInvite(token)
      .then((res) => {
        if (res?.success && res?.group_id) {
          sessionStorage.setItem(cacheKey, "1")
          navigate(`/groups/${res.group_id}`, { replace: true })
        }
      })
      .catch((err: any) => {
        try {
          ;(window as any)?.Telegram?.WebApp?.showPopup?.({
            title: "Invite error",
            message: String(err?.message || err || "Failed to accept invite"),
            buttons: [{ type: "close" }],
          })
        } catch {}
      })
  }, [navigate, location.key])
}
