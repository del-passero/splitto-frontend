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
  // иногда бэк отдаёт ссылку на сущность
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
  // НОВОЕ: протащим аватар группы (если есть)
  avatar_url?: string
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

/* ===== helpers: мягко вытаскиваем имена/аватары из data ===== */
function safeJson(data: any): any {
  if (!data) return {}
  if (typeof data === "string") {
    try { return JSON.parse(data) } catch { return {} }
  }
  return data
}

function joinName(a?: string | null, b?: string | null) {
  return [a, b].filter(Boolean).join(" ")
}

function pickUserNameById(
  id: number | null | undefined,
  ctx: FormatCtx,
  d: any,
  roleKeys: string[]
): string | undefined {
  if (!id) return undefined
  // 1) мапка из стора
  const mapName = ctx.usersMap[id]?.name
  if (mapName) return mapName

  // 2) прямая строка в data: actor_name / target_name / user_name
  for (const k of roleKeys) {
    const v = d?.[`${k}_name`]
    if (typeof v === "string" && v.trim()) return v.trim()
  }

  // 3) объект вида data.actor / data.target / data.user
  for (const k of roleKeys) {
    const obj = d?.[k]
    if (obj && typeof obj === "object") {
      const n1 = joinName(obj.first_name, obj.last_name)
      if (n1) return n1
      if (typeof obj.name === "string" && obj.name.trim()) return obj.name.trim()
      if (typeof obj.username === "string" && obj.username.trim()) return obj.username.trim()
    }
  }

  return undefined
}

function pickGroupName(groupId: number | undefined, ctx: FormatCtx, d: any): string | undefined {
  // 1) явно в data
  if (typeof d?.group_name === "string" && d.group_name.trim()) return d.group_name.trim()
  // 2) вложенный объект data.group
  if (d?.group && typeof d.group === "object") {
    const g = d.group
    const v = g.name || g.title
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  // 3) мапка из стора
  if (groupId && ctx.groupsMap[groupId]?.name) return ctx.groupsMap[groupId]!.name
  return undefined
}

function pickGroupAvatar(d: any): string | undefined {
  if (typeof d?.group_avatar_url === "string" && d.group_avatar_url) return d.group_avatar_url
  if (d?.group && typeof d.group === "object") {
    const v = d.group.avatar_url || d.group.photo_url || d.group.image_url
    if (typeof v === "string" && v) return v
  }
  if (typeof d?.avatar_url === "string" && d.avatar_url) return d.avatar_url
  return undefined
}

export function formatEventCard(ev: EventRow, ctx: FormatCtx): EventCard {
  const t = ctx.t ?? ((s: string) => s)
  const d = safeJson(ev.data)

  // нормализуем type
  const typeNorm = String(ev.type || "").toLowerCase()

  // entity → group id, если вдруг там
  const entityGroupId =
    ev?.entity && typeof ev.entity === "object" && (ev.entity as any)?.kind === "group"
      ? Number((ev.entity as any)?.id) || undefined
      : undefined

  // безопасный group_id: event.group_id -> data.group_id -> entity.group.id
  const groupIdSafe: number | undefined =
    (typeof ev.group_id === "number" ? ev.group_id : undefined) ??
    (typeof d.group_id === "number" ? d.group_id : undefined) ??
    entityGroupId

  // имя группы
  const groupName = pickGroupName(groupIdSafe, ctx, d) || unknownGroup(groupIdSafe)
  // аватар группы (если есть)
  const groupAvatarUrl = pickGroupAvatar(d)

  // подписи юзеров
  const actorName =
    (ev.actor_id === ctx.meId && "Вы") ||
    pickUserNameById(ev.actor_id, ctx, d, ["actor", "user"]) ||
    unknownUser(ev.actor_id)
  const targetName =
    pickUserNameById(ev.target_user_id, ctx, d, ["target", "user"]) ||
    unknownUser(ev.target_user_id || undefined)
  const payerName =
    (typeof d.payer_id === "number" &&
      (pickUserNameById(d.payer_id, ctx, d, ["payer", "user"]) || unknownUser(d.payer_id))) ||
    undefined

  const cardBase = {
    id: ev.id,
    type: ev.type, // оригинал, чтобы фильтры работали
    created_at: ev.created_at,
    bucket: bucketOf(ev.type),
  } as const

  switch (typeNorm) {
    case "group_created":
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Создана группа «${groupName}»`,
        subtitle: `Создатель: ${actorName}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "group_renamed":
      return {
        ...cardBase,
        icon: "Edit",
        title: "Группа переименована",
        subtitle: `${d.old_name || "—"} → ${d.new_name || "—"}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
      }

    case "group_avatar_changed": {
      const oldU = d.old_avatar_url
      const newU = d.new_avatar_url
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
        avatar_url: newU || groupAvatarUrl,
      }
    }

    case "group_archived":
      return {
        ...cardBase,
        icon: "Archive",
        title: "Группа архивирована",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "group_unarchived":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа разархивирована",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "group_deleted": {
      const hard = d.mode === "hard"
      return {
        ...cardBase,
        icon: "Archive",
        title: hard ? "Группа удалена окончательно" : "Группа отправлена в удалённые",
        subtitle: hard ? `ID ${d.group_id || "—"}` : groupName,
        route: hard ? undefined : groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        disabled: hard,
        avatar_url: groupAvatarUrl,
      }
    }

    case "group_restored":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа восстановлена",
        subtitle: groupName,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "member_added":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `Добавлен участник ${targetName}`,
        subtitle: `Группа: ${groupName} • ${actorName}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "member_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `Исключён участник ${targetName}`,
        subtitle: `Группа: ${groupName} • ${actorName}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "member_left":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${targetName} вышел(а) из группы`,
        subtitle: `Группа: ${groupName}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "transaction_created": {
      const money = formatMoney(d.amount, d.currency)
      const title = d.title || "Без названия"
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Новая трата: ${money}`,
        subtitle: `${title}${payerName ? ` • Плательщик: ${payerName}` : ""}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }
    }

    case "transaction_updated": {
      const changed: string[] = Array.isArray(d.changed) ? d.changed : []
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
        avatar_url: groupAvatarUrl,
      }
    }

    case "transaction_receipt_added":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Добавлен чек",
        subtitle: `${d.title || "Без названия"} • ${formatMoney(d.amount, d.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "transaction_receipt_replaced":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек обновлён",
        subtitle: `${d.title || "Без названия"} • ${formatMoney(d.amount, d.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "transaction_receipt_removed":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек удалён",
        subtitle: `${d.title || "Без названия"} • ${formatMoney(d.amount, d.currency)}`,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }

    case "friendship_created":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `${actorName} и ${targetName} теперь друзья`,
        subtitle: undefined,
      }

    case "friendship_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${actorName} удалил(а) из друзей ${targetName}`,
        subtitle: undefined,
      }

    default:
      return {
        ...cardBase,
        icon: "Bell",
        title: ev.type,
        subtitle: groupIdSafe ? `Группа: ${groupName}` : undefined,
        route: groupIdSafe ? `/groups/${groupIdSafe}` : undefined,
        avatar_url: groupAvatarUrl,
      }
  }
}
