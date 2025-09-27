// frontend/src/api/groupInvitesApi.ts
// Групповые инвайты: create -> deep_link, preview, accept + утилиты для start_param

export type InvitePreview = {
  group?: { id: number; name?: string | null; avatar_url?: string | null }
  inviter?: { id: number; name?: string | null; username?: string | null; photo_url?: string | null } | null
  already_member?: boolean
}

function getTelegramInitData(): string {
  // @ts-ignore
  return (window as any)?.Telegram?.WebApp?.initData || ""
}

const API_URL = import.meta.env.VITE_API_URL || "https://splitto-backend-prod-ugraf.amvera.io/api"

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "x-telegram-initdata": getTelegramInitData(),
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    // сервер кладёт код в detail.code
    throw new Error(errorData.detail?.code || errorData.detail || res.statusText)
  }
  // @ts-ignore – корректно вернуть void для 204
  return res.status === 204 ? undefined : await res.json()
}

/** Создать инвайт и сразу получить готовую deep-link для Telegram */
export async function createGroupInvite(
  groupId: number
): Promise<{ token: string; deep_link: string | null }> {
  return fetchJson<{ token: string; deep_link: string | null }>(
    `${API_URL}/groups/${groupId}/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  )
}

/** Превью инвайта для модалки «Вступить в группу» */
export async function previewGroupInvite(token?: string): Promise<InvitePreview> {
  return fetchJson<InvitePreview>(`${API_URL}/groups/invite/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(token ? { token } : {}),
  })
}

/** Принять групповой инвайт (добавляет в группу) */
export async function acceptGroupInvite(
  token?: string
): Promise<{ success: boolean; group_id?: number }> {
  return fetchJson<{ success: boolean; group_id?: number }>(
    `${API_URL}/groups/invite/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { token } : {}),
    }
  )
}

/** Достаём start_param из Telegram WebApp или из URL */
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

/** Нормализуем токен: убираем префиксы типа join:, g:, а также token=... */
export function normalizeInviteToken(raw?: string | null): string | null {
  if (!raw) return null
  let t = String(raw).trim()
  try {
    t = decodeURIComponent(t)
  } catch {
    // ignore
  }
  const lower = t.toLowerCase()
  if (lower.startsWith("join:")) t = t.slice(5)
  if (lower.startsWith("g:")) t = t.slice(2)
  if (/^token=/.test(t)) t = t.replace(/^token=/, "")
  return t || null
}

/** Back-compat: принять инвайт, взяв токен прямо из initData/URL */
export async function acceptGroupInviteFromInit(): Promise<{ success: boolean; group_id?: number }> {
  const tok = normalizeInviteToken(getStartParam())
  return acceptGroupInvite(tok || undefined)
}
