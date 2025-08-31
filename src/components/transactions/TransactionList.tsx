// src/components/transactions/TransactionList.tsx
import React, { ReactNode } from "react";

/**
 * Универсальный список «как в ContactsList».
 * Без рамок карточек, единые отступы, разделители на цветах Telegram.
 */
type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
  /** Отступ слева для разделителя (px) — чтобы не заходить на аватар/иконку. */
  leftInsetPx?: number;
  /** Горизонтальный паддинг самого списка. */
  horizontalPaddingPx?: number;
  /** «Кровотечение» за пределы родителя по горизонтали. */
  bleedPx?: number;
};

export default function TransactionList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  leftInsetPx = 48,         // 40px иконка + небольшой зазор
  horizontalPaddingPx = 0,  // на странице уже выходим в край
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
                className="absolute bottom-0 right-0 h-px bg-[var(--tg-secondary-bg-color,#e7e7e7)] opacity-30"
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
