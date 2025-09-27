// frontend/src/components/group/InviteGroupModal.tsx
// Модалка «ПРИГЛАСИТЬ В ГРУППУ» (генерит deep_link). Поддерживает prop `open`.

import { useEffect, useState } from "react"
import { createGroupInvite } from "../../api/groupInvitesApi"

type Lang = "ru" | "en" | "es"
const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    title: "Invite to group",
    description: "Share this link. People will see a join dialog for this group.",
    copy: "Copy link",
    openInTelegram: "Open in Telegram",
    close: "Close",
    creating: "Creating…",
    created: "Link ready",
    copied: "Link copied",
    error: "Failed to create invite",
  },
  ru: {
    title: "Приглашение в группу",
    description: "Поделитесь ссылкой. Пользователь увидит окно вступления в ЭТУ группу.",
    copy: "Скопировать ссылку",
    openInTelegram: "Открыть в Telegram",
    close: "Закрыть",
    creating: "Создаём…",
    created: "Ссылка готова",
    copied: "Ссылка скопирована",
    error: "Не удалось создать инвайт",
  },
  es: {
    title: "Invitar al grupo",
    description: "Comparte este enlace. La persona verá un diálogo para unirse a ESTE grupo.",
    copy: "Copiar enlace",
    openInTelegram: "Abrir en Telegram",
    close: "Cerrar",
    creating: "Creando…",
    created: "Enlace listo",
    copied: "Enlace copiado",
    error: "No se pudo crear la invitación",
  },
}

const normalizeLang = (c?: string | null): Lang => {
  const x = (c || "").toLowerCase().split("-")[0]
  return (["ru", "en", "es"].includes(x) ? x : "en") as Lang
}
const getLang = (): Lang => {
  const tg: any = (window as any)?.Telegram?.WebApp
  return normalizeLang(
    tg?.initDataUnsafe?.user?.language_code || tg?.initDataUnsafe?.language || tg?.languageCode
  )
}
const useT = () => {
  const lang = getLang()
  return (k: keyof typeof STRINGS["en"]) => STRINGS[lang][k] || STRINGS.en[k]
}

function useOverlayColor() {
  const tg = (window as any)?.Telegram?.WebApp
  const scheme = tg?.colorScheme as "light" | "dark" | undefined
  return scheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.45)"
}

type Props = {
  groupId: number
  onClose: () => void
  /** управляемое открытие модалки; по умолчанию true */
  open?: boolean
}

export default function InviteGroupModal({ groupId, onClose, open = true }: Props) {
  const t = useT()
  const overlay = useOverlayColor()

  const [creating, setCreating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setCreating(true)
      setError(null)
      try {
        const { deep_link, token } = await createGroupInvite(groupId)
        if (cancelled) return
        // Всегда используем deep_link; если нет BOT_USERNAME — соберём ссылку вручную (fallback)
        const url =
          deep_link ||
          (token ? `https://t.me/${(window as any)?.__BOT_USERNAME__ || ""}?startapp=${encodeURIComponent(token)}` : null)
        setLink(url)
      } catch (e: any) {
        setError(e?.message || "create_failed")
      } finally {
        setCreating(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [groupId, open])

  if (!open) return null

  const tg = (window as any)?.Telegram?.WebApp

  const onCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      tg?.showToast?.(STRINGS[getLang()].copied)
    } catch {
      // no-op
    }
  }

  const onOpenTelegram = () => {
    if (!link) return
    if (typeof tg?.openTelegramLink === "function") {
      tg.openTelegramLink(link)
    } else {
      window.open(link, "_blank")
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--tg-theme-bg-color,#fff)",
    color: "var(--tg-theme-text-color,#111)",
    border: "1px solid var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.06))",
    boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
  }
  const hintStyle: React.CSSProperties = {
    color: "var(--tg-theme-hint-color,rgba(0,0,0,0.6))",
  }
  const secondaryBtnStyle: React.CSSProperties = {
    background: "var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.05))",
    color: "var(--tg-theme-text-color,#111)",
  }
  const primaryBtnStyle: React.CSSProperties = {
    background: "var(--tg-theme-button-color,#2ea6ff)",
    color: "var(--tg-theme-button-text-color,#fff)",
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: overlay }}>
      <div className="w-[92%] max-w-[520px] rounded-2xl p-5" style={cardStyle}>
        <div className="text-lg font-semibold mb-1">{STRINGS[getLang()].title}</div>
        <div className="text-sm mb-4" style={hintStyle}>{STRINGS[getLang()].description}</div>

        <div className="rounded-xl px-3 py-2 mb-4" style={{ background: "var(--tg-theme-secondary-bg-color,rgba(0,0,0,0.05))" }}>
          <div className="text-xs break-all select-all">
            {creating ? STRINGS[getLang()].creating : (link || error || STRINGS[getLang()].error)}
          </div>
        </div>

        <div className="flex gap-8 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl" style={secondaryBtnStyle} disabled={creating}>
            {STRINGS[getLang()].close}
          </button>
          <button onClick={onCopy} className="px-4 py-2 rounded-xl" style={secondaryBtnStyle} disabled={creating || !link}>
            {STRINGS[getLang()].copy}
          </button>
          <button onClick={onOpenTelegram} className="px-4 py-2 rounded-xl font-medium" style={primaryBtnStyle} disabled={creating || !link}>
            {STRINGS[getLang()].openInTelegram}
          </button>
        </div>
      </div>
    </div>
  )
}
