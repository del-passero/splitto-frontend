// src/components/category/CategoryPickerModal.tsx
// Иерархическая модалка выбора категории:
//  • Все топ-категории (parent_id = null) всегда РАЗВЕРНУТЫ.
//  • Выбирать можно ТОЛЬКО подкатегории (у родительских нет радио и клика выбора).
//  • Поиск: если совпал родитель — показываем ВСЕ его подкатегории; если совпадают только дети — показываем только совпавших детей.
//  • Локаль берём из i18n и прокидываем ?locale=... в API.
//  • Порядок родителей: Food and drinks → Transport → Travel → Housing → Entertainments → остальные.

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export type CategoryItem = {
  id: number
  key: string
  name: string
  parent_id: number | null
  icon?: string | null
  color?: string | null
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

// ---- API ----

type ApiExpenseCategoryOut = {
  id: number
  key: string
  name: string
  icon?: string | null
  color?: string | null
  parent_id?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  name_i18n?: Record<string, string> | null
}

type ApiListResp = {
  items: ApiExpenseCategoryOut[]
  total: number
  restricted: boolean
}

async function apiListGroupCategoriesPage(params: {
  groupId: number
  offset: number
  limit: number
  locale: string
}): Promise<ApiListResp> {
  const url = new URL(`${API_URL}/groups/${params.groupId}/categories`)
  url.searchParams.set("offset", String(params.offset))
  url.searchParams.set("limit", String(params.limit))
  url.searchParams.set("locale", params.locale)
  const res = await fetch(url.toString(), {
    headers: { "x-telegram-initdata": getTelegramInitData() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---- Utils ----

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Жёсткий порядок родителей + фолбэк по подстрокам key
const PARENT_ORDER: Record<string, number> = {
  // Food and drinks
  food_and_drinks: 0, food_drinks: 0, food: 0, groceries: 0, dining: 0, eating_out: 0,
  // Transport
  transport: 1, transportation: 1, transit: 1,
  // Travel
  travel: 2, trips: 2,
  // Housing
  housing: 3, home_housing: 3, home: 3, rent_housing: 3,
  // Entertainments
  entertainments: 4, entertainment: 4, entertainment_and_arts: 4, leisure: 4, fun: 4
}

const getParentPriority = (key?: string | null) => {
  if (!key) return 999
  const k = String(key).toLowerCase()
  if (k in PARENT_ORDER) return PARENT_ORDER[k]
  if (k.includes("food") || k.includes("drink")) return 0
  if (k.includes("transport")) return 1
  if (k.includes("travel")) return 2
  if (k.includes("hous") || k.includes("home")) return 3
  if (k.includes("entertain") || k.includes("leisure") || k.includes("fun")) return 4
  return 999
}

// ---- UI parts ----

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
    />
  </div>
)

function Radio({ active }: { active: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${
        active ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"
      }`}
    >
      {active && <div className="w-3 h-3 rounded-full" style={{ background: "var(--tg-link-color)" }} />}
    </div>
  )
}

const ParentHeader = ({
  item,
  showDivider,
}: {
  item: CategoryItem
  showDivider: boolean
}) => {
  return (
    <div className="relative">
      <div className="w-full flex items-center px-4 py-3 select-none">
        <div
          className="flex items-center justify-center mr-3 rounded-full"
          style={{
            width: 34,
            height: 34,
            fontSize: 20,
            background: item.color ? `${item.color}22` : "transparent",
            border: item.color ? `1px solid ${item.color}55` : "1px solid var(--tg-hint-color)",
          }}
        >
          <span aria-hidden>{item.icon || "🗂️"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[var(--tg-text-color)] truncate">{item.name}</div>
        </div>
        {/* у родителя НЕТ радио и клика выбора */}
      </div>

      {showDivider && <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
    </div>
  )
}

const ChildRow = ({
  item,
  selected,
  onClick,
  showDivider,
}: {
  item: CategoryItem
  selected: boolean
  onClick: () => void
  showDivider: boolean
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between pl-[64px] pr-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition"
      >
        <div className="flex items-center min-w-0">
          <div className="flex items-center justify-center mr-3 rounded-full" style={{ width: 30, height: 30, fontSize: 18 }}>
            <span aria-hidden>{item.icon || "🏷️"}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[15px] text-[var(--tg-text-color)] truncate">{item.name}</div>
        </div>
        <Radio active={selected} />
      </button>

      {showDivider && <div className="absolute left-[94px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />}
    </div>
  )
}

// ---- Component ----

export default function CategoryPickerModal({
  open,
  onClose,
  groupId,
  selectedId,
  onSelect,
  closeOnSelect = true,
}: Props) {
  const { i18n, t } = useTranslation()
  const locale = useMemo(() => (i18n.language || "ru").split("-")[0], [i18n.language])

  const [allItems, setAllItems] = useState<CategoryItem[]>([])
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

  // первичное открытие/смена groupId/locale — подгружаем заново
  useEffect(() => {
    if (!open || !groupId) return
    setQ("")
    qRef.current = ""
    setAllItems([])
    void initLoad(groupId, locale)
  }, [open, groupId, locale])

  async function initLoad(groupIdParam: number, loc: string) {
    const myId = ++reqIdRef.current
    setLoading(true)
    try {
      let offset = 0
      const acc: CategoryItem[] = []

      /* eslint-disable no-constant-condition */
      while (true) {
        const page = await apiListGroupCategoriesPage({ groupId: groupIdParam, offset, limit: PAGE_SIZE, locale: loc })
        const mapped = (page.items || []).map<CategoryItem>((it) => ({
          id: it.id,
          key: it.key,
          name: it.name, // уже локализовано на бэке
          parent_id: it.parent_id ?? null,
          icon: it.icon || null,
          color: it.color || null,
        }))
        acc.push(...mapped)

        offset += (page.items?.length || 0)
        if ((page.items?.length || 0) < PAGE_SIZE || offset >= MAX_TOTAL) break
      }

      if (reqIdRef.current !== myId) return
      setAllItems(acc)

      if (listRef.current) listRef.current.scrollTop = 0
    } finally {
      if (reqIdRef.current === myId) setLoading(false)
    }
  }

  // Построение дерева
  const { parents, childrenByParent, orphans } = useMemo(() => {
    const parents = allItems.filter((x) => x.parent_id == null)
    const parentIds = new Set(parents.map((p) => p.id))

    const childrenByParent = new Map<number, CategoryItem[]>()
    const orphans: CategoryItem[] = []

    for (const item of allItems) {
      if (item.parent_id == null) continue
      if (parentIds.has(item.parent_id)) {
        const arr = childrenByParent.get(item.parent_id) || []
        arr.push(item)
        childrenByParent.set(item.parent_id, arr)
      } else {
        orphans.push(item) // нет родителя в выдаче
      }
    }

    const coll = new Intl.Collator(locale)

    // Родители: сначала по приоритету, затем по имени
    parents.sort((a, b) => {
      const pa = getParentPriority(a.key)
      const pb = getParentPriority(b.key)
      if (pa !== pb) return pa - pb
      return coll.compare(a.name, b.name)
    })

    // Дети: по имени
    childrenByParent.forEach((arr) => arr.sort((a, b) => coll.compare(a.name, b.name)))
    orphans.sort((a, b) => coll.compare(a.name, b.name))

    return { parents, childrenByParent, orphans }
  }, [allItems, locale])

  // Поиск
  const filteredTree = useMemo(() => {
    const qn = norm(q).trim()
    if (!qn) return { parents, childrenByParent, orphans }

    const coll = new Intl.Collator(locale)
    const includes = (s: string) => norm(s).includes(qn)

    const outParents: CategoryItem[] = []
    const outChildrenByParent = new Map<number, CategoryItem[]>()
    const outOrphans: CategoryItem[] = []

    for (const p of parents) {
      const kids = childrenByParent.get(p.id) || []
      if (includes(p.name)) {
        outParents.push(p)
        outChildrenByParent.set(p.id, [...kids])
      } else {
        const k = kids.filter((c) => includes(c.name))
        if (k.length) {
          outParents.push(p)
          outChildrenByParent.set(p.id, k)
        }
      }
    }

    for (const c of orphans) {
      if (includes(c.name)) outOrphans.push(c)
    }

    // Сохранить требуемый порядок родителей
    outParents.sort((a, b) => {
      const pa = getParentPriority(a.key)
      const pb = getParentPriority(b.key)
      if (pa !== pb) return pa - pb
      return coll.compare(a.name, b.name)
    })
    outChildrenByParent.forEach((arr) => arr.sort((a, b) => coll.compare(a.name, b.name)))
    outOrphans.sort((a, b) => coll.compare(a.name, b.name))

    return { parents: outParents, childrenByParent: outChildrenByParent, orphans: outOrphans }
  }, [q, parents, childrenByParent, orphans, locale])

  const handleSelect = (it: CategoryItem) => {
    if (it.parent_id == null) return // только подкатегории
    onSelect(it)
    if (closeOnSelect) onClose()
  }

  if (!open) return null

  const titleSafe = (() => {
    const s = t("category.select_title")
    return s && s !== "category.select_title" ? s : "Выбор категории"
  })()
  const notFoundSafe = (() => {
    const s = t("category.not_found")
    return s && s !== "category.not_found" ? s : "Ничего не найдено"
  })()
  const closeSafe = (() => {
    const s = t("close")
    return s && s !== "close" ? s : "Закрыть"
  })()

  const tree = filteredTree

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

        {/* поиск (placeholder через ключ локализации) */}
        <SearchField value={q} onChange={setQ} placeholder={t("category.search_placeholder")} />

        {/* список (всегда развернутый) */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {/* Родители с детьми */}
          {tree.parents.map((p, idxP) => {
            const kids = tree.childrenByParent.get(p.id) ?? childrenByParent.get(p.id) ?? []
            const isLastParent = idxP === tree.parents.length - 1 && (!tree.orphans || tree.orphans.length === 0)

            return (
              <div key={`p-${p.id}`} className="relative">
                <ParentHeader item={p} showDivider={!kids.length ? !isLastParent : false} />

                {/* дети (ТОЛЬКО они кликабельны) */}
                {kids.length > 0 && (
                  <div>
                    {kids.map((c, idxC) => {
                      const isLastChild = idxC === kids.length - 1
                      const divider = !isLastChild || !isLastParent
                      return (
                        <ChildRow
                          key={`c-${c.id}`}
                          item={c}
                          selected={selectedId === c.id}
                          onClick={() => handleSelect(c)}
                          showDivider={divider}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Сироты (когда родителя нет в выдаче) — считаем подкатегориями */}
          {tree.orphans.length > 0 && (
            <div className="mt-2">
              <div className="px-4 py-2 text-[12px] opacity-60">Другие</div>
              {tree.orphans.map((c, idx) => (
                <ChildRow
                  key={`o-${c.id}`}
                  item={c}
                  selected={selectedId === c.id}
                  onClick={() => handleSelect(c)}
                  showDivider={idx !== tree.orphans.length - 1}
                />
              ))}
            </div>
          )}

          {!loading && tree.parents.length === 0 && tree.orphans.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--tg-hint-color)]">{notFoundSafe}</div>
          )}

          {loading && <div className="px-4 py-4 text-[13px] text-[var(--tg-hint-color)]">{t("loading")}</div>}
        </div>
      </div>
    </div>
  )
}
