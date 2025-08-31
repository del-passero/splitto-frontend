// src/components/transactions/TransactionList.tsx
import React, { ReactNode } from "react";

/**
 * Универсальный список «как в ContactsList»:
 *  • На всю ширину контейнера (есть режим bleed).
 *  • Без рамок карточек.
 *  • Единый горизонтальный паддинг списка (можно задать 0).
 *  • Разделители между элементами, начинаются после левой колонки.
 */
type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
  /** Отступ слева для разделителя (px). */
  leftInsetPx?: number;
  /** Горизонтальный паддинг самого списка. */
  horizontalPaddingPx?: number;
  /**
   * Насколько «кровоточить» за пределы родителя по горизонтали.
   * Нужен, если родитель уже дал свой внутренний паддинг.
   */
  bleedPx?: number;
};

export default function TransactionList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  leftInsetPx = 48,           // 40px иконка + небольшой зазор
  horizontalPaddingPx = 0,    // по умолчанию без боковых отступов
  bleedPx = 0,
}: Props<T>) {
  return (
    <div
      className={`w-full ${className}`}
      role="list"
      style={{
        marginLeft: bleedPx ? -bleedPx : undefined,
        marginRight: bleedPx ? -bleedPx : undefined,
        paddingLeft: horizontalPaddingPx,
        paddingRight: horizontalPaddingPx,
      }}
    >
      {items.map((it, idx) => {
        const key =
          (keyExtractor ? keyExtractor(it, idx) : undefined) ??
          (typeof (it as any)?.id !== "undefined"
            ? (it as any).id
            : `${idx}-${(it as any)?.type ?? "tx"}-${(it as any)?.date ?? ""}-${(it as any)?.amount ?? ""}`);
        return (
          <div key={key} className="relative">
            {renderItem(it, idx)}
            {idx !== items.length - 1 && (
              <div
                className="absolute bottom-0 right-0 h-px bg-[var(--tg-hint-color)] opacity-15"
                style={{ left: leftInsetPx }}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
