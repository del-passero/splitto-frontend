import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { useFriendsStore } from "../../store/friendsStore"
import { addGroupMember } from "../../api/groupMembersApi"

type Props = {
  open: boolean
  onClose: () => void
  groupId: number
  /** user.id участников, которые уже в группе */
  existingMemberIds: number[]
  /** коллбек после успешного добавления хотя бы одного участника */
  onAdded?: (addedIds: number[]) => void
}

const PAGE_SIZE = 20

type FriendItem = {
  id: number // id записи дружбы (используем как key)
  user: {
    id: number
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
  }
}

export default function AddGroupMembersModal({
  open,
  onClose,
  groupId,
  existingMemberIds,
  onAdded,
}: Props) {
  const { t } = useTranslation()

  // friendsStore — как в ContactsList.tsx
  const {
    friends,
    loading,
    error,
    fetchFriends,
    searchFriends,
    clearFriends,
    hasMore,
    page,
    setPage,
  } = useFriendsStore()

  // поиск
  const [q, setQ] = useState("")
  const isSearching = q.trim().length > 0

  // выбранные user.id
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // ошибки добавления по user.id
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({})

  // процесс добавления
  const [adding, setAdding] = useState(false)

  const existingSet = useMemo(() => new Set(existingMemberIds), [existingMemberIds])

  // фильтруем «только не в группе»
  const visibleFriends: FriendItem[] = useMemo(
    () => friends.filter((f: FriendItem) => !existingSet.has(f.user.id)),
    [friends, existingSet]
  )

  // блокировка скролла body, когда модалка открыта
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // первичная загрузка / смена поиска
  useEffect(() => {
    if (!open) return
    // сбросы
    clearFriends()
    setRowErrors({})
    setSelected(new Set())
    setPage(0)

    if (isSearching) {
      searchFriends(q.trim(), 0, PAGE_SIZE)
    } else {
      fetchFriends(0, PAGE_SIZE)
    }
  }, [open, isSearching, q, fetchFriends, searchFriends, clearFriends, setPage])

  // инфинити-скролл
  const loaderRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open || !loaderRef.current) return
    const el = loaderRef.current
    const io = new IntersectionObserver((entries) => {
      const ent = entries[0]
      if (ent.isIntersecting && !loading && hasMore) {
        const nextPage = page + 1
        setPage(nextPage)
        if (isSearching) {
          searchFriends(q.trim(), nextPage * PAGE_SIZE, PAGE_SIZE)
        } else {
          fetchFriends(nextPage * PAGE_SIZE, PAGE_SIZE)
        }
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [open, loading, hasMore, page, setPage, isSearching, q, fetchFriends, searchFriends])

  const toggle = useCallback(
    (userId: number) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(userId)) next.delete(userId)
        else next.add(userId)
        return next
      })
      // сбрасываем возможную предыдущую ошибку для строки
      setRowErrors((prev) => {
        if (!prev[userId]) return prev
        const { [userId]: _, ...rest } = prev
        return rest
      })
    },
    [setSelected, setRowErrors]
  )

  const allCount = selected.size
  const canSubmit = allCount > 0 && !adding

  async function handleSubmit() {
    if (!canSubmit) return
    setAdding(true)
    const ids = Array.from(selected)
    const added: number[] = []
    const errors: Record<number, string> = {}

    for (const uid of ids) {
      try {
        // ВАЖНО: у тебя в API одна сигнатура — один объект payload
        await addGroupMember({ group_id: groupId, user_id: uid })
        added.push(uid)
      } catch (e: any) {
        errors[uid] = e?.message || "Error"
      }
    }

    // отмечаем ошибки у строк
    setRowErrors(errors)

    // убираем успешно добавленных из выбора и из видимого списка (через existingSet)
    if (added.length > 0) {
      // обновим existingSet «логически» — для фильтра
      added.forEach((uid) => existingSet.add(uid))
      // снимем выделение с успешно добавленных
      setSelected((prev) => {
        const next = new Set(prev)
        added.forEach((uid) => next.delete(uid))
        return next
      })
    }

    setAdding(false)

    // если нет ошибок — закрываем и обновляем страницу
    if (added.length > 0 && Object.keys(errors).length === 0) {
      onAdded?.(added)
      // жёсткое обновление, как просил
      window.location.reload()
    }
    // если были ошибки — модалку НЕ закрываем
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      {/* sheet */}
      <div
        className="relative w-full sm:max-w-md bg-[var(--tg-card-bg)] text-[var(--tg-text-color)]
                   rounded-t-2xl shadow-tg-card overflow-hidden animate-modal-pop h-[90vh] max-h-[90vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tg-secondary-bg-color,#e7e7e7)]">
          <div className="text-[15px] font-semibold">{t("add_members_modal.title")}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--tg-accent-color)]/10" aria-label={t("close")}>
            <X className="w-5 h-5 text-[var(--tg-hint-color)]" />
          </button>
        </div>

        {/* search */}
        <div className="px-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("add_members_modal.search_placeholder")}
            className="w-full bg-transparent outline-none border-b border-[var(--tg-hint-color)] focus:border-[var(--tg-link-color)] py-3 text-[15px] placeholder:opacity-60"
            autoFocus
          />
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {!!error && (
            <div className="px-4 py-6 text-center text-red-500">{String(error)}</div>
          )}

          {!loading && visibleFriends.length === 0 && (
            <div className="px-4 py-10 text-center text-[var(--tg-hint-color)]">
              {t("add_members_modal.empty")}
            </div>
          )}

          {visibleFriends.map((friend, idx) => {
            const u = friend.user
            const userId = u.id
            const checked = selected.has(userId)
            const errText = rowErrors[userId]

            return (
              <div key={friend.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(userId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition text-left"
                >
                  {/* левый блок — аватар + имя/username */}
                  <div className="flex items-center min-w-0">
                    <img
                      src={u.photo_url || ""}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover bg-[var(--tg-secondary-bg-color,#e7e7e7)] mr-3"
                      onError={(e: any) => { e.currentTarget.style.visibility = "hidden" }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="text-[15px] font-medium text-[var(--tg-text-color)] truncate">
                        {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || `@${u.id}`}
                      </div>
                      {!!u.username && (
                        <div className="text-[12px] text-[var(--tg-hint-color)]">@{u.username}</div>
                      )}
                    </div>
                  </div>

                  {/* чекбокс */}
                  <div
                    className={`relative flex items-center justify-center w-6 h-6 rounded-md border
                                ${checked ? "border-[var(--tg-link-color)]" : "border-[var(--tg-hint-color)]"}`}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    {checked && <div className="w-3.5 h-3.5 rounded-sm" style={{ background: "var(--tg-link-color)" }} />}
                  </div>
                </button>

                {/* разделитель — как в ContactsList: не под аватаром (левый отступ 64px) */}
                {idx !== visibleFriends.length - 1 && (
                  <div className="absolute left-[64px] right-0 bottom-0 h-px bg-[var(--tg-hint-color)] opacity-15" />
                )}

                {/* ошибка по строке */}
                {!!errText && (
                  <div className="px-4 pb-2 text-[12px] text-red-500">{errText}</div>
                )}
              </div>
            )
          })}

          {hasMore && <div ref={loaderRef} style={{ height: 1, width: "100%" }} />}

          {loading && visibleFriends.length > 0 && (
            <div className="px-4 py-3 text-center text-[var(--tg-hint-color)]">{t("loading")}</div>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-[var(--tg-secondary-bg-color,#e7e7e7)] p-3 flex gap-2 bg-[var(--tg-card-bg)]">
          <button
            type="button"
            onClick={onClose}
            style={{ color: "#000" }} // читаемость в тёмной теме
            className="flex-1 py-3 rounded-xl font-semibold bg-[var(--tg-secondary-bg-color,#e6e6e6)]
                       border border-[var(--tg-hint-color)]/30 hover:bg-[var(--tg-theme-button-color,#40A7E3)]/10 active:scale-95 transition"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-xl font-semibold text-white
                       bg-[var(--tg-accent-color,#40A7E3)] active:scale-95 transition
                       disabled:opacity-60 disabled:pointer-events-none"
          >
            {adding ? t("add_members_modal.adding") : t("add_members_modal.add_btn", { count: allCount })}
          </button>
        </div>
      </div>
    </div>
  )
}
