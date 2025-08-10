// src/components/currency/CurrencyPickerModal.tsx

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export type CurrencyItem = {
  code: string
  numeric_code: number
  name: string
  symbol?: string | null
  decimals: number
  flag_emoji?: string | null
  is_popular?: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  selectedCode?: string
  onSelect: (item: CurrencyItem) => void
  closeOnSelect?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const PAGE_SIZE = 200 // шаг для полной подгрузки

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

async function apiListPopular(locale: string): Promise<CurrencyItem[]> {
  const url = new URL(`${API_URL}/currencies/popular`)
  url.searchParams.set("locale", locale)
  const res = await fetch(url.toString(), {
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function apiListCurrenciesPage(params: {
  locale: string
  offset: number
  limit: number
}): Promise<{ items: CurrencyItem[]; total: number }> {
  const url = new URL(`${API_URL}/currencies`)
  url.searchParams.set("locale", params.locale)
  url.searchParams.set("offset", String(params.offset))
  url.searchParams.set("limit", String(params.limit))
  const res = await fetch(url.toString(), {
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// нормализация (без завязки на локаль)
function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function clientFilter(items: CurrencyItem[], query: string): CurrencyItem[] {
  const q = norm(query).trim()
  if (!q) return items
  const tokens = q.split(/\s+/).filter(Boolean)
  if (!tokens.length) return items
  return items.filter((it) => {
    const hay = norm(`${it.name ?? ""} ${it.code ?? ""}`)
    // Совпадение по ЛЮБОЙ подстроке (OR) — ловит и «рубль» при вводе «ру», независимо от позиции
    return tokens.some((tok) => hay.includes(tok))
  })
}

const SearchField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) => (
  <div className="px-4">
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent outline-none border-b border-[var(--tg-hint-color)] focus:border-[var(--tg-link-color)] py-3 text-[15px] placeholder:opacity-60"
      autoFocus
    />
  </div>
)

const Row = ({
  item,
  selected,
  onClick,
  showDivider,
}: {
  item: CurrencyItem
  selected: boolean
  onClick: () => void
  showDivider: boolean
}) => (
  <div className="relative">
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition"
      aria-selected={selected}
    >
      <div className="flex items-center min-w-0">
        {/* флаг */}
        <div className="flex items-center justify-center mr-3 rounded-full" style={{ width: 34, height: 34, fontSize: 20 }}>
          <span aria-hidden>{item.flag_emoji || "🏳️"}</span>
        </div>
        {/* название + код */}
        <div className="flex flex-col text-left min-w-0">
          <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{item.name}</div>
          <div className="text-[12px] text-[var(--tg-hint-color)]">{item.code}</div>
        </div>
      </div>

      {/* радио */}
      <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}>
        {selected && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}
      </div>
    </button>

    {/* разделитель как в ContactsList: НЕ под флагом */}
    {showDivider && <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
  </div>
)

const PopularChips = ({
  items,
  selectedCode,
  onPick,
  label,
}: {
  items: CurrencyItem[]
  selectedCode?: string
  onPick: (item: CurrencyItem) => void
  label: string
}) => {
  if (!items.length) return null
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="text-[12px] mb-2 opacity-60">{label}</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {items.map((c) => {
          const active = c.code === selectedCode
          return (
            <button
              key={c.code}
              onClick={() => onPick(c)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border ${
                active
                  ? "border-[var(--tg-link-color)] bg-[var(--tg-accent-color,#40A7E3)]/10"
                  : "border-[var(--tg-hint-color)]/50 bg-[var(--tg-card-bg)]"
              } shadow-[0_10px_28px_-12px_rgba(0,0,0,0.55)] hover:shadow-[0_14px_36px_-12px_rgba(0,0,0,0.6)] transition whitespace-nowrap`}
              title={`${c.name} (${c.code})`}
            >
              <span style={{ fontSize: 16 }}>{c.flag_emoji || "🏳️"}</span>
              <span className="font-medium">{c.code}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CurrencyPickerModal({
  open,
  onClose,
  selectedCode,
  onSelect,
  closeOnSelect = true,
}: Props) {
  const { i18n, t } = useTranslation()
  const locale = useMemo(() => (i18n.language || "en").split("-")[0], [i18n.language])

  const [popular, setPopular] = useState<CurrencyItem[]>([])
  const [allItems, setAllItems] = useState<CurrencyItem[]>([]) // ПОЛНЫЙ список (один раз)
  const [items, setItems] = useState<CurrencyItem[]>([])       // Отфильтрованный вид
  const [loading, setLoading] = useState(false)

  const [q, setQ] = useState("")
  const qRef = useRef(q)
  const reqIdRef = useRef(0)

  const listRef = useRef<HTMLDivElement | null>(null)

  // запрет прокрутки body
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // первичное открытие / смена локали
  useEffect(() => {
    if (!open) return
    setQ("")
    qRef.current = ""
    setItems([])
    setAllItems([])
    void initLoad()
  }, [open, locale])

  async function initLoad() {
    const myId = ++reqIdRef.current
    setLoading(true)
    try {
      // популярные (опционально)
      apiListPopular(locale).then(setPopular).catch(() => setPopular([]))

      // ТЯНЕМ ВЕСЬ СПРАВОЧНИК по страницам (без server q)
      let offset = 0
      const acc: CurrencyItem[] = []
      // защитный предел на случай чего-то странного на бэке
      const MAX_TOTAL = 3000

      // крутим до последней страницы
      /* eslint-disable no-constant-condition */
      while (true) {
        const { items: page } = await apiListCurrenciesPage({ locale, offset, limit: PAGE_SIZE })
        acc.push(...page)
        offset += page.length
        if (page.length < PAGE_SIZE || offset >= MAX_TOTAL) break
      }

      if (reqIdRef.current !== myId) return
      setAllItems(acc)
      setItems(acc)         // по умолчанию показываем всё
      if (listRef.current) listRef.current.scrollTop = 0
    } finally {
      if (reqIdRef.current === myId) setLoading(false)
    }
  }

  // дебаунс поиска
  useEffect(() => {
    if (!open) return
    const h = setTimeout(() => {
      if (qRef.current === q) return
      qRef.current = q
      const filtered = clientFilter(allItems, qRef.current)
      setItems(filtered)
      if (listRef.current) listRef.current.scrollTop = 0 // не «утягиваем» вниз
    }, 200)
    return () => clearTimeout(h)
  }, [q, open, allItems])

  if (!open) return null

  // безопасный фоллбек для ключа (пока у тебя i18n не подхватывает currency_popular)
  const popularLabel = (() => {
    const s = t("currency_popular")
    return s && s !== "currency_popular" ? s : "Популярные"
  })()

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* фон */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      {/* контейнер-шит */}
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("currency.select_title") || "Выбор валюты"}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">{t("close")}</button>
        </div>

        {/* поиск */}
        <SearchField value={q} onChange={setQ} placeholder={t("currency.search_placeholder") || "Поиск валюты"} />

        {/* популярные — только когда нет запроса */}
        {!q && (
          <PopularChips
            items={popular}
            selectedCode={selectedCode}
            onPick={(c) => { onSelect(c); if (closeOnSelect) onClose() }}
            label={popularLabel}
          />
        )}

        {/* список — разделители как в ContactsList */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {items.map((it, idx) => (
            <Row
              key={it.code}
              item={it}
              selected={it.code === selectedCode}
              onClick={() => { onSelect(it); if (closeOnSelect) onClose() }}
              showDivider={idx !== items.length - 1}
            />
          ))}

          {!loading && items.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">
              {t("currency.not_found") || "Ничего не найдено"}
            </div>
          )}

          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>
      </div>
    </div>
  )
}
