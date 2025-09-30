// src/hooks/useReceiptStager.ts
import { useEffect, useMemo, useState } from "react"
import { compressImage } from "../utils/image"

/** Опции хука (поддерживаем разные имена полей из бэка) */
export type UseReceiptStagerOptions = {
  /** URL файла чека на сервере */
  initialServerUrl?: string | null
  /** URL превью на сервере (например, картинка для pdf) */
  initialServerPreviewUrl?: string | null

  /** Алиасы для обратной совместимости */
  initialUrl?: string | null
  initialPreviewUrl?: string | null

  /** Произвольные данные — разбираем preview_url/is_pdf, если прилетит */
  initialData?: any | null
}

/** Возвращаемый тип */
export type UseReceiptStagerReturn = {
  // что показывать
  displayUrl: string | null
  displayIsPdf: boolean

  // локально выбранный файл
  stagedFile: File | null
  setStagedFile: (f: File | null) => void
  stagedPreview: string | null
  stagedIsPdf: boolean

  // серверные url
  serverUrl: string | null
  setServerUrl: (s: string | null) => void
  serverPreviewUrl: string | null
  setServerPreviewUrl: (s: string | null) => void

  // допданные
  data: any | null
  setData: (d: any | null) => void

  // логика удаления существующего чека
  removeMarked: boolean
  markDeleted: () => void
  unmarkDeleted: () => void

  // утилиты
  clearAll: () => void
  busy: boolean
  error: string | null

  // ===== алиасы для старого кода (обратная совместимость) =====
  file: File | null
  setFile: (f: File | null) => void
  existingUrl: string | null
  previewUrl: string | null
  clear: () => void
  deleted: boolean
}

// Параметры сжатия «как у аватаров»
const RECEIPT_MAX_DIM = 1024
const RECEIPT_QUALITY = 0.82
const RECEIPT_TARGET_BYTES = 600 * 1024 // целевой размер ~600 KB
const SIZE_SKIP_BYTES = 500 * 1024 // если файл уже <500 KB — можно не сжимать

function isPdfFile(file: File | null): boolean {
  if (!file) return false
  const t = (file.type || "").toLowerCase()
  return t === "application/pdf" || /\.pdf($|\?)/i.test(file.name || "")
}

function isImageFile(file: File | null): boolean {
  if (!file) return false
  const t = (file.type || "").toLowerCase()
  return t.startsWith("image/")
}

