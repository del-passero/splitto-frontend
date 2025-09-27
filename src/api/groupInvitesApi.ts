// frontend/src/api/groupInvitesApi.ts

export type InvitePreview = {
  group: { id: number; name?: string | null; avatar_url?: string | null } | null
  inviter:
    | { id: number; name?: string | null; username?: string | null; photo_url?: string | null }
    | null
  already_member: boolean
}

const API_URL =
  import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

function getTelegramInitData(): string {
  // @ts-ignore
  return (window as any)?.Telegram?.WebApp?.initData || ""
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message =
      (errorData?.detail?.code as string) ||
      (errorData?.detail as string) ||
      res.statusText
    throw new Error(message)
  }
  // @ts-ignore — для 204 вернём undefined
  return res.status === 204 ? undefined : ((await res.json()) as T)
}

/** Создать бессрочный инвайт-токен для группы */
export async function createGroupInvite(
  groupId: number
): Promise<{ token: string; deep_link?: string }> {
  return fetchJson<{ token: string; deep_link?: string }>(
    `${API_URL}/groups/${groupId}/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  )
}

/** Превью инвайта для модалки (по token или по start_param в initData) */
export async function previewGroupInvite(token?: string): Promise<InvitePreview> {
  return fetchJson<InvitePreview>(`${API_URL}/groups/invite/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: token ? JSON.stringify({ token }) : undefined,
  })
}

/** Принять инвайт (по token или по start_param внутри initData) */
export async function acceptGroupInvite(
  token?: string
): Promise<{ success: boolean; group_id?: number }> {
  return fetchJson<{ success: boolean; group_id?: number }>(
    `${API_URL}/groups/invite/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: token ? JSON.stringify({ token }) : undefined,
    }
  )
}

/** Опционально: принять инвайт напрямую из initData.start_param (без body) */
export async function acceptGroupInviteFromInit(): Promise<{
  success: boolean
  group_id?: number
}> {
  return fetchJson<{ success: boolean; group_id?: number }>(
    `${API_URL}/groups/invite/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  )
}

/** Достаём start_param из Telegram WebApp или URL */
export function getStartParam(): string | null {
  const tg: any = (window as any)?.Telegram?.WebApp
  const fromInitData: string | null =
    (tg?.initDataUnsafe?.start_param as string | undefined) ??
    (tg?.initDataUnsafe?.startParam as string | undefined) ??
    null

  const params = new URLSearchParams(window.location.search)
  const fromUrl =
    params.get("startapp") ||
    params.get("start") ||
    params.get("tgWebAppStartParam") ||
    null

  return fromInitData || fromUrl
}

/** Нормализация токена: убираем join:, g:, token= */
export function normalizeInviteToken(raw?: string | null): string | null {
  if (!raw) return null
  let t = String(raw).trim()
  try {
    t = decodeURIComponent(t)
  } catch {}
  const lower = t.toLowerCase()
  if (lower.startsWith("join:")) t = t.slice(5)
  if (lower.startsWith("g:")) t = t.slice(2)
  if (/^token=/.test(t)) t = t.replace(/^token=/, "")
  return t || null
}
