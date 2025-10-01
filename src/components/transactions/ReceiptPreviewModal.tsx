// src/components/transactions/ReceiptPreviewModal.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Cсылка на файл: может быть https://, blob:, data:; для PDF желательно абсолютный/blob URL */
  url?: string | null;
  /** Подсказываем модалке, что это PDF (для blob: часто невозможно определить по расширению) */
  isPdf?: boolean;
  /** Кастомный путь к pdf.js viewer, если он лежит не в /pdfjs/web/viewer.html */
  pdfViewerPath?: string; // по умолчанию "/pdfjs/web/viewer.html"
};

const PAD = 24; // поля вокруг контента внутри окна

export default function ReceiptPreviewModal({
  open,
  onClose,
  url,
  isPdf = false,
  pdfViewerPath = "/pdfjs/web/viewer.html",
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ==== закрытие по ESC и клику на фон ====
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  if (!url) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[1400] bg-black/70 flex items-center justify-center p-4"
        onMouseDown={onOverlayMouseDown}
      >
        <div
          className="relative max-w-[92vw] w-[440px] rounded-2xl bg-[var(--tg-card-bg,#111)] text-[var(--tg-text-color)] p-4 shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 p-1 rounded-md hover:bg-white/10"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
          <div className="text-[14px]">Файл не найден.</div>
        </div>
      </div>
    );
  }

  if (isPdf) {
    // ==== PDF через встроенный pdf.js viewer ====
    // Работает и с blob: URL — pdf.js их понимает.
    const viewerSrc = `${pdfViewerPath}?file=${encodeURIComponent(url)}`;

    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[1400] bg-black/80 p-0 md:p-2"
        onMouseDown={onOverlayMouseDown}
      >
        <div
          className="relative w-full h-full md:rounded-2xl overflow-hidden bg-black"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>

          <iframe
            title="PDF Preview"
            src={viewerSrc}
            className="w-full h-full block bg-black"
            // на случай CSP/iframe-ограничений дадим понятный фолбэк
          />
        </div>
      </div>
    );
  }

  // ==== IMAGE PREVIEW ====
  // Задача: показываем в "натуральном размере", но ограничиваем окном.
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useLayoutEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const box = useMemo(() => {
    // пока не знаем natural size — занимаем до 90vh/90vw
    const vw = viewport.w;
    const vh = viewport.h;
    const maxW = Math.max(0, vw - PAD * 2);
    const maxH = Math.max(0, vh - PAD * 2);

    if (!natural) return { w: Math.min(520, maxW), h: Math.min(520, maxH) };

    const scale = Math.min(1, maxW / natural.w, maxH / natural.h);
    return {
      w: Math.max(0, Math.floor(natural.w * scale)),
      h: Math.max(0, Math.floor(natural.h * scale)),
    };
  }, [natural, viewport]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1400] bg-black/80 flex items-center justify-center p-0"
      onMouseDown={onOverlayMouseDown}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-[var(--tg-card-bg,#111)]"
        style={{ width: box.w, height: box.h }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        {/* Само изображение: object-contain + чёткая подгонка под контейнер */}
        <img
          src={url}
          alt="Receipt"
          onLoad={onImgLoad}
          className="w-full h-full block object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