export function useReceiptStager(opts?: UseReceiptStagerOptions): UseReceiptStagerReturn {
  // разруливаем входные поля
  const initialServerUrl = opts?.initialServerUrl ?? opts?.initialUrl ?? null

  // из initialData пробуем достать превью и признак pdf
  const dataPreviewFromData =
    opts?.initialData?.preview_url ??
    opts?.initialData?.preview ??
    null

  const initialServerPreviewUrl =
    opts?.initialServerPreviewUrl ??
    opts?.initialPreviewUrl ??
    dataPreviewFromData ??
    null

  const [serverUrl, setServerUrl] = useState<string | null>(initialServerUrl)
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(initialServerPreviewUrl)

  const [stagedFile, _setStagedFile] = useState<File | null>(null)
  const [stagedPreview, setStagedPreview] = useState<string | null>(null)
  const [stagedIsPdf, setStagedIsPdf] = useState<boolean>(false)

  const [data, setData] = useState<any | null>(opts?.initialData ?? null)

  const [removeMarked, setRemoveMarked] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // аккуратно перевыставляем превью при локальном файле
  useEffect(() => {
    if (!stagedFile) {
      if (stagedPreview?.startsWith("blob:")) {
        try { URL.revokeObjectURL(stagedPreview) } catch {}
      }
      setStagedPreview(null)
      setStagedIsPdf(false)
      return
    }
    const isPdf = isPdfFile(stagedFile)
    setStagedIsPdf(isPdf)
    const url = URL.createObjectURL(stagedFile)
    setStagedPreview(url)
    return () => {
      try { URL.revokeObjectURL(url) } catch {}
    }
  }, [stagedFile])

  // что показывать в карточке:
  // 1) если выбран локальный файл — его превью
  // 2) иначе серверное превью (если есть)
  // 3) иначе оригинальный серверный файл
  const displayUrl = useMemo(
    () => stagedPreview ?? serverPreviewUrl ?? serverUrl,
    [stagedPreview, serverPreviewUrl, serverUrl]
  )

  // pdf считаем так:
  // - если локальный файл — по его типу
  // - если серверное превью есть — это почти всегда картинка => не pdf
  // - иначе:
  //    а) если бэк прислал явный флаг is_pdf — по нему
  //    б) либо смотрим на расширение оригинального serverUrl
  const displayIsPdf = useMemo(() => {
    if (stagedPreview) return stagedIsPdf
    if (serverPreviewUrl) {
      if (data && typeof data.is_pdf === "boolean") return !!data.is_pdf
      return false
    }
    if (data && typeof data.is_pdf === "boolean") return !!data.is_pdf
    return /\.pdf($|\?)/i.test(serverUrl ?? "")
  }, [stagedPreview, stagedIsPdf, serverPreviewUrl, serverUrl, data])

  // Полная очистка локального выбора
  const clearAll = () => {
    setError(null)
    setRemoveMarked(false)
    _setStagedFile(null)
    if (stagedPreview?.startsWith("blob:")) {
      try { URL.revokeObjectURL(stagedPreview) } catch {}
    }
    setStagedPreview(null)
    setStagedIsPdf(false)
  }

  // Маркировка удаления
  const markDeleted = () => {
    setError(null)
    setRemoveMarked(true)
    // локально выбранный файл теряем — аналогично аватару
    _setStagedFile(null)
    if (stagedPreview?.startsWith("blob:")) {
      try { URL.revokeObjectURL(stagedPreview) } catch {}
    }
    setStagedPreview(null)
    setStagedIsPdf(false)
  }
  const unmarkDeleted = () => setRemoveMarked(false)

  // Обёртка над сеттером со сжатием «как у аватаров»
  const setStagedFile = (f: File | null) => {
    setError(null)

    if (!f) {
      _setStagedFile(null)
      return
    }

    // Если выбираем новый файл — снять отметку «удалить»
    setRemoveMarked(false)

    // PDF не трогаем
    if (isPdfFile(f)) {
      _setStagedFile(f)
      return
    }

    // Если это не изображение — просто прокинем как есть
    if (!isImageFile(f)) {
      _setStagedFile(f)
      return
    }

    // Изображение: попробуем сжать/сконвертировать
    setBusy(true)
    ;(async () => {
      try {
        const useOriginal = f.size <= SIZE_SKIP_BYTES
        const processed = useOriginal
          ? f
          : await compressImage(f, {
              maxSide: RECEIPT_MAX_DIM,
              quality: RECEIPT_QUALITY,
              mime: "image/jpeg",
              targetBytes: RECEIPT_TARGET_BYTES,
            })

        _setStagedFile(processed || f)
      } catch {
        // Без ошибок локализации — просто используем оригинал
        _setStagedFile(f)
      } finally {
        setBusy(false)
      }
    })()
  }

  return {
    displayUrl,
    displayIsPdf,

    stagedFile,
    setStagedFile,
    stagedPreview,
    stagedIsPdf,

    serverUrl,
    setServerUrl,
    serverPreviewUrl,
    setServerPreviewUrl,

    data,
    setData,

    removeMarked,
    markDeleted,
    unmarkDeleted,

    clearAll,

    busy,
    error,

    // алиасы для обратной совместимости
    file: null as any,           // заменим геттером ниже
    setFile: null as any,
    existingUrl: null as any,
    previewUrl: null as any,
    clear: null as any,
    deleted: null as any,
  } as any
}

// удобный «дефолтный экспорт» с алиасами-геттерами
export default function createReceiptStager(opts?: UseReceiptStagerOptions) {
  const s = useReceiptStager(opts) as any

  Object.defineProperties(s, {
    file: {
      get() {
        return s.stagedFile
      },
      set(v: File | null) {
        s.setStagedFile(v)
      },
    },
    setFile: {
      get() {
        return s.setStagedFile
      },
    },
    existingUrl: {
      get() {
        return s.serverUrl
      },
      set(v: string | null) {
        s.setServerUrl(v)
      },
    },
    previewUrl: {
      get() {
        // для обратной совместимости: отдаём локальное превью, а если его нет — серверное
        return s.stagedPreview ?? s.serverPreviewUrl
      },
    },
    clear: {
      get() {
        return s.clearAll
      },
    },
    deleted: {
      get() {
        return s.removeMarked
      },
    },
  })

  return s as UseReceiptStagerReturn & {
    file: File | null
    setFile: (f: File | null) => void
    existingUrl: string | null
    previewUrl: string | null
    clear: () => void
    deleted: boolean
  }
}
