// src/components/group/EditGroupModal.tsx
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import CardSection from "../CardSection"
import { X, Save, Loader2, ImagePlus, Trash2 } from "lucide-react"
import {
  patchGroupInfo,
  getGroupDetails,
  setGroupAvatarByUrl,
} from "../../api/groupsApi"
import GroupAvatar from "../GroupAvatar"

// ===== API & Upload endpoints (как в CreateGroupModal) =====
const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  "https://splitto-backend-prod-ugraf.amvera.io/api"
const UPLOAD_ENDPOINT: string =
  (import.meta.env.VITE_UPLOAD_URL as string) ||
  `${API_URL}/upload/image`

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

// ===== Настройки компрессии =====
const MAX_DIM = 1024
const JPEG_QUALITY = 0.82
const SIZE_SKIP_BYTES = 500 * 1024

async function blobToFile(blob: Blob, fileName: string): Promise<File> {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() })
}
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}
function drawOnCanvas(img: HTMLImageElement, maxDim: number, fillWhiteBackground = true): HTMLCanvasElement {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const ratio = w > h ? maxDim / w : maxDim / h
  const scale = Math.min(1, ratio || 1)
  const outW = Math.max(1, Math.round(w * scale))
  const outH = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")!
  if (fillWhiteBackground) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, outW, outH) }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, outW, outH)
  return canvas
}
async function compressImage(original: File, opts?: { maxDim?: number; quality?: number }): Promise<File> {
  try {
    if (original.size <= SIZE_SKIP_BYTES) return original
    const maxDim = opts?.maxDim ?? MAX_DIM
    const quality = opts?.quality ?? JPEG_QUALITY

    const dataUrl = await readAsDataURL(original)
    const img = document.createElement("img")
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl })

    const maxSide = Math.max(img.naturalWidth || 0, img.naturalHeight || 0)
    if (maxSide && maxSide <= maxDim && original.size <= 1024 * 1024) return original

    const canvas = drawOnCanvas(img, maxDim, true)
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("TO_BLOB_FAILED"))), "image/jpeg", quality)
    )
    if (blob.size >= original.size) return original
    const base = original.name.replace(/\.[^.]+$/u, "")
    return await blobToFile(blob, `${base}.jpg`)
  } catch { return original }
}

async function uploadImageAndGetUrl(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    body: form,
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })

  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `Upload failed: HTTP ${res.status}`)
  }

  const data = await res.json().catch(() => ({}))
  const url: string | undefined =
    data?.url || data?.URL || data?.Location || data?.location || data?.publicUrl || data?.public_url

  if (!url || typeof url !== "string") throw new Error("UPLOAD_NO_URL_IN_RESPONSE")
  return url
}

