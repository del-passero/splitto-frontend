// frontend/src/api/groupInvitesApi.ts
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
    throw new Error(errorData.detail?.code || errorData.detail || res.statusText)
  }
  return await res.json()
}

/** Создать бессрочный инвайт-токен для группы */
export async function createGroupInvite(groupId: number): Promise<{ token: string }> {
  return fetchJson<{ token: string }>(`${API_URL}/groups/${groupId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
}

/** Принять инвайт в группу по токену */
export async function acceptGroupInvite(token: string): Promise<{ success: boolean; group_id?: number }> {
  return fetchJson<{ success: boolean; group_id?: number }>(`${API_URL}/groups/invite/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
}

/** Достаём start_param из Telegram WebApp или из URL */
export function getStartParam(): string | null {
  const tg: any = (window as any)?.Telegram?.WebApp
  // у типов Telegram.d.ts нет start_param — берём из any и поддерживаем обе формы
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
