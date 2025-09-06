// frontend/src/api/groupInvitesApi.ts
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
}

export function getStartParam(): string | null {
  // 1) из Telegram API
  // @ts-ignore
  const fromUnsafe = window?.Telegram?.WebApp?.initDataUnsafe?.start_param as string | undefined
  if (fromUnsafe) return fromUnsafe
  // 2) из URL (Telegram добавляет ?tgWebAppStartParam=...)
  const urlParam = new URLSearchParams(location.search).get("tgWebAppStartParam")
  return urlParam
}

export function normalizeInviteToken(raw: string | null | undefined): string | null {
  if (!raw) return null
  let t = raw.trim().replace(/\s+/g, "")
  if (t.startsWith("join:")) t = t.split(":", 1)[0] === "join" ? t.substring(5) : t
  // base64url паддинг (если нужно)
  if (/^[A-Za-z0-9_-]+$/.test(t) && t.length % 4 !== 0) {
    t = t + "=".repeat((4 - (t.length % 4)) % 4)
  }
  return t
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
