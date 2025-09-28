// src/hooks/useReceiptStager.ts
import { useEffect, useMemo, useState } from "react";

/** Опции хука (поддерживаем разные имена полей из бэка) */
export type UseReceiptStagerOptions = {
  /** URL файла чека на сервере */
  initialServerUrl?: string | null;
  /** URL превью на сервере (например, картинка для pdf) */
  initialServerPreviewUrl?: string | null;

  /** Алиасы для обратной совместимости */
  initialUrl?: string | null;
  initialPreviewUrl?: string | null;

  /** Произвольные данные — разбираем preview_url/is_pdf, если прилетит */
  initialData?: any | null;
};

export type UseReceiptStagerReturn = {
  // что показывать в мини-превью (квадратик в форме)
  displayUrl: string | null;
  displayIsPdf: boolean;

  // что открывать в модалке предпросмотра (предпочтительно PDF)
  viewerUrl: string | null;
  viewerIsPdf: boolean;

  // локально выбранный файл
  stagedFile: File | null;
  setStagedFile: (f: File | null) => void;
  stagedPreview: string | null;
  stagedIsPdf: boolean;

  // серверные url
  serverUrl: string | null;
  setServerUrl: (s: string | null) => void;
  serverPreviewUrl: string | null;
  setServerPreviewUrl: (s: string | null) => void;

  // допданные
  data: any | null;
  setData: (d: any | null) => void;

  // логика удаления существующего чека
  removeMarked: boolean;
  markDeleted: () => void;
  unmarkDeleted: () => void;

  // утилиты
  clearAll: () => void;
  busy: boolean;
  error: string | null;

  // ===== алиасы для старого кода (обратная совместимость) =====
  file: File | null;
  setFile: (f: File | null) => void;
  existingUrl: string | null;
  previewUrl: string | null;
  clear: () => void;
  deleted: boolean;
};

export function useReceiptStager(opts?: UseReceiptStagerOptions): UseReceiptStagerReturn {
  // разруливаем входные поля
  const initialServerUrl =
    opts?.initialServerUrl ?? opts?.initialUrl ?? null;

  // из initialData пробуем достать превью и признак pdf
  const dataPreviewFromData =
    opts?.initialData?.preview_url ??
    opts?.initialData?.preview ??
    null;

  const initialServerPreviewUrl =
    opts?.initialServerPreviewUrl ??
    opts?.initialPreviewUrl ??
    dataPreviewFromData ??
    null;

  const [serverUrl, setServerUrl] = useState<string | null>(initialServerUrl);
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(
    initialServerPreviewUrl
  );

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [stagedIsPdf, setStagedIsPdf] = useState<boolean>(false);

  const [data, setData] = useState<any | null>(opts?.initialData ?? null);

  const [removeMarked, setRemoveMarked] = useState(false);

  // превью для локального файла
  useEffect(() => {
    if (!stagedFile) {
      setStagedPreview(null);
      setStagedIsPdf(false);
      return;
    }
    const isPdf =
      stagedFile.type === "application/pdf" || /\.pdf$/i.test(stagedFile.name);
    setStagedIsPdf(isPdf);
    const url = URL.createObjectURL(stagedFile);
    setStagedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedFile]);

  // что показывать в карточке:
  // 1) если выбран локальный файл — его превью
  // 2) иначе серверное превью (если есть)
  // 3) иначе оригинальный серверный файл
  const displayUrl = useMemo(
    () => stagedPreview ?? serverPreviewUrl ?? serverUrl,
    [stagedPreview, serverPreviewUrl, serverUrl]
  );

  // pdf в мини-превью считаем так:
  // - если локальный файл — по его типу
  // - если серверное превью есть — это почти всегда картинка => не pdf
  // - иначе смотрим на оригинальный серверный url по расширению
  const displayIsPdf = useMemo(() => {
    if (stagedPreview) return stagedIsPdf;
    if (serverPreviewUrl) return false;
    return /\.pdf($|\?)/i.test(serverUrl ?? "");
  }, [stagedPreview, stagedIsPdf, serverPreviewUrl, serverUrl]);

  // === новое: что отдавать в модалку предпросмотра ===
  const originalIsPdf = useMemo(
    () => /\.pdf($|\?)/i.test(serverUrl ?? ""),
    [serverUrl]
  );

  // Для viewerUrl приоритет:
  // 1) локальный файл (если выбран)
  // 2) оригинальный PDF (если есть) — хотим открыть именно PDF, а не превью
  // 3) серверное превью (картинка) или оригинальный файл
  const viewerUrl = useMemo(() => {
    if (stagedPreview) return stagedPreview;
    if (originalIsPdf && serverUrl) return serverUrl;
    return serverPreviewUrl ?? serverUrl;
  }, [stagedPreview, originalIsPdf, serverUrl, serverPreviewUrl]);

  const viewerIsPdf = useMemo(() => {
    if (stagedPreview) return stagedIsPdf;
    return originalIsPdf;
  }, [stagedPreview, stagedIsPdf, originalIsPdf]);

  const clearAll = () => {
    setStagedFile(null);
    setStagedPreview(null);
  };

  const markDeleted = () => setRemoveMarked(true);
  const unmarkDeleted = () => setRemoveMarked(false);

  return {
    displayUrl,
    displayIsPdf,

    viewerUrl,
    viewerIsPdf,

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

    busy: false,
    error: null,

    // алиасы
    file: null as any, // заменим геттером ниже
    setFile: null as any,
    existingUrl: null as any,
    previewUrl: null as any,
    clear: null as any,
    deleted: null as any,
  } as any;
}

// удобный «дефолтный экспорт» с алиасами-геттерами
export default function createReceiptStager(opts?: UseReceiptStagerOptions) {
  const s = useReceiptStager(opts) as any;

  Object.defineProperties(s, {
    file: {
      get() {
        return s.stagedFile;
      },
      set(v: File | null) {
        s.setStagedFile(v);
      },
    },
    setFile: {
      get() {
        return s.setStagedFile;
      },
    },
    existingUrl: {
      get() {
        return s.serverUrl;
      },
      set(v: string | null) {
        s.setServerUrl(v);
      },
    },
    previewUrl: {
      get() {
        // для обратной совместимости: отдаём локальное превью, а если его нет — серверное
        return s.stagedPreview ?? s.serverPreviewUrl;
      },
    },
    clear: {
      get() {
        return s.clearAll;
      },
    },
    deleted: {
      get() {
        return s.removeMarked;
      },
    },
  });

  return s as UseReceiptStagerReturn & {
    file: File | null;
    setFile: (f: File | null) => void;
    existingUrl: string | null;
    previewUrl: string | null;
    clear: () => void;
    deleted: boolean;
  };
}
