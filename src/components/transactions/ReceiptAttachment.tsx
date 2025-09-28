// src/components/transactions/ReceiptAttachment.tsx
import React, { useRef } from "react";
import { FileUp, Image as ImageIcon, Eye, Trash2 } from "lucide-react";

type Props = {
  displayUrl: string | null;
  isPdf: boolean;
  busy?: boolean;
  error?: string | null;
  removeMarked?: boolean;

  onPick: (file: File) => void;
  onClear?: () => void;     // локально очистить файл/превью
  onRemove?: () => void;    // алиас для обратной совместимости
  onPreview: () => void;

  className?: string;
};

export default function ReceiptAttachment({
  displayUrl,
  isPdf,
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

  const doPick = () => inputRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.target.value = "";
  };

  const clear = () => {
    if (onClear) onClear();
    else if (onRemove) onRemove();
  };

  const hasPreview = !!displayUrl;

  return (
    <div className={`rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon size={16} className="opacity-70" />
        <div className="text-[14px] font-medium">Чек</div>
        {busy && <span className="ml-2 text-[12px] opacity-70">Загрузка…</span>}
        {removeMarked && <span className="ml-2 text-[12px] text-red-500">Помечен к удалению</span>}
        {error && <span className="ml-2 text-[12px] text-red-500">{error}</span>}
      </div>

      {/* превью (картинка) */}
      {hasPreview && !isPdf && (
        <div className="mb-2">
          <img
            src={displayUrl!}
            alt="Receipt"
            className="w-full max-h-64 object-contain rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)]"
          />
        </div>
      )}

      {/* pdf — показываем плашку + кнопка «Открыть» */}
      {hasPreview && isPdf && (
        <div className="mb-2 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] p-3 flex items-center justify-between">
          <div className="text-[14px]">PDF-файл</div>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--tg-accent-color,#40A7E3)] text-white text-[12px]"
            onClick={onPreview}
          >
            <Eye size={14} /> Открыть
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={doPick}
          className="h-9 px-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5 text-[14px] inline-flex items-center gap-1"
          disabled={busy}
        >
          <FileUp size={16} /> Выбрать файл
        </button>

        {hasPreview && (
          <>
            <button
              type="button"
              onClick={onPreview}
              className="h-9 px-3 rounded-xl border border-[var(--tg-secondary-bg-color,#e7e7e7)] hover:bg-black/5 dark:hover:bg-white/5 text-[14px] inline-flex items-center gap-1"
            >
              <Eye size={16} /> Предпросмотр
            </button>
            <button
              type="button"
              onClick={clear}
              className="h-9 px-3 rounded-xl border border-red-400/50 text-red-600 hover:bg-red-500/10 text-[14px] inline-flex items-center gap-1"
            >
              <Trash2 size={16} /> Очистить
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

