// frontend/src/components/group/InviteGroupModal.tsx
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { createGroupInvite } from "../../api/groupInvitesApi"

type Props = {
  open: boolean
  onClose: () => void
  groupId: number
}

export default function InviteGroupModal({ open, onClose, groupId }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  // Сборка ссылки: t.me/<bot>/app?startapp=<token> (если известен бот), иначе — fallback на origin
  const link = useMemo(() => {
    const tok = token || ""
    const bot = import.meta.env.VITE_TG_BOT_USERNAME
    if (bot) {
      return `https://t.me/${bot}/app?startapp=${encodeURIComponent(tok)}`
    }
    return `${window.location.origin}?startapp=${encodeURIComponent(tok)}`
  }, [token])

  useEffect(() => {
    if (!open || !groupId) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await createGroupInvite(groupId)
        if (!active) return
        setToken(res.token)
      } catch (e: any) {
        setError(e?.message || "invite_error")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [open, groupId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {/* ignore */}
  }

  const handleShare = () => {
    const tg = (window as any)?.Telegram?.WebApp
    if (tg?.shareURL) {
      tg.shareURL(link)
      setShared(true)
      setTimeout(() => setShared(false), 1500)
      return
    }
    handleCopy()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative max-w-[92vw] w-[520px] rounded-2xl border bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
        style={{ borderColor: "var(--tg-secondary-bg-color,#e7e7e7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[16px] font-semibold mb-2">{t("invite_by_link")}</div>

        {loading ? (
          <div className="text-[var(--tg-hint-color)] py-8">{t("loading")}</div>
        ) : error ? (
          <div className="text-red-500">{t("invite_error")}</div>
        ) : (
          <>
            <div className="text-[13px] opacity-80 mb-2 break-all">{link}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 h-10 rounded-xl font-semibold bg-[var(--tg-secondary-bg-color,#e6e6e6)] text-[var(--tg-text-color)] active:scale-95 transition"
              >
                {copied ? t("copied") : t("copy_link")}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 h-10 rounded-xl font-semibold bg-[var(--tg-accent-color,#40A7E3)] text-white active:scale-95 transition"
              >
                {shared ? t("shared") : t("share_link")}
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-[var(--tg-secondary-bg-color,#e6e6e6)] text-[var(--tg-text-color)] font-semibold active:scale-95 transition"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  )
}
