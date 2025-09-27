// src/components/CreateGroupModal.tsx
import { useState, useEffect, useRef } from "react"
import { X, Loader2, CircleDollarSign, CalendarDays, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import CurrencyPickerModal, { type CurrencyItem } from "./currency/CurrencyPickerModal"
import CardSection from "./CardSection"
import { createGroup, patchGroupCurrency, patchGroupSchedule, setGroupAvatarByUrl } from "../api/groupsApi"
import GroupAvatar from "./GroupAvatar"

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (group: { id: number; name: string; description: string }) => void
  ownerId: number
}

const NAME_MAX = 40
const DESC_MAX = 120

const UPLOAD_ENDPOINT: string | undefined = import.meta.env.VITE_UPLOAD_URL as string | undefined

async function uploadImageAndGetUrl(file: File): Promise<string> {
  if (!UPLOAD_ENDPOINT) {
    throw new Error("UPLOAD_ENDPOINT_NOT_CONFIGURED")
  }
  const form = new FormData()
  form.append("file", file)
  // при необходимости можно добавить доп. поля: папку, имя и т.п.
  const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: form })
  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `Upload failed: HTTP ${res.status}`)
  }
  // ожидаем JSON вида { url: "https://..."} или { Location: "https://..."}
  const data = await res.json().catch(() => ({}))
  const url: string | undefined =
    data?.url || data?.URL || data?.Location || data?.location || data?.publicUrl || data?.public_url
  if (!url || typeof url !== "string") {
    throw new Error("UPLOAD_NO_URL_IN_RESPONSE")
  }
  return url
}

function Switch({
  checked,
  onChange,
  ariaLabel,
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

/** Строка секции — edge-to-edge, divider как в CurrencyPickerModal */
function Row({
  icon,
  label,
  value,
  right,
  onClick,
  isLast,
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
        {/* слева выравниваем по инпутам (контейнер формы даёт p-4) */}
        <span className="ml-4 mr-3 flex items-center" style={{ width: 22 }}>
          {icon}
        </span>

        <span className="flex-1 text-left text-[var(--tg-text-color)] text-[16px]">{label}</span>

        {/* правая часть — к правому краю формы (p-4) */}
        {right ? (
          <span className="mr-4">{right}</span>
        ) : (
          <>
            {value && <span className="text-[var(--tg-link-color)] text-[16px] mr-2">{value}</span>}
            {onClick && <ChevronRight className="text-[var(--tg-hint-color)] mr-4" size={20} />}
          </>
        )}
      </button>

      {/* Divider как в модалке валют: НЕ под иконкой */}
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
      // сбрасываем состояние аватара
      setAvatarPreview(null)
      setAvatarRemoteUrl(null)
      setAvatarUploading(false)
      setAvatarError(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open])

  // освобождаем objectURL при смене/закрытии
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        try { URL.revokeObjectURL(avatarPreview) } catch {}
      }
    }
  }, [avatarPreview])

  const onPickAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return
    // превью сразу
    const objUrl = URL.createObjectURL(file)
    setAvatarPreview(objUrl)

    // если настроен эндпоинт загрузки — грузим прямо сейчас
    if (UPLOAD_ENDPOINT) {
      setAvatarUploading(true)
      try {
        const url = await uploadImageAndGetUrl(file)
        setAvatarRemoteUrl(url)
      } catch (err: any) {
        setAvatarError(
          (t("errors.upload_failed") as string) ||
          err?.message ||
          "Не удалось загрузить изображение"
        )
        setAvatarRemoteUrl(null)
      } finally {
        setAvatarUploading(false)
      }
    } else {
      // если загрузчик не настроен — дадим понятный хинт
      setAvatarError(
        (t("group_form.upload_hint_no_endpoint") as string) ||
        "Файл выбран. Чтобы загрузка работала, задайте VITE_UPLOAD_URL и перезапустите фронт."
      )
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

      // если есть загруженный (публичный) URL аватара — установим его
      if (avatarRemoteUrl) {
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

  // жёсткое ограничение по длине (обрезаем ввод)
  const onNameChange = (v: string) => setName(v.length > NAME_MAX ? v.slice(0, NAME_MAX) : v)
  const onDescChange = (v: string) => setDesc(v.length > DESC_MAX ? v.slice(0, DESC_MAX) : v)
  const nameLeft = Math.max(0, NAME_MAX - name.length)
  const descLeft = Math.max(0, DESC_MAX - desc.length)

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-[var(--tg-bg-color,#000)]/70">
      {/* full-screen контейнер с максимально стабильной высотой */}
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

          {/* Контейнер формы */}
          <form onSubmit={handleSubmit} className="p-4 pt-4 flex flex-col gap-1">
            <div className="text-lg font-bold text-[var(--tg-text-color)] mb-1">
              {t("create_group")}
            </div>

            {/* ====== НОВОЕ: Блок аватара сверху ====== */}
            <div className="w-full flex flex-col items-center gap-3 mb-2">
              <GroupAvatar
                name={name || "G"}
                src={avatarPreview || undefined}
                size={80}
              />
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
                {/* скрытый input для выбора файла */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileSelected}
                />
              </div>
              {/* тонкий хинт / ошибка под кнопкой */}
              {avatarError && (
                <div className="text-[12px] text-red-500 text-center px-4">
                  {avatarError}
                </div>
              )}
              {!avatarError && avatarRemoteUrl && (
                <div className="text-[12px] text-[var(--tg-hint-color)] text-center">
                  {(t("group_form.avatar_uploaded") as string) || "Изображение загружено"}
                </div>
              )}
              {!avatarError && !UPLOAD_ENDPOINT && avatarPreview && !avatarRemoteUrl && (
                <div className="text-[12px] text-[var(--tg-hint-color)] text-center px-4">
                  {(t("group_form.upload_hint_no_endpoint") as string)
                    || "Файл выбран как превью. Чтобы загрузить на хостинг и сохранить в группу, настрой VITE_UPLOAD_URL."}
                </div>
              )}
            </div>
            {/* ====== /НОВОЕ ====== */}

            {/* Имя + хинт (вплотную) */}
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

            {/* Описание + хинт: фиксированный зазор 4px как у Name */}
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

            {/* Один CardSection: валюта + тумблер + (при включении) поле даты */}
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
                  isLast  // divider под тумблером не рисуем
                />

                {/* Поле даты (при isTrip) */}
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

                    {/* скрытый input type="date" — чтобы showPicker()/click работал и дата сохранялась */}
                    <input
                      ref={hiddenDateRef}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="absolute opacity-0 pointer-events-none w-0 h-0"
                      tabIndex={-1}
                    />

                    {/* подпись под полем, как у хинтов: вплотную */}
                    <div className="text-[12px] text-[var(--tg-hint-color)] mt-[4px]">
                      {t("group_form.trip_date")}
                    </div>
                  </div>
                )}
              </CardSection>
            </div>

            {/* Ошибка */}
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            {/* Кнопки */}
            <div className="flex flex-row gap-2 mt-1 w-full">
              <button
                type="button"
                onClick={onClose}
                style={{ color: "#000" }} // чёрный текст
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

      {/* выбор валюты */}
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
