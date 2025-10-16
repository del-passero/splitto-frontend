// src/utils/events/formatEventCard.ts
export type EventRow = {
  id: number | string
  type: string
  actor_id: number | string
  group_id: number | string | null
  target_user_id?: number | string | null
  transaction_id?: number | string | null
  data?: any
  created_at: string
  // иногда бэк отдаёт ссылку на сущность
  entity?: { kind?: string; id?: number | string; [k: string]: any } | null
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
  // НОВОЕ: возвращаем обогащённую сущность (используется на фронте для аватаров/клика)
  entity?: {
    kind?: string
    id?: number
    name?: string
    avatar_url?: string | null
    route?: string
    [k: string]: any
  }
}

export type FormatCtx = {
  meId: number
  usersMap: Record<number, { name?: string }>
  groupsMap: Record<number, { name?: string; avatar_url?: string | null }>
  t?: (k: string) => string
}

/* ===== helpers ===== */

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
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

/* ===== основной форматер ===== */

export function formatEventCard(ev: EventRow, ctx: FormatCtx): EventCard {
  const t = ctx.t ?? ((s: string) => s)

  // 1) data: строка -> объект
  let data: any = ev.data || {}
  if (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      data = {}
    }
  }

  // 2) нормализация type
  const typeNorm = String(ev.type || "").toLowerCase()

  // 3) group_id: event.group_id -> data.group_id -> data.group.id -> entity (group)
  const entityIsGroup =
    ev?.entity && typeof ev.entity === "object" && (ev.entity as any)?.kind === "group"
  const entGroupId = entityIsGroup ? toNum((ev.entity as any)?.id) : undefined

  const dataGroupId =
    toNum((data?.group && (data.group.id ?? data.group.group_id)) ?? data?.group_id) ??
    undefined

  const groupIdSafe: number | undefined =
    toNum(ev.group_id) ?? dataGroupId ?? entGroupId

  // 4) имя/аватар группы: data -> groupsMap -> fallback
  const dataGroupName: string | undefined =
    (typeof data?.group_name === "string" && data.group_name) ||
    (typeof data?.group?.name === "string" && data.group.name) ||
    undefined

  const dataGroupAvatar: string | null | undefined =
    data?.new_avatar_url ??
    data?.avatar_url ??
    data?.group_avatar_url ??
    data?.group?.avatar_url ??
    undefined

  const groupMapEntry = groupIdSafe ? ctx.groupsMap[groupIdSafe] : undefined
  const groupName =
    dataGroupName || groupMapEntry?.name || unknownGroup(groupIdSafe)
  const groupAvatar =
    (dataGroupAvatar as string | null | undefined) ??
    groupMapEntry?.avatar_url ??
    null

  // 5) подписи акторов/таргетов/плательщика
  const actorId = toNum(ev.actor_id)
  const targetId = toNum(ev.target_user_id)
  const payerId = toNum(data?.payer_id)

  const actorNameFromData =
    (typeof data?.actor_name === "string" && data.actor_name) ||
    (data?.actor && typeof data.actor.name === "string" && data.actor.name) ||
    undefined

  const targetNameFromData =
    (typeof data?.target_name === "string" && data.target_name) ||
    (data?.target && typeof data.target.name === "string" && data.target.name) ||
    undefined

  const payerNameFromData =
    (typeof data?.payer_name === "string" && data.payer_name) ||
    (data?.payer && typeof data.payer.name === "string" && data.payer.name) ||
    undefined

  const actorLabel =
    actorNameFromData ||
    (actorId === ctx.meId ? "Вы" : ctx.usersMap[actorId || -1]?.name) ||
    unknownUser(actorId)

  const targetLabel =
    targetNameFromData || ctx.usersMap[targetId || -1]?.name || unknownUser(targetId)

  const payerLabel =
    payerNameFromData || ctx.usersMap[payerId || -1]?.name || unknownUser(payerId)

  // 6) базовая карточка
  const cardBase = {
    id: toNum(ev.id) ?? 0,
    type: ev.type, // оставляем оригинальный регистр
    created_at: ev.created_at,
    bucket: bucketOf(ev.type),
  } as const

  // готовим entity (если знаем группу)
  const baseEntity =
    groupIdSafe !== undefined
      ? {
          kind: "group",
          id: groupIdSafe,
          name: groupName,
          avatar_url: groupAvatar ?? null,
          route: `/groups/${groupIdSafe}`,
        }
      : undefined

  // 7) по типам
  switch (typeNorm) {
    case "group_created":
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Создана группа «${groupName}»`,
        subtitle: `Создатель: ${actorLabel}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "group_renamed":
      return {
        ...cardBase,
        icon: "Edit",
        title: "Группа переименована",
        subtitle: `${data?.old_name || "—"} → ${data?.new_name || "—"}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "group_avatar_changed": {
      const oldU = data?.old_avatar_url
      const newU = data?.new_avatar_url ?? groupAvatar
      let subtitle = "Аватар обновлён"
      if (!oldU && newU) subtitle = "Аватар добавлен"
      else if (oldU && !newU) subtitle = "Аватар удалён"
      else if (oldU && newU) subtitle = "Аватар заменён"
      return {
        ...cardBase,
        icon: "Edit",
        title: `Обновлён аватар «${groupName}»`,
        subtitle,
        route: baseEntity?.route,
        entity: { ...(baseEntity || {}), avatar_url: newU ?? null },
      }
    }

    case "group_archived":
      return {
        ...cardBase,
        icon: "Archive",
        title: "Группа архивирована",
        subtitle: groupName,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "group_unarchived":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа разархивирована",
        subtitle: groupName,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "group_deleted": {
      const hard = (data?.mode || "").toString().toLowerCase() === "hard"
      return {
        ...cardBase,
        icon: "Archive",
        title: hard ? "Группа удалена окончательно" : "Группа отправлена в удалённые",
        subtitle: hard ? `ID ${data?.group_id || groupIdSafe || "—"}` : groupName,
        route: hard ? undefined : baseEntity?.route,
        disabled: hard,
        entity: baseEntity,
      }
    }

    // на будущее, если появится
    case "group_restored":
      return {
        ...cardBase,
        icon: "Users",
        title: "Группа восстановлена",
        subtitle: groupName,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "member_added":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `Добавлен участник ${targetLabel}`,
        subtitle: `Группа: ${groupName} • ${actorLabel}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "member_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `Исключён участник ${targetLabel}`,
        subtitle: `Группа: ${groupName} • ${actorLabel}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "member_left":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${targetLabel} вышел(а) из группы`,
        subtitle: `Группа: ${groupName}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "transaction_created": {
      const money = formatMoney(data?.amount, data?.currency)
      const title = data?.title || "Без названия"
      return {
        ...cardBase,
        icon: "PlusCircle",
        title: `Новая трата: ${money}`,
        subtitle: `${title} • Плательщик: ${payerLabel}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }
    }

    case "transaction_updated": {
      const changed: string[] = Array.isArray(data?.changed) ? data.changed : []
      const subtitle =
        changed.length <= 3
          ? `Изменены: ${changed.map((k) => FIELD_RU[k] || k).join(", ")}`
          : `Изменений: ${changed.length}`
      return {
        ...cardBase,
        icon: "Edit",
        title: "Трата обновлена",
        subtitle,
        route: baseEntity?.route,
        entity: baseEntity,
      }
    }

    case "transaction_receipt_added":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Добавлен чек",
        subtitle: `${data?.title || "Без названия"} • ${formatMoney(data?.amount, data?.currency)}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "transaction_receipt_replaced":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек обновлён",
        subtitle: `${data?.title || "Без названия"} • ${formatMoney(data?.amount, data?.currency)}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "transaction_receipt_removed":
      return {
        ...cardBase,
        icon: "FileText",
        title: "Чек удалён",
        subtitle: `${data?.title || "Без названия"} • ${formatMoney(data?.amount, data?.currency)}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }

    case "transaction_deleted": { // NEW
      const money = formatMoney(data?.amount, data?.currency)
      const title = data?.title || "Без названия"
      return {
        ...cardBase,
        icon: "Archive",
        title: "Трата удалена",
        subtitle: `${title}${money ? " • " + money : ""}`,
        route: baseEntity?.route,
        entity: baseEntity,
      }
    }

    case "friendship_created":
      return {
        ...cardBase,
        icon: "UserPlus",
        title: `${actorLabel} и ${targetLabel} теперь друзья`,
        subtitle: undefined,
        entity: undefined,
      }

    case "friendship_removed":
      return {
        ...cardBase,
        icon: "UserMinus",
        title: `${actorLabel} удалил(а) из друзей ${targetLabel}`,
        subtitle: undefined,
        entity: undefined,
      }

    default:
      // мягкий фолбэк
      return {
        ...cardBase,
        icon: "Bell",
        title: ev.type,
        subtitle: groupIdSafe ? `Группа: ${groupName}` : undefined,
        route: baseEntity?.route,
        entity: baseEntity,
      }
  }
}
