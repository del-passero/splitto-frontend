// src/components/transactions/ReceiptPreviewModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Предпросмотр чека:
 *  • Картинка — показываем <img> (object-fit: contain).
 *  • PDF с сервера — iframe с /pdfjs/web/viewer.html?file=<url-encoded>.
 *  • Локальный несохранённый PDF — читаем File в data:URL и только затем отдаём viewer'у.
 */
type Props = {
  open: boolean;
  onClose: () => void;

  /** URL того, что показываем (из стейджера: displayUrl / serverUrl) */
  url?: string | null; // мягче к вызовам, где могут передать undefined

  /** Признак PDF для отображения */
  isPdf: boolean;

  /** Локальный файл, если пользователь только что прикрепил (нужен для локального PDF) */
  localFile?: File | null;

  /** ALT для картинок (не обязателен) */
  alt?: string;
};

export default function ReceiptPreviewModal({
  open,
  onClose,
  url = null,
  isPdf,
  localFile,
  alt = "",
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Лочим скролл body при открытии
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC закрывает
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Локальный PDF -> data:URL (pdf.js не умеет открывать blob: из другого окна)
  useEffect(() => {
    setDataUrl(null);
    if (!open || !isPdf || !localFile) return;
    const fr = new FileReader();
    fr.onload = () => setDataUrl(String(fr.result || ""));
    fr.readAsDataURL(localFile);
    return () => {
      try { fr.abort(); } catch {}
    };
  }, [open, isPdf, localFile]);

  // Если прилетел относительный URL, pdf.js все равно откроет (один и тот же origin).
  const encodedTarget = useMemo(() => {
    if (!isPdf) return "";
    if (localFile) return encodeURIComponent(dataUrl || "");
    return encodeURIComponent(url || "");
  }, [isPdf, localFile, dataUrl, url]);

  const viewerSrc = isPdf ? `/pdfjs/web/viewer.html?file=${encodedTarget}` : "";

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Закрыть"
      >
        <X />
      </button>

      {/* Контент */}
      {!isPdf ? (
        url ? (
          <img
            src={url}
            alt={alt}
            style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain", display: "block" }}
            draggable={false}
          />
        ) : null
      ) : (
        // Если локальный PDF — ждём dataUrl, потом рендерим viewer
        localFile && !dataUrl ? (
          <div className="text-white opacity-80 text-sm">Загрузка PDF…</div>
        ) : (
          <iframe
            title="PDF"
            src={viewerSrc}
            style={{ width: "100vw", height: "100vh", border: 0, background: "black" }}
            allow="clipboard-write"
          />
        )
      )}
    </div>
  );
}