async function deleteAvatarOnServer(groupId: number): Promise<void> {
  const res = await fetch(`${API_URL}/groups/${groupId}/avatar`, {
    method: "DELETE",
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })
  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `Delete failed: HTTP ${res.status}`)
  }
}

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

  // avatar state
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null) // что сейчас на сервере
  const [stagedAvatarUrl, setStagedAvatarUrl] = useState<string | null>(null)   // что хотим сохранить (URL из upload)
  const [stagedPreview, setStagedPreview] = useState<string | null>(null)       // локальный blob: превью
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarRemoveMarked, setAvatarRemoveMarked] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initialName || "")
    setDesc(initialDescription || "")
    setError(null)
    setSaving(false)
    setAvatarError(null)
    setStagedPreview(null)
    setStagedAvatarUrl(null)
    setAvatarRemoveMarked(false)
    if (fileInputRef.current) fileInputRef.current.value = ""

    // загрузим текущие детали группы, чтобы получить url аватара
    ;(async () => {
      try {
        const g = await getGroupDetails(groupId)
        const av = (g as any).avatar_url || (g as any).avatarUrl || (g as any).avatar || null
        setCurrentAvatarUrl(typeof av === "string" && av.trim() ? av : null)
      } catch {
        // мягко игнорируем; редактирование имени/описания не зависит
      }
    })()

    // автофокус
    setTimeout(() => firstRef.current?.focus(), 60)
  }, [open, initialName, initialDescription, groupId])

  useEffect(() => {
    return () => {
      if (stagedPreview?.startsWith("blob:")) {
        try { URL.revokeObjectURL(stagedPreview) } catch {}
      }
    }
  }, [stagedPreview])

  if (!open) return null

  const nameLeft = Math.max(0, NAME_MAX - name.length)
  const descLeft = Math.max(0, DESC_MAX - desc.length)

  function onPickAvatarClick() {
    setAvatarError(null)
    fileInputRef.current?.click()
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file, { maxDim: MAX_DIM, quality: JPEG_QUALITY })
      const previewUrl = URL.createObjectURL(compressed)
      if (stagedPreview?.startsWith("blob:")) {
        try { URL.revokeObjectURL(stagedPreview) } catch {}
      }
      setStagedPreview(previewUrl)

      // заливаем на сторадж, но на саму группу не применяем до "Сохранить"
      const url = await uploadImageAndGetUrl(compressed)
      setStagedAvatarUrl(url)
      setAvatarRemoveMarked(false) // выбрали новое фото — значит не удаляем
    } catch (err: any) {
      setStagedAvatarUrl(null)
      setAvatarError((t("errors.upload_failed") as string) || err?.message || "Не удалось загрузить изображение")
    } finally {
      setAvatarUploading(false)
    }
  }

  function markAvatarRemove() {
    setAvatarError(null)
    setAvatarRemoveMarked(true)
    setStagedAvatarUrl(null)
    if (stagedPreview?.startsWith("blob:")) {
      try { URL.revokeObjectURL(stagedPreview) } catch {}
    }
    setStagedPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    if (!name.trim()) {
      setError(t("errors.group_name_required") as string)
      return
    }
    if (avatarUploading) {
      setError((t("group_form.avatar_still_uploading") as string) || "Дождитесь окончания загрузки аватара")
      return
    }

    try {
      setSaving(true)
      setError(null)

      // 1) имя/описание
      await patchGroupInfo(groupId, { name: name.trim(), description: desc.trim() || null })

      // 2) аватар
      if (avatarRemoveMarked && currentAvatarUrl) {
        await deleteAvatarOnServer(groupId)
        setCurrentAvatarUrl(null)
      } else if (stagedAvatarUrl && stagedAvatarUrl !== currentAvatarUrl) {
        // setGroupAvatarByUrl теперь сам делает абсолютный URL — 422 больше не будет
        await setGroupAvatarByUrl(groupId, stagedAvatarUrl)
        setCurrentAvatarUrl(stagedAvatarUrl)
      }

      // 3) дочитаем актуалку (для onSaved)
      const g = await getGroupDetails(groupId)
      onSaved?.({ name: g.name, description: g.description ?? null })

      onClose()
    } catch (e: any) {
      setError(e?.message || (t("error_edit_group") as string))
    } finally {
      setSaving(false)
    }
  }

  const previewSrc =
    stagedPreview || // локальный blob выбранного файла
    stagedAvatarUrl || // если вдруг хотим показать уже загруженный URL (без blob)
    currentAvatarUrl || // текущий с сервера
    undefined

  const hasAnyAvatar =
    !!previewSrc || !!currentAvatarUrl

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
            {/* Аватар */}
            <CardSection className="py-3">
              <div className="w-full flex flex-col items-center gap-3">
                <GroupAvatar name={name || "G"} src={previewSrc} size={80} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPickAvatarClick}
                    className="px-3 py-2 rounded-xl font-semibold text-sm
                               bg-[var(--tg-accent-color,#40A7E3)] text-white
                               hover:opacity-95 active:scale-95 transition
                               disabled:opacity-60 disabled:pointer-events-none
                               inline-flex items-center gap-2"
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {avatarUploading
                      ? ((t("uploading") as string) || "Загрузка...")
                      : ((hasAnyAvatar ? (t("group_form.change_image") as string) : (t("group_form.upload_image") as string)) || (hasAnyAvatar ? "Изменить фото" : "Загрузить фото"))
                    }
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelected}
                  />

                  {hasAnyAvatar && (
                    <button
                      type="button"
                      onClick={markAvatarRemove}
                      className="px-3 py-2 rounded-xl font-semibold text-sm
                                 bg-transparent text-red-500 border border-red-500/40
                                 hover:bg-red-500/10 active:scale-95 transition
                                 inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {(t("group_form.remove_image") as string) || "Удалить фото"}
                    </button>
                  )}
                </div>

                {avatarError && (
                  <div className="text-[12px] text-red-500 text-center px-4">{avatarError}</div>
                )}
                {!avatarError && (stagedAvatarUrl || avatarRemoveMarked) && (
                  <div className="text-[12px] text-[var(--tg-hint-color)] text-center">
                    {avatarRemoveMarked
                      ? ((t("group_form.avatar_marked_for_delete") as string) || "Фото будет удалено при сохранении")
                      : ((t("group_form.avatar_uploaded") as string) || "Изображение загружено — не забудьте сохранить")}
                  </div>
                )}
              </div>
            </CardSection>

            {/* Имя/описание */}
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
                  {t("group_form.name_hint_remaining", { n: Math.max(0, NAME_MAX - name.length), max: NAME_MAX })}
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
                  {t("group_form.desc_hint_remaining", { n: Math.max(0, DESC_MAX - desc.length), max: DESC_MAX })}
                </div>
              </div>

              {error && (
                <div className="px-1 mt-2 text-[12px] text-red-500">{error}</div>
              )}
            </CardSection>

            {/* Кнопки */}
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
                disabled={saving || avatarUploading}
                className="w-1/2 h-11 rounded-xl font-semibold
                           text-white
                           bg-[var(--tg-accent-color,#40A7E3)]
                           hover:bg-[color:var(--tg-accent-color,#40A7E3)]/90
                           active:scale-95 transition disabled:opacity-60
                           shadow-[0_6px_20px_-10px_rgba(0,0,0,.5)]
                           border border-[var(--tg-hint-color)]/20
                           flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
