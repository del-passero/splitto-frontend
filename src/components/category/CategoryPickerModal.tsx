// src/components/category/CategoryPickerModal.tsx
// Модалка выбора категории c ИЕРАРХИЧЕСКИМ отображением:
//  • Топ-категории (parent_id = null) как секции (строки), кликабельные;
//  • Подкатегории — внутри секции, с отступом;
//  • Поиск фильтрует и топы, и подкатегории; при поиске раскрываются только секции с совпадениями;
//  • Локаль берём из i18n и прокидываем ?locale=... в API;
//  • Разделители как в ContactsList (НЕ под иконкой).

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronRight } from "lucide-react"

export type CategoryItem = {
  id: number
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
      autoFocus
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

const ParentRow = ({
  item,
  selected,
  expanded,
  onToggle,
  onSelect,
  showDivider,
}: {
  item: CategoryItem
  selected: boolean
  expanded: boolean
  onToggle: () => void
  onSelect: () => void
  showDivider: boolean
}) => {
  return (
    <div className="relative">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 text-[var(--tg-text-color)]"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDown className="opacity-70" size={18} />
          ) : (
            <ChevronRight className="opacity-70" size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="flex-1 flex items-center min-w-0 ml-2 mr-3 hover:opacity-90 transition text-left"
        >
          {/* иконка/цвет */}
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
          <div className="text-[15px] font-semibold text-[var(--tg-text-color)] truncate">{item.name}</div>
        </button>

        <Radio active={selected} />
      </div>

      {/* разделитель как в ContactsList: НЕ под иконкой */}
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
          <div className="text-[15px] text-[var(--tg-text-color)] truncate">{item.name}</div>
        </div>
        <Radio active={selected} />
      </button>

      {/* разделитель */}
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

  const [allItems, setAllItems] = useState<CategoryItem[]>([]) // полный список (на открытие/смену группы/локали)
  const [loading, setLoading] = useState(false)

  const [q, setQ] = useState("")
  const qRef = useRef(q)
  const reqIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  // раскрытые секции (id топ-категорий)
  const [openSections, setOpenSections] = useState<Set<number>>(new Set())

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
    setOpenSections(new Set())
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

      // по умолчанию раскрываем секцию, где лежит выбранная категория (если есть)
      if (selectedId) {
        const sel = acc.find((x) => x.id === selectedId)
        const parentId = sel?.parent_id ?? sel?.id ?? null
        if (parentId) {
          setOpenSections((prev) => new Set(prev).add(parentId))
        }
      }

      if (listRef.current) listRef.current.scrollTop = 0
    } finally {
      if (reqIdRef.current === myId) setLoading(false)
    }
  }

  // Построение дерева
  const { parents, childrenByParent, orphans } = useMemo(() => {
    const parents = allItems.filter((x) => x.parent_id == null)
    // быстрое обращение по id
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
        // родителя нет в выдаче — положим в "прочее"
        orphans.push(item)
      }
    }

    // сортируем по имени (бэкенд уже сортирует, но клиентская сортировка держит иерархию красивой)
    const coll = new Intl.Collator(locale)
    parents.sort((a, b) => coll.compare(a.name, b.name))
    childrenByParent.forEach((arr) => arr.sort((a, b) => coll.compare(a.name, b.name)))
    orphans.sort((a, b) => coll.compare(a.name, b.name))

    return { parents, childrenByParent, orphans }
  }, [allItems, locale])

  // Поиск (фильтруем дерево, оставляя только совпадающие секции/детей)
  const filteredTree = useMemo(() => {
    const qn = norm(q).trim()
    if (!qn) return { parents, childrenByParent, orphans, hasFilter: false }

    const coll = new Intl.Collator(locale)
    const hitsParents: CategoryItem[] = []
    const hitsChildrenByParent = new Map<number, CategoryItem[]>()
    const hitsOrphans: CategoryItem[] = []

    const includes = (s: string) => norm(s).includes(qn)

    // проверка родителя и его детей
    for (const p of parents) {
      const pMatch = includes(p.name)
      const kids = (childrenByParent.get(p.id) || []).filter((c) => includes(c.name))
      if (pMatch || kids.length) {
        hitsParents.push(p)
        if (kids.length) {
          kids.sort((a, b) => coll.compare(a.name, b.name))
          hitsChildrenByParent.set(p.id, kids)
        } else {
          // если совпал только родитель — детей не показываем (или можно показать всех — реши сам)
          hitsChildrenByParent.set(p.id, [])
        }
      }
    }

    // сироты
    for (const c of orphans) {
      if (includes(c.name)) hitsOrphans.push(c)
    }

    hitsParents.sort((a, b) => coll.compare(a.name, b.name))
    hitsOrphans.sort((a, b) => coll.compare(a.name, b.name))

    return { parents: hitsParents, childrenByParent: hitsChildrenByParent, orphans: hitsOrphans, hasFilter: true }
  }, [q, parents, childrenByParent, orphans, locale])

  // При активном поиске — раскрываем все секции, где есть совпадения
  useEffect(() => {
    if (!open) return
    if (!filteredTree.hasFilter) return
    const next = new Set<number>(openSections)
    for (const p of filteredTree.parents) {
      next.add(p.id)
    }
    setOpenSections(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]) // на каждый новый запрос поиска раскрываем релевантное

  const toggleSection = (pid: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  const handleSelect = (it: CategoryItem) => {
    onSelect(it)
    if (closeOnSelect) onClose()
  }

  if (!open) return null

  // безопасные фолбэки для i18n-ключей
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

        {/* поиск */}
        <SearchField value={q} onChange={setQ} placeholder={placeholderSafe} />

        {/* список (дерево) */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {/* Родители с детьми */}
          {tree.parents.map((p, idxP) => {
            const kids = tree.childrenByParent.get(p.id) ?? childrenByParent.get(p.id) ?? []
            const expanded = openSections.has(p.id) || tree.hasFilter // при поиске секции с матчами раскрыты
            const isLastParent = idxP === tree.parents.length - 1 && (!tree.orphans || tree.orphans.length === 0)
            return (
              <div key={`p-${p.id}`} className="relative">
                <ParentRow
                  item={p}
                  selected={selectedId === p.id}
                  expanded={expanded}
                  onToggle={() => toggleSection(p.id)}
                  onSelect={() => handleSelect(p)}
                  showDivider={!expanded || kids.length === 0 ? !isLastParent : false}
                />

                {/* дети */}
                {expanded && kids.length > 0 && (
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

          {/* Сироты (когда родитель не пришёл с бэка) */}
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
