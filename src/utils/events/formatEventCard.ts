// src/utils/events/formatEventCard.ts
export type EventRow = {
  id: number
  type: string
  actor_id: number
  group_id: number | null
  target_user_id?: number | null
  transaction_id?: number | null
  data?: any
  created_at: string
  // НОВОЕ: иногда бэк отдаёт ссылку на сущность
  entity?: { kind?: string; id?: number } | Record<string, any> | null
}

export type EventCard = {
  id: number
  type: string
  icon:
    | "Bell"
    | "PlusCircle"
    | "Edit"
    | "Users"
    | "Archive"
    | "UserPlus"
    | "UserMinus"
    | "FileText"
    | "HandCoins"
  title: string
  subtitle?: string
  created_at: string
  route?: string
  disabled?: boolean
  bucket: "tx" | "edits" | "groups" | "users" | "other"
}

export type FormatCtx = {
  meId: number
  usersMap: Record<number, { name?: string }>
  groupsMap: Record<number, { name?: string }>
  t?: (k: string) => string
}

const FIELD_RU: Record<string, string> = {
  amount: "сумма",
  currency: "валюта",
  title: "название",
  date: "дата",
  payer_id: "кто платил",
  shares: "разделение",
  category_id: "категория",
  group_id: "группа",
  receipt: "чек",
}

function bucketOf(type: string): EventCard["bucket"] {
  const t = (type || "").toLowerCase()
  if (t.startsWith("transaction_") || t.includes("receipt")) return "tx"
  if (t.endsWith("_updated") || t.includes("updated")) return "edits"
  if (t.startsWith("group_")) return "groups"
  if (t.startsWith("member_") || t.includes("user")) return "users"
  return "other"
}

const unknownUser = (id?: number | null) => (id ? `Пользователь #${id}` : "Пользователь")
const unknownGroup = (id?: number | null) => (id ? `Группа #${id}` : "Группа")

export function formatMoney(amountStr?: string | null, code?: string | null) {
  if (!amountStr) return ""
  const n = Number(amountStr)
  if (!isFinite(n)) return `${amountStr} ${code || ""}`.trim()
  try {
    return (
      new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n) +
      (code ? ` ${code}` : "")
    )
  } catch {
    return `${amountStr} ${code || ""}`.trim()
  }
}

