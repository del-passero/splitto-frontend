// frontend/src/hooks/useAcceptInviteOnBoot.ts
import { useEffect, useRef } from "react"
import { acceptGroupInvite, getStartParam, normalizeInviteToken } from "../api/groupInvitesApi"

// пробрось из своего роутера
type NavigateFn = (path: string) => void

export function useAcceptInviteOnBoot(navigate: NavigateFn, onError?: (msg: string) => void) {
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true

    const raw = getStartParam()
    const token = normalizeInviteToken(raw)

    if (!token) return

    ;(async () => {
      try {
        const { success, group_id } = await acceptGroupInvite(token)
        if (success && group_id) {
          navigate(`/groups/${group_id}`)
        }
      } catch (e: any) {
        const code = e?.message || "accept_failed"
        // optionally покажи тост/алерт
        onError?.(code)
      }
    })()
  }, [navigate, onError])
}
