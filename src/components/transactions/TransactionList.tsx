// src/components/transactions/TransactionList.tsx

import React, { ReactNode } from "react"

/**
 * Универсальный список «как в ContactsList»:
 *  • На всю ширину контейнера (есть режим bleed).
 *  • Без рамок карточек.
 *  • Единый горизонтальный паддинг списка.
 *  • Разделители между элементами, начинаются после левой колонки (иконка 40px + отступ ≈ 64px).
 *  • Цвета опираются на те же tg-переменные, что и ContactsList.
 */
type Props<T> = {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  className?: string
  /** Отступ слева для разделителя, по умолчанию 64px, чтобы не резать аватар/иконку. */
  leftInsetPx?: number
  /** Горизонтальный паддинг самого списка. */
  horizontalPaddingPx?: number
  /**
   * Насколько «кровоточить» за пределы родителя по горизонтали.
   * Нужен, если родитель уже дал свой паддинг.
   */
  bleedPx?: number
}

export default function TransactionList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  leftInsetPx = 64,
  horizontalPaddingPx = 16,
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
        // фон — прозрачный, чтобы читался системный фон как на Contacts
        background: "transparent",
      }}
    >
      {items.map((it, idx) => {
        const key =
          (keyExtractor ? keyExtractor(it, idx) : undefined) ??
          (typeof (it as any)?.id !== "undefined"
            ? (it as any).id
            : `${idx}-${(it as any)?.type ?? "tx"}-${(it as any)?.date ?? ""}-${(it as any)?.amount ?? ""}`)

        return (
          <div key={key} className="relative">
            {renderItem(it, idx)}
            {idx !== items.length - 1 && (
              <div
                // тот же разделитель, что и в ContactsList:
                className="absolute bottom-0 right-0 h-px bg-[var(--tg-hint-color)] opacity-15"
                style={{ left: leftInsetPx }}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
