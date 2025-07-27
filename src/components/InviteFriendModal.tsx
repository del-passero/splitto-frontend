import { useState } from "react"
import { useTranslation } from "react-i18next"

type Props = {
    open: boolean
    onClose: () => void
    inviteLink: string | null
    onCreateLink: () => void
}

const InviteFriendModal = ({ open, onClose, inviteLink, onCreateLink }: Props) => {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)
    const [shared, setShared] = useState(false)

    if (!open) return null

    const handleCopy = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleShare = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
            setShared(true)
            setTimeout(() => setShared(false), 1000)
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.close()
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-[var(--tg-bg-color)] rounded-2xl shadow-xl w-[90vw] max-w-xs p-6 flex flex-col">
                <div className="font-bold text-lg mb-3">{t("invite_friend")}</div>
                {inviteLink ? (
                    <>
                        <input
                            readOnly
                            className="w-full px-2 py-1 rounded-lg border bg-[var(--tg-card-bg)] mb-3 text-[var(--tg-text-color)]"
                            value={inviteLink}
                        />
                        {/* Кнопка "Скопировать ссылку" */}
                        <button
                            onClick={handleCopy}
                            className="w-full py-2 mb-2 rounded-xl font-medium bg-[var(--tg-link-color)] text-white hover:opacity-90 transition"
                        >
                            {copied ? t("copied") : t("copy_link")}
                        </button>
                        {/* Кнопка "Поделиться" (Telegram) */}
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
                            onClick={onCreateLink}
                            className="w-full py-2 mb-2 rounded-xl font-medium bg-[var(--tg-link-color)] text-white hover:opacity-90 transition"
                        >
                            {t("create_invite_link")}
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
