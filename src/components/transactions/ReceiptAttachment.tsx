// src/components/transactions/ReceiptAttachment.tsx
import React from "react";

type Props = {
  /* Новый вариант */
  displayUrl?: string | null;
  isPdf?: boolean;

  /* Старый вариант (оба поддерживаются) */
  existingUrl?: string | null;
  previewUrl?: string | null;

  busy?: boolean;
  disabled?: boolean;
  error?: string | null;

  /* remove flags (любой из двух имён) */
  removeMarked?: boolean;
  markedDeleted?: boolean;

  /* Колбэки (любой из onClear/onRemove) */
  onPick?: (file: File) => void;
  onClear?: () => void;
  onRemove?: () => void;

  onPreview?: () => void;

  className?: string;
};

export default function ReceiptAttachment(props: Props) {
  const {
    displayUrl,
    isPdf,
    existingUrl,
    previewUrl,
    busy,
    disabled,
    error,
    removeMarked,
    markedDeleted,
    onPick,
    onClear,
    onRemove,
    onPreview,
    className,
  } = props;

  // Унифицируем данные для рендера
  const url = displayUrl ?? previewUrl ?? existingUrl ?? null;
  const computedIsPdf =
    typeof isPdf === "boolean"
      ? isPdf
      : (url ? /\.pdf($|\?)/i.test(url) : false);
  const removeFlag = Boolean(removeMarked ?? markedDeleted);
  const isDisabled = Boolean(busy || disabled);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className={className ?? ""}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!url || isDisabled}
          onClick={onPreview}
          className="w-14 h-14 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] bg-[var(--tg-card-bg)] flex items-center justify-center overflow-hidden disabled:opacity-50"
          title={url ? "Открыть" : "Нет файла"}
        >
          {url ? (
            computedIsPdf ? (
              <span className="text-[12px]">PDF</span>
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={url} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <span className="text-[12px] opacity-60">нет файла</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] truncate">
            {url ? (computedIsPdf ? "Прикреплён PDF" : "Прикреплено изображение") : "Чек не прикреплён"}
          </div>
          {removeFlag && (
            <div className="text-[12px] text-red-500">Помечено на удаление</div>
          )}
          {error && <div className="text-[12px] text-red-500">{error}</div>}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="px-2 h-8 rounded-lg border border-[var(--tg-secondary-bg-color,#e7e7e7)] text-[12px]"
            onClick={() => inputRef.current?.click()}
            disabled={isDisabled}
          >
            {url ? "Заменить" : "Прикрепить"}
          </button>
          {url && (
            <button
              type="button"
              className="px-2 h-8 rounded-lg border border-red-500/40 text-red-600 text-[12px]"
              onClick={() => (onClear ? onClear() : onRemove && onRemove())}
              disabled={isDisabled}
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onPick) onPick(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
