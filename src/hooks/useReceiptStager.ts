// src/hooks/useReceiptStager.ts
import { useEffect, useMemo, useState } from "react";

/** Опции хука (с поддержкой обоих имён поля URL) */
export type UseReceiptStagerOptions = {
  /** Начальный URL чека, уже лежащего на сервере (новое «каноничное» имя) */
  initialServerUrl?: string | null;
  /** Алиас для обратной совместимости со старым кодом */
  initialUrl?: string | null;
  /** Начальные произвольные данные чека — для совместимости со старым кодом */
  initialData?: any | null;
};

/**
 * Единый «стейджер» для вложения чека с обратной совместимостью полей:
 * - stagedFile / setStagedFile и алиасы file / setFile
 * - stagedPreview и алиас previewUrl
 * - serverUrl и алиас existingUrl
 * - removeMarked и алиас deleted
 * - clearAll и алиас clear
 */
export function useReceiptStager(opts?: UseReceiptStagerOptions) {
  // серверный URL уже загруженного чека (поддерживаем оба имени поля)
  const initialServer = opts?.initialServerUrl ?? opts?.initialUrl ?? null;
  const [serverUrl, setServerUrl] = useState<string | null>(initialServer);

  // локально выбранный, ещё не загруженный файл
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [stagedIsPdf, setStagedIsPdf] = useState<boolean>(false);

  // произвольные данные чека (если где-то в коде нужно)
  const [data, setData] = useState<any | null>(opts?.initialData ?? null);

  // пометка «удалить серверный чек»
  const [removeMarked, setRemoveMarked] = useState<boolean>(false);

  // превью для локально выбранного файла
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

  // что отображать в UI
  const displayUrl = useMemo(
    () => stagedPreview ?? serverUrl,
    [stagedPreview, serverUrl]
  );
  const displayIsPdf = useMemo(
    () => (stagedPreview ? stagedIsPdf : /\.pdf($|\?)/i.test(serverUrl ?? "")),
    [stagedPreview, stagedIsPdf, serverUrl]
  );

  const clearAll = () => {
    setStagedFile(null);
    setStagedPreview(null);
    // serverUrl не трогаем — это делает mark/unmark или внешняя логика
  };

  const markDeleted = () => setRemoveMarked(true);
  const unmarkDeleted = () => setRemoveMarked(false);

  return {
    // текущее «что показывать»
    displayUrl,
    displayIsPdf,

    // серверный объект
    serverUrl,
    setServerUrl,

    // локальный staged
    stagedFile,
    setStagedFile,
    stagedPreview,
    stagedIsPdf,

    // произвольные данные
    data,
    setData,

    // удаление существующего чека
    removeMarked,
    markDeleted,
    unmarkDeleted,

    // утилиты
    clearAll,

    // для UI
    busy: false as boolean,
    error: null as string | null,

    /* ===== Алиасы для старого кода (обратная совместимость) ===== */
    // file/preview/existing
    file: null as any, // геттер ниже
    previewUrl: null as any,
    existingUrl: null as any,
    // clear / deleted
    clear: null as any,
    deleted: null as any,
    // setFile
    setFile: null as any,
  } as any;
}

// Экспорт по умолчанию оставляю — вдруг где-то он используется.
// Переопределим алиасы геттерами/сеттерами, чтобы не терять типы при деструктуризации.
export default function createReceiptStager(opts?: UseReceiptStagerOptions) {
  const stager = useReceiptStager(opts) as any;

  Object.defineProperties(stager, {
    file: {
      get() {
        return stager.stagedFile;
      },
      set(v: File | null) {
        stager.setStagedFile(v);
      },
    },
    previewUrl: {
      get() {
        return stager.stagedPreview;
      },
    },
    existingUrl: {
      get() {
        return stager.serverUrl;
      },
      set(v: string | null) {
        stager.setServerUrl(v);
      },
    },
    clear: {
      get() {
        return stager.clearAll;
      },
    },
    deleted: {
      get() {
        return stager.removeMarked;
      },
    },
    setFile: {
      get() {
        return stager.setStagedFile;
      },
    },
  });

  return stager as ReturnType<typeof useReceiptStager> & {
    file: File | null;
    previewUrl: string | null;
    existingUrl: string | null;
    clear: () => void;
    deleted: boolean;
    setFile: (f: File | null) => void;
  };
}

export type UseReceiptStagerReturn = ReturnType<typeof useReceiptStager>;
