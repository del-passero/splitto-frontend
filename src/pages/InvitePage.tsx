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

  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<InvitePreview | null>(null)

  // 1) Берём токен из query и/или из initDataUnsafe.start_param (WebApp)
  useEffect(() => {
    const fromQuery = params.get("token")
    const fromTg = getStartParam()
    const tok = normalizeInviteToken(fromQuery || fromTg)
    setToken(tok)
  }, [params])

  // 2) Превью приглашения
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

  const inviterName = preview?.inviter?.name || ""
  const inviterUsername = preview?.inviter?.username ? `@${preview.inviter.username}` : ""
  const inviterAvatar = preview?.inviter?.photo_url || null

  const groupName = preview?.group?.name || t("group")
  const groupAvatar = preview?.group?.avatar_url || null

  const already = Boolean(preview?.already_member)
  const canJoin = useMemo(() => Boolean(token && preview && !already), [token, preview, already])

  const onClose = () =>
    window.history.length > 1 ? nav(-1) : nav("/", { replace: true })

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

  return (
    <div
      className="w-full min-h-[100dvh] flex items-center justify-center"
      style={{
        background: "var(--tg-theme-secondary-bg-color, var(--tg-theme-bg-color, #fff))",
        color: "var(--tg-theme-text-color, #111)",
      }}
    >
      <div
        className="w-[92%] max-w-[560px] rounded-2xl p-5 relative"
        style={{
          background: "var(--tg-theme-bg-color, #fff)",
          color: "var(--tg-theme-text-color, #111)",
          border: "1px solid var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.06))",
          boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
        }}
      >
        {/* Кнопка-крестик (закрыть) */}
        <button
          aria-label={t("invite_page.close_aria")}
          onClick={onClose}
          className="absolute right-3 top-3 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "transparent",
            color: "var(--tg-theme-hint-color, rgba(0,0,0,0.6))",
          }}
        >
          {/* простая иконка-крестик, без зависимостей */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Заголовок */}
        <div className="text-lg font-semibold mb-4 pr-10">
          {t("invite_page.title")}
        </div>

        {/* Состояния */}
        {loading && (
          <div className="text-sm">{t("invite_page.loading_preview")}</div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-500">{t(error) || error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Блок пригласившего */}
            <div className="flex items-center gap-3 mb-3">
              {inviterAvatar ? (
                <img src={inviterAvatar} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ background: "var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.06))" }}
                />
              )}

              <div className="flex flex-col min-w-0">
                <div className="font-medium truncate">
                  {inviterName} {inviterUsername && <span className="opacity-80">{inviterUsername}</span>}
                </div>

                {!already && (
                  <div
                    className="text-xs"
                    style={{ color: "var(--tg-theme-hint-color, rgba(0,0,0,0.6))" }}
                  >
                    {t("invite_page.invites_you")}
                  </div>
                )}
              </div>
            </div>

            {/* Если уже в группе */}
            {already ? (
              <div className="mt-4">
                <div className="text-sm mb-2 font-medium">{t("invite_page.already_title")}</div>
                <div className="flex items-center gap-3">
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg"
                      style={{ background: "var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.06))" }}
                    />
                  )}
                  <div className="text-base font-semibold">{groupName}</div>
                </div>
              </div>
            ) : (
              <>
                {/* Блок группы + слоган */}
                <div className="flex items-center gap-3 mt-2 mb-1">
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg"
                      style={{ background: "var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.06))" }}
                    />
                  )}
                  <div className="flex flex-col">
                    <div className="text-base font-semibold">{groupName}</div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--tg-theme-hint-color, rgba(0,0,0,0.6))" }}
                    >
                      {t("invite_page.tagline")}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={onJoin}
                    disabled={!canJoin || accepting}
                    className="px-4 py-2 rounded-xl font-medium"
                    style={{
                      background: "var(--tg-theme-button-color, #2ea6ff)",
                      color: "var(--tg-theme-button-text-color, #fff)",
                      opacity: !canJoin || accepting ? 0.6 : 1,
                    }}
                  >
                    {accepting ? t("loading") : t("invite_page.join")}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
