// src/components/CreateGroupModal.tsx
import { useState, useEffect, useRef } from "react"
import { X, Loader2, CircleDollarSign, CalendarDays, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CurrencyPickerModal, { type CurrencyItem } from "./currency/CurrencyPickerModal"
import CardSection from "./CardSection"
import { createGroup, patchGroupCurrency, patchGroupSchedule, setGroupAvatarByUrl } from "../api/groupsApi"
import GroupAvatar from "./GroupAvatar"

// ===== API и upload endpoints (важно: одинаковая база с остальным API) =====
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

// ===== Настройки компрессии изображений =====
const MAX_DIM = 1024          // максимум по большей стороне
const JPEG_QUALITY = 0.82     // качество JPEG
const SIZE_SKIP_BYTES = 500 * 1024 // если файл уже <500 KB, можно не сжимать

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (group: { id: number; name: string; description: string }) => void
  ownerId: number
}

const NAME_MAX = 40
const DESC_MAX = 120

// ===== Утилиты компрессии =====
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

// ===== Загрузка на бэкенд и получение публичной ссылки =====
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

function Switch({
  checked, onChange, ariaLabel,
}: { checked: boolean; onChange: (v: boolean) => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors
        ${checked ? "bg-[var(--tg-theme-button-color,#40A7E3)]" : "bg-[var(--tg-secondary-bg-color,#e6e6e6)]"}`}
    >
      <span className={`absolute h-6 w-6 rounded-full bg-white shadow transform transition-transform
        ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  )
}

function Row({
  icon, label, value, right, onClick, isLast,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  right?: React.ReactNode
  onClick?: () => void
  isLast?: boolean
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center w-full py-4 bg-transparent focus:outline-none active:opacity-90"
        style={{ minHeight: 48 }}
      >
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>{icon}</span>
        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">{label}</span>
        {right ? (
          <span className="mr-4">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[16px] mr-2">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-4" size={20} />}
          </>
        )}
      </button>
      {!isLast && (
        <div className="absolute left-[50px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15 pointer-events-none" />
      )}
    </div>
  )
}

function formatDateYmdToDmy(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd
  const [y, m, d] = ymd.split("-")
  return `${d}.${m}.${y}`
}

