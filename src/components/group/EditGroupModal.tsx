// src//components/group/EditGroupModal.tsx
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { X, Save } from "lucide-react"
import { patchGroupInfo, getGroupDetails } from "../../api/groupsApi"

type Props = {
  open: boolean
  onClose: () => void
  groupId: number
  initialName: string
  initialDescription?: string
  onSaved?: (g: { name: string; description?: string | null }) => void
}

const NAME_MAX = 64
const DESC_MAX = 160

export default function EditGroupModal({
  open, onClose, groupId, initialName, initialDescription, onSaved
}: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName || "")
  const [desc, setDesc] = useState(initialDescription || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initialName || "")
    setDesc(initialDescription || "")
    setError(null)
    setSaving(false)
    // автофокус на инпут имени
    setTimeout(() => firstRef.current?.focus(), 50)
  }, [open, initialName, initialDescription])

  if (!open) return null

  async function handleSave() {
    if (!name.trim()) {
      setError(t("errors.group_name_required") as string)
      return
    }
    try {
      setSaving(true)
      setError(null)
      await patchGroupInfo(groupId, { name: name.trim(), description: desc.trim() || null })
      // перезагрузим, чтобы отдать актуалку наверх (или просто вернём локально)
      const g = await getGroupDetails(groupId)
      onSaved?.({ name: g.name, description: g.description ?? null })
    } catch (e: any) {
      setError(e?.message || (t("error_edit_group") as string))
    } finally {
      setSaving(false)
    }
  }

  const nameLeft = Math.max(0, NAME_MAX - name.length)
  const descLeft = Math.max(0, DESC_MAX - desc.length)

  return (
    <div className="fixed inset-0 z-[1300] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto overflow-x-hidden bg-[var(--tg-card-bg,#111)]">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-[var(--tg-card-bg)] border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
            <div className="text-[17px] font-bold text-[var(--tg-text-color)]">
              {t("edit_group")}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--tg-accent-color)]/10 transition"
              aria-label={t("close")}
            >
              <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 flex flex-col gap-2">
            <CardSection className="py-2">
              <div className="px-1">
                <label className="block text-[12px] font-medium opacity-80 mb-1">{t("group_form.name_placeholder")}</label>
                <input
                  ref={firstRef}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                  className="w-full h-10 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                  placeholder={t("group_name_placeholder")}
                />
                <div className="text-[12px] mt-1 text-[var(--tg-hint-color)]">
                  {t("group_form.name_hint_remaining", { n: nameLeft, max: NAME_MAX })}
                </div>
              </div>

              <div className="px-1 mt-3">
                <label className="block text-[12px] font-medium opacity-80 mb-1">{t("group_form.description_placeholder")}</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value.slice(0, DESC_MAX))}
                  className="w-full min-h-[90px] rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--tg-accent-color)]"
                  placeholder={t("group_description_placeholder")}
                />
                <div className="text-[12px] mt-1 text-[var(--tg-hint-color)]">
                  {t("group_form.desc_hint_remaining", { n: descLeft, max: DESC_MAX })}
                </div>
              </div>

              {error && (
                <div className="px-1 mt-2 text-[12px] text-red-500">{error}</div>
              )}
            </CardSection>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 h-11 rounded-xl font-semibold
                           text-black
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           hover:bg-[color:var(--tg-theme-button-color,#40A7E3)]/10
                           active:scale-95 transition
                           border border-[var(--tg-hint-color)]/30"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-1/2 h-11 rounded-xl font-semibold
                           text-white
                           bg-[var(--tg-accent-color,#40A7E3)]
                           hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                           active:scale-95 transition disabled:opacity-60
                           shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                           border border-[var(--tg-hint-color)]/20
                           flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