export function formatEventCard(ev: EventRow, ctx: FormatCtx): EventCard {
  const t = ctx.t ?? ((s: string) => s)

  // 1) НОРМАЛИЗУЕМ data: строка -> JSON
  let data: any = ev.data || {}
  if (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }

  // 2) НОРМАЛИЗУЕМ type к нижнему регистру (для switch)
  const typeNorm = String(ev.type || "").toLowerCase()

  // 3) Безопасно достаём group_id: event.group_id -> data.group_id -> entity.group.id
  const entityGroupId =
    ev?.entity && typeof ev.entity === "object" && (ev.entity as any)?.kind === "group"
      ? Number((ev.entity as any)?.id) || undefined
      : undefined

  const groupIdSafe: number | undefined =
    (typeof ev.group_id === "number" ? ev.group_id : undefined) ??
    (typeof data.group_id === "number" ? data.group_id : undefined) ??
    entityGroupId

  // 4) Имя группы: data.group_name -> groupsMap -> fallback
  const groupName =
    (typeof data.group_name === "string" && data.group_name) ||
    (groupIdSafe && ctx.groupsMap[groupIdSafe]?.name) ||
    unknownGroup(groupIdSafe)

  // 5) Подписи акторов (учитываем имена из data)
  const actorNameFromData =
    typeof data.actor_name === "string" && data.actor_name ? data.actor_name : undefined
  const targetNameFromData =
    typeof data.target_name === "string" && data.target_name ? data.target_name : undefined
  const payerNameFromData =
    typeof data.payer_name === "string" && data.payer_name ? data.payer_name : undefined

  const actorLabel =
    ev.actor_id === ctx.meId
      ? "Вы"
      : actorNameFromData || ctx.usersMap[ev.actor_id]?.name || unknownUser(ev.actor_id)

  const targetLabel =
    targetNameFromData ||
    (ev.target_user_id && ctx.usersMap[ev.target_user_id]?.name) ||
    unknownUser(ev.target_user_id || undefined)

  const payerLabel =
    payerNameFromData ||
    (data.payer_id && ctx.usersMap[data.payer_id]?.name) ||
    unknownUser(data.payer_id || undefined)

  const cardBase = {
    id: ev.id,
    type: ev.type, // оставляем исходный, чтобы фильтры работали по строке, а не по lower
    created_at: ev.created_at,
    bucket: bucketOf(ev.type),
  } as const

  // --- по типам ---
  switch (typeNorm) {
    case "group_created":
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Создана группа «${groupName}»`,
        subtitle: `Создатель: ${actorLabel}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "group_renamed":
      return {
        ...cardBase,
        icon: "Edit",
        title: "Группа переименована",
        subtitle: `${data.old_name || "—"} → ${data.new_name || "—"}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "group_avatar_changed": {
      const oldU = data.old_avatar_url
      const newU = data.new_avatar_url
      let subtitle = "Аватар обновлён"
      if (!oldU && newU) subtitle = "Аватар добавлен"
      else if (oldU && !newU) subtitle = "Аватар удалён"
      else if (oldU && newU) subtitle = "Аватар заменён"
      return {
        ...cardBase,
        icon: "Edit",
        title: "Обновлён аватар группы",
        subtitle,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }
    }

    case "group_archived":
      return {
        ...cardBase,
        icon: "Archive",
        title: "Группа архивирована",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "group_unarchived":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа разархивирована",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "group_deleted": {
      const hard = data.mode === "hard"
      return {
        ...cardBase,
        icon: "Archive",
        title: hard ? "Группа удалена окончательно" : "Группа отправлена в удалённые",
        subtitle: hard ? `ID ${data.group_id || "—"}` : groupName,
        route: hard ? undefined : groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        disabled: hard,
      }
    }

    // на будущее — если добавишь на бэке
    case "group_restored":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа восстановлена",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "member_added":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `Добавлен участник ${targetLabel}`,
        subtitle: `Группа: ${groupName} • ${actorLabel}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "member_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `Исключён участник ${targetLabel}`,
        subtitle: `Группа: ${groupName} • ${actorLabel}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "member_left":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${targetLabel} вышел(а) из группы`,
        subtitle: `Группа: ${groupName}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "transaction_created": {
      const money = formatMoney(data.amount, data.currency)
      const title = data.title || "Без названия"
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Новая трата: ${money}`,
        subtitle: `${title} • Плательщик: ${payerLabel}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }
    }

    case "transaction_updated": {
      const changed: string[] = Array.isArray(data.changed) ? data.changed : []
      const subtitle =
        changed.length <= 3
          ? `Изменены: ${changed.map((k) => FIELD_RU[k] || k).join(", ")}`
          : `Изменений: ${changed.length}`
      return {
        ...cardBase,
        icon: "Edit",
        title: "Трата обновлена",
        subtitle,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }
    }

    case "transaction_receipt_added":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Добавлен чек",
        subtitle: `${data.title || "Без названия"} • ${formatMoney(data.amount, data.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "transaction_receipt_replaced":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек обновлён",
        subtitle: `${data.title || "Без названия"} • ${formatMoney(data.amount, data.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "transaction_receipt_removed":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек удалён",
        subtitle: `${data.title || "Без названия"} • ${formatMoney(data.amount, data.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "friendship_created":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `${actorLabel} и ${targetLabel} теперь друзья`,
        subtitle: undefined,
      }

    case "friendship_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${actorLabel} удалил(а) из друзей ${targetLabel}`,
        subtitle: undefined,
      }

    default:
      // мягкий фолбэк
      return {
        ...cardBase,
        icon: "Bell",
        title: ev.type,
        subtitle: groupIdSafe ? `Группа: ${groupName}` : undefined,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }
  }
}
