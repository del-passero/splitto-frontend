// src/components/transactions/ReceiptPreviewModal.tsx
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** URL картинки (из стейджера: displayUrl / serverUrl) */
  url?: string | null; // допускаем undefined в вызовах
  /** ALT для картинок (не обязателен) */
  alt?: string;
};

/**
 * Предпросмотр чека: ТОЛЬКО изображение.
 * Никаких PDF/iframe — просто <img> с object-fit: contain.
 */
export default function ReceiptPreviewModal({
  open,
  onClose,
  url = null,
  alt = "",
}: Props) {
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

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
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
      {url ? (
        <img
          src={url}
          alt={alt}
          style={{
            maxWidth: "100vw",
            maxHeight: "100vh",
            objectFit: "contain",
            display: "block",
          }}
          draggable={false}
        />
      ) : null}
    </div>
  );
}
