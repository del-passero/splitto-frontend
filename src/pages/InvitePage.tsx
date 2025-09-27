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
import Avatar from "../components/Avatar"
import GroupAvatar from "../components/GroupAvatar"

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

  const groupId = preview?.group?.id
  const groupName = preview?.group?.name || t("group")
  const groupAvatarUrl = preview?.group?.avatar_url || null

  const already = Boolean(preview?.already_member)
  const canJoin = useMemo(() => Boolean(token && preview && !already), [token, preview, already])

  // Крестик: если уже в группе — сразу ведём в группу, иначе закрываем/назад.
  const onClose = () => {
    if (already && groupId) {
      nav(`/groups/${groupId}`, { replace: true })
      return
    }
    window.history.length > 1 ? nav(-1) : nav("/", { replace: true })
  }

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

  // UI с переменными Telegram WebApp (как на других страницах).
  // Страница без боковых отступов, карточка на всю ширину.

  return (
    <div className="min-h-[100dvh] w-full bg-[var(--tg-bg-color)] flex flex-col">
      {/* Верхняя "карточка" без горизонтальных отступов */}
      <div
        className="w-full relative border-b px-4 pt-4 pb-5"
        style={{
          background: "var(--tg-card-bg)",
          borderColor: "var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.06))",
          color: "var(--tg-text-color)",
        }}
      >
        {/* Кнопка-крестик (закрыть) */}
        <button
          aria-label={t("invite_page.close_aria")}
          onClick={onClose}
          className="absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 active:scale-[0.98]"
          style={{
            background: "transparent",
            color: "var(--tg-hint-color)",
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Заголовок */}
        <div className="pr-12">
          <div className="text-[18px] font-semibold text-[var(--tg-text-color)]">
            {t("invite_page.title")}
          </div>
        </div>

        {/* Состояния */}
        {loading && (
          <div className="mt-3 text-[14px] text-[var(--tg-text-color)]">{t("invite_page.loading_preview")}</div>
        )}

        {!loading && error && (
          <div className="mt-3 text-[14px] text-red-500">{t(error) || error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Если НЕ в группе: блок пригласившего */}
            {!already && (
              <div className="mt-4 flex items-center gap-3">
                {/* Круглый аватар пригласившего — строго круг/cover */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--tg-bg-color)] flex items-center justify-center">
                  {inviterAvatar ? (
                    <img
                      src={inviterAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar
                      name={inviterName || inviterUsername || "U"}
                      size={56}
                    />
                  )}
                </div>

                {/* Имя/фамилия и username — как на UserCard: 1-я строка крупнее, 2-я — хинт */}
                <div className="flex flex-col min-w-0">
                  <div className="text-[16px] font-semibold text-[var(--tg-text-color)] truncate">
                    {inviterName || inviterUsername || t("not_specified")}
                  </div>
                  <div className="text-[13px] text-[var(--tg-hint-color)] truncate">
                    {inviterUsername}
                  </div>
                </div>
              </div>
            )}

            {/* Подпись “приглашает вас в группу” — нормальным (не мелким) шрифтом */}
            {!already && (
              <div className="mt-3 text-[14px] text-[var(--tg-text-color)]">
                {t("invite_page.invites_you")}
              </div>
            )}

            {/* Блок группы */}
            <div className={`mt-3 flex items-center gap-3`}>
              {/* Квадратный аватар группы — строго квадрат/cover */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--tg-bg-color)] flex items-center justify-center">
                {groupAvatarUrl ? (
                  <img
                    src={groupAvatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GroupAvatar name={groupName} size={64} className="relative" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="text-[17px] font-semibold text-[var(--tg-text-color)] truncate">
                  {groupName}
                </div>
              </div>
            </div>

            {/* Если уже в группе — компактный текст */}
            {already ? (
              <div className="mt-3 text-[15px] font-medium text-[var(--tg-text-color)]">
                {t("invite_page.already_title")}
              </div>
            ) : (
              // Подзаголовок-слоган — нормальным шрифтом
              <div className="mt-2 text-[14px] text-[var(--tg-hint-color)]">
                {t("invite_page.tagline")}
              </div>
            )}

            {/* CTA */}
            {!already && (
              <div className="mt-6 w-full flex justify-center">
                <button
                  onClick={onJoin}
                  disabled={!canJoin || accepting}
                  className="px-5 py-2.5 rounded-xl font-medium hover:opacity-90 active:scale-[0.99]"
                  style={{
                    background: "var(--tg-link-color)",
                    color: "var(--tg-theme-button-text-color,#fff)",
                    opacity: !canJoin || accepting ? 0.6 : 1,
                  }}
                >
                  {accepting ? t("loading") : t("invite_page.join")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