const CreateGroupModal = ({ open, onClose, onCreated, ownerId }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [currencyModal, setCurrencyModal] = useState(false)
  const [currency, setCurrency] = useState<CurrencyItem | null>(null)

  const [isTrip, setIsTrip] = useState(false)
  const [endDate, setEndDate] = useState<string>("")
  const hiddenDateRef = useRef<HTMLInputElement | null>(null)

  // --- Аватар: превью/загрузка ---
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarRemoteUrl, setAvatarRemoteUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setName(""); setDesc(""); setError(null); setLoading(false)
      setIsTrip(false); setEndDate("")
      setAvatarPreview(null); setAvatarRemoteUrl(null); setAvatarUploading(false); setAvatarError(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        try { URL.revokeObjectURL(avatarPreview) } catch {}
      }
    }
  }, [avatarPreview])

  const onPickAvatarClick = () => fileInputRef.current?.click()

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file, { maxDim: MAX_DIM, quality: JPEG_QUALITY })
      const previewUrl = URL.createObjectURL(compressed)
      setAvatarPreview(previewUrl)

      try {
        const url = await uploadImageAndGetUrl(compressed)
        setAvatarRemoteUrl(url)
        setAvatarError(null)
      } catch (err: any) {
        setAvatarRemoteUrl(null)
        setAvatarError((t("errors.upload_failed") as string) || err?.message || "Не удалось загрузить изображение")
      }
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError(t("errors.group_name_required")); return }
    if (isTrip && !endDate) { setError(t("errors.group_trip_date_required")); return }
    if (avatarUploading) { setError((t("group_form.avatar_still_uploading") as string) || "Дождитесь окончания загрузки аватара"); return }

    setLoading(true)
    try {
      const group = await createGroup({ name: name.trim(), description: desc.trim(), owner_id: ownerId })

      const promises: Promise<any>[] = []
      const code = currency?.code || "USD"
      if (code !== "USD") promises.push(patchGroupCurrency(group.id, code))
      if (isTrip && endDate) promises.push(patchGroupSchedule(group.id, { end_date: endDate }))

      if (avatarRemoteUrl) {
        // setGroupAvatarByUrl теперь сам сделает абсолютный URL
        promises.push(setGroupAvatarByUrl(group.id, avatarRemoteUrl))
      }

      Promise.allSettled(promises).catch(() => {})

      onCreated?.(group)
      setName(""); setDesc("")
      navigate(`/groups/${group.id}`)
      onClose()
    } catch {
      setError(t("errors.create_group_failed"))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const onNameChange = (v: string) => setName(v.length > NAME_MAX ? v.slice(0, NAME_MAX) : v)
  const onDescChange = (v: string) => setDesc(v.length > DESC_MAX ? v.slice(0, DESC_MAX) : v)
  const nameLeft = Math.max(0, NAME_MAX - name.length)
  const descLeft = Math.max(0, DESC_MAX - desc.length)

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      <div className="w-full h-[100dvh] min-h-screen mx-0 my-0">
        <div className="relative w-full h-[100dvh] min-h-screen overflow-y-auto bg-[var(--tg-card-bg,#111)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-[var(--tg-accent-color)]/10 transition"
            aria-label={t("close")}
            tabIndex={0}
          >
            <X className="w-6 h-6 text-[var(--tg-hint-color)]" />
          </button>

          <form onSubmit={handleSubmit} className="p-4 pt-4 flex flex-col gap-1">
            <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1">
              {t("create_group")}
            </div>

            {/* Аватар */}
            <div className="w-full flex flex-col items-center gap-3 mb-2">
              <GroupAvatar name={name || "G"} src={avatarPreview || undefined} size={80} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPickAvatarClick}
                  className="px-3 py-2 rounded-xl font-semibold text-sm
                             bg-[var(--tg-accent-color,#40A7E3)] text-white
                             hover:opacity-95 active:scale-95 transition
                             disabled:opacity-60 disabled:pointer-events-none"
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {(t("uploading") as string) || "Загрузка..."}
                    </span>
                  ) : (
                    (t("group_form.upload_image") as string) || "Загрузить изображение"
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileSelected}
                />
              </div>
              {avatarError && (
                <div className="text-[12px] text-red-500 text-center px-4">{avatarError}</div>
              )}
              {!avatarError && avatarRemoteUrl && (
                <div className="text-[12px] text-[var(--tg-hint-color)] text-center">
                  {(t("group_form.avatar_uploaded") as string) || "Изображение загружено"}
                </div>
              )}
            </div>

            {/* Имя */}
            <div className="space-y-[4px]">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)]
                           border-[var(--tg-secondary-bg-color,#e7e7e7)]
                           text-[var(--tg-text-color)] placeholder:text-[var(--tg-hint-color)]
                           font-medium text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                maxLength={NAME_MAX}
                autoFocus
                placeholder={t("group_form.name_placeholder")}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                disabled={loading}
              />
              <div className={`text-[12px] ${nameLeft === 0 ? "text-red-500" : "text-[var(--tg-hint-color)]"}`}>
                {name.length === 0
                  ? t("group_form.name_hint_initial", { max: NAME_MAX })
                  : t("group_form.name_hint_remaining", { n: nameLeft })}
              </div>
            </div>

            {/* Описание */}
            <div className="grid gap-[4px]">
              <textarea
                className="w-full px-4 py-3 rounded-xl border bg-[var(--tg-bg-color,#fff)]
                           border-[var(--tg-secondary-bg-color,#e7e7e7)]
                           text-[var(--tg-text-color)] placeholder:text-[var(--tg-hint-color)]
                           font-normal text-base min-h-[64px] max-h-[160px] resize-none
                           focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                maxLength={DESC_MAX}
                placeholder={t("group_form.description_placeholder")}
                value={desc}
                onChange={(e) => onDescChange(e.target.value)}
                disabled={loading}
              />
              <div className={`text-[12px] ${descLeft === 0 ? "text-red-500" : "text-[var(--tg-hint-color)]"}`}>
                {desc.length === 0
                  ? t("group_form.desc_hint_initial", { max: DESC_MAX })
                  : t("group_form.desc_hint_remaining", { n: descLeft })}
              </div>
            </div>

            {/* Валюта / поездка */}
            <div className="-mx-4">
              <CardSection className="py-0">
                <Row
                  icon={<CircleDollarSign className="text-[var(--tg-link-color)]" size={22} />}
                  label={t("currency.main_currency")}
                  value={currency?.code || "USD"}
                  onClick={() => setCurrencyModal(true)}
                />
                <Row
                  icon={<CalendarDays className="text-[var(--tg-link-color)]" size={22} />}
                  label={t("group_form.is_trip")}
                  right={<Switch checked={isTrip} onChange={setIsTrip} ariaLabel={t("group_form.is_trip")} />}
                  onClick={() => setIsTrip((v) => !v)}
                  isLast
                />
                {isTrip && (
                  <div className="px-4 pt-2 pb-3">
                    <button
                      type="button"
                      className="w-full px-4 py-3 rounded-xl border text-left bg-[var(--tg-bg-color,#fff)]
                                 border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[var(--tg-text-color)]
                                 font-normal text-base focus:border-[var(--tg-accent-color)] focus:outline-none transition"
                      onClick={() => {
                        const el = hiddenDateRef.current
                        if (!el) return
                        // @ts-ignore
                        if (typeof el.showPicker === "function") el.showPicker()
                        else el.click()
                      }}
                    >
                      {endDate ? formatDateYmdToDmy(endDate) : t("group_form.trip_date_placeholder")}
                    </button>
                    <input
                      ref={hiddenDateRef}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                      tabIndex={-1}
                    />
                    <div className="text-[12px] text-[var(--tg-hint-color)] mt-[4px]">
                      {t("group_form.trip_date")}
                    </div>
                  </div>
                )}
              </CardSection>
            </div>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <div className="flex flex-row gap-2 mt-1 w-full">
              <button
                type="button"
                onClick={onClose}
                style={{ color: "#000" }}
                className="w-1/2 py-3 rounded-xl font-bold text-base
                           bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                           border border-[var(--tg-hint-color)]/30
                           hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="w-1/2 py-3 rounded-xl font-bold text-base
                           bg-[var(--tg-accent-color,#40A7E3)] text-white
                           flex items-center justify-center gap-2 active:scale-95
                           disabled:opacity-60 disabled:pointer-events-none transition"
                disabled={loading || avatarUploading}
              >
                {(loading || avatarUploading) && <Loader2 className="animate-spin w-5 h-5" />}
                {t("create_group")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CurrencyPickerModal
        open={currencyModal}
        onClose={() => setCurrencyModal(false)}
        selectedCode={currency?.code || "USD"}
        onSelect={(c: CurrencyItem) => setCurrency(c)}
      />
    </div>
  )
}

export default CreateGroupModal
