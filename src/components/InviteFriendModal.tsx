// src/components/InviteFriendModal.tsx

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { createInvite } from "../api/friendsApi"

// Имя бота для ссылки — не забудь поменять если понадобится!
const BOT_USERNAME = "Splitto_Bot"

type Props = {
  open: boolean
  onClose: () => void
  inviteLink?: string | null // Можно не передавать, логика вся внутри
}

// Компонент модального окна для приглашения друга
const InviteFriendModal = ({ open, onClose }: Props) => {
  const { t, i18n } = useTranslation()
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shared, setShared] = useState(false)

  // Генерация ссылки через API
  const handleCreateInvite = async () => {
    setLoading(true)
    setError(null)
    try {
      const invite = await createInvite()
      const url = `https://t.me/${BOT_USERNAME}/app?startapp=${invite.token}`
      setInviteLink(url)
    } catch (e: any) {
      setError(e.message || t("invite_error"))
    } finally {
      setLoading(false)
    }
  }

  // Копирование полного приглашения с текстом
  const handleCopy = () => {
    if (inviteLink) {
      // Получаем текст из локали (i18n) и подставляем ссылку
      const msg = t("invite_message", { link: inviteLink })
      navigator.clipboard.writeText(msg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Поделиться ссылкой (закрыть WebApp, если надо)
  const handleShare = () => {
    if (inviteLink) {
      const msg = t("invite_message", { link: inviteLink })
      navigator.clipboard.writeText(msg)
      setShared(true)
      setTimeout(() => setShared(false), 1000)
      //if (window.Telegram?.WebApp) {
        //window.Telegram.WebApp.close()
      //}
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-[var(--tg-bg-color)] rounded-2xl shadow-xl w-[90vw] max-w-xs p-6 flex flex-col">
        <div className="font-bold text-lg mb-3">{t("invite_friend")}</div>
        {/* Ошибка */}
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}

        {inviteLink ? (
          <>
            <input
              readOnly
              className="w-full px-2 py-1 rounded-lg border bg-[var(--tg-card-bg)] mb-3 text-[var(--tg-text-color)]"
              value={inviteLink}
            />
            {/* Кнопка "Скопировать ссылку" — копирует полный текст */}
            <button
              onClick={handleCopy}
              className="w-full py-2 mb-2 rounded-xl font-medium bg-[var(--tg-link-color)] text-white hover:opacity-90 transition"
            >
              {copied ? t("copied") : t("copy_link")}
            </button>
            {/* Кнопка "Поделиться" */}
            <button
              onClick={handleShare}
              disabled={!inviteLink}
              className={`
                w-full py-2 mb-2 rounded-xl font-medium border transition
                ${inviteLink
                  ? "bg-[var(--tg-bg-color)] text-[var(--tg-link-color)] border-[var(--tg-link-color)] hover:bg-[var(--tg-link-color)]/10 active:bg-[var(--tg-link-color)]/20 hover:text-[var(--tg-link-color)]"
                  : "bg-[var(--tg-bg-color)] text-[var(--tg-hint-color)] border-[var(--tg-hint-color)] opacity-50 cursor-not-allowed"
                }
              `}
            >
              {shared ? t("shared") : t("share_link")}
            </button>
            {/* Кнопка "Закрыть" */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl font-medium text-[var(--tg-link-color)] hover:bg-[var(--tg-link-color)] hover:text-white transition"
            >
              {t("close")}
            </button>
          </>
        ) : (
          <>
            {/* Кнопка "Создать ссылку-приглашение" */}
            <button
              onClick={handleCreateInvite}
              className="w-full py-2 mb-2 rounded-xl font-medium bg-[var(--tg-link-color)] text-white hover:opacity-90 transition"
              disabled={loading}
            >
              {loading ? t("loading") : t("create_invite_link")}
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl font-medium text-[var(--tg-link-color)] hover:bg-[var(--tg-link-color)] hover:text-white transition"
            >
              {t("close")}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default InviteFriendModal
