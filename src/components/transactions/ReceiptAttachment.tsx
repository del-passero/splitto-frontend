// src/components/transactions/ReceiptAttachment.tsx
import React, { useRef } from "react";
import { FileUp, Image as ImageIcon, Eye, Trash2, Camera } from "lucide-react";

type Props = {
  displayUrl: string | null;
  /** Совместимость со старым кодом: можно передать, но не используется */
  isPdf?: boolean;
  busy?: boolean;
  error?: string | null;
  removeMarked?: boolean;

  onPick: (file: File) => void;
  onClear?: () => void; // локально очистить файл/превью
  onRemove?: () => void; // алиас для обратной совместимости
  onPreview: () => void;

  className?: string;
};

export default function ReceiptAttachment({
  displayUrl,
  isPdf = false, // игнорируется, PDF больше не поддерживаем
  busy = false,
  error = null,
  removeMarked = false,
  onPick,
  onClear,
  onRemove,
  onPreview,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const doPick = () => inputRef.current?.click();
  const doCamera = () => cameraRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const t = (f.type || "").toLowerCase();
      if (t.startsWith("image/")) {
        onPick(f);
      } else {
        // мягко игнорируем не-изображения
        // можно заменить на тост/alert при необходимости
        console.warn("Only image/* is allowed for receipt.");
      }
    }
    e.target.value = "";
  };

  const clear = () => {
    if (onClear) onClear();
    else if (onRemove) onRemove();
  };

  const hasPreview = !!displayUrl;

  return (
    <div
      className={`rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] p-3 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={16} className="opacity-70" />
        <div className="text-[14px] font-medium">Чек</div>
        {busy && <span className="ml-2 text-[12px] opacity-70">Загрузка…</span>}
        {removeMarked && (
          <span className="ml-2 text-[12px] text-red-500">Помечен к удалению</span>
        )}
        {error && <span className="ml-2 text-[12px] text-red-500">{error}</span>}
      </div>

      {/* Превью — «книжное» окно 3:4 */}
      {hasPreview && (
        <div className="mb-3">
          <div
            className="relative -ml-1 w-28 sm:w-32 aspect-[3/4] rounded-lg overflow-hidden
                       border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-bg-color,#fff)]"
          >
            <img
              src={displayUrl!}
              alt="Receipt"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={doPick}
          className="h-9 px-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]
                     hover:bg-black/5 dark:hover:bg-white/5 text-[14px] inline-flex items-center gap-1"
          disabled={busy}
        >
          <FileUp size={16} /> Выбрать файл
        </button>

        {/* Кнопка камеры — отдельный input с capture="environment" */}
        <button
          type="button"
          onClick={doCamera}
          className="h-9 px-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]
                     hover:bg-black/5 dark:hover:bg-white/5 text-[14px] inline-flex items-center gap-2"
          title="Сделать фото"
          aria-label="Сделать фото"
          disabled={busy}
        >
          <Camera size={16} />
          <span className="hidden xs:inline">Сделать фото</span>
        </button>

        {hasPreview && (
          <>
            <button
              type="button"
              onClick={onPreview}
              className="h-9 px-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)]
                         hover:bg-black/5 dark:hover:bg-white/5 text-[14px] inline-flex items-center gap-1"
            >
              <Eye size={16} /> Предпросмотр
            </button>
            <button
              type="button"
              onClick={clear}
              className="h-9 px-3 rounded-xl border border-red-400/50 text-red-600
                         hover:bg-red-500/10 text-[14px] inline-flex items-center gap-1"
            >
              <Trash2 size={16} /> Очистить
            </button>
          </>
        )}
      </div>

      {/* Основной файловый инпут: ТОЛЬКО image/* */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Камера: только изображения, открывает нативную камеру на мобилках */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
