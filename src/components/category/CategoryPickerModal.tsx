import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export type CategoryItem = {
  id: number
  name: string
  emoji?: string | null
  color?: string | null
  icon?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  groupId: number
  selectedId?: number
  onSelect: (item: CategoryItem) => void
  closeOnSelect?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"
const PAGE_SIZE = 200
const MAX_TOTAL = 5000

function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

async function apiListGroupCategoriesPage(params: {
  groupId: number
  offset: number
  limit: number
}): Promise<{ items: CategoryItem[]; total?: number }> {
  const url = new URL(`${API_URL}/groups/${params.groupId}/categories`)
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

// фильтр по клиенту (OR по подстрокам)
function clientFilter(items: CategoryItem[], query: string): CategoryItem[] {
  const q = norm(query).trim()
  if (!q) return items
  const tokens = q.split(/\s+/).filter(Boolean)
  if (!tokens.length) return items
  return items.filter((it) => {
    const hay = norm(`${it.name ?? ""}`)
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
  item: CategoryItem
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
        {/* эмодзи/иконка */}
        <div
          className="flex items-center justify-center mr-3 rounded-full"
          style={{ width: 34, height: 34, fontSize: 20, background: "transparent" }}
        >
          <span aria-hidden>{item.emoji || "🏷️"}</span>
        </div>

        {/* название */}
        <div className="flex flex-col text-left min-w-0">
          <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">{item.name}</div>
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

    {/* разделитель как в ContactsList: НЕ под иконкой */}
    {showDivider && <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
  </div>
)

export default function CategoryPickerModal({
  open,
  onClose,
  groupId,
  selectedId,
  onSelect,
  closeOnSelect = true,
}: Props) {
  const { t } = useTranslation()

  const [allItems, setAllItems] = useState<CategoryItem[]>([]) // полный список (один раз на открытие)
  const [items, setItems] = useState<CategoryItem[]>([]) // отфильтрованный вид
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
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // первичное открытие/смена groupId
  useEffect(() => {
    if (!open || !groupId) return
    setQ("")
    qRef.current = ""
    setItems([])
    setAllItems([])
    void initLoad(groupId)
  }, [open, groupId])

  async function initLoad(groupIdParam: number) {
    const myId = ++reqIdRef.current
    setLoading(true)
    try {
      let offset = 0
      const acc: CategoryItem[] = []
      /* eslint-disable no-constant-condition */
      while (true) {
        const { items: page } = await apiListGroupCategoriesPage({ groupId: groupIdParam, offset, limit: PAGE_SIZE })
        acc.push(...page)
        offset += page.length
        if (page.length < PAGE_SIZE || offset >= MAX_TOTAL) break
      }
      if (reqIdRef.current !== myId) return
      setAllItems(acc)
      setItems(acc)
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
      if (listRef.current) listRef.current.scrollTop = 0
    }, 200)
    return () => clearTimeout(h)
  }, [q, open, allItems])

  if (!open) return null

  const titleSafe = (() => {
    const s = t("category.select_title")
    return s && s !== "category.select_title" ? s : "Выбор категории"
  })()
  const placeholderSafe = (() => {
    const s = t("category.search_placeholder")
    return s && s !== "category.search_placeholder" ? s : "Поиск категории"
  })()
  const notFoundSafe = (() => {
    const s = t("category.not_found")
    return s && s !== "category.not_found" ? s : "Ничего не найдено"
  })()
  const closeSafe = (() => {
    const s = t("close")
    return s && s !== "close" ? s : "Закрыть"
  })()

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* фон */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      {/* контейнер-шит */}
      <div className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)] rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{titleSafe}</div>
          <button onClick={onClose} className="text-[13px] opacity-70 hover:opacity-100 transition">
            {closeSafe}
          </button>
        </div>

        {/* поиск */}
        <SearchField value={q} onChange={setQ} placeholder={placeholderSafe} />

        {/* список */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {items.map((it, idx) => (
            <Row
              key={it.id}
              item={it}
              selected={it.id === selectedId}
              onClick={() => {
                onSelect(it)
                if (closeOnSelect) onClose()
              }}
              showDivider={idx !== items.length - 1}
            />
          ))}

          {!loading && items.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{notFoundSafe}</div>
          )}

          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>
      </div>
    </div>
  )
}
