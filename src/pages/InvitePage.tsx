// frontend/src/pages/InvitePage.tsx
// Единая "воронка" инвайта: читаем токен, делаем preview, показываем CTA, по Join — accept и редирект.

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  previewGroupInvite,
  acceptGroupInvite,
  normalizeInviteToken,
  getStartParam,
  type InvitePreview,
} from "../api/groupInvitesApi"

export default function InvitePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()

  // Хуки на месте, без условий:
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<InvitePreview | null>(null)

  // 1) Достаём токен одинаково на каждом рендере (хуки не зависят от условий)
  useEffect(() => {
    const fromQuery = params.get("token")
    const fromTg = getStartParam()
    const tok = normalizeInviteToken(fromQuery || fromTg)
    setToken(tok)
  }, [params])

  // 2) Подгружаем превью (если токен есть)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setPreview(null)

      if (!token) {
        setLoading(false)
        return
      }
      try {
        const p = await previewGroupInvite(token)
        if (!cancelled) setPreview(p)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "bad_token")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const groupName = preview?.group?.name || t("group")
  const inviterName = preview?.inviter?.name || ""
  const inviterUsername = preview?.inviter?.username ? `@${preview.inviter.username}` : ""
  const groupAvatar = preview?.group?.avatar_url || null

  const canJoin = useMemo(() => Boolean(token && preview && !preview.already_member), [token, preview])

  const onJoin = async () => {
    if (!token) return
    setAccepting(true)
    setError(null)
    try {
      const res = await acceptGroupInvite(token)
      if (res?.group_id) {
        nav(`/groups/${res.group_id}`, { replace: true })
        return
      }
      setError("accept_failed")
    } catch (e: any) {
      setError(e?.message || "accept_failed")
    } finally {
      setAccepting(false)
    }
  }

  // UI без изменения порядка хуков
  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center">
      <div className="w-[92%] max-w-[520px] rounded-2xl p-5"
           style={{
             background: "var(--tg-theme-bg-color,#fff)",
             color: "var(--tg-theme-text-color,#111)",
             border: "1px solid var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.06))",
             boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
           }}>
        <div className="text-lg font-semibold mb-3">{t("join_group")}</div>

        {loading && <div className="text-sm">{t("loading")}…</div>}

        {!loading && error && (
          <div className="text-sm text-red-500">{t(error) || error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center gap-3 mb-4">
              {groupAvatar ? (
                <img src={groupAvatar} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full"
                     style={{ background: "var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.06))" }} />
              )}
              <div className="flex flex-col">
                <div className="font-medium">{groupName}</div>
                <div className="text-xs" style={{ color: "var(--tg-theme-hint-color,rgba(0,0,0,0.6))" }}>
                  {inviterName} {inviterUsername && <span>({inviterUsername})</span>}
                </div>
              </div>
            </div>

            {preview?.already_member ? (
              <div className="text-sm mb-3">{t("you_are_already_member")}</div>
            ) : (
              <div className="text-sm mb-3">{t("invited_you_to_group")}</div>
            )}

            <div className="flex gap-8 justify-end">
              <button
                onClick={() => window.history.length > 1 ? nav(-1) : nav("/", { replace: true })}
                className="px-4 py-2 rounded-xl"
                style={{
                  background: "var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.05))",
                  color: "var(--tg-theme-text-color,#111)",
                }}
              >
                {t("close")}
              </button>

              {!preview?.already_member && (
                <button
                  onClick={onJoin}
                  disabled={!canJoin || accepting}
                  className="px-4 py-2 rounded-xl font-medium"
                  style={{
                    background: "var(--tg-theme-button-color,#2ea6ff)",
                    color: "var(--tg-theme-button-text-color,#fff)",
                    opacity: !canJoin || accepting ? 0.6 : 1,
                  }}
                >
                  {accepting ? t("loading") : t("join")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
