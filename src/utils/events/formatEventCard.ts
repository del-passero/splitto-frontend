// src/utils/events/formatEventCard.ts
export type EventRow = {
  id: number
  type: string
  actor_id: number | null
  group_id: number | null
  target_user_id?: number | null
  transaction_id?: number | null
  data?: any
  created_at: string
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
  /** если знаем — положим сюда, компонент возьмёт из entity.avatar_url */
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

const unknownUser = (id?: number | null) => (typeof id === "number" ? `Пользователь #${id}` : "Пользователь")
const unknownGroup = (id?: number | null) => (typeof id === "number" ? `Группа #${id}` : "Группа")

export function formatMoney(amountStr?: string | null, code?: string | null) {
  if (!amountStr) return ""
  const n = Number(amountStr)
  if (!isFinite(n)) return `${amountStr} ${code || ""}`.trim()
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n) + (code ? ` ${code}` : "")
  } catch {
    return `${amountStr} ${code || ""}`.trim()
  }
}

/* ===== helpers ===== */
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
  if (!id && id !== 0) return undefined
  const m = ctx.usersMap[id]
  if (m?.name) return m.name

  for (const k of roleKeys) {
    const v = d?.[`${k}_name`]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
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
  if (typeof d?.group_name === "string" && d.group_name.trim()) return d.group_name.trim()
  if (d?.group && typeof d.group === "object") {
    const v = d.group.name || d.group.title
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  if (groupId && ctx.groupsMap[groupId]?.name) return ctx.groupsMap[groupId]!.name
  return undefined
}

function pickGroupAvatar(d: any): string | undefined {
  if (typeof d?.new_avatar_url === "string" && d.new_avatar_url) return d.new_avatar_url
  if (typeof d?.group_avatar_url === "string" && d.group_avatar_url) return d.group_avatar_url
  if (d?.group && typeof d.group === "object") {
    const v = d.group.avatar_url || d.group.photo_url || d.group.image_url
    if (typeof v === "string" && v) return v
  }
  if (typeof d?.avatar_url === "string" && d.avatar_url) return d.avatar_url
  return undefined
}

export function formatEventCard(ev: EventRow, ctx: FormatCtx): EventCard {
  const d = safeJson(ev.data)
  const typeNorm = String(ev.type || "").toLowerCase()

  // group id из разных мест
  const entityGroupId =
    ev?.entity && typeof ev.entity === "object" && (ev.entity as any)?.kind === "group"
      ? Number((ev.entity as any)?.id) || undefined
      : undefined
  const groupIdSafe: number | undefined =
    (typeof ev.group_id === "number" ? ev.group_id : undefined) ??
    (typeof d.group_id === "number" ? d.group_id : undefined) ??
    entityGroupId

  // имена/аватары группы
  const groupName = pickGroupName(groupIdSafe, ctx, d) || unknownGroup(groupIdSafe)
  const groupAvatarUrl = pickGroupAvatar(d)

  // ACTOR: учитываем creator_id как источник actor_id
  const actorIdEff =
    (typeof ev.actor_id === "number" ? ev.actor_id : undefined) ??
    (typeof d.actor_id === "number" ? d.actor_id : undefined) ??
    (typeof d.creator_id === "number" ? d.creator_id : undefined)

  const actorName =
    (actorIdEff === ctx.meId && "Вы") ||
    pickUserNameById(actorIdEff, ctx, d, ["actor", "creator", "user"]) ||
    unknownUser(actorIdEff)

  // TARGET
  const targetIdEff =
    (typeof ev.target_user_id === "number" ? ev.target_user_id : undefined) ??
    (typeof d.target_user_id === "number" ? d.target_user_id : undefined) ??
    (typeof d.member_id === "number" ? d.member_id : undefined)
  const targetName =
    pickUserNameById(targetIdEff, ctx, d, ["target", "member", "user"]) ||
    unknownUser(targetIdEff)

  // PAYER
  const payerIdEff = typeof d.payer_id === "number" ? d.payer_id : undefined
  const payerName =
    (payerIdEff &&
      (pickUserNameById(payerIdEff, ctx, d, ["payer", "user", "actor"]) || unknownUser(payerIdEff))) ||
    undefined

  const cardBase = {
    id: ev.id,
    type: ev.type,
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
        avatar_url: groupAvatarUrl,
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
