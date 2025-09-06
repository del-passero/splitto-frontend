// frontend/src/api/groupInvitesApi.ts
function getTelegramInitData(): string {
  // @ts-ignore
  return window?.Telegram?.WebApp?.initData || ""
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

/** Принять инвайт в группу по токену (передаём initData и в заголовке, и в теле) */
export async function acceptGroupInvite(token: string): Promise<{ success: boolean; group_id?: number }> {
  return fetchJson<{ success: boolean; group_id?: number }>(`${API_URL}/groups/invite/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      // критично: дублируем initData в тело, чтобы бек точно увидел его,
      // даже если заголовок прилетит пустым из-за гонки инициализации TG WebApp.
      initData: getTelegramInitData(),
    }),
  })
}

