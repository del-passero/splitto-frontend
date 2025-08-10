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
const PAGE_SIZE = 40
const CLIENT_SEARCH_LIMIT = 2000 // разовая «большая» подгрузка для клиентского фильтра

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

async function apiListPopular(locale: string): Promise<CurrencyItem[]> {
  const url = new URL(`${API_URL}/currencies/popular`)
  url.searchParams.set("locale", locale)
  const res = await fetch(url.toString(), { headers: { "x-telegram-initdata": getTelegramInitData() } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function apiListCurrencies(params: {
  locale: string
  offset: number
  limit: number
  q?: string
}): Promise<{ items: CurrencyItem[]; total: number }> {
  const url = new URL(`${API_URL}/currencies`)
  url.searchParams.set("locale", params.locale)
  url.searchParams.set("offset", String(params.offset))
  url.searchParams.set("limit", String(params.limit))
  if (params.q) url.searchParams.set("q", params.q.trim())
  const res = await fetch(url.toString(), { headers: { "x-telegram-initdata": getTelegramInitData() } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Нормализуем строку: lower + убираем комб.диакритики (работает и для кириллицы/латиницы) */
function norm(s: string) {
  return (s || "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/** Подстраховка на клиенте: матч по ЛЮБОЙ подстроке (OR) в name ИЛИ code */
function clientFilter(items: CurrencyItem[], query: string): CurrencyItem[] {
  const q = norm(query).trim()
  if (!q) return items
  const tokens = q.split(/\s+/).filter(Boolean)
  if (!tokens.length) return items
  return items.filter((it) => {
    const hay = norm(`${it.name ?? ""} ${it.code ?? ""}`)
    return tokens.some((tok) => hay.includes(tok))
  })
}

/** Включаем «клиентский режим» для кириллицы или когда выбран ru */
function isClientSearch(query: string, locale: string) {
  const hasQuery = query.trim().length > 0
  const hasCyr = /[\u0400-\u04FF]/.test(query)
  return hasQuery && (locale.startsWith("ru") || hasCyr)
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
      <div
        className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${
          selected ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"
        }`}
      >
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
  const [items, setItems] = useState<CurrencyItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [offset, setOffset] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const [q, setQ] = useState("")
  const qRef = useRef(q)
  const reqIdRef = useRef(0)

  const listRef = useRef<HTMLDivElement | null>(null) // скроллим только список
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)
  const lockRef = useRef(false)

  // запрет прокрутки body
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // дебаунс ввода
  useEffect(() => {
    if (!open) return
    const h = setTimeout(() => {
      if (qRef.current === q) return
      qRef.current = q
      void reload(true)
    }, 250)
    return () => clearTimeout(h)
  }, [q, open])

  // первичная загрузка
  useEffect(() => {
    if (!open) return
    setQ("")
    qRef.current = ""
    setItems([])
    setTotal(0)
    setOffset(0)
    void loadPopular()
    void reload(true)
  }, [open, locale])

  async function loadPopular() {
    try {
      const data = await apiListPopular(locale)
      setPopular(data)
    } catch {
      setPopular([])
    }
  }

  async function reload(reset: boolean) {
    const myId = ++reqIdRef.current
    setLoading(true)

    if (reset) {
      // сброс и вверх
      setItems([])
      setOffset(0)
      setTotal(0)
      if (ioRef.current) {
        ioRef.current.disconnect()
        ioRef.current = null
      }
      if (listRef.current) listRef.current.scrollTop = 0
    }

    try {
      const query = qRef.current || ""
      const clientMode = isClientSearch(query, locale)

      if (clientMode) {
        // тянем большую страницу БЕЗ server q, фильтруем локально — русское «второе слово» ловится
        const { items: page } = await apiListCurrencies({
          locale,
          offset: 0,
          limit: CLIENT_SEARCH_LIMIT,
        })
        if (reqIdRef.current !== myId) return

        const filtered = clientFilter(page, query)
        setItems(filtered)
        setOffset(filtered.length)
        setTotal(filtered.length)
      } else {
        // обычный серверный поиск с пагинацией
        const reqOffset = reset ? 0 : offset
        const { items: page, total } = await apiListCurrencies({
          locale,
          offset: reqOffset,
          limit: PAGE_SIZE,
          q: query || undefined,
        })
        if (reqIdRef.current !== myId) return

        const pageFiltered = clientFilter(page, query) // лёгкая подстраховка
        setItems((prev) => (reset ? pageFiltered : [...prev, ...pageFiltered]))
        const newOffset = reqOffset + page.length
        setOffset(newOffset)
        setTotal(typeof total === "number" ? total : newOffset)
      }

      // после отрисовки — гарантированно наверх
      if (reset && listRef.current) {
        requestAnimationFrame(() => {
          if (listRef.current) listRef.current.scrollTop = 0
        })
      }
    } finally {
      if (reqIdRef.current === myId) setLoading(false)
    }
  }

  const clientMode = isClientSearch(q, locale)
  const hasMore = !clientMode && offset < total

  // infinity-scroll: root = собственный список; при clientMode выключен
  useEffect(() => {
    const el = sentinelRef.current
    const root = listRef.current
    if (!open || clientMode || !el || !root) return

    if (ioRef.current) {
      ioRef.current.disconnect()
      ioRef.current = null
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e.isIntersecting) return
        if (lockRef.current || loading) return
        if (!hasMore) return
        lockRef.current = true
        Promise.resolve(reload(false)).finally(() => (lockRef.current = false))
      },
      { root, rootMargin: "200px 0px 0px 0px", threshold: 0 }
    )
    io.observe(el)
    ioRef.current = io

    return () => io.disconnect()
  }, [open, clientMode, hasMore, loading, offset, total])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* фон */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      {/* контейнер */}
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[88vh] max-h-[88vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("currency.select_title") || "Выбор валюты"}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">
            {t("close")}
          </button>
        </div>

        {/* поиск */}
        <SearchField value={q} onChange={setQ} placeholder={t("currency.search_placeholder") || "Поиск валюты"} />

        {/* популярные — только когда нет запроса */}
        {!q && (
          <PopularChips
            items={popular}
            selectedCode={selectedCode}
            onPick={(c) => {
              onSelect(c)
              if (closeOnSelect) onClose()
            }}
            label={t("currency_popular")}
          />
        )}

        {/* список */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {items.map((it, idx) => (
            <Row
              key={it.code}
              item={it}
              selected={it.code === selectedCode}
              onClick={() => {
                onSelect(it)
                if (closeOnSelect) onClose()
              }}
              showDivider={idx !== items.length - 1}
            />
          ))}

          {!loading && items.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{t("currency.not_found") || "Ничего не найдено"}</div>
          )}
          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}

          {/* сентинел */}
          {!clientMode && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
      </div>
    </div>
  )
}
